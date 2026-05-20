import { Alert } from 'react-native';
import { buildEwmFrame, parseDecryptedPayload } from '../../util/EwmFrameBuilder';
import { sendAndReceiveQueued } from '../../util/ble';
import { hookProps, store, getPushStatusNameFromId, PushStatusItem } from './controller';

let _stopFlag = false;

export const onReadData = async () => {
  const connectedId = store.state.hhu.idConnected;
  const { state, setState } = hookProps;

  if (state.isReading) {
    _stopFlag = true;
    return;
  }

  if (!connectedId) {
    Alert.alert('Chưa kết nối', 'Vui lòng kết nối thiết bị BLE trước khi đọc.');
    return;
  }

  const fromUI = parseInt(state.fromValue) || 1;
  const toUI   = parseInt(state.toValue)   || 100;

  if (fromUI < 1 || toUI > 100 || fromUI > toUI) {
    Alert.alert('Giá trị không hợp lệ', 'Phạm vi hợp lệ từ 1 đến 100.');
    return;
  }

  const totalBlocks = Math.ceil((toUI - fromUI + 1) / 5);

  _stopFlag = false;
  setState(p => ({ ...p, isReading: true, statusList: [], progress: { done: 0, total: totalBlocks } }));

  let rowNumber = 1;
  let doneBlocks = 0;
  let timeoutOccurred = false;
  const u16LE = (v: number) => [v & 0xff, (v >> 8) & 0xff];

  try {
    for (let blockStart = fromUI; blockStart <= toUI; blockStart += 5) {
      if (_stopFlag) break;

      const blockEnd = Math.min(blockStart + 4, toUI);
      const frame = buildEwmFrame(12, [...u16LE(blockStart), ...u16LE(blockEnd)]);

      try {
        const recv = await sendAndReceiveQueued(connectedId, frame);
        doneBlocks++;

        if (recv?.length) {
          const decryptedPayload = parseDecryptedPayload(new Uint8Array(recv));
          let index = 0;
          const rows: PushStatusItem[] = [];

          while (index + 9 <= decryptedPayload.length) {
            index += 2; // skip 2-byte index field
            const p = decryptedPayload.slice(index, index + 7);
            index += 7;

            rows.push({
              id: rowNumber++,
              time: `${2000 + p[0]}-${p[1].toString().padStart(2,'0')}-${p[2].toString().padStart(2,'0')} ` +
                    `${p[3].toString().padStart(2,'0')}:${p[4].toString().padStart(2,'0')}:${p[5].toString().padStart(2,'0')}`,
              status: getPushStatusNameFromId(p[6]),
            });
          }

          if (rows.length) {
            setState(p => ({
              ...p,
              statusList: [...p.statusList, ...rows],
              progress: { done: doneBlocks, total: totalBlocks },
            }));
          } else {
            setState(p => ({ ...p, progress: { done: doneBlocks, total: totalBlocks } }));
          }
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
      [{ text: 'Đã hiểu' }],
    );
  }
};
