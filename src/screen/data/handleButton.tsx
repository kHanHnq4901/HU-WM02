import { Alert } from 'react-native';
import { buildEwmFrame, parseDecryptedPayload } from '../../util/EwmFrameBuilder';
import { sendAndReceiveQueued } from '../../util/ble';
import { DataItem, hookProps, store } from './controller';

let _stopFlag = false;

export const onReadData = async () => {
  const connectedId = store.state.hhu.idConnected;
  const { state, setState } = hookProps;

  if (state.isReading) {
    _stopFlag = true;
    return;
  }

  if (!connectedId) {
    Alert.alert('Chưa kết nối', 'Vui lòng kết nối thiết bị BLE trước khi đọc dữ liệu.');
    return;
  }

  const fromUI = parseInt(state.fromValue) || 1;
  const toUI   = parseInt(state.toValue)   || 720;

  if (fromUI < 1 || toUI > 720 || fromUI > toUI) {
    Alert.alert('Giá trị không hợp lệ', 'Phạm vi hợp lệ từ 1 đến 720, và giá trị đầu phải nhỏ hơn giá trị cuối.');
    return;
  }

  const fromIndex = fromUI - 1;
  const toIndex   = toUI - 1;
  const totalBlocks = Math.ceil((toIndex - fromIndex + 1) / 5);

  _stopFlag = false;
  setState(p => ({ ...p, isReading: true, dataList: [], progress: { done: 0, total: totalBlocks } }));

  let rowNumber = 1;
  let tempRows: DataItem[] = [];
  let doneBlocks = 0;
  let timeoutOccurred = false;
  const u16LE = (v: number) => [v & 0xff, (v >> 8) & 0xff];

  try {
    for (let blockStart = fromIndex; blockStart <= toIndex; blockStart += 5) {
      if (_stopFlag) break;

      const blockEnd = Math.min(blockStart + 4, toIndex);
      const frame = buildEwmFrame(10, [...u16LE(blockStart), ...u16LE(blockEnd)]);

      try {
        const recv = await sendAndReceiveQueued(connectedId, frame);
        doneBlocks++;

        if (recv?.length) {
          const decryptedPayload = parseDecryptedPayload(new Uint8Array(recv));
          let index = 0;

          while (index + 20 <= decryptedPayload.length) {
            const payloadData = decryptedPayload.slice(index + 2, index + 20);
            index += 20;

            const y  = 2000 + payloadData[0];
            const mo = payloadData[1].toString().padStart(2, '0');
            const d  = payloadData[2].toString().padStart(2, '0');
            const h  = payloadData[3].toString().padStart(2, '0');
            const mi = payloadData[4].toString().padStart(2, '0');
            const s  = payloadData[5].toString().padStart(2, '0');

            tempRows.push({
              id: rowNumber++,
              time: `${y}-${mo}-${d} ${h}:${mi}:${s}`,
              forward: readUInt32LE(payloadData, 6),
              reverse: readUInt32LE(payloadData, 10),
              flow: readUInt32LE(payloadData, 14),
            });
          }
        }

        if (tempRows.length >= 30 || blockStart + 5 > toIndex) {
          const batch = [...tempRows];
          setState(p => ({
            ...p,
            dataList: [...p.dataList, ...batch],
            progress: { done: doneBlocks, total: totalBlocks },
          }));
          tempRows = [];
        } else {
          setState(p => ({ ...p, progress: { done: doneBlocks, total: totalBlocks } }));
        }
      } catch (e: any) {
        if (e?.message === 'EWM timeout') {
          timeoutOccurred = true;
          break;
        }
        doneBlocks++;
        setState(p => ({ ...p, progress: { done: doneBlocks, total: totalBlocks } }));
      }
    }
  } finally {
    _stopFlag = false;
    setState(p => ({ ...p, isReading: false, progress: null }));
  }

  if (timeoutOccurred) {
    Alert.alert(
      'Thiết bị không phản hồi',
      'Quá thời gian chờ. Kiểm tra lại kết nối BLE và thử đọc lại.',
      [{ text: 'Đã hiểu', style: 'default' }],
    );
  }
};

export function readUInt32LE(bytes: Uint8Array, offset = 0): number {
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}
