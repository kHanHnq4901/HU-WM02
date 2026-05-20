import { aes128Decrypt, aes128Encrypt } from "./aes128";
import { bytesToHex } from "./ble";

export type ParameterData = {
  paramId: number;
  data: number[];
};

export const EWM_HEADER = "*EWM02";

export function buildEwmFrame(typePack: number, payload: number[]): number[] {
  const frame: number[] = [];

  // 1. Header "*EWM02" (6 bytes)
  const headerBytes = Array.from(EWM_HEADER).map(c => c.charCodeAt(0));
  frame.push(...headerBytes);

  // 2. TypePack (1 byte)
  frame.push(typePack & 0xFF);

  // 3. LenSerial = 0 (1 byte)
  frame.push(0x00);

  // 4. Meter Serial (Để rỗng khi làm việc cổng quang - theo C#)

  // 5. LenPayload (1 byte)
  frame.push(payload.length & 0xFF);

  // 6. Payload (Mã hóa AES128)
  const encrypted = Array.from(aes128Encrypt(new Uint8Array(payload)));
  frame.push(...encrypted);

  // 7. End mark "#" (1 byte)
  frame.push(0x23);

  // 8. CRC16 MODBUS
  const crc = crc16Modbus(frame);
  // Theo C#: BitConverter.GetBytes(crc) trên hệ thống Little Endian sẽ trả về [Low, High]
  frame.push(crc & 0xFF);         // Low byte
  frame.push((crc >> 8) & 0xFF);  // High byte

  return frame;
}

export function parseDecryptedPayload(frame: Uint8Array): Uint8Array {
  try {
    let index = 0;

    // 1. Check header
    const header = String.fromCharCode(...frame.slice(0, 6));
    if (header !== EWM_HEADER) throw new Error('Invalid header');
    index += 6;

    // 2. Skip TypePack
    index += 1;

    // 3. Read lenSerial và skip Serial
    const lenSerial = frame[index++];
    index += lenSerial;

    // 4. Read lenPayload
    const lenPayload = frame[index];

    // 5. Tính chiều dài encryptedPayload (Theo logic C# đúng)
    // C# code: lenPayload < 16 ? 16 : lenPayload
    const encryptedPayloadLen = lenPayload < 16 ? 16 : lenPayload;
    
    // Tăng index sau khi đọc lenPayload để trỏ vào vùng encrypted data
    index += 1; 

    // 6. Kiểm tra đủ dữ liệu (Giống logic index++ của C#)
    if (index + encryptedPayloadLen > frame.length) {
      throw new Error("Frame quá ngắn hoặc sai định dạng");
    }

    // 7. Extract encrypted payload
    const encryptedPayload = frame.slice(index, index + encryptedPayloadLen);

    // 8. Decrypt AES128
    const decryptedPayload = aes128Decrypt(encryptedPayload);

    // Lưu ý: Nếu C# trả về mảng đã decrypt có padding, 
    // bạn có thể cần .slice(0, lenPayload) nếu thư viện TS không tự cắt.
    return decryptedPayload.slice(0, lenPayload);
  } catch (ex: any) {
    throw new Error("Lỗi khi phân tích frame: " + ex.message);
  }
}

/**
 * Các hàm bổ trợ giữ nguyên
 */
export function                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
buildOptSetPayload(parameters: ParameterData[]): number[] {
  const payload: number[] = [];
  for (const p of parameters) {
    payload.push(p.paramId & 0xff);
    payload.push(...p.data.map(e => e & 0xff));
  }
  return payload;
}

export function buildOptReadPayload(paramIds: number[]): number[] {
  return paramIds.map(e => e & 0xff);
}

export function crc16Modbus(data: number[]): number {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 0x0001) {
        crc >>= 1;
        crc ^= 0xa001;
      } else {
        crc >>= 1;
      }
    }
  }
  return crc & 0xffff;
}