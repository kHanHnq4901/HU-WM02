// handleButton.ts
import { Alert } from 'react-native';
import { buildEwmFrame, parseDecryptedPayload } from '../../util/EwmFrameBuilder';
import { sendAndReceiveQueued, bytesToHex } from '../../util/ble';
import { hookProps, store, getEventNameFromId } from './controller';
import { sleep } from '../../util';

export const onReadData = async () => {
  const connectedId = store.state.hhu.idConnected;
  const { state, setState } = hookProps;

  if (!connectedId) {
    Alert.alert('Lỗi', 'Chưa kết nối thiết bị BLE');
    return;
  }

  if (state.isReading) {
    Alert.alert('Thông báo', 'Đang đọc dữ liệu, vui lòng đợi hoặc bấm DỪNG');
    return;
  }

  const fromIndex = parseInt(state.fromValue) || 0;
  const toIndex = parseInt(state.toValue) || 720;

  if (fromIndex > toIndex || fromIndex < 0 || toIndex > 720) {
    Alert.alert(
      'Lỗi',
      'Giá trị từ, đến đọc dữ liệu không hợp lệ. Chỉ cho phép từ 0 đến 720.'
    );
    return;
  }

  // 🔥 reset & set trạng thái
  setState(p => ({
    ...p,
    dataList: [],
    isReading: true,
    stopRead: false,
  }));

  let rowNumber = 1;
  const getBytesLE = (v: number) => [v & 0xff, (v >> 8) & 0xff];

  try {
    for (let blockStart = fromIndex; blockStart <= toIndex; blockStart += 5) {
      if (hookProps.state.stopRead) {
        console.log('⛔ Người dùng dừng đọc');
        break;
      }

      const blockEnd = Math.min(blockStart + 4, toIndex);
      const payload = [...getBytesLE(blockStart), ...getBytesLE(blockEnd)];
      const frame = buildEwmFrame(10, payload);

      console.log(`📤 Send (${blockStart}-${blockEnd})`);

      try {
        const recv = await sendAndReceiveQueued(connectedId, frame);
        if (!recv?.length) {
          await sleep(100);
          continue;
        }

        const decryptedPayload = parseDecryptedPayload(new Uint8Array(recv));
        let index = 0;
        const rows: any[] = [];

        while (index + 20 <= decryptedPayload.length) {
          const payloadData = decryptedPayload.slice(index + 2, index + 20);
          index += 20;

          const year = 2000 + payloadData[0];
          const month = payloadData[1];
          const day = payloadData[2];
          const hour = payloadData[3];
          const minute = payloadData[4];
          const second = payloadData[5];

          rows.push({
            id: rowNumber++,
            time:
              `${year}-${month.toString().padStart(2,'0')}-${day
                .toString().padStart(2,'0')} ` +
              `${hour.toString().padStart(2,'0')}:${minute
                .toString().padStart(2,'0')}:${second.toString().padStart(2,'0')}`,
            forward: readUInt32LE(payloadData, 6),
            reverse: readUInt32LE(payloadData, 10),
            flow: readUInt32LE(payloadData, 14),
          });
        }

        if (rows.length) {
          setState(prev => ({
            ...prev,
            dataList: [...prev.dataList, ...rows],
          }));
        }

        await sleep(100);
      } catch (err) {
        console.error(`[Lỗi] Block ${blockStart}-${blockEnd}`, err);
        await sleep(100);
      }
    }
  } finally {
    // 🔥 reset trạng thái
    setState(p => ({
      ...p,
      isReading: false,
      stopRead: false,
    }));

    console.log('✅ Kết thúc đọc dữ liệu');
  }
};




export function readUInt32LE(bytes: Uint8Array, offset = 0): number {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  ) >>> 0; // >>> 0 để ép sang unsigned
}









