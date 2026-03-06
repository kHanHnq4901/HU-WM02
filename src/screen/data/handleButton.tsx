// handleButton.ts
import { Alert } from 'react-native';
import { buildEwmFrame, parseDecryptedPayload } from '../../util/EwmFrameBuilder';
import { sendAndReceiveQueued, bytesToHex } from '../../util/ble';
import { hookProps, store, getEventNameFromId } from './controller';
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

  // 🔹 UI index (1-based)
  // Giả sử dữ liệu cấu hình tối đa là 720 bản ghi
  const fromUI = parseInt(state.fromValue) || 1;
  const toUI   = parseInt(state.toValue)   || 720;

  if (fromUI > toUI || fromUI < 1 || toUI > 720) {
    Alert.alert('Lỗi', 'Giá trị không hợp lệ (1–720)');
    return;
  }

  // 🔥 Firmware index (0-based)
  const fromIndex = fromUI - 1;
  const toIndex   = toUI   - 1;

  // 🚀 BẮT ĐẦU ĐỌC
  setState(p => ({
    ...p,
    isReading: true,
    stopRead: false,
    dataList: [], // Clear mảng dataList thay vì eventList
  }));

  let rowNumber = 1;
  const u16LE = (v: number) => [v & 0xff, (v >> 8) & 0xff];

  try {
    // 🔥 ĐỌC THEO BLOCK 5 DATA / FRAME
    for (let blockStart = fromIndex; blockStart <= toIndex; blockStart += 5) {
      // 🛑 CHECK DỪNG
      if (hookProps.state.stopRead) {
        console.log('⛔ Người dùng dừng đọc Dữ liệu');
        break;
      }

      const blockEnd = Math.min(blockStart + 4, toIndex);
      const payload = [
        ...u16LE(blockStart),
        ...u16LE(blockEnd),
      ];

      // Mã lệnh cho Data là 10 (Event là 11)
      const frame = buildEwmFrame(10, payload);
      
      console.log(
        `📤 Send Data (${blockStart + 1}-${blockEnd + 1})`
      );

      try {
        const recv = await sendAndReceiveQueued(connectedId, frame);
        if (!recv?.length) {
          await sleep(100);
          continue;
        }

        const decryptedPayload = parseDecryptedPayload(new Uint8Array(recv));
        let index = 0;
        const rows: any[] = [];

        // 🔹 1 data = 2 byte index + 18 byte data = 20 byte
        while (index + 20 <= decryptedPayload.length) {
          // Cắt lấy 18 byte dữ liệu, bỏ qua 2 byte index ban đầu
          const payloadData = decryptedPayload.slice(index + 2, index + 20);
          index += 20;

          // Parse thời gian
          const year = 2000 + payloadData[0];
          const month = payloadData[1];
          const day = payloadData[2];
          const hour = payloadData[3];
          const minute = payloadData[4];
          const second = payloadData[5];

          const timeStr =
            `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ` +
            `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;

          // Đẩy vào mảng tạm
          rows.push({
            id: rowNumber++,
            time: timeStr,
            forward: readUInt32LE(payloadData, 6),
            reverse: readUInt32LE(payloadData, 10),
            flow: readUInt32LE(payloadData, 14),
          });
        }

        // ✅ setState 1 lần / block
        if (rows.length) {
          setState(p => ({
            ...p,
            dataList: [...p.dataList, ...rows],
          }));
        }

      } catch (err) {
        console.log(`[Lỗi] Block ${blockStart + 1}-${blockEnd + 1}`, err);
      }

      await sleep(100);
    }
  } finally {
    // 🧹 RESET TRẠNG THÁI
    setState(p => ({
      ...p,
      isReading: false,
      stopRead: false,
    }));

    console.log('✅ Kết thúc đọc Dữ liệu');
  }
};

// Hàm parse byte vẫn giữ nguyên
export function readUInt32LE(bytes: Uint8Array, offset = 0): number {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  ) >>> 0; 
}









