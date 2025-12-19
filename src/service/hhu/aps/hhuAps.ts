import { crc16 } from "../../../util/crc16";
import { int16_t } from "../define";
import { CommandType, LoraCommandCode } from "../defineEM";

const STX = 0x02;         
const MODULE_TYPE = 0x08; 
global.Buffer = require('buffer').Buffer;
export const stringToBytes = (text: string): number[] => {
  const encoder = new TextEncoder();
  return Array.from(encoder.encode(text)); 
};

export const stringToUint8Array = (text: string): Uint8Array => {
  const encoder = new TextEncoder();
  return encoder.encode(text);
};

export const stringToBuffer = (text: string): Buffer => {
  return Buffer.from(text, "utf-8");
};

const buildPacket = (
  commandType: number,
  payload: number[],
  meterSerial: number[]
): number[] => {
  const lenPayload = payload.length;
  const baseData = [
    STX,
    MODULE_TYPE,
    commandType,
    lenPayload,
    ...meterSerial,
    ...payload,
  ];

  // dùng Uint8Array thay cho Buffer
  const buf = new Buffer(baseData);
  const crc = crc16(buf, buf.length);

  return [...baseData,  crc & 0xff,(crc >> 8) & 0xff];
};

export const buildGetParamPacket = (
  meterSerial: string,
  payload: LoraCommandCode
): number[] => {
  return buildPacket(
    CommandType.LORA_GET_PARAM,
    [payload as number],
    stringToBytes(meterSerial)
  );
};

export const buildSetParamPacket = (
  meterSerial: string,
  params: { id: number; data: number[] }[]
): number[] => {
  // Payload: [LORA_CMD_SETTING, paramCount, ...allParams]
  const payload: number[] = [];
  payload.push(LoraCommandCode.LORA_CMD_SETTING);
  payload.push(params.length); // số lượng params

  // nối từng param vào payload
  params.forEach((p) => {
    payload.push(p.id);           // u8ParamId
    payload.push(p.data.length);  // u8LenParam
    payload.push(...p.data);      // pParamData
  });
  console.log (payload)
  return buildPacket(
    CommandType.LORA_SET_PARAM,
    payload,
    stringToBytes(meterSerial)
  );
};

export const buildQueryDataPacket = (
  meterSerial: string,
  packet : number,
  isDetailedRead?: boolean
): number[] => {
  // ✅ Thêm 1 byte biểu diễn trạng thái isDetailedRead
  const detailedReadByte = isDetailedRead ?   LoraCommandCode.LORA_CMD_QUERY_DATA_DETAIL : LoraCommandCode.LORA_CMD_QUERY_DATA;

  const payload = [
    detailedReadByte, // ✅ byte mới
    packet,
  ];
  return buildPacket(
    CommandType.LORA_QUERY_DATA,
    payload,
    stringToBytes(meterSerial)
  );
};

export const buildLoraWakeUpPacket = (meterSerial: string): number[] => {
  const wakeupString = "WM08WakeUpNow";
  const wakeupBytes = stringToBytes(wakeupString);

  const payload = [
    LoraCommandCode.WAKEUP_DEVICE,
    0,
    wakeupBytes.length,
    ...wakeupBytes,
  ];
  return buildPacket(
    CommandType.LORA_WAKEUP,
    payload,
    stringToBytes(meterSerial)
  );
};

export enum HuCommandCode {
  CMD_APP_TRANSMIT_DEVICE_DATA_LORA = 0x00,
  CMD_APP_TRANSMIT_DEVICE_DATA_OPTICAL = 0x01,
  CMD_APP_CHANGE_NAME_BLE = 0x02,
  CMD_APP_GET_VERSION_FIRMWARE = 0x03,
  CMD_APP_UPDATE_FIRMWARE = 0x04,
}
export enum BootloaderCommandCode {
  FOTA_CMD_START_UPDATE = 0x10,
  FOTA_CMD_RECV_FW = 0x11,
  FOTA_CMD_CHECK_CRC_FW = 0x12,
  FOTA_CMD_VERSION_FW = 0x13
}

export const buildCmdHuPacket = (commandCode: HuCommandCode, payload: number[] = [] ): number[] => {
  const START_BYTE = 0xaa;

  const length = payload.length; // độ dài payload

  // Data để tính CRC: Command + Length + Payload
  const dataForCrc = [START_BYTE,commandCode, length, ...payload];
  const crc = crc16(new Buffer(dataForCrc),dataForCrc.length);
  // Build final packet
  return [
    START_BYTE,
    commandCode,
    length,
    ...payload,
    crc & 0xff,        // CRC Low
    (crc >> 8) & 0xff, // CRC High
  ];
};

export const buildCmdBootloaderPacket = (
  commandCode: BootloaderCommandCode,
  payload: number[] = []
): number[] => {
  const START_BYTE = 0xaa;

  // đảm bảo payload đủ 4 byte
  const fixedPayload = [...payload];
  while (fixedPayload.length < 4) {
    fixedPayload.push(0x00);
  }

  const length = fixedPayload.length; // lúc nào cũng = 4

  const dataForCrc = [START_BYTE, commandCode, length, ...fixedPayload];
  const crc = crc16(Buffer.from(dataForCrc), dataForCrc.length);

  return [
    START_BYTE,
    commandCode,
    length,
    ...fixedPayload,
    crc & 0xff,        // CRC Low
    (crc >> 8) & 0xff, // CRC High
  ];
};


export const buildCmdRecvFwBootloaderPacket = (commandCode: BootloaderCommandCode, payload: number[] = [] ): number[] => {
  const START_BYTE = 0xaa;
  const length = payload.length; // uint16

  // Tách length thành 2 byte
  const lengthLow = length & 0xff;
  const lengthHigh = (length >> 8) & 0xff;

  // Data để tính CRC: START + CMD + LengthLow + LengthHigh + Payload
  const dataForCrc = [START_BYTE, commandCode, lengthLow, lengthHigh, ...payload];
  const crc = crc16(Buffer.from(dataForCrc), dataForCrc.length);

  // Build final packet
  return [
    START_BYTE,
    commandCode,
    lengthLow,
    lengthHigh,
    ...payload,
    crc & 0xff,        // CRC Low
    (crc >> 8) & 0xff, // CRC High
  ];
};