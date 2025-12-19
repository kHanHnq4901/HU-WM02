import { Alert } from "react-native";
import { send } from "../../util/ble";
import { buildQueryDataPacket } from "../../service/hhu/aps/hhuAps";
import { parseResponsePayload } from "../../service/hhu/hhuParser";
import { removeBleListener } from "../../service/hhu/ble";
import { hhuState } from "../../service/hhu/hhuState";
import { HuResponseCode, getHuResponseMsg } from "../../service/hhu/huResponse";
import { Buffer } from "buffer";
import { store } from "../../screen/overview/controller";

export function createHhuHandler(hookProps: any) {
  let timeoutRetry: NodeJS.Timeout | null = null;
  let ackTimeout: NodeJS.Timeout | null = null;
  let hasFinished = false;
  let hasReceivedAnyPacket = false;
  let isProcessing = false;

  const packetRawMap: Map<number, number[]> = new Map();
  const perPacketRetries: Map<number, number> = new Map();
  let expectedTotalPackets = 0;
  let nextToProcessIndex = 1;
  let accumulatedRecords: any[] = [];
  let currentMeterData: any = null;
  let latchPeriodMinutesLocal = 0;

  const ACK_TIMEOUT_MS = 400;
  const MISSING_PACKET_TIMEOUT_MS = 4000;

  const getMaxRetry = () => {
    const v = store?.state?.appSetting?.setting?.retryCount;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  };

  const clearAckTimeout = () => {
    if (ackTimeout) {
      clearTimeout(ackTimeout);
      ackTimeout = null;
    }
  };

  const clearRetryTimeout = () => {
    if (timeoutRetry) {
      clearTimeout(timeoutRetry);
      timeoutRetry = null;
    }
  };

  
  const cleanup = () => {
    console.log("🧹 cleanup - reset state & resources");
    clearRetryTimeout();
    clearAckTimeout();

    try {
      removeBleListener();
    } catch {}

    hhuState.dataQueue = [];

    hasFinished = true;
    hasReceivedAnyPacket = false;
    isProcessing = false;

    packetRawMap.clear();
    perPacketRetries.clear();
    expectedTotalPackets = 0;
    nextToProcessIndex = 1;
    accumulatedRecords = [];
    currentMeterData = null;
    latchPeriodMinutesLocal = 0;

    try {
      hookProps.setState((prev: any) => ({
        ...prev,
        isReading: false,
        isLoading: false,
        textLoading: "",
      }));
    } catch (err) {
      console.warn("hookProps.setState failed in cleanup:", err);
    }
  };

  const finalizeProcessing = (meterSerial: string) => {
    console.log("✅ finalizeProcessing: đã xử lý đủ gói, chờ 300ms trước cleanup để đảm bảo state cập nhật.");
    setTimeout(() => {
      if (hasFinished) return;
      const processed = nextToProcessIndex - 1;
      if (expectedTotalPackets > 0 && processed >= expectedTotalPackets) {
        console.log("finalizeProcessing: điều kiện đủ -> cleanup()");
        cleanup();
      } else {
        console.log("finalizeProcessing: điều kiện không đủ, giữ nguyên state.");
      }
    }, 300);
  };

  const handleAckTimeoutFor = (packetIndex: number) => {
    ackTimeout = null;
    const retries = perPacketRetries.get(packetIndex) ?? 0;
    const max = getMaxRetry();

    if (retries >= max) {
      console.warn(`⚠️ ACK timeout: packet ${packetIndex} exceeded retry ${retries} >= ${max}`);
      Alert.alert("Thông báo", `Gửi gói ${packetIndex} thất bại sau ${retries} lần thử.`);
      cleanup();
      return;
    }

    perPacketRetries.set(packetIndex, retries + 1);
    console.log(`🔁 ACK timeout: retrying packet ${packetIndex} (attempt ${retries + 1})`);
    sendRequestForPacket(packetIndex);
  };

  const sendRequestForPacket = async (packetIndex: number) => {
    const packet = buildQueryDataPacket(
      hookProps.state.serial,
      packetIndex,
      hookProps.state.isDetailedRead
    );
    try {
      await send(store.state.hhu.idConnected, packet);
      console.log(`📤 Sent packet request ${packetIndex}`);
      hookProps.setState?.((prev: any) => ({
        ...prev,
        textLoading: `Đang đọc dữ liệu... gửi yêu cầu gói ${packetIndex}`,
      }));

      clearAckTimeout();
      ackTimeout = setTimeout(() => handleAckTimeoutFor(packetIndex), ACK_TIMEOUT_MS);
    } catch (err) {
      console.log(`❌ Error sending packet ${packetIndex}:`, err);
      handleAckTimeoutFor(packetIndex);
    }
  };

  const resetTimeout = (meterSerial: string) => {
    clearRetryTimeout();
    timeoutRetry = setTimeout(() => {
      if (isProcessing) {
        console.log("⏳ resetTimeout fired but isProcessing true -> reschedule");
        resetTimeout(meterSerial);
        return;
      }
      console.log("⏰ resetTimeout fired => checkAndRequestMissingPackets");
      checkAndRequestMissingPackets(meterSerial);
    }, MISSING_PACKET_TIMEOUT_MS);
  };

  const checkAndRequestMissingPackets = async (meterSerial: string) => {
    if (hasFinished || expectedTotalPackets <= 0) {
      console.log("checkAndRequestMissingPackets: nothing to do");
      return;
    }

    if (packetRawMap.size === expectedTotalPackets) {
      console.log("✅ all raw payloads received -> try process sequentially");
      await tryProcessSequentialPackets(meterSerial);
      return;
    }

    const missing: number[] = [];
    for (let i = 1; i <= expectedTotalPackets; i++) {
      if (!packetRawMap.has(i)) missing.push(i);
    }

    if (missing.length === 0) {
      console.log("checkAndRequestMissingPackets: missing list empty -> try process sequentially");
      await tryProcessSequentialPackets(meterSerial);
      return;
    }

    console.log(`📡 checkAndRequestMissingPackets: missing = [${missing.join(", ")}]`);
    for (const idx of missing) {
      const retries = perPacketRetries.get(idx) ?? 0;
      if (retries >= getMaxRetry()) {
        console.warn(`⚠️ Gói ${idx} đã retry ${retries} lần -> dừng đọc.`);
        Alert.alert("Thông báo", `Không nhận được gói ${idx} sau ${retries} lần thử. Vui lòng thử lại.`);
        cleanup();
        return;
      }
      perPacketRetries.set(idx, retries + 1);
      await sendRequestForPacket(idx);
    }
    resetTimeout(meterSerial);
  };

  const tryProcessSequentialPackets = async (meterSerial: string) => {
    if (hasFinished || isProcessing) return;

    isProcessing = true;
    try {
      while (packetRawMap.has(nextToProcessIndex)) {
        const rawPayload = packetRawMap.get(nextToProcessIndex)!;
        const result = parseResponsePayload(rawPayload, meterSerial, accumulatedRecords, latchPeriodMinutesLocal);

        if (nextToProcessIndex === 1 && result?.meterData) {
          currentMeterData = result.meterData;
          latchPeriodMinutesLocal = parseInt(String(result.meterData.latchPeriod || latchPeriodMinutesLocal), 10) || latchPeriodMinutesLocal;
          if (result.totalPacket && result.totalPacket > 0) {
            expectedTotalPackets = result.totalPacket;
            hhuState.globalTotalPacket = expectedTotalPackets;
          }
          if (result.meterData?.latchPeriod) {
            hhuState.globalLatchPeriodMinutes = parseInt(String(result.meterData.latchPeriod), 10) || hhuState.globalLatchPeriodMinutes;
          }
        }

        accumulatedRecords = result.historyRecords ?? accumulatedRecords;

        try {
          hookProps.setState((prev: any) => ({
            ...prev,
            meterData: result.meterData ?? prev.meterData ?? null,
            historyData: accumulatedRecords.length
              ? { serial: meterSerial, dataRecords: accumulatedRecords.map((r: any) => ({ timestamp: r.timestamp, value: r.value })) }
              : prev.historyData ?? null,
            textLoading: `Đã xử lý ${nextToProcessIndex-1}/${expectedTotalPackets || "?"} gói`,
          }));
        } catch {}

        hhuState.receivedPacketCount = Math.max(hhuState.receivedPacketCount, nextToProcessIndex);
        packetRawMap.delete(nextToProcessIndex);
        nextToProcessIndex++;
      }

      const processed = nextToProcessIndex - 1;
      if (expectedTotalPackets > 0 && processed >= expectedTotalPackets) {
        finalizeProcessing(meterSerial);
        return;
      }

      if (expectedTotalPackets > 0 && packetRawMap.size < expectedTotalPackets) {
        resetTimeout(meterSerial);
      }
    } catch (err) {
      console.log("❌ Lỗi trong tryProcessSequentialPackets:", err);
      cleanup();
    } finally {
      isProcessing = false;
    }
  };

  const responeData = async (payload: number[], meterSerial: string) => {
    try {
      const packetIndex = typeof payload[1] === "number" ? payload[1] : 0;
      if (!packetIndex) return;

      if (hasFinished) return;

      packetRawMap.set(packetIndex, payload);
      hasReceivedAnyPacket = true;

      if (packetIndex === 1 && !currentMeterData) {
        const firstResult = parseResponsePayload(payload, meterSerial, [], 0);
        if (firstResult && firstResult.meterData) {
          currentMeterData = firstResult.meterData;
          latchPeriodMinutesLocal = parseInt(String(firstResult.meterData.latchPeriod), 10) || 0;
          expectedTotalPackets = firstResult.totalPacket || expectedTotalPackets || 0;
          if (expectedTotalPackets > 0) hhuState.globalTotalPacket = expectedTotalPackets;
          if (firstResult.meterData?.latchPeriod) {
            hhuState.globalLatchPeriodMinutes = parseInt(String(firstResult.meterData.latchPeriod), 10) || hhuState.globalLatchPeriodMinutes;
          }
        } else {
          Alert.alert("Thông báo", "Gói 1 trả về không hợp lệ");
          cleanup();
          return;
        }
      }

      await tryProcessSequentialPackets(meterSerial);

      if (!hasFinished && expectedTotalPackets > 0 && packetRawMap.size < expectedTotalPackets) {
        resetTimeout(meterSerial);
      }
    } catch (err) {
      console.log("❌ Lỗi trong responeData:", err);
      cleanup();
    }
  };

  const hhuHandleReceiveData = async (data: { value: number[] }) => {
    if (hasFinished) return;
    console.log("Dữ liệu phản hồi về (raw):", data.value);

    const buf = Buffer.from(data.value);

    if (buf[0] === 0xAA) {
      const response = buf[2];
      const msg = getHuResponseMsg(response);
      clearAckTimeout();

      if (response !== HuResponseCode.CMD_RESP_SUCCESS) {
        Alert.alert("Thông báo", "Thiết bị báo lỗi: " + msg);
        cleanup();
        return;
      }
      return;
    }

    if (buf.length < 15 || buf[0] !== 0x02 || buf[1] !== 0x08) return;

    const commandType = buf[2];
    const lenPayload = buf[3];
    const meterSerial = buf.slice(4, 14).toString("ascii");
    const payload = Array.from(buf.slice(14, 14 + lenPayload));

    if (commandType === 0x01) {
      await responeData(payload, meterSerial);
    }
  };

  const prepareForRead = () => {
    clearRetryTimeout();
    clearAckTimeout();

    packetRawMap.clear();
    perPacketRetries.clear();
    expectedTotalPackets = 0;
    nextToProcessIndex = 1;
    accumulatedRecords = [];
    currentMeterData = null;
    latchPeriodMinutesLocal = 0;
    hasFinished = false;
    hasReceivedAnyPacket = false;
    isProcessing = false;

    console.log("🔄 prepareForRead - retryCount (fresh):", getMaxRetry());

    try {
      hookProps.setState((prev: any) => ({
        ...prev,
        isReading: true,
        meterData: null,
        historyData: null,
        textLoading: "Đang đọc dữ liệu",
        currentTime: new Date(),
      }));
    } catch {}
  };

  return {
    prepareForRead,
    hhuHandleReceiveData,
    cleanup,
    getMaxRetry,
    _internal: {
      hasFinished: () => hasFinished,
      hasReceivedAnyPacket: () => hasReceivedAnyPacket,
      isProcessing: () => isProcessing,
      packetRawMap,
      expectedTotalPackets: () => expectedTotalPackets,
      nextToProcessIndex: () => nextToProcessIndex,
    },
  };
}

