export const hhuState = {
    dataQueue: [] as { value: number[] }[],
    isProcessing: false,
    globalHistoryRecords: [] as { timestamp: Date; value: number }[],
    globalLatchPeriodMinutes: 0,
    globalTotalPacket: 0,
    receivedPacketCount: 0,
  };
  
  export const resetState = () => {
    hhuState.dataQueue.length = 0;
    hhuState.globalHistoryRecords.length = 0;
    hhuState.globalLatchPeriodMinutes = 0;
    hhuState.globalTotalPacket = 0;
    hhuState.receivedPacketCount = 0;
    hhuState.isProcessing = false;
  };
  