import { PermissionsAndroid, Platform } from 'react-native';
import BleManager from 'react-native-ble-manager';
import { Buffer } from 'buffer';
import { crc16 } from './crc16';
import {
  buildEwmFrame,
  buildOptReadPayload,
  parseDecryptedPayload,
} from './EwmFrameBuilder';
import { sleep } from '.';

const TAG = 'Ble.ts';

let service = '';
let characteristic = '';

/* ================= PERMISSION ================= */

export async function requestBlePermission(): Promise<boolean> {
  if (Platform.OS === 'android' && Platform.Version >= 23) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
}

/* ================= CONNECT ================= */

export async function connect(id: string): Promise<boolean> {
  for (let i = 0; i < 2; i++) {
    try {
      await BleManager.stopScan();
      await BleManager.connect(id);
      return true;
    } catch (e) {
      console.log(TAG, 'Connect retry', e);
      await sleep(1000);
    }
  }
  return false;
}

/* ================= NOTIFICATION ================= */

export async function startNotification(id: string) {
  const res: any = await BleManager.retrieveServices(id);
  const char = res.characteristics.find(
    (c: any) => c.properties?.Write && c.properties?.Notify,
  );
  if (!char) throw new Error('No writable notify characteristic');

  service = char.service;
  characteristic = char.characteristic;

  await BleManager.startNotification(id, service, characteristic);
}

export async function stopNotification(id: string) {
  await BleManager.stopNotification(id, service, characteristic);
}

/* ================= FRAME SEND ================= */

async function sendFrameInternal(id: string, data: number[]) {
  const payload = Uint8Array.from(data);
  const crcPayload = crc16(Buffer.from(payload), payload.length);

  const body = [...data, crcPayload & 0xff, (crcPayload >> 8) & 0xff];
  const header = [0xaa, 0x01, body.length & 0xff, body.length >> 8];
  const base = [...header, ...body];

  const crcFrame = crc16(Buffer.from(base), base.length);
  const frame = [...base, crcFrame & 0xff, crcFrame >> 8, 0x4f, 0x4b, 0x45];

  await BleManager.write(id, service, characteristic, frame, 256);
}

/* ================= QUEUE SEND ================= */

interface BleTask {
  frame: number[];
  timeout: number;
  resolve: (data: number[]) => void;
  reject: (e: any) => void;
}

const taskQueue: BleTask[] = [];
let sending = false;

export function sendAndReceiveQueued(
  id: string,
  frame: number[],
  timeout = 2000,
): Promise<number[]> {
  return new Promise((resolve, reject) => {
    taskQueue.push({ frame, timeout, resolve, reject });
    processQueue(id);
  });
}

async function processQueue(id: string) {
  if (sending || taskQueue.length === 0) return;
  sending = true;

  const task = taskQueue.shift()!;
  try {
    const waitAck = waitBleAck(800);
    const waitEwm = waitEwmResponse(task.timeout);

    await sendFrameInternal(id, task.frame);

    await waitAck; // ACK có hoặc không đều OK
    const resp = await waitEwm;

    task.resolve(resp);
  } catch (e) {
    task.reject(e);
  } finally {
    await sleep(120);
    sending = false;
    processQueue(id);
  }
}

/* ================= RX BUFFER ================= */

let rxBuffer: number[] = [];

/* ================= ACK QUEUE ================= */

const ackQueue: ((status: number) => void)[] = [];

export function waitBleAck(timeout = 1000): Promise<number> {
  return new Promise(resolve => {
    ackQueue.push(resolve);

    setTimeout(() => {
      const i = ackQueue.indexOf(resolve);
      if (i !== -1) ackQueue.splice(i, 1);
      resolve(0); // ACK không về không phải lỗi
    }, timeout);
  });
}

function findAck(buf: number[]) {
  for (let i = 0; i <= buf.length - 6; i++) {
    // tránh ACK nằm trong EWM
    if (buf[i] === 0x2a && buf[i + 1] === 0x45) break;

    if (buf[i] === 0xaa && buf[i + 5] === 0x55) {
      return { index: i, frame: buf.slice(i, i + 6), length: 6 };
    }
  }
  return null;
}


/* ================= EWM QUEUE ================= */

const ewmQueue: ((data: number[]) => void)[] = [];

export function waitEwmResponse(timeout = 2000): Promise<number[]> {
  return new Promise((resolve, reject) => {
    ewmQueue.push(resolve);

    setTimeout(() => {
      const i = ewmQueue.indexOf(resolve);
      if (i !== -1) ewmQueue.splice(i, 1);
      reject(new Error('EWM timeout'));
    }, timeout);
  });
}

const HEADER = [0x2a, 0x45, 0x57, 0x4d, 0x30, 0x32]; // *EWM02

function findEwm(buf: number[]) {
  if (buf.length < HEADER.length) return null;

  for (let i = 0; i <= buf.length - HEADER.length; i++) {
    let match = true;
    for (let j = 0; j < HEADER.length; j++) {
      if (buf[i + j] !== HEADER[j]) {
        match = false;
        break;
      }
    }
    if (!match) continue;

    // 👉 CHỐT: coi toàn bộ phần còn lại là frame
    return {
      index: i,
      length: buf.length - i,
      frame: buf.slice(i),
    };
  }

  return null;
}



export function onBleData({ value }: { value: number[] }) {
  console.log('📥 BLE RAW:', bytesToHex(value));

  rxBuffer.push(...value);

  while (true) {
    const ewm = findEwm(rxBuffer);
    if (!ewm) break;

    console.log('📦 EWM:', bytesToHex(ewm.frame));
    ewmQueue.shift()?.(ewm.frame);
    rxBuffer.splice(ewm.index, ewm.length);
  }
}



export function bytesToHex(data?: number[] | Uint8Array) {
  if (!data) return '';
  return Array.from(data)
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ')
    .toUpperCase();
}
