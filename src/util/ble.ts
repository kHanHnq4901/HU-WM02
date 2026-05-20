import { Alert, PermissionsAndroid, Platform } from 'react-native';
import BleManager from 'react-native-ble-manager';
import { Buffer } from 'buffer';
import { crc16 } from './crc16';
import { sleep } from '.';
import { store } from '../screen/overview/controller';

const TAG = 'Ble.ts';

let service = '';
let characteristic = '';
let rxBuffer: number[] = [];

/* ================= PERMISSIONS ================= */

export async function requestBlePermission(): Promise<boolean> {
  if (Platform.OS === 'android' && Platform.Version >= 23) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
}

/* ================= CONNECT & NOTIFY ================= */

export async function connect(id: string): Promise<boolean> {
  for (let i = 0; i < 2; i++) {
    try {
      await BleManager.stopScan();
      await BleManager.connect(id);
      await BleManager.requestMTU(id, 256); // MTU lớn giúp gửi OTA/Frame mượt hơn
      return true;
    } catch (e) {
      console.log(TAG, 'Connect retry', e);
      await sleep(1000);
    }
  }
  return false;
}

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

/* ================= FRAME SEND INTERNAL ================= */

async function sendFrameInternal(id: string, data: number[]) {
  const payload = Uint8Array.from(data);
  const crcPayload = crc16(Buffer.from(payload), payload.length);
  const body = [...data, crcPayload & 0xff, (crcPayload >> 8) & 0xff];
  const header = [0xaa, 0x01, body.length & 0xff, (body.length >> 8) & 0xff];
  const base = [...header, ...body];
  const crcFrame = crc16(Buffer.from(base), base.length);
  const frame = [...base, crcFrame & 0xff, (crcFrame >> 8) & 0xff, 0x4f, 0x4b, 0x45];

  console.log("📤 Gửi gói tin Frame, tổng độ dài:", frame.length);

  const WRITE_CHUNK_SIZE = 128;
  for (let i = 0; i < frame.length; i += WRITE_CHUNK_SIZE) {
    const chunk = frame.slice(i, i + WRITE_CHUNK_SIZE);
    await BleManager.write(id, service, characteristic, chunk);
    if (frame.length > WRITE_CHUNK_SIZE) await sleep(20); // Giảm sleep xuống xíu để mượt hơn
  }
}

export async function sendRawBle(id: string, data: Uint8Array) {
  const body = Array.from(data);
  const header = [0xaa, 0x01, body.length & 0xff, (body.length >> 8) & 0xff];
  const base = [...header, ...body];
  const crcFrame = crc16(Buffer.from(base), base.length);
  const finalFrame = [...base, crcFrame & 0xff, (crcFrame >> 8) & 0xff, 0x4f, 0x4b, 0x45];

  const CHUNK = 128;
  for (let i = 0; i < finalFrame.length; i += CHUNK) {
    await BleManager.write(id, service, characteristic, finalFrame.slice(i, i + CHUNK));
    await sleep(20);
  }
}

/* ================= QUEUE SYSTEM ================= */

interface BleTask {
  frame: number[];
  timeout: number;
  resolve: (data: number[]) => void;
  reject: (e: any) => void;
}

const taskQueue: BleTask[] = [];
let isProcessing = false;

export function sendAndReceiveQueued(
  id: string,
  frame: Uint8Array | number[],
  timeout = 5000,
): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const data = frame instanceof Uint8Array ? Array.from(frame) : frame;
    taskQueue.push({ frame: data, timeout, resolve, reject });
    processQueue(id);
  });
}

async function processQueue(id: string) {
  if (isProcessing || taskQueue.length === 0) return;
  isProcessing = true;

  const task = taskQueue.shift()!;
  try {
    rxBuffer = [];
    const ackPromise = waitBleAck(1000);
    const ewmPromise = waitEwmResponse(task.timeout);
    await sendFrameInternal(id, task.frame);
    await ackPromise;
    const resp = await ewmPromise;
    task.resolve(resp);
  } catch (e: any) {
    // Clear pending callbacks so they don't bleed into the next task
    ackQueue.length = 0;
    ewmQueue.length = 0;
    rxBuffer = [];
    task.reject(e);
  } finally {
    isProcessing = false;
    if (taskQueue.length > 0) setTimeout(() => processQueue(id), 0);
  }
}

/* ================= DATA PARSERS ================= */

function findAck(buf: number[]) {
  for (let i = 0; i <= buf.length - 6; i++) {
    if (buf[i] === 0xaa && buf[i + 1] === 0x01 && buf[i + 5] === 0x55) {
      return { index: i, length: 6 };
    }
  }
  return null;
}

function findEwm(buf: number[]) {
  const HEADER = [0x2a, 0x45, 0x57, 0x4d, 0x30, 0x32]; // *EWM02
  for (let i = 0; i <= buf.length - HEADER.length; i++) {
    let match = true;
    for (let j = 0; j < HEADER.length; j++) {
      if (buf[i + j] !== HEADER[j]) { match = false; break; }
    }
    if (!match) continue;

    const lenSerIndex = i + 7;
    if (buf.length <= lenSerIndex) return null;
    const lenSerial = buf[lenSerIndex];

    const lenPayIndex = i + 8 + lenSerial;
    if (buf.length <= lenPayIndex) return null;
    const lenPayload = buf[lenPayIndex];

    const encryptedLen = lenPayload < 16 ? 16 : lenPayload;
    const totalLen = 6 + 1 + 1 + lenSerial + 1 + encryptedLen + 1 + 2;

    if (buf.length < i + totalLen) return null;

    return { index: i, length: totalLen, frame: buf.slice(i, i + totalLen) };
  }
  return null;
}

