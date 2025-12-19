import { aes128Decrypt, aes128Encrypt } from "./aes128";
import { bytesToHex } from "./ble";

export type ParameterData = {
  paramId: number;
  data: number[];
};

export const EWM_HEADER = "*EWM02";

export function buildEwmFrame(typePack: number, payload: number[]): number[] {
  const frame: number[] = [];

  // 1. Header "*EWM02"
  const headerBytes = Array.from(EWM_HEADER).map(c => c.charCodeAt(0));
  frame.push(...headerBytes);

  // 2. TypePack
  frame.push(typePack & 0xFF);

  // 3. LenSerial = 0 (optical mode)
  frame.push(0x00);

  // 4. MeterSerial = none

  // 5. LenPayload
  frame.push(payload.length & 0xFF);

  // 6. Payload được mã hóa AES128 (giống C# AES128)
  const encrypted = Array.from(aes128Encrypt(new Uint8Array(payload)));
  frame.push(...encrypted);

  // 7. End mark "#"
  frame.push("#".charCodeAt(0));

  // 8. CRC16 MODBUS (BIG-ENDIAN, giống C#)
  const crc = crc16Modbus(frame);

  frame.push(crc & 0xFF); // Low byte
  frame.push((crc >> 8) & 0xFF); // High byte
          

  return frame;
}

export function parseDecryptedPayload(frame: Uint8Array): Uint8Array {
  let index = 0;

  /* ===== HEADER ===== */
  if (frame.length < 6) {
    throw new Error('Frame too short (header)');
  }

  const header = String.fromCharCode(...frame.slice(index, index + 6));
  if (header !== '*EWM02') {
    throw new Error('Invalid EWM header');
  }
  index += 6;

  /* ===== TYPE PACK ===== */
  if (index + 1 > frame.length) {
    throw new Error('Frame too short (TypePack)');
  }
  index += 1;

  /* ===== LEN SERIAL ===== */
  if (index + 1 > frame.length) {
    throw new Error('Frame too short (LenSerial)');
  }
  const lenSerial = frame[index++];
  if (index + lenSerial > frame.length) {
    throw new Error('Frame too short (Serial)');
  }
  index += lenSerial;

  /* ===== LEN PAYLOAD ===== */
  if (index + 1 > frame.length) {
    throw new Error('Frame too short (LenPayload)');
  }
  const lenPayload = frame[index++];

  /* ===== AES PADDED LEN ===== */
  const encryptedLen = lenPayload < 16 ? 16 : lenPayload;

  /* ===== CHECK MIN FRAME ===== */
  // encrypted payload + '#' + CRC16
  const minFrameLen = index + encryptedLen + 1 + 2;
  if (frame.length < minFrameLen) {
    throw new Error('Frame too short for payload');
  }

  /* ===== ENCRYPTED PAYLOAD ===== */
  const encryptedPayload = frame.slice(index, index + encryptedLen);
  index += encryptedLen;

  console.log('🔒 Encrypted payload:', bytesToHex(encryptedPayload));

  /* ===== CHECK '#' ===== */
  if (frame[index] !== 0x23) {
    throw new Error('Missing # delimiter');
  }
  index += 1;

  /* ===== (OPTIONAL) CRC CHECK ===== */
  // const crc = frame.slice(index, index + 2);

  /* ===== DECRYPT ===== */
  const decryptedFull = aes128Decrypt(encryptedPayload);

  /* ===== CUT REAL PAYLOAD ===== */
  const decryptedPayload = decryptedFull.slice(0, lenPayload);

  console.log('🔓 Decrypted payload:', bytesToHex(decryptedPayload));

  return decryptedPayload;
}



export function buildOptSetPayload(
  parameters: ParameterData[]
): number[] {
  const payload: number[] = [];

  for (const p of parameters) {
    payload.push(p.paramId & 0xff);
    payload.push(...p.data.map(e => e & 0xff));
  }

  return payload;
}

export function buildOptReadPayload(
  paramIds: number[]
): number[] {
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
