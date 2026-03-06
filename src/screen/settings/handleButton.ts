// handleButton.ts
import { Alert } from 'react-native';
import { hookProps, store } from './controller';
import { buildEwmFrame, buildOptReadPayload, parseDecryptedPayload } from '../../util/EwmFrameBuilder';
import { bytesToHex, calcCrc16ForOTA, sendAndReceiveQueued, sendRawBle, waitRawText } from '../../util/ble';

const BASE_URL = 'http://14.225.244.63:5050/WM02A';

export const handleCheckFirmware = async (): Promise<void> => {
  const { setState } = hookProps;
  const connectedId = store.state.hhu.idConnected;

  if (!connectedId) {
    Alert.alert('Lỗi', 'Chưa kết nối thiết bị');
    return;
  }

  try {
    // ===== Loading CURRENT VERSION =====
    setState(prev => ({
      ...prev,
      loadingCurrentVersion: true,
    }));

    // ===== Gửi lệnh đọc Firmware từ thiết bị =====
    const paramIds = [4];
    const payload = buildOptReadPayload(paramIds);
    const frame = buildEwmFrame(6, payload);

    console.log("Send: " + bytesToHex(frame));

    const receivedData = await sendAndReceiveQueued(
      connectedId,
      frame
    );

    console.log("Recv: " + bytesToHex(receivedData));

    if (!receivedData || receivedData.length === 0) {
      throw new Error("Không nhận được phản hồi");
    }

    // ===== Parse payload =====
    const decryptedPayload = parseDecryptedPayload(
      new Uint8Array(receivedData)
    );

    const fwVerBytes = decryptedPayload.slice(0, 10);
    const fwVer = String.fromCharCode(...fwVerBytes).trim();

    console.log("Firmware Version:", fwVer);

    // ===== Update current version =====
    setState(prev => ({
      ...prev,
      currentVersion: fwVer,
      loadingCurrentVersion: false,
    }));

  } catch (error) {
    console.log("Firmware read error:", error);

    setState(prev => ({
      ...prev,
      currentVersion: 'Không đọc được firmware từ thiết bị',
      loadingCurrentVersion: false,
    }));
  }
};


export const handleUpdateFirmware = async (): Promise<void> => {
  const connectedId = store.state.hhu.idConnected;

  if (!connectedId) {
    Alert.alert("Lỗi", "Chưa kết nối thiết bị");
    return;
  }

  try {
    hookProps.setState(prev => ({
      ...prev,
      otaRunning: true,
      otaProgress: 0,
      otaSent: 0,
      otaTotal: 0
    }));

    const response = await fetch(`${BASE_URL}/firmware.txt`);
    const arrayBuffer = await response.arrayBuffer();
    const firmwareBytes = new Uint8Array(arrayBuffer);

    const CHUNK_SIZE = 512;
    const firmwareChunks: Uint8Array[] = [];

    for (let i = 0; i < firmwareBytes.length; i += CHUNK_SIZE) {
      const chunk = firmwareBytes.slice(i, i + CHUNK_SIZE);
      const crcBytes = calcCrc16ForOTA(chunk);

      const finalChunk = new Uint8Array(chunk.length + 2);
      finalChunk.set(chunk, 0);
      finalChunk.set(crcBytes, chunk.length);

      firmwareChunks.push(finalChunk);
    }

    const totalBytes = firmwareChunks.reduce((a,b) => a + b.length, 0);

    hookProps.setState(prev => ({
      ...prev,
      otaTotal: totalBytes
    }));

    console.log(`📦 Tổng file: ${firmwareChunks.length}`);

    const startCmd = new TextEncoder().encode("OPT_UPDATE");
    await sendRawBle(connectedId, startCmd);

    let sentBytes = 0;

    while (true) {
      const text = await waitRawText(5000);

      if (text === "SUCCESS") {
        hookProps.setState(prev => ({
          ...prev,
          otaProgress: 100,
          otaRunning: false
        }));

        Alert.alert("Thành công", "Cập nhật Firmware hoàn tất!");
        break;
      }

      if (text === "FAIL") {
        throw new Error("Thiết bị báo FAIL");
      }

      if (text.startsWith("F")) {
        const fileIndex = parseInt(text.replace("F",""), 10);

        if (fileIndex > 0 && fileIndex <= firmwareChunks.length) {
          const data = firmwareChunks[fileIndex - 1];

          // 🔥 TRÍCH XUẤT VÀ LOG CRC TỪ 2 BYTE CUỐI
          const crcLow = data[data.length - 2].toString(16).padStart(2, '0').toUpperCase();
          const crcHigh = data[data.length - 1].toString(16).padStart(2, '0').toUpperCase();
          
          console.log(`📤 Đang gửi ${text} - Kích thước: ${data.length} bytes - CRC: 0x${crcHigh}${crcLow} [L:${crcLow} H:${crcHigh}]`);

          // Tiến hành gửi data
          await sendRawBle(connectedId, data);

          sentBytes += data.length;

          const progress = Math.floor(
            (sentBytes / totalBytes) * 100
          );

          hookProps.setState(prev => ({
            ...prev,
            otaProgress: progress,
            otaSent: sentBytes
          }));
        }
      }
    }

  } catch (error: any) {
    hookProps.setState(prev => ({
      ...prev,
      otaRunning: false
    }));

    console.log("OTA error:", error);
    Alert.alert("Lỗi cập nhật", error.message);
  }
};


export const handleCheckRemoteVersion = async (): Promise<void> => {
  const { setState } = hookProps;

  try {
    setState(prev => ({
      ...prev,
      loadingRemoteVersion: true,
    }));

    console.log("🔥 CALL API");

    const response = await fetch(`${BASE_URL}/version.txt`);
    const text = await response.text();
    const remoteVer = text.trim();

    console.log("Remote version:", remoteVer);

    setState(prev => ({
      ...prev,
      remoteVersion: remoteVer,
      loadingRemoteVersion: false,
    }));

  } catch (error) {
    console.log("API error:", error);

    setState(prev => ({
      ...prev,
      remoteVersion: 'Không kiểm tra được',
      loadingRemoteVersion: false,
    }));
  }
};


