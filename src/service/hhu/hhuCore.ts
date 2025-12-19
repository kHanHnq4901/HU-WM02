import { parseResponsePayload } from "./hhuParser";

type UpdateStateFn = (update: (prev: any) => any) => void;
type SendFn = (data: number[]) => Promise<void>;
type CheckConnectedFn = () => Promise<boolean>;

export interface HhuCoreProps {
  meterSerial: string;
  isDetailedRead: boolean;
  send: SendFn;
  checkConnected: CheckConnectedFn;
  updateState: UpdateStateFn;
  getRetryCount?: () => number;
}

// --- biến nội bộ ---
let packetRawMap: Map<number, number[]> = new Map();
let perPacketRetries: Map<number, number> = new Map();
let expectedTotalPackets = 0;
let nextToProcessIndex = 1;
let accumulatedRecords: any[] = [];
let currentMeterData: any = null;
let latchPeriodMinutesLocal = 0;
let isProcessing = false;
let timeoutRetry: NodeJS.Timeout | null = null;
let hasFinished = false;
let hasReceivedAnyPacket = false;
let initialSendRetryCount = 0;

export const resetCoreState = () => {
  if (timeoutRetry) clearTimeout(timeoutRetry);
  packetRawMap.clear();
  perPacketRetries.clear();
  expectedTotalPackets = 0;
  nextToProcessIndex = 1;
  accumulatedRecords = [];
  currentMeterData = null;
  latchPeriodMinutesLocal = 0;
  isProcessing = false;
  timeoutRetry = null;
  hasFinished = false;
  hasReceivedAnyPacket = false;
  initialSendRetryCount = 0;
};

// --- logic chung ---
export async function responeDataCore(payload: number[], props: HhuCoreProps) {
  const { meterSerial, updateState } = props;
  const packetIndex = payload[1];
  if (!packetIndex || hasFinished) return;

  packetRawMap.set(packetIndex, payload);
  hasReceivedAnyPacket = true;

  // parse packet 1 nhanh để lấy expectedTotalPackets
  if (packetIndex === 1 && !currentMeterData) {
    const firstResult = parseResponsePayload(payload, meterSerial, [], 0);
    if (!firstResult?.meterData) {
      updateState(prev => ({ ...prev, textLoading: "Gói 1 không hợp lệ" }));
      hasFinished = true;
      return;
    }
    currentMeterData = firstResult.meterData;
    latchPeriodMinutesLocal = parseInt(String(firstResult.meterData.latchPeriod), 10) || 0;
    expectedTotalPackets = firstResult.totalPacket || 0;
  }

  await tryProcessSequentialPacketsCore(props);
}

async function tryProcessSequentialPacketsCore(props: HhuCoreProps) {
  const { meterSerial, updateState } = props;

  if (hasFinished || isProcessing) return;
  isProcessing = true;

  try {
    while (packetRawMap.has(nextToProcessIndex)) {
      const rawPayload = packetRawMap.get(nextToProcessIndex)!;
      const result = parseResponsePayload(rawPayload, meterSerial, accumulatedRecords, latchPeriodMinutesLocal);

      if (nextToProcessIndex === 1 && result.meterData) {
        currentMeterData = result.meterData;
      }

      accumulatedRecords = result.historyRecords ?? accumulatedRecords;

      // callback UI
      updateState(prev => ({
        ...prev,
        meterData: result.meterData ?? prev.meterData,
        historyData: accumulatedRecords.length ? { serial: meterSerial, dataRecords: accumulatedRecords } : prev.historyData,
      }));

      nextToProcessIndex++;
    }

    // check nếu hết gói => finalize
    if (expectedTotalPackets > 0 && nextToProcessIndex > expectedTotalPackets) {
      hasFinished = true;
      isProcessing = false;
      return;
    }
  } finally {
    isProcessing = false;
  }
}
