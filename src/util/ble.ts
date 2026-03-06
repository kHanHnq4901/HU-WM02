import { Alert, PermissionsAndroid, Platform } from 'react-native';
import BleManager from 'react-native-ble-manager';
import { Buffer } from 'buffer';
import { crc16 } from './crc16';
import {
  buildEwmFrame,
  buildOptReadPayload,
  parseDecryptedPayload,
} from './EwmFrameBuilder';
import { sleep } from '.';
import { store } from '../screen/overview/controller';
import { setStatus } from '../screen/ble/controller';
import { connectHandle } from '../screen/ble/handleButton';

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

  console.log("📤 FULL FRAME LENGTH:", frame.length);

  const MTU = 256;

  for (let i = 0; i < frame.length; i += MTU) {
    const chunk = frame.slice(i, i + MTU);

    console.log(
      `📤 SEND CHUNK ${i / MTU + 1}:`,
      chunk.length
    );

    await BleManager.write(
      id,
      service,
      characteristic,
      chunk,
      MTU,
    );

    // nếu thiết bị yếu nên mở cái này
    // await sleep(5);
  }
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
  frame: Uint8Array | number[],
  timeout = 500,
): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const data =
      frame instanceof Uint8Array ? Array.from(frame) : frame;

    taskQueue.push({ frame: data, timeout, resolve, reject });
    processQueue(id);
  });
}

async function processQueue(id: string) {
  if (sending || taskQueue.length === 0) return;
  sending = true;

  const task = taskQueue.shift()!;
  try {
    const waitAck = waitBleAck(400);
    const waitEwm = waitEwmResponse(task.timeout);

    await sendFrameInternal(id, task.frame);

    await waitAck; // ACK có hoặc không đều OK
    const resp = await waitEwm;

    task.resolve(resp);
  } catch (e) {
    task.reject(e);
  } finally {
    sending = false;
    processQueue(id);
  }
}

/* ================= RX BUFFER ================= */

let rxBuffer: number[] = [];

/* ================= ACK QUEUE ================= */

const ackQueue: ((status: number) => void)[] = [];

export function waitBleAck(timeout = 500): Promise<number> {
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
    if (
      buf[i] === 0xaa &&
      buf[i + 1] === 0x01 &&
      buf[i + 5] === 0x55
    ) {
      return {
        index: i,
        frame: buf.slice(i, i + 6),
        length: 6,
      };
    }
  }
  return null;
}



/* ================= EWM QUEUE ================= */

const ewmQueue: ((data: number[]) => void)[] = [];

