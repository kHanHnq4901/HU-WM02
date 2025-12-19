import { parseUint16, parseUint32 } from "../../util";
import { parseDateBCD } from "./aps/util";

export interface HistoryRecord {
  timestamp: Date;
  value: number;
}

export interface MeterData {
  serial: string;
  currentTime: Date;
  impData: number;
  expData: number;
  event: string;
  batteryLevel: string;
  latchPeriod: string;
  totalPacket: number;
}

export interface ParseResult {
  meterData?: MeterData;
  historyRecords: HistoryRecord[];
  receivedPacketCount: number;
  totalPacket: number;
}

export function parseResponsePayload(
  payload: number[],
  meterSerial: string,
  prevRecords: HistoryRecord[] = [],
  latchPeriodMinutes: number = 0
): ParseResult {
  let receivedPacketCount = 0;
  let totalPacket = 0;
  const historyRecords: HistoryRecord[] = [...prevRecords];

  if (payload.length < 3) {
    return { historyRecords, receivedPacketCount, totalPacket };
  }

  const u8CommandCode = payload[0];
  const indexPacket = payload[1];
  const recordCount = payload[2];
  const bytePerRecord = u8CommandCode === 1 ? 4 : 2;
  let offset = 3;

  let meterData: MeterData | undefined;

  if (indexPacket === 1) {
    const currentTimeBytes = payload.slice(offset, offset + 6);
    const currentDate = parseDateBCD(currentTimeBytes);
    offset += 6;

    const impData = parseUint32(payload.slice(offset, offset + 4));
    offset += 4;
    const expData = parseUint32(payload.slice(offset, offset + 4));
    offset += 4;

    const event = payload[offset].toString(16).padStart(2, "0");
    offset += 1;

    const voltage = payload[offset] / 10;
    const batteryLevel = `${Math.min(
      100,
      Math.max(0, (voltage / 3.6) * 100)
    ).toFixed(0)}%`;
    offset += 1;

    const latchPeriod =
      (payload[offset] & 0xff) | ((payload[offset + 1] & 0xff) << 8);
    offset += 2;

    totalPacket = payload[offset];
    offset += 1;

    receivedPacketCount = 1;

    meterData = {
      serial: meterSerial,
      currentTime: currentDate,
      impData,
      expData,
      event,
      batteryLevel,
      latchPeriod: latchPeriod.toString(),
      totalPacket,
    };

    if (currentDate) {
      const baseTimeMs = currentDate.getTime();
      for (let i = 0; i < recordCount; i++) {
        const start = offset + i * bytePerRecord;
        const value =
          u8CommandCode === 1
            ? parseUint32(payload.slice(start, start + bytePerRecord))
            : parseUint16(payload.slice(start, start + bytePerRecord));

        const timestamp = new Date(baseTimeMs - i * latchPeriod * 60_000);
        historyRecords.push({ timestamp, value });
      }
    }
  } else {
    receivedPacketCount++;

    if (historyRecords.length === 0) {
      return { historyRecords, receivedPacketCount, totalPacket };
    }

    const oldest = historyRecords.reduce(
      (min, r) => (r.timestamp < min ? r.timestamp : min),
      historyRecords[0].timestamp
    );

    for (let i = 0; i < recordCount; i++) {
      const start = offset + i * bytePerRecord;
      const value =
        u8CommandCode === 1
          ? parseUint32(payload.slice(start, start + bytePerRecord))
          : parseUint16(payload.slice(start, start + bytePerRecord));

      const timestamp = new Date(
        oldest.getTime() - (i + 1) * latchPeriodMinutes * 60_000
      );
      historyRecords.push({ timestamp, value });
    }
  }

  return {
    meterData,
    historyRecords,
    receivedPacketCount,
    totalPacket,
  };
}