// Hàm trích xuất Text an toàn, tránh lỗi Call Stack
function findRawText(buf: number[]) {
  // Chỉ chuyển đổi tối đa 512 bytes đầu tiên để tránh tràn bộ nhớ
  const checkLimit = Math.min(buf.length, 512);
  const text = String.fromCharCode(...buf.slice(0, checkLimit));
  const match = text.match(/(SUCCESS|FAIL|F\d+)/);
  
  if (match) {
    return {
      index: text.indexOf(match[0]),
      length: match[0].length,
      text: match[0]
    };
  }
  return null;
}

/* ================= ON BLE DATA ================= */

export function onBleData({ value }: { value: number[] }) {
  rxBuffer.push(...value);

  // Bảo vệ bộ nhớ: Chống tràn mảng do rác BLE
  if (rxBuffer.length > 4096) {
    console.warn("⚠️ Buffer quá đầy, đang xoá bớt dữ liệu rác!");
    rxBuffer = rxBuffer.slice(-1024); // Chỉ giữ lại 1024 bytes mới nhất
  }

  let processing = true;
  while (processing) {
    processing = false;

    // 1. Kiểm tra ACK
    const ack = findAck(rxBuffer);
    if (ack) {
      if (ackQueue.length > 0) ackQueue.shift()?.(1);
      rxBuffer.splice(0, ack.index + ack.length);
      processing = true;
      continue;
    }

    // 2. Kiểm tra EWM Response
    const ewm = findEwm(rxBuffer);
    if (ewm) {
      console.log(`📦 Đã nhận EWM Frame: ${ewm.length} bytes`);
      if (ewmQueue.length > 0) ewmQueue.shift()?.(ewm.frame);
      rxBuffer.splice(0, ewm.index + ewm.length);
      processing = true;
      continue;
    }

    // 3. Kiểm tra Raw Text (SUCCESS/FAIL/F...)
    const textData = findRawText(rxBuffer);
    if (textData) {
      if (rawTextQueue.length > 0) rawTextQueue.shift()?.(textData.text);
      rxBuffer.splice(0, textData.index + textData.length);
      processing = true;
      continue;
    }
  }
}

/* ================= QUEUE HELPERS ================= */

const ackQueue: ((status: number) => void)[] = [];
const ewmQueue: ((data: number[]) => void)[] = [];
const rawTextQueue: ((data: string) => void)[] = []; // Sửa kiểu dữ liệu callback

export function waitBleAck(timeout: number): Promise<number> {
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      const idx = ackQueue.indexOf(callback);
      if (idx !== -1) ackQueue.splice(idx, 1);
      resolve(0); // Timeout ACK không coi là lỗi
    }, timeout);

    const callback = (s: number) => {
      clearTimeout(timer);
      resolve(s);
    };
    ackQueue.push(callback);
  });
}

export function waitEwmResponse(timeout: number): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const idx = ewmQueue.indexOf(callback);
      if (idx !== -1) ewmQueue.splice(idx, 1);
      reject(new Error('EWM timeout'));
    }, timeout);

    const callback = (d: number[]) => {
      clearTimeout(timer);
      resolve(d);
    };
    ewmQueue.push(callback);
  });
}

// 🔥 Fix triệt để lỗi Memory Leak và Timeout ảo ở hàm này
export function waitRawText(timeout = 5000): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const idx = rawTextQueue.indexOf(callback);
      if (idx !== -1) rawTextQueue.splice(idx, 1);
      reject(new Error("RAW timeout"));
    }, timeout);

    const callback = (text: string) => {
      clearTimeout(timer);
      resolve(text);
    };
    rawTextQueue.push(callback);
  });
}

/* ================= UTILS ================= */

export function bytesToHex(data?: number[] | Uint8Array) {
  if (!data) return '';
  return Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(' ').toUpperCase();
}

export function calcCrc16ForOTA(data: Uint8Array): Uint8Array {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 8; j !== 0; j--) {
      if ((crc & 0x0001) !== 0) {
        crc >>= 1;
        crc ^= 0xA001;
      } else {
        crc >>= 1;
      }
    }
  }
  return new Uint8Array([crc & 0xFF, (crc >> 8) & 0xFF]);
}

export const reconnectHandle = async () => {
  const lastId = store?.state.hhu.idConnectLast;
  if (!lastId) return;

  try {
    store.setState(p => ({ ...p, hhu: { ...p.hhu, connect: "CONNECTING" } }));
    await BleManager.connect(lastId);
    await startNotification(lastId);
    store.setState(p => ({ ...p, hhu: { ...p.hhu, connect: "CONNECTED", isConnected: true, idConnected: lastId } }));
  } catch (err) {
    store.setState(p => ({ ...p, hhu: { ...p.hhu, connect: "DISCONNECTED", isConnected: false } }));
  }
};