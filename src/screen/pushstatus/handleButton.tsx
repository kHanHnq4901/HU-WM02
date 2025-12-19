// handleButton.ts
import { Alert } from 'react-native';
import { buildEwmFrame, parseDecryptedPayload } from '../../util/EwmFrameBuilder';
import { sendAndReceiveQueued, bytesToHex } from '../../util/ble';
import { hookProps, store, getPushStatusNameFromId, PushStatusItem } from './controller';
import { sleep } from '../../util';

export const onReadData = async () => {
  const connectedId = store.state.hhu.idConnected;
  const { state, setState } = hookProps;

  // ⛔ Nếu đang đọc → chuyển sang DỪNG
  if (state.isReading) {
    setState(p => ({ ...p, stopRead: true }));
    return;
  }

  if (!connectedId) {
    Alert.alert('Lỗi', 'Chưa kết nối thiết bị BLE');
    return;
  }

  const fromIndex = parseInt(state.fromValue) || 1;
  const toIndex = parseInt(state.toValue) || 100;

  if (fromIndex > toIndex || fromIndex < 1 || toIndex > 100) {
    Alert.alert('Lỗi', 'Giá trị không hợp lệ (1–100)');
    return;
  }

  // 🚀 Bắt đầu đọc
  setState(p => ({
    ...p,
    isReading: true,
    stopRead: false,
    statusList: [],
  }));

  let rowNumber = 1;
  const getBytesLE = (v: number) => [v & 0xff, (v >> 8) & 0xff];

  try {
    for (let blockStart = fromIndex; blockStart <= toIndex; blockStart += 5) {
      // 🛑 Kiểm tra dừng
      if (hookProps.state.stopRead) {
        console.log('⛔ Người dùng dừng đọc dữ liệu');
        break;
      }

      const blockEnd = Math.min(blockStart + 4, toIndex);
      const payload = [...getBytesLE(blockStart), ...getBytesLE(blockEnd)];
      const frame = buildEwmFrame(12, payload);

      console.log(`📤 Send (${blockStart} → ${blockEnd}):`, bytesToHex(frame));

      try {
        const recv = await sendAndReceiveQueued(connectedId, frame);
        if (!recv?.length) continue;

        const decryptedPayload = parseDecryptedPayload(new Uint8Array(recv));
        let index = 0;
        const rows: any[] = [];

        while (index + 9 <= decryptedPayload.length) {
          const currentIndex = (decryptedPayload[index] << 8) | decryptedPayload[index + 1];
          index += 2;

          const p = decryptedPayload.slice(index, index + 7);
          index += 7;

          const year = 2000 + p[0];
          const month = p[1];
          const day = p[2];
          const hour = p[3];
          const minute = p[4];
          const second = p[5];
          const status = getPushStatusNameFromId(p[6]);

          const timeStr =
            `${year}-${month.toString().padStart(2,'0')}-${day.toString().padStart(2,'0')} ` +
            `${hour.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')}:${second.toString().padStart(2,'0')}`;

          rows.push({ id: rowNumber++, time: timeStr, status });
        }

        if (rows.length) {
          setState(prev => ({
            ...prev,
            statusList: [...prev.statusList, ...rows],
          }));
        }
      } catch (err) {
        console.log(`[Lỗi] Frame ${blockStart}-${blockEnd}:`, err);
      }

      await sleep(100);
    }
  } finally {
    setState(p => ({
      ...p,
      isReading: false,
      stopRead: false,
    }));

    console.log('✅ Đọc xong tất cả bản tin');
  }
};