export function waitEwmResponse(timeout = 5000): Promise<number[]> {
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
  for (let i = 0; i <= buf.length - HEADER.length; i++) {
    let match = true;

    for (let j = 0; j < HEADER.length; j++) {
      if (buf[i + j] !== HEADER[j]) {
        match = false;
        break;
      }
    }

    if (!match) continue;

    // ví dụ tối thiểu 10 byte để tránh false positive
    if (buf.length - i < 10) return null;

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

  // ================= ACK =================
  while (true) {
    const ack = findAck(rxBuffer);
    if (!ack) break;

    console.log("✅ ACK:", bytesToHex(ack.frame));

    ackQueue.shift()?.(1);
    rxBuffer.splice(ack.index, ack.length);
  }

  // ================= EWM =================
  while (true) {
    const ewm = findEwm(rxBuffer);
    if (!ewm) break;

    console.log('📦 EWM:', bytesToHex(ewm.frame));

    ewmQueue.shift()?.(ewm.frame);
    rxBuffer.splice(ewm.index, ewm.length);
  }

  // ================= RAW TEXT (FIXED) =================
  // Cắt phần ACK và EWM ở trên giữ nguyên...

  // ================= RAW TEXT (ĐÃ SỬA LẠI LOGIC PARSE) =================
  try {
    // Ép mảng buffer thành chuỗi
    const text = String.fromCharCode(...rxBuffer).trim();
    
    // Tìm kiếm các từ khóa đặc biệt mà Bootloader trả về thay vì so sánh toàn bộ
    const match = text.match(/(SUCCESS|FAIL|RESPONSE_FAIL|F\d+)/);

    if (match) {
      const extractedCmd = match[0]; // Lấy từ khóa bắt được (vd: "F1", "SUCCESS")
      console.log("📥 Bắt được RAW TEXT:", extractedCmd);

      if (rawTextQueue.length > 0) {
        rawTextQueue.shift()?.(extractedCmd);
      }

      rxBuffer = []; // Chỉ clear buffer khi đã bắt đúng lệnh
    }
  } catch (e) {
    // ignore
  }
}


/* ================= RAW TEXT QUEUE ================= */

const rawTextQueue: ((data: string) => void)[] = [];

export function waitRawText(timeout = 5000): Promise<string> {
  return new Promise((resolve, reject) => {

    rawTextQueue.push(resolve);

    setTimeout(() => {
      const i = rawTextQueue.indexOf(resolve);
      if (i !== -1) rawTextQueue.splice(i, 1);
      reject(new Error("RAW timeout"));
    }, timeout);

  });
}




export function bytesToHex(data?: number[] | Uint8Array) {
  if (!data) return '';
  return Array.from(data)
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ')
    .toUpperCase();
}
export async function sendRawBle(
  id: string,
  data: Uint8Array,
) {
  // 1. Tạo Frame có chứa "O K E" để kích hoạt xử lý ở mạch
  const payloadArray = Array.from(data);
  const crcPayload = crc16(Buffer.from(data), data.length);
  const body = [...payloadArray, crcPayload & 0xff, (crcPayload >> 8) & 0xff];
  const header = [0xaa, 0x01, body.length & 0xff, body.length >> 8];
  const base = [...header, ...body];
  const crcFrame = crc16(Buffer.from(base), base.length);
  
  // Gắn đuôi EXT (O K E) để mạch biết đã hết 1 Frame
  const finalFrame = [
    ...base, 
    crcFrame & 0xff, 
    crcFrame >> 8, 
    0x4f, // Chữ 'O'
    0x4b, // Chữ 'K'
    0x45  // Chữ 'E'
  ];

  //console.log("📤 BLE FRAMED LENGTH (TOTAL):", finalFrame.length);

  // 2. Chẻ nhỏ Frame theo đúng giới hạn của BLE (128 bytes)
  const WRITE_CHUNK_SIZE = 128;

  for (let i = 0; i < finalFrame.length; i += WRITE_CHUNK_SIZE) {
    const chunk = finalFrame.slice(i, i + WRITE_CHUNK_SIZE);

    // console.log(
    //   `📤 Gửi Chunk ${Math.floor(i / WRITE_CHUNK_SIZE) + 1}: ${chunk.length} bytes`
    // );

    // Gửi từng phần nhỏ xuống cho mạch lưu dần vào bộ nhớ đệm
    await BleManager.write(
      id,
      service,
      characteristic,
      chunk,
      chunk.length
    );

    // ⚠️ RẤT QUAN TRỌNG: 
    // Vì gửi lượng data lớn (128 bytes/lần), bạn phải cho mạch một khoảng 
    // thời gian ngắn (30ms - 50ms) để nó kịp chép vào bộ nhớ đệm (buffer), 
    // tránh tình trạng bị mất byte khiến mạch không bao giờ tìm thấy chữ "O K E".
    await sleep(30); 
  }
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
  // Trả về mảng 2 byte: [Low Byte, High Byte]
  return new Uint8Array([crc & 0xFF, (crc >> 8) & 0xFF]);
}
export const reconnectHandle = async () => {
  console.log("reconnect")
  const lastId = store?.state.hhu.idConnectLast;
  const lastName = store?.state.hhu.nameConnectLast;

  if (!lastId) {
    Alert.alert("Thông báo", "Không tìm thấy thiết bị đã kết nối trước đó.");
    return;
  }

  if (store.state.hhu.connect === "CONNECTING") return;

  if (
    store.state.hhu.connect === "CONNECTED" &&
    store.state.hhu.idConnected === lastId
  ) {
    Alert.alert("Thông báo", `Đang kết nối với ${lastName || lastId}`);
    return;
  }

  console.log(`🔄 Reconnect BLE: ${lastName} (${lastId})`);

  try {
    // ===== set CONNECTING =====
    store.setState(prev => ({
      ...prev,
      hhu: {
        ...prev.hhu,
        connect: "CONNECTING"
      }
    }));

    // ===== connect BLE =====
    await BleManager.connect(lastId);

    const res: any = await BleManager.retrieveServices(lastId);

    const char = res.characteristics.find(
      (c: any) => c.properties?.Write && c.properties?.Notify
    );

    if (!char) {
      throw new Error("Không tìm thấy characteristic");
    }

    await BleManager.startNotification(
      lastId,
      char.service,
      char.characteristic
    );

    console.log("✅ Reconnect thành công");

    // ===== update state =====
    store.setState(prev => ({
      ...prev,
      hhu: {
        ...prev.hhu,
        connect: "CONNECTED",
        isConnected: true,
        idConnected: lastId,
        name: lastName,
        serviceUUID: char.service,
        characteristicUUID: char.characteristic
      }
    }));

  } catch (err) {
    console.log("❌ Reconnect lỗi:", err);

    store.setState(prev => ({
      ...prev,
      hhu: {
        ...prev.hhu,
        connect: "DISCONNECTED",
        isConnected: false
      }
    }));

    Alert.alert("Lỗi", "Không thể kết nối lại thiết bị.");
  }
};


