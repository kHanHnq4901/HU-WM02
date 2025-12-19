// handleButton.ts
import { Alert } from 'react-native';
import { buildEwmFrame, parseDecryptedPayload } from '../../util/EwmFrameBuilder';
import { sendAndReceiveQueued, bytesToHex } from '../../util/ble';
import { hookProps, store, getEventNameFromId } from './controller';
import { sleep } from '../../util';

export const onReadEvent = async () => {
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
  const fromUI = parseInt(state.fromValue) || 1;
  const toUI   = parseInt(state.toValue)   || 32;

  if (fromUI > toUI || fromUI < 1 || toUI > 32) {
    Alert.alert('Lỗi', 'Giá trị không hợp lệ (1–32)');
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
    eventList: [],
  }));

  let rowNumber = 1;
  const u16LE = (v: number) => [v & 0xff, (v >> 8) & 0xff];

  try {
    // 🔥 ĐỌC THEO BLOCK 5 EVENT / FRAME
    for (let blockStart = fromIndex; blockStart <= toIndex; blockStart += 5) {
      // 🛑 CHECK DỪNG
      if (hookProps.state.stopRead) {
        console.log('⛔ Người dùng dừng đọc Event');
        break;
      }

      const blockEnd = Math.min(blockStart + 4, toIndex);
      const payload = [
        ...u16LE(blockStart),
        ...u16LE(blockEnd),
      ];

      const frame = buildEwmFrame(11, payload);
      console.log(
        `📤 Send (${blockStart + 1}-${blockEnd + 1})`,
        bytesToHex(frame)
      );

      try {
        const recv = await sendAndReceiveQueued(connectedId, frame);
        if (!recv?.length) continue;

        const decryptedPayload = parseDecryptedPayload(new Uint8Array(recv));
        let index = 0;
        const rows: any[] = [];

        // 🔹 1 event = 2 byte index + 7 byte data
        while (index + 9 <= decryptedPayload.length) {
          const recvIndex =
            ((decryptedPayload[index] << 8) |
              decryptedPayload[index + 1]) + 1;
          index += 2;

          const p = decryptedPayload.slice(index, index + 7);
          index += 7;

          const timeStr =
            `20${p[0]}-${p[1].toString().padStart(2, '0')}-${p[2]
              .toString()
              .padStart(2, '0')} ` +
            `${p[3].toString().padStart(2, '0')}:${p[4]
              .toString()
              .padStart(2, '0')}:${p[5]
              .toString()
              .padStart(2, '0')}`;

          rows.push({
            id: rowNumber++,
            time: timeStr,
            event: getEventNameFromId(p[6]),
          });
        }

        // ✅ setState 1 lần / block
        if (rows.length) {
          setState(p => ({
            ...p,
            eventList: [...p.eventList, ...rows],
          }));
        }
      } catch (err) {
        console.log(
          `[Lỗi] Block ${blockStart + 1}-${blockEnd + 1}`,
          err
        );
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

    console.log('✅ Kết thúc đọc Event');
  }
};














