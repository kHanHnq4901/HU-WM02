import { checkUpdateHHU } from '../../service/api';
import { BleFunc_SaveStorage, BleFunc_StartNotification, connectLatestBLE } from '../../service/hhu/bleHhuFunc';
import { ObjSend } from '../../service/hhu/hhuFunc';
import { requestBluetoothPermissions, requestPermissionScan } from '../../service/permission';
import BleManager from 'react-native-ble-manager';
import * as Ble from '../../util/ble';
import { showAlert, showToast, sleep } from '../../util';
import { hookProps, HookState, setStatus, store } from './controller';
import { Alert, Platform } from 'react-native';
import { PropsAppSetting, saveValueAppSettingToNvm } from '../../service/storage';
import { bytesToHex, sendAndReceiveQueued } from '../../util/ble';
import { SetStateAction } from 'react';
import { buildEwmFrame, buildOptReadPayload, buildOptSetPayload, ParameterData, parseDecryptedPayload } from '../../util/EwmFrameBuilder';

const TAG = 'handleBtn Ble:';

export const connectHandle = async (id: string, name: string) => {
  try {
    if (store?.state.hhu.connect === 'CONNECTED') {
      if (store?.state.hhu.idConnected === id) {
        // read rssi

        // let rssi: number = 0;
        // try {
        //   //console.log(TAG, 'a');
        //   if (store.state.hhu.rssi === 0) {
        //     console.log(TAG, 'read rssi');
        //     rssi = await BleManager.getRssi(id);
        //     //console.log(TAG, 'b');
        //     store?.setValue(state => {
        //       state.hhu.rssi = rssi;
        //       return { ...state };
        //     });
        //    await BleFunc_StartNotification(id);
        //     console.log(TAG, 'get rssi: ' + rssi);
        //   }
        // } catch (err: any) {
        //   console.log(TAG, err.message);
        // }

        return;
      }
      await BleManager.disconnect(store.state.hhu.idConnected, true);
    }
    if (name) {
      setStatus('Đang kết nối tới  ' + name + ' ...');
      store?.setState(state => {
        state.hhu.name = name;
        return { ...state };
      });
    }
    let succeed: boolean = false;
    try {
      store?.setState(state => {
        state.hhu.connect = 'CONNECTING';
        return { ...state };
      });
      //await BleManager.refreshCache(id);
      succeed = await Ble.connect(id);
    } catch (err :any) {
      store?.setState(state => {
        state.hhu.idConnected = '';
        state.hhu.connect = 'DISCONNECTED';
        return { ...state };
      });
      setStatus('Kết nối thất bại: ' + err.message);
    }

    if (succeed) {
      setStatus('Kết nối thành công');
      BleFunc_StartNotification(id);
      let rssi: number = 0;
      // try {
      //   rssi = await BleManager.getRssi(id);
      // } catch (err: any) {
      //   console.log(TAG, err.message);
      // }
      store?.setState(state => {
        state.hhu.idConnected = id;
        state.hhu.connect = 'CONNECTED';
        state.hhu.rssi = rssi;
        return { ...state };
      });
      BleFunc_SaveStorage(id);
      ObjSend.id = id;
      await sleep(500);
      
      
    } else {
      setStatus('Kết nối thất bại');
    }
    //navigation.goBack();
  } catch (err :any) {
    console.log(TAG, err);
    setStatus('Kết nối thất bại: ' + err.message);
  }
};

// Hàm scan
export const onScanPress = async () => {
  if (hookProps.state.ble.isScan) {
    return;
  }

  hookProps.setState(state => {
    state.status = ''; // Không xóa listNewDevice nữa
    return { ...state };
  });

  const requestScanPermission = await requestBluetoothPermissions();

  try {
    if (requestScanPermission) {
      console.log('here request');

      try {
        await BleManager.enableBluetooth();

        if (Platform.OS === 'android') {
          await BleManager.start({ showAlert: false });
          console.log("BLE Module initialized");
        }

        // Bắt đầu quét
        BleManager.scan([], 5, true).then(() => {
          console.log("Scan started");
          hookProps.setState(state => {
            state.ble.isScan = true;
            return { ...state };
          });

          // Sau 5s thì dừng quét
          setTimeout(() => {
            BleManager.stopScan().then(() => {
              console.log("Scan stopped");
              hookProps.setState(state => {
                state.ble.isScan = false;
                return { ...state };
              });
            });
          }, 5000);
        });

      } catch (err) {
        showAlert('Thiết bị cần được bật Bluetooth');
        return;
      }

    } else {
      console.log('requestGps failed');
    }
  } catch (err: any) {
    console.log(TAG, 'err:', err);
  }
};

export const disConnect = async (id: string) => {
  try {
    //console.log('here:', store.state.bleConnected);
    if (store?.state.hhu.connect === 'CONNECTED') {
      console.log('diconnect...');
      setStatus('Ngắt kết nối bluetooth');
      //await Ble.stopNotification(id);
      if (id === null) {
      } else {
        await BleManager.disconnect(id, true);
      }
    }
  } catch {}
};
export async function onBlePress() {
  console.log ('onBlePress')
  // Xin quyền nếu cần
  //await requestBlePermissions();

  const connectState = store.state.hhu.connect;
  console.log('Trạng thái kết nối hiện tại:', connectState);

  if (connectState === 'DISCONNECTED') {
    try {
      await connectLatestBLE(store);
      console.log('Kết nối lại thiết bị cũ');
    } catch (err) {
      console.log('Lỗi khi kết nối lại:', err);
    }
    return;
  }

  if (connectState === 'CONNECTING') {
    console.log('Đang kết nối, bỏ qua thao tác...');
    return;
  }
  if (connectState === 'CONNECTED') {
    Alert.alert(
      'Ngắt kết nối Bluetooth?',
      'Bạn có muốn ngắt kết nối thiết bị Bluetooth không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Ngắt kết nối',
          onPress: async () => {
            try {
              let peripheralId = ObjSend.id;
  
              if (!peripheralId) {
                let peripherals: any[] = [];
                if (Platform.OS === 'android') {
                  // Android: lấy các thiết bị đã paired
                  peripherals = await BleManager.getBondedPeripherals();
                }
                if (peripherals.length > 0) {
                  peripheralId = peripherals[0].id;
                }
              }
  
              if (peripheralId) {
                console.log('Ngắt kết nối với:', peripheralId);
                await BleManager.disconnect(peripheralId);
                store.setState(state => {
                  state.hhu.idConnected = '';
                  state.hhu.connect = 'DISCONNECTED';
                  return { ...state };
                });
              } else {
                console.log('Không tìm thấy thiết bị để ngắt kết nối.');
              }
            } catch (err) {
              console.log('Lỗi khi ngắt kết nối:', err);
            }
          },
        },
      ]
    );
  }
}



export async function onSavePress() {
  await saveValueAppSettingToNvm(store?.state.appSetting as PropsAppSetting);
  showToast('Đã lưu');
}
function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
const READ_COMMANDS = {
  moduleNo:          { paramId: 6,  length: 15,  stateKey: "inputModuleNo", ascii: true },
  meterNo:           { paramId: 5,  length: 20,  stateKey: "inputMeterNo", ascii: true },
  rtc:               { paramId: 1,  length: 6,   stateKey: "inputRTC" },
  firmwareVer:       { paramId: 10, length: 10,  stateKey: "inputFirmwareVer", ascii: true },
  bootVer:           { paramId: 11, length: 10,  stateKey: "inputBootVer", ascii: true },
  impData:           { paramId: 20, length: 4,   stateKey: "inputImpData" },
  expData:           { paramId: 21, length: 4,   stateKey: "inputExpData" },
  ipport:            { paramId: 30, length: 20,  stateKey: "inputIPPORT", ascii: true },
  latchPeriod:       { paramId: 31, length: 2,   stateKey: "inputLatchPeriod" },
  pushPeriod:        { paramId: 32, length: 2,   stateKey: "inputPushPeriod" },
  pushMethod:        { paramId: 33, length: 1,   stateKey: "inputPushMethod" },
  q3:                { paramId: 40, length: 4,   stateKey: "inputQ3" },
  lpr:               { paramId: 41, length: 4,   stateKey: "inputLPR" },
  moduleType:        { paramId: 42, length: 1,   stateKey: "inputModuleType" },
  pushTime1:         { paramId: 50, length: 6,   stateKey: "inputPushTime1" },
  pushTime2:         { paramId: 51, length: 6,   stateKey: "inputPushTime2" },
  temp:              { paramId: 60, length: 2,   stateKey: "inputTemp" },
  voltage:           { paramId: 61, length: 2,   stateKey: "inputVoltage" },
  remainBattery:     { paramId: 62, length: 2,   stateKey: "inputRemainBattery" },
  resetCount:        { paramId: 70, length: 2,   stateKey: "inputResetCount" },
  latDataIndex:      { paramId: 80, length: 4,   stateKey: "inputLatDataIndex" },
  pushDataIndex:     { paramId: 81, length: 4,   stateKey: "inputPushDataIndex" },
  latchEventIndex:   { paramId: 82, length: 4,   stateKey: "inputLatchEventIndex" },
  pushEventIndex:    { paramId: 83, length: 4,   stateKey: "inputPushEventIndex" },
  nb:                { paramId: 90, length: 1,   stateKey: "inputNB" },
  voltageThreshold:  { paramId: 91, length: 2,   stateKey: "inputVoltageThreshold" },
  enableDevice:      { paramId: 92, length: 1,   stateKey: "inputEnableDevice" },
  readData:          { paramId: 100, length: 20, stateKey: "inputReadData" },
  readEvent:         { paramId: 101, length: 20, stateKey: "inputReadEvent" },
  readPushStatus:    { paramId: 102, length: 5,  stateKey: "inputReadPushStatus" },
  sensor1:           { paramId: 110, length: 2,  stateKey: "inputSensor1" },
  sensor2:           { paramId: 111, length: 2,  stateKey: "inputSensor2" },
  batteryCapacity:   { paramId: 120, length: 2,  stateKey: "inputBatteryCapacity" },
  eventConfig:       { paramId: 130, length: 5,  stateKey: "inputEventConfig" },
  pushEventMethod:   { paramId: 131, length: 1,  stateKey: "inputPushEventMethod" },
  randomMin:         { paramId: 140, length: 1,  stateKey: "inputRandomMin" },
  timeZone:          { paramId: 141, length: 1,  stateKey: "inputTimeZone" },
  qccid:             { paramId: 150, length: 25, stateKey: "inputQCCID", ascii: true },
} as const;


export const Read = async (): Promise<void> => {
  const { state, setState } = hookProps;
  const connectedId = store.state.hhu.idConnected;

  if (!connectedId) {
    Alert.alert('Lỗi', 'Chưa kết nối thiết bị');
    return;
  }

  try {
    // Initialize BLE listener if needed
    // Assuming listener is already set up in connection

    // Module No
    if (state.chkModuleNo) {
      setState(prev => ({ ...prev, inputModuleNo: '' }));

      const paramIds = [6];
      const payload = buildOptReadPayload(paramIds);
      const frame = buildEwmFrame(6, payload);

      console.log("Send: " + bytesToHex(frame));
      const receivedData = await sendAndReceiveQueued(connectedId, frame);
      console.log("Recv: " + bytesToHex(receivedData || []) + "\r\n");

      if (!receivedData || receivedData.length === 0) {
        console.log("[Lỗi] Không nhận được phản hồi từ thiết bị.\r\n");
        return;
      }

      const decryptedPayload = parseDecryptedPayload(new Uint8Array(receivedData));
      console.log("Payload: " + bytesToHex(decryptedPayload) + "\r\n");
      const moduleNoBytes = decryptedPayload.slice(0, 15);
      const moduleNo = String.fromCharCode(...moduleNoBytes).trim();
      setState(prev => ({ ...prev, inputModuleNo: moduleNo }));
    }

    // Meter No
    if (state.chkMeterNo) {
    setState(prev => ({ ...prev, inputMeterNo: "" })); // Clear input

    const payload = buildOptReadPayload([5]);
    const frame = buildEwmFrame(6, payload);

    console.log("Send: " + bytesToHex(frame));
    const receivedData = await sendAndReceiveQueued(connectedId, frame);
    console.log("Recv: " + bytesToHex(receivedData || []) + "\r\n");

    if (!receivedData || receivedData.length === 0) {
      console.log("[Lỗi] Không nhận được phản hồi từ thiết bị.\r\n");
      return;
    }

    try {
      const decryptedPayload = parseDecryptedPayload(new Uint8Array(receivedData));
      console.log("Payload: " + bytesToHex(decryptedPayload) + "\r\n");

      const meterNoBytes = decryptedPayload.slice(0, 16);
      const meterNo = String.fromCharCode(...meterNoBytes).trim();
      console.log ('meterNoBytes ' + meterNoBytes)
      console.log ('meterNo ' + meterNo)
      setState(prev => ({ ...prev, inputMeterNo: meterNo }));
    } catch (e: any) {
      console.log("[Lỗi] Không thể giải mã payload: " + e.message);
    }
  }

    // RTC
   if (state.chkRTC) {
    setState(prev => ({ ...prev, inputRTC: "" })); // Clear

    const payload = buildOptReadPayload([1]);
    const frame = buildEwmFrame(6, payload);

    console.log("Send: " + bytesToHex(frame));
    const receivedData = await sendAndReceiveQueued(connectedId, frame);
    console.log("Recv: " + bytesToHex(receivedData || []) + "\r\n");

    if (!receivedData || receivedData.length === 0) {
      console.log("[Lỗi] Không nhận được phản hồi từ thiết bị.\r\n");
      return;
    }

    try {
      const decryptedPayload = parseDecryptedPayload(new Uint8Array(receivedData));
      console.log("Payload: " + bytesToHex(decryptedPayload) + "\r\n");

      const dt = decryptedPayload.slice(0, 6);

      const year = 2000 + dt[0];
      const month = dt[1];
      const day = dt[2];
      const hour = dt[3];
      const minute = dt[4];
      const second = dt[5];

      const dateObj = new Date(year, month - 1, day, hour, minute, second);

      setState(prev => ({
        ...prev,
        inputRTC: dateObj.toLocaleString(),
      }));
    } catch (e: any) {
      console.log("[Lỗi] Không thể giải mã payload: " + e.message);
    }



  }
      // Firmware Ver
    if (state.chkFirmwareVer) {
      setState(prev => ({ ...prev, inputFirmwareVer: '' }));

      const paramIds = [4];
      const payload = buildOptReadPayload(paramIds);
      const frame = buildEwmFrame(6, payload);

      console.log("Send: " + bytesToHex(frame));
      const receivedData = await sendAndReceiveQueued(connectedId, frame);
      console.log("Recv: " + bytesToHex(receivedData) + "\r\n");

      if (!receivedData || receivedData.length === 0) {
        console.log("[Lỗi] Không nhận được phản hồi từ thiết bị.\r\n");
        return;
      }

      const decryptedPayload = parseDecryptedPayload(new Uint8Array(receivedData));
      console.log("Payload: " + bytesToHex(decryptedPayload) + "\r\n");
      const fwVerBytes = decryptedPayload.slice(0, 10);
      const fwVer = String.fromCharCode(...fwVerBytes).trim();
      setState(prev => ({ ...prev, inputFirmwareVer: fwVer }));
    }

    // Boot Ver
    if (state.chkBootVer) {
      setState(prev => ({ ...prev, inputBootVer: '' }));

      const paramIds = [40];
      const payload = buildOptReadPayload(paramIds);
      const frame = buildEwmFrame(6, payload);

      console.log("Send: " + bytesToHex(frame));
      const receivedData = await sendAndReceiveQueued(connectedId, frame);
      console.log("Recv: " + bytesToHex(receivedData) + "\r\n");

      if (!receivedData || receivedData.length === 0) {
        console.log("[Lỗi] Không nhận được phản hồi từ thiết bị.\r\n");
        return;
      }

      const decryptedPayload = parseDecryptedPayload(new Uint8Array(receivedData));
      console.log("Payload: " + bytesToHex(decryptedPayload) + "\r\n");
      const bootVerBytes = decryptedPayload.slice(0, 10);
      const bootVer = String.fromCharCode(...bootVerBytes).trim();
      setState(prev => ({ ...prev, inputBootVer: bootVer }));
    }

    if (state.chkImpData) {
      // reset
      setState(prev => ({
        ...prev,
        inputImpData: '',
        inputExpData: '',
        inputTotalData: '',
      }));

      /* ======================
        ĐỌC IMP DATA (ID = 2)
        ====================== */
      const payloadImp = buildOptReadPayload([2]);
      const frameImp = buildEwmFrame(6, payloadImp);

      console.log('Send IMP:', bytesToHex(frameImp));
      const recvImp = await sendAndReceiveQueued(connectedId, frameImp);

      if (!recvImp || recvImp.length === 0) {
        console.log('[Lỗi] Không nhận được IMP');
        return;
      }

      const impPayload = parseDecryptedPayload(new Uint8Array(recvImp));
      const impData = readUInt32LE(impPayload, 0);

      console.log('ImpData:', impData);

      /* ======================
        ĐỌC EXP DATA (ID = 3)
        ====================== */
      const payloadExp = buildOptReadPayload([3]);
      const frameExp = buildEwmFrame(6, payloadExp);

      console.log('Send EXP:', bytesToHex(frameExp));
      const recvExp = await sendAndReceiveQueued(connectedId, frameExp);

      if (!recvExp || recvExp.length === 0) {
        console.log('[Lỗi] Không nhận được EXP');
        return;
      }

      const expPayload = parseDecryptedPayload(new Uint8Array(recvExp));
      const expData = readUInt32LE(expPayload, 0);

      console.log('ExpData:', expData);

      /* ======================
        TÍNH TỔNG (KHÔNG GỬI TBI)
        ====================== */
      const totalData = impData - expData;

      setState(prev => ({
        ...prev,
        inputImpData: impData.toString(),
        inputExpData: expData.toString(),
        inputTotalData: totalData.toString(),
      }));
    }



    // IPPORT
    if (state.chkIPPORT) {
      setState(prev => ({ ...prev, inputIPPORT: '' }));

      const payload = buildOptReadPayload([11]);
      const frame = buildEwmFrame(6, payload);

      console.log('Send:', bytesToHex(frame));
      const receivedData = await sendAndReceiveQueued(connectedId, frame);
      console.log('Recv:', bytesToHex(receivedData || []));

      if (!receivedData || receivedData.length === 0) {
        console.log('[Lỗi] Không nhận được phản hồi từ thiết bị');
        return;
      }

      const decryptedPayload = parseDecryptedPayload(
        new Uint8Array(receivedData)
      );

      console.log('Payload:', bytesToHex(decryptedPayload));

      // ✅ Y HỆT C#: Take(25) + Encoding.ASCII
      if (decryptedPayload.length >= 25) {
        const ipPortBytes = decryptedPayload.slice(0, 25);
        const ipPort = asciiLikeDotNet(ipPortBytes);

        console.log('IP/PORT:', ipPort); // 👉 14.225.244.63:4399

        setState(prev => ({
          ...prev,
          inputIPPORT: ipPort,
        }));
      } else {
        console.log('[Lỗi] Payload IP/PORT không đủ độ dài');
      }
    }


    // Latch Period
    if (state.chkLatchPeriod) {
      setState(prev => ({ ...prev, inputLatchPeriod: '' }));

      const payload = buildOptReadPayload([16]);
      const frame = buildEwmFrame(6, payload);

      console.log('Send:', bytesToHex(frame));
      const receivedData = await sendAndReceiveQueued(connectedId, frame);
      console.log('Recv:', bytesToHex(receivedData || []), '\n');

      if (!receivedData || receivedData.length === 0) {
        console.log('[Lỗi] Không nhận được phản hồi từ thiết bị\n');
        return;
      }

      const decryptedPayload = parseDecryptedPayload(new Uint8Array(receivedData));
      console.log('Payload:', bytesToHex(decryptedPayload), '\n');

      if (decryptedPayload.length >= 2) {
        const view = new DataView(decryptedPayload.buffer);
        const latchPeriod = view.getInt16(0, true); // ✅ little-endian
        setState(prev => ({
          ...prev,
          inputLatchPeriod: latchPeriod.toString(),
        }));
      }
    }


    // Push Period
    if (state.chkPushPeriod) {
      setState(prev => ({ ...prev, inputPushPeriod: '' }));

      const payload = buildOptReadPayload([18]);
      const frame = buildEwmFrame(6, payload);

      console.log('Send:', bytesToHex(frame));
      const receivedData = await sendAndReceiveQueued(connectedId, frame);
      console.log('Recv:', bytesToHex(receivedData || []), '\n');

      if (!receivedData || receivedData.length === 0) {
        console.log('[Lỗi] Không nhận được phản hồi từ thiết bị\n');
        return;
      }

      const decryptedPayload = parseDecryptedPayload(new Uint8Array(receivedData));
      console.log('Payload:', bytesToHex(decryptedPayload), '\n');

      if (decryptedPayload.length >= 2) {
        const view = new DataView(decryptedPayload.buffer);
        const pushPeriod = view.getInt16(0, true); // ✅ little-endian
        setState(prev => ({
          ...prev,
          inputPushPeriod: pushPeriod.toString(),
        }));
      }
    }


    // Push Method
    if (state.chkPushMethod) {
      setState(prev => ({ ...prev, inputPushMethod: '' }));

      const paramIds = [17];
      const payload = buildOptReadPayload(paramIds);
      const frame = buildEwmFrame(6, payload);

      console.log("Send: " + bytesToHex(frame));
      const receivedData = await sendAndReceiveQueued(connectedId, frame);
      console.log("Recv: " + bytesToHex(receivedData || []) + "\r\n");

      if (!receivedData || receivedData.length === 0) {
        console.log("[Lỗi] Không nhận được phản hồi từ thiết bị.\r\n");
        return;
      }

      const decryptedPayload = parseDecryptedPayload(new Uint8Array(receivedData));
      console.log("Payload: " + bytesToHex(decryptedPayload) + "\r\n");

      if (0 < decryptedPayload.length) {
        const pushMethod = decryptedPayload[0];
        setState(prev => ({ ...prev, inputPushMethod: pushMethod.toString() }));
      }
    }
    if (state.chkEnableDevice) {
      setState(p => ({ ...p, inputEnableDevice: '' }));

      const frame = buildEwmFrame(6, buildOptReadPayload([28]));
      const received = await sendAndReceiveQueued(connectedId, frame);

      if (!received?.length) return;

      const payload = parseDecryptedPayload(new Uint8Array(received));

      if (payload.length >= 1) {
        const value = payload[0] & 0xff;
        if (value === 0 || value === 1) {
          setState(p => ({ ...p, inputEnableDevice: value.toString() }));
        }
      }
    }
    if (state.chkPushEventMethod) {
      setState(p => ({ ...p, inputPushEventMethod: '' }));

      const frame = buildEwmFrame(6, buildOptReadPayload([42]));
      const received = await sendAndReceiveQueued(connectedId, frame);

      if (!received?.length) return;

      const pld = parseDecryptedPayload(new Uint8Array(received));

      if (pld.length >= 1) {
        setState(p => ({ ...p, inputPushEventMethod: pld[0].toString() }));
      }
    }
    if (state.chkPushEventIndex) {
      setState(prev => ({ ...prev, inputPushEventIndex: '' }));

      const payload = buildOptReadPayload([34]);
      const frame = buildEwmFrame(6, payload);

      const receivedData = await sendAndReceiveQueued(connectedId, frame);
      if (!receivedData?.length) return;

      const decryptedPayload = parseDecryptedPayload(new Uint8Array(receivedData));

      if (decryptedPayload.length >= 4) {
        const value = new DataView(decryptedPayload.buffer)
          .getUint32(0, true); // ✅
        setState(prev => ({ ...prev, inputPushEventIndex: value.toString() }));
      }
    }
    
    // Q3
    if (state.chkQ3) {
      setState(prev => ({ ...prev, inputQ3: '' }));

      const paramIds = [14];
      const payload = buildOptReadPayload(paramIds);
      const frame = buildEwmFrame(6, payload);

      console.log('Send:', bytesToHex(frame));
      const receivedData = await sendAndReceiveQueued(connectedId, frame);
      console.log('Recv:', bytesToHex(receivedData || []), '\n');

      if (!receivedData || receivedData.length === 0) {
        console.log('[Lỗi] Không nhận được phản hồi từ thiết bị.\n');
        return;
      }

      const decryptedPayload = parseDecryptedPayload(new Uint8Array(receivedData));
      console.log('Payload:', bytesToHex(decryptedPayload), '\n');

      // ✅ GIỐNG C#: BitConverter.ToInt32(...)
      if (decryptedPayload.length >= 4) {
        const view = new DataView(decryptedPayload.buffer);
        const q3Value = view.getInt32(0, true); // ✅ little-endian
        setState(prev => ({
          ...prev,
          inputQ3: q3Value.toString(),
        }));
      }
    }


    // LPR
    if (state.chkLPR) {
      setState(prev => ({ ...prev, inputLPR: '' }));

      const paramIds = [15];
      const payload = buildOptReadPayload(paramIds);
      const frame = buildEwmFrame(6, payload);

      console.log("Send: " + bytesToHex(frame));
      const receivedData = await sendAndReceiveQueued(connectedId, frame);
      console.log("Recv: " + bytesToHex(receivedData || []) + "\r\n");

      if (!receivedData || receivedData.length === 0) {
        console.log("[Lỗi] Không nhận được phản hồi từ thiết bị.\r\n");
        return;
      }

      const decryptedPayload = parseDecryptedPayload(new Uint8Array(receivedData));
      console.log("Payload: " + bytesToHex(decryptedPayload) + "\r\n");

      if (0 < decryptedPayload.length) {
        const lprValue = decryptedPayload[0];
        setState(prev => ({ ...prev, inputLPR: lprValue.toString() }));
      }
    }

    // ModuleType
    if (state.chkModuleType) {
      setState(prev => ({ ...prev, inputModuleType: '' }));

      const paramIds = [13];
      const payload = buildOptReadPayload(paramIds);
      const frame = buildEwmFrame(6, payload);

      console.log("Send: " + bytesToHex(frame));
      const receivedData = await sendAndReceiveQueued(connectedId, frame);
      console.log("Recv: " + bytesToHex(receivedData || []) + "\r\n");

      if (!receivedData || receivedData.length === 0) {
        console.log("[Lỗi] Không nhận được phản hồi từ thiết bị.\r\n");
        return;
      }

      const decryptedPayload = parseDecryptedPayload(new Uint8Array(receivedData));
      console.log("Payload: " + bytesToHex(decryptedPayload) + "\r\n");

      if (0 < decryptedPayload.length) {
        const moduleType = decryptedPayload[0];
        setState(prev => ({ ...prev, inputModuleType: moduleType.toString() }));
      }
    }

    // PushTime1
    if (state.chkPushTime1) {
      setState(prev => ({ ...prev, inputPushTime1: '' }));

      const paramIds = [19];
      const payload = buildOptReadPayload(paramIds);
      const frame = buildEwmFrame(6, payload);

      console.log("Send: " + bytesToHex(frame));
      const receivedData = await sendAndReceiveQueued(connectedId, frame);
      console.log("Recv: " + bytesToHex(receivedData || []) + "\r\n");

      if (!receivedData || receivedData.length === 0) {
        console.log("[Lỗi] Không nhận được phản hồi từ thiết bị.\r\n");
        return;
      }

      const decryptedPayload = parseDecryptedPayload(new Uint8Array(receivedData));
      console.log("Payload: " + bytesToHex(decryptedPayload) + "\r\n");

      if (1 < decryptedPayload.length) {
        const pushTime1 = decryptedPayload[0].toString().padStart(2, '0') + ":" + decryptedPayload[1].toString().padStart(2, '0');
        setState(prev => ({ ...prev, inputPushTime1: pushTime1 }));
      }
    }

    // PushTime2
    if (state.chkPushTime2) {
      setState(prev => ({ ...prev, inputPushTime2: '' }));

      const paramIds = [20];
      const payload = buildOptReadPayload(paramIds);
      const frame = buildEwmFrame(6, payload);

      console.log("Send: " + bytesToHex(frame));
      const receivedData = await sendAndReceiveQueued(connectedId, frame);
      console.log("Recv: " + bytesToHex(receivedData || []) + "\r\n");

      if (!receivedData || receivedData.length === 0) {
        console.log("[Lỗi] Không nhận được phản hồi từ thiết bị.\r\n");
        return;
      }

      const decryptedPayload = parseDecryptedPayload(new Uint8Array(receivedData));
      console.log("Payload: " + bytesToHex(decryptedPayload) + "\r\n");

      if (1 < decryptedPayload.length) {
        const pushTime2 = decryptedPayload[0].toString().padStart(2,'0') + ":" + decryptedPayload[1].toString().padStart(2, '0');
        setState(prev => ({ ...prev, inputPushTime2: pushTime2 }));
      }
    }

    // Temp
    if (state.chkTemp) {
      setState(prev => ({ ...prev, inputTemp: '' }));

      const paramIds = [22];
      const payload = buildOptReadPayload(paramIds);
      const frame = buildEwmFrame(6, payload);

      console.log("Send: " + bytesToHex(frame));
      const receivedData = await sendAndReceiveQueued(connectedId, frame);
      console.log("Recv: " + bytesToHex(receivedData || []) + "\r\n");

      if (!receivedData || receivedData.length === 0) {
        console.log("[Lỗi] Không nhận được phản hồi từ thiết bị.\r\n");
        return;
      }

      const decryptedPayload = parseDecryptedPayload(new Uint8Array(receivedData));
      console.log("Payload: " + bytesToHex(decryptedPayload) + "\r\n");

      if (0 < decryptedPayload.length) {
        const temp = decryptedPayload[0];
        setState(prev => ({ ...prev, inputTemp: temp.toString() }));
      }
    }

    // Voltage
    if (state.chkVoltage) {
      setState(prev => ({ ...prev, inputVoltage: '' }));

      const paramIds = [23];
      const payload = buildOptReadPayload(paramIds);
      const frame = buildEwmFrame(6, payload);

      console.log("Send: " + bytesToHex(frame));
      const receivedData = await sendAndReceiveQueued(connectedId, frame);
      console.log("Recv: " + bytesToHex(receivedData || []) + "\r\n");

      if (!receivedData || receivedData.length === 0) {
        console.log("[Lỗi] Không nhận được phản hồi từ thiết bị.\r\n");
        return;
      }

      const decryptedPayload = parseDecryptedPayload(new Uint8Array(receivedData));
      console.log("Payload: " + bytesToHex(decryptedPayload) + "\r\n");

      if (0 < decryptedPayload.length) {
        const voltage = decryptedPayload[0];
        const voltageValue = (voltage / 40.0).toFixed(2);
        setState(prev => ({ ...prev, inputVoltage: voltageValue }));
      }
    }

    // RemainBattery
    if (state.chkRemainBattery) {
      setState(prev => ({ ...prev, inputRemainBattery: '' }));

      const paramIds = [21];
      const payload = buildOptReadPayload(paramIds);
      const frame = buildEwmFrame(6, payload);

      console.log('Send:', bytesToHex(frame));
      const receivedData = await sendAndReceiveQueued(connectedId, frame);
      console.log('Recv:', bytesToHex(receivedData || []), '\n');

      if (!receivedData || receivedData.length === 0) {
        console.log('[Lỗi] Không nhận được phản hồi từ thiết bị.\n');
        return;
      }

      const decryptedPayload = parseDecryptedPayload(new Uint8Array(receivedData));
      console.log('Payload:', bytesToHex(decryptedPayload), '\n');

      // ✅ GIỐNG C#: BitConverter.ToInt16(...)
      if (decryptedPayload.length >= 2) {
        const view = new DataView(decryptedPayload.buffer);
        const dataValue = view.getInt16(0, true); // ✅ little-endian
        setState(prev => ({
          ...prev,
          inputRemainBattery: dataValue.toString(),
        }));
      }
    }


    // ResetCount
    if (state.chkResetCount) {
      setState(prev => ({ ...prev, inputResetCount: '' }));

      const paramIds = [24];
      const payload = buildOptReadPayload(paramIds);
      const frame = buildEwmFrame(6, payload);

      console.log("Send: " + bytesToHex(frame));
      const receivedData = await sendAndReceiveQueued(connectedId, frame);
      console.log("Recv: " + bytesToHex(receivedData || []) + "\r\n");

      if (!receivedData || receivedData.length === 0) {
        console.log("[Lỗi] Không nhận được phản hồi từ thiết bị.\r\n");
        return;
      }

      const decryptedPayload = parseDecryptedPayload(new Uint8Array(receivedData));
      console.log("Payload: " + bytesToHex(decryptedPayload) + "\r\n");

      if (0 < decryptedPayload.length) {
        const resetCount = decryptedPayload[0];
        setState(prev => ({ ...prev, inputResetCount: resetCount.toString() }));
      }
    }

    // LatDataIndex
    if (state.chkLatDataIndex) {
      setState(prev => ({ ...prev, inputLatDataIndex: '' }));

      const payload = buildOptReadPayload([31]);
      const frame = buildEwmFrame(6, payload);

      console.log("Send:", bytesToHex(frame));
      const receivedData = await sendAndReceiveQueued(connectedId, frame);
      console.log("Recv:", bytesToHex(receivedData || []));

      if (!receivedData || receivedData.length === 0) return;

      const decryptedPayload = parseDecryptedPayload(new Uint8Array(receivedData));
      console.log("Payload:", bytesToHex(decryptedPayload));

      if (decryptedPayload.length >= 4) {
        const value = new DataView(decryptedPayload.buffer)
          .getUint32(0, true); // ✅ LITTLE-ENDIAN
        setState(prev => ({ ...prev, inputLatDataIndex: value.toString() }));
      }
    }


    // PushDataIndex
    if (state.chkPushDataIndex) {
      setState(prev => ({ ...prev, inputPushDataIndex: '' }));

      const payload = buildOptReadPayload([32]);
      const frame = buildEwmFrame(6, payload);

      const receivedData = await sendAndReceiveQueued(connectedId, frame);
      if (!receivedData?.length) return;

      const decryptedPayload = parseDecryptedPayload(new Uint8Array(receivedData));

      if (decryptedPayload.length >= 4) {
        const value = new DataView(decryptedPayload.buffer)
          .getUint32(0, true); // ✅
        setState(prev => ({ ...prev, inputPushDataIndex: value.toString() }));
      }
    }


    // LatchEventIndex
    if (state.chkLatchEventIndex) {
      setState(prev => ({ ...prev, inputLatchEventIndex: '' }));

      const payload = buildOptReadPayload([33]);
      const frame = buildEwmFrame(6, payload);

      const receivedData = await sendAndReceiveQueued(connectedId, frame);
      if (!receivedData?.length) return;

      const decryptedPayload = parseDecryptedPayload(new Uint8Array(receivedData));

      if (decryptedPayload.length >= 4) {
        const value = new DataView(decryptedPayload.buffer)
          .getUint32(0, true); // ✅
        setState(prev => ({ ...prev, inputLatchEventIndex: value.toString() }));
      }
    }


    // PushEventIndex
    


    // NB
    if (state.chkNB) {
      setState(prev => ({
        ...prev,
        inputNBQCCID: '',
        inputNBIMSI: '',
        inputNBAPN: '',
        inputNBMNO: '',
        inputNBNETIP: '',
        inputNBRSSI: '',
      }));

      const payload = buildOptReadPayload([35]);
      const frame = buildEwmFrame(6, payload);

      console.log("Send:", bytesToHex(frame));
      const receivedData = await sendAndReceiveQueued(
        connectedId,
        frame,
        108,
        120000
      );
      console.log("Recv:", bytesToHex(receivedData || []));

      if (!receivedData || receivedData.length === 0) {
        console.log("[Lỗi] Không nhận được phản hồi từ thiết bị.");
        return;
      }

      const decryptedPayload = parseDecryptedPayload(
        new Uint8Array(receivedData)
      );
      console.log("Payload:", bytesToHex(decryptedPayload));

      let offset = 0;

      // QCCID [20 bytes ASCII]
      const qccid = asciiBytesToString(
        decryptedPayload.slice(offset, offset + 20)
      );
      offset += 20;

      // IMSI [20 bytes ASCII]
      const imsi = asciiBytesToString(
        decryptedPayload.slice(offset, offset + 20)
      );
      offset += 20;

      // APN [20 bytes ASCII]
      const apn = asciiBytesToString(
        decryptedPayload.slice(offset, offset + 20)
      );
      offset += 20;

      // MNO [20 bytes ASCII]
      const mno = asciiBytesToString(
        decryptedPayload.slice(offset, offset + 20)
      );
      offset += 20;

      // NETIP [15 bytes ASCII]
      const netip = asciiBytesToString(
        decryptedPayload.slice(offset, offset + 15)
      );
      offset += 15;

      // RSSI [1 byte int]
      const rssi = decryptedPayload[offset] & 0xff;

      setState(prev => ({
        ...prev,
        inputNBQCCID: qccid,
        inputNBIMSI: imsi,
        inputNBAPN: apn,
        inputNBMNO: mno,
        inputNBNETIP: netip,
        inputNBRSSI: rssi.toString(),
      }));
    }

    if (state.chkVoltageThreshold) {
      setState(p => ({ ...p, inputVoltageThreshold: '' }));

      const frame = buildEwmFrame(6, buildOptReadPayload([36]));
      const received = await sendAndReceiveQueued(connectedId, frame);

      if (!received?.length) return;

      const payload = parseDecryptedPayload(new Uint8Array(received));

      if (payload.length >= 1) {
        const voltage = payload[0] & 0xff;
        const voltageThreshold = voltage / 10.0;
        setState(p => ({
          ...p,
          inputVoltageThreshold: voltageThreshold.toFixed(1),
        }));
      }
    }
    
    if (state.chkSensor1) {
      setState(p => ({
        ...p,
        inputSensor1_MaxSa: '',
        inputSensor1_MinSa: '',
        inputSensor1_MaxSb: '',
        inputSensor1_MinSb: '',
        inputSensor1_MaxSc: '',
        inputSensor1_MinSc: '',
        inputSensor1_Average: '',
      }));

      const frame = buildEwmFrame(6, buildOptReadPayload([37]));
      const received = await sendAndReceiveQueued(connectedId, frame);

      if (!received?.length) return;

      const pld = parseDecryptedPayload(new Uint8Array(received));

      if (pld.length >= 7) {
        setState(p => ({
          ...p,
          inputSensor1_MaxSa: pld[0].toString(),
          inputSensor1_MinSa: pld[1].toString(),
          inputSensor1_MaxSb: pld[2].toString(),
          inputSensor1_MinSb: pld[3].toString(),
          inputSensor1_MaxSc: pld[4].toString(),
          inputSensor1_MinSc: pld[5].toString(),
          inputSensor1_Average: pld[6].toString(),
        }));
      }
    }
    if (state.chkSensor2) {
      setState(p => ({
        ...p,
        inputSensor2_Numex1: '',
        inputSensor2_Numex2: '',
        inputSensor2_Maxch1: '',
        inputSensor2_Minch1: '',
        inputSensor2_Maxch2: '',
        inputSensor2_Minch2: '',
        inputSensor2_Average1: '',
        inputSensor2_Average2: '',
      }));

      const frame = buildEwmFrame(6, buildOptReadPayload([38]));
      const received = await sendAndReceiveQueued(connectedId, frame);

      if (!received?.length) return;

      const pld = parseDecryptedPayload(new Uint8Array(received));

      if (pld.length >= 8) {
        setState(p => ({
          ...p,
          inputSensor2_Numex1: pld[0].toString(),
          inputSensor2_Numex2: pld[1].toString(),
          inputSensor2_Maxch1: pld[2].toString(),
          inputSensor2_Minch1: pld[3].toString(),
          inputSensor2_Maxch2: pld[4].toString(),
          inputSensor2_Minch2: pld[5].toString(),
          inputSensor2_Average1: pld[6].toString(),
          inputSensor2_Average2: pld[7].toString(),
        }));
      }
    }
    if (state.chkBatteryCapacity) {
      setState(p => ({ ...p, inputBatteryCapacity: '' }));

      const frame = buildEwmFrame(6, buildOptReadPayload([41]));
      const received = await sendAndReceiveQueued(connectedId, frame);

      if (!received?.length) return;

      const pld = parseDecryptedPayload(new Uint8Array(received));

      if (pld.length >= 2) {
        const value = new DataView(pld.buffer).getInt16(0, true);
        setState(p => ({ ...p, inputBatteryCapacity: value.toString() }));
      }
    }
    if (state.chkEventConfig) {
      setState(p => ({ ...p, inputEventConfig: '' }));

      const frame = buildEwmFrame(6, buildOptReadPayload([26]));
      const received = await sendAndReceiveQueued(connectedId, frame);

      if (!received?.length) return;

      const pld = parseDecryptedPayload(new Uint8Array(received));

      if (pld.length >= 1) {
        setState(p => ({ ...p, inputEventConfig: pld[0].toString() }));
      }
    }

    if (state.chkRandomMin) {
      setState(p => ({ ...p, inputRandomMin: '' }));

      const frame = buildEwmFrame(6, buildOptReadPayload([43]));
      const received = await sendAndReceiveQueued(connectedId, frame);

      if (!received?.length) return;

      const pld = parseDecryptedPayload(new Uint8Array(received));

      if (pld.length >= 1) {
        setState(p => ({ ...p, inputRandomMin: pld[0].toString() }));
      }
    }
    if (state.chkTimeZone) {
      setState(p => ({ ...p, inputTimeZone: '' }));

      const frame = buildEwmFrame(6, buildOptReadPayload([44]));
      const received = await sendAndReceiveQueued(connectedId, frame);

      if (!received?.length) return;

      const pld = parseDecryptedPayload(new Uint8Array(received));

      if (pld.length >= 1) {
        setState(p => ({ ...p, inputTimeZone: pld[0].toString() }));
      }
    }
    if (state.chkQCCID) {
      setState(p => ({ ...p, inputQCCID: '' }));

      const frame = buildEwmFrame(6, buildOptReadPayload([7]));
      const received = await sendAndReceiveQueued(connectedId, frame);

      if (!received?.length) return;

      const pld = parseDecryptedPayload(new Uint8Array(received));

      // QCCID = 20 bytes ASCII
      const qccid = asciiBytesToString(pld.slice(0, 20));

      setState(p => ({ ...p, inputQCCID: qccid }));
    }


    } catch (ex: any) {
      Alert.alert('Lỗi', ex.toString());
    }
};

export function readUInt32LE(bytes: Uint8Array, offset = 0): number {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  ) >>> 0;
}
export function asciiBytesToString(bytes: Uint8Array): string {
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 0x00) break; // stop tại null
    result += String.fromCharCode(bytes[i]);
  }
  return result.trim();
}

function asciiLikeDotNet(bytes: Uint8Array): string {
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b === 0x00) break;       
    if (b < 0x20 || b > 0x7E) break; 
    result += String.fromCharCode(b);
  }
  return result.trim();
}
export function stringToAsciiBytes(str: string, length?: number): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code > 0xFF) {
      throw new Error(`Character at position ${i} is not ASCII`);
    }
    bytes.push(code);
  }

  if (length !== undefined) {
    while (bytes.length < length) {
      bytes.push(0x00); // pad null
    }
    if (bytes.length > length) {
      bytes.length = length; // cắt bớt nếu dài hơn
    }
  }

  return new Uint8Array(bytes);
}




export const Write = async () => {
  const connectedId = store.state.hhu.idConnected;
  const { state } = hookProps;

  if (!connectedId) {
    Alert.alert('Lỗi', 'Chưa kết nối thiết bị BLE');
    return;
  }
    const successList: string[] = [];
    const errorList: string[] = [];
    const pushResult = (ok: boolean, name: string, err?: any) => {
  if (ok) successList.push(name);
  else errorList.push(name + (err ? ` (${err})` : ''));
};
    if (state.chkModuleNo) {
      try {
      const moduleNoRaw = (state.inputModuleNo || '').trim();
      const moduleNoPadded = moduleNoRaw.padEnd(15, '\0');
      const moduleNoData = Array.from(stringToAsciiBytes(moduleNoPadded), b => b & 0xff);
      const payload = buildOptSetPayload([{ paramId: 6, data: moduleNoData }]);
      const frame = buildEwmFrame(5, payload);
      const recv = await sendAndReceiveQueued(connectedId, frame);
      pushResult(!!recv?.length, 'ModuleNo');
      } catch (e) {
        pushResult(false, 'ModuleNo');
      }
    }

    if (state.chkMeterNo) {
      const meterNo = (state.inputMeterNo || '').trim();
      const meterNoPadded = meterNo.padEnd(20, '\0');
      const meterNoData = Array.from(stringToAsciiBytes(meterNoPadded));
      const payload = buildOptSetPayload([{ paramId: 5, data: meterNoData }]);
      const frame = buildEwmFrame(5, payload);
      const recv = await sendAndReceiveQueued(connectedId, frame);
      pushResult(!!recv?.length, 'MeterNo');
    }

    if (state.chkRTC) {
      const time = state.inputRTC ? new Date(state.inputRTC) : new Date(); // radCustomTime=false => dùng thời gian hiện tại
      const timeData: number[] = [
        time.getFullYear() % 100,
        time.getMonth() + 1,
        time.getDate(),
        time.getHours(),
        time.getMinutes(),
        time.getSeconds(),
      ];

      const payload = buildOptSetPayload([{ paramId: 1, data: timeData }]);
      const frame = buildEwmFrame(5, payload);

      const recv = await sendAndReceiveQueued(connectedId, frame);
      pushResult(!!recv?.length, 'RTC');
    }


    if (state.chkImpData) {
      const v = Number(state.inputImpData);
      if (Number.isInteger(v) && v >= 0 && v <= 0xffffffff) {
        const buf = new ArrayBuffer(4);
        new DataView(buf).setUint32(0, v, true);
        const payload = buildOptSetPayload([{ paramId: 2, data: Array.from(new Uint8Array(buf)) }]);
        const frame = buildEwmFrame(5, payload);
        const recv = await sendAndReceiveQueued(connectedId, frame);
        pushResult(!!recv?.length, 'ImpData');
      }
    }

    if (state.chkImpData) {
      const v = Number(state.inputExpData);
      if (Number.isInteger(v) && v >= 0 && v <= 0xffffffff) {
        const buf = new ArrayBuffer(4);
        new DataView(buf).setUint32(0, v, true);
        const payload = buildOptSetPayload([{ paramId: 3, data: Array.from(new Uint8Array(buf)) }]);
        const frame = buildEwmFrame(5, payload);
        const recv = await sendAndReceiveQueued(connectedId, frame);
        pushResult(!!recv?.length, 'ImpData');
      }
    }

    if (state.chkIPPORT) {
      const ipport = (state.inputIPPORT || '').padEnd(25, '\0');
      const payload = buildOptSetPayload([{ paramId: 11, data: Array.from(stringToAsciiBytes(ipport)) }]);
      const frame = buildEwmFrame(5, payload);
      const recv = await sendAndReceiveQueued(connectedId, frame);
      pushResult(!!recv?.length, 'IPPORT');
    }

    if (state.chkQ3) {
      const v = Number(state.inputQ3);
      if (Number.isInteger(v)) {
        const buf = new ArrayBuffer(4);
        new DataView(buf).setInt32(0, v, true);

        const payload = buildOptSetPayload([
          { paramId: 14, data: Array.from(new Uint8Array(buf)) },
        ]);

        const frame = buildEwmFrame(5, payload);
        const recv = await sendAndReceiveQueued(connectedId, frame);
        pushResult(!!recv?.length, 'Q3');
      }
    }

    if (state.chkLPR) {
      const v = Number(state.inputLPR);
      if (Number.isInteger(v) && v >= 0 && v <= 255) {
        const payload = buildOptSetPayload([
          { paramId: 15, data: [v & 0xff] },
        ]);

        const frame = buildEwmFrame(5, payload);
        const recv = await sendAndReceiveQueued(connectedId, frame);

        pushResult(!!recv?.length, 'LPR');
      }
    }

    if (state.chkModuleType) {
      const v = Number(state.inputModuleType);
      if (Number.isInteger(v) && v >= 0 && v <= 255) {
        const payload = buildOptSetPayload([
          { paramId: 13, data: [v & 0xff] },
        ]);

        const frame = buildEwmFrame(5, payload);
        const recv = await sendAndReceiveQueued(connectedId, frame);

        pushResult(!!recv?.length, 'ModuleType');
      }
    }

    if (state.chkResetCount) {
      const v = Number(state.inputResetCount);
      if (Number.isInteger(v) && v >= 0 && v <= 255) {
        const payload = buildOptSetPayload([
          { paramId: 24, data: [v & 0xff] },
        ]);

        const frame = buildEwmFrame(5, payload);
        const recv = await sendAndReceiveQueued(connectedId, frame);

                pushResult(!!recv?.length, 'ResetCount');
      }
    }
    if (state.chkLatchPeriod) {
      const v = Number(state.inputLatchPeriod);
      if (Number.isInteger(v) && v > 0 && v <= 65535) {
        const buf = new ArrayBuffer(2);
        new DataView(buf).setUint16(0, v, true);

        const payload = buildOptSetPayload([
          { paramId: 16, data: Array.from(new Uint8Array(buf)) },
        ]);

        const frame = buildEwmFrame(5, payload);
        const recv = await sendAndReceiveQueued(connectedId, frame);

        pushResult(!!recv?.length, 'LatchPeriod');
      }
    }
    if (state.chkPushMethod) {
      const v = Number(state.inputPushMethod);
      if (v === 1 || v === 2) {
        const payload = buildOptSetPayload([
          { paramId: 17, data: [v] },
        ]);

        const frame = buildEwmFrame(5, payload);
        const recv = await sendAndReceiveQueued(connectedId, frame);
        pushResult(!!recv?.length, 'PushMethod');
      }
    }
    if (state.chkPushPeriod) {
      const v = Number(state.inputPushPeriod);
      if (Number.isInteger(v) && v >= 0 && v <= 65535) {
        const buf = new ArrayBuffer(2);
        new DataView(buf).setUint16(0, v, true);

        const payload = buildOptSetPayload([
          { paramId: 18, data: Array.from(new Uint8Array(buf)) },
        ]);

        const frame = buildEwmFrame(5, payload);
        const recv = await sendAndReceiveQueued(connectedId, frame);

        pushResult(!!recv?.length, 'PushPeriod');
      }
    }
    if (state.chkPushTime1) {
      const m = /^(\d{1,2}):(\d{1,2})$/.exec(state.inputPushTime1 || '');
      if (m) {
        const h = Number(m[1]);
        const min = Number(m[2]);

        if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
          const payload = buildOptSetPayload([
            { paramId: 19, data: [h, min] },
          ]);

          const frame = buildEwmFrame(5, payload);
          const recv = await sendAndReceiveQueued(connectedId, frame);
           pushResult(!!recv?.length, 'PushTime1');
        }
      }
    }
    if (state.chkPushTime2) {
      const m = /^(\d{1,2}):(\d{1,2})$/.exec(state.inputPushTime2 || '');
      if (m) {
        const h = Number(m[1]);
        const min = Number(m[2]);

        if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
          const payload = buildOptSetPayload([
            { paramId: 20, data: [h, min] },
          ]);

          const frame = buildEwmFrame(5, payload);
          const recv = await sendAndReceiveQueued(connectedId, frame);

           pushResult(!!recv?.length, 'PushTime2');
        }
      }
    }

    if (state.chkEnableDevice) {
      const value = Number(state.inputEnableDevice);

      if (value === 0 || value === 1) {
        const payload = buildOptSetPayload([
          { paramId: 28, data: Uint8Array.from([value]) },
        ]);

        const frame = buildEwmFrame(5, payload);

        const recv = await sendAndReceiveQueued(connectedId, frame);
        pushResult(!!recv?.length, 'Enable Device');
      } else {
        console.log('❌ EnableDevice chỉ nhận 0 hoặc 1');
      }
    }
       if (state.chkClearData) {
      const payload = buildOptSetPayload([
        { paramId: 27, data: [] }, // ✅ number[]
      ]);

      const frame = buildEwmFrame(5, payload);

      const recv = await sendAndReceiveQueued(connectedId, frame);
      pushResult(!!recv?.length, 'Clear Data');
    }

    if (state.chkPushData) {
      const payload = buildOptSetPayload([
        { paramId: 29, data: [] },
      ]);

      const frame = buildEwmFrame(5, payload);
      const recv = await sendAndReceiveQueued(connectedId, frame);
      pushResult(!!recv?.length, 'Push Data');
    }
    if (state.chkResetModule) {
      const payload = buildOptSetPayload([
        { paramId: 30, data: [] },
      ]);

      const frame = buildEwmFrame(5, payload);

      const recv = await sendAndReceiveQueued(connectedId, frame);
      
      pushResult(!!recv?.length, 'Reset Module');
    }
    if (state.chkBatteryCapacity) {
      const value = Number(state.inputBatteryCapacity);

      if (value >= 0 && value <= 65535) {
        const payload = buildOptSetPayload([
          {
            paramId: 41,
            data: Uint8Array.from([(value >> 8) & 0xff, value & 0xff]),
          },
        ]);

        const frame = buildEwmFrame(5, payload);
        const recv = await sendAndReceiveQueued(connectedId, frame);
      
        pushResult(!!recv?.length, 'Battery Capacity');
      } else {
        console.log('❌ BatteryCapacity không hợp lệ');
      }
    }
    if (state.chkEventConfig) {
      const value = Number(state.inputEventConfig);

      if (value >= 0 && value <= 255) {
        const payload = buildOptSetPayload([
          { paramId: 26, data: Uint8Array.from([value]) },
        ]);

        const frame = buildEwmFrame(5, payload);
        const recv = await sendAndReceiveQueued(connectedId, frame);
        pushResult(!!recv?.length, 'Event Config');
      } else {
        console.log('❌ EventConfig không hợp lệ');
      }
    }
    if (state.chkPushEventMethod) {
      const value = Number(state.inputPushEventMethod);

      if (value >= 0 && value <= 255) {
        const payload = buildOptSetPayload([
          { paramId: 42, data: Uint8Array.from([value]) },
        ]);

        const frame = buildEwmFrame(5, payload);
        const recv = await sendAndReceiveQueued(connectedId, frame);
        pushResult(!!recv?.length, 'Push Event Method');
      } else {
        console.log('❌ PushEventMethod không hợp lệ');
      }
    }
    if (state.chkTimeZone) {
      const value = Number(state.inputTimeZone);

      if (value >= 0 && value <= 255) {
        const payload = buildOptSetPayload([
          { paramId: 44, data: Uint8Array.from([value]) },
        ]);

        const frame = buildEwmFrame(5, payload);
        const recv = await sendAndReceiveQueued(connectedId, frame);
        pushResult(!!recv?.length, 'Time Zone');
      } else {
        console.log('❌ TimeZone không hợp lệ');
      }
    }
    if (state.chkVoltageThreshold) {
    const voltage = Number(state.inputVoltageThreshold);

    if (voltage >= 2.5 && voltage <= 3.3) {
      const value = Math.round(voltage * 10);

      const payload = buildOptSetPayload([
        { paramId: 36, data: Uint8Array.from([value]) },
      ]);

      const frame = buildEwmFrame(5, payload);

      const recv = await sendAndReceiveQueued(connectedId, frame);

      pushResult(!!recv?.length, 'Voltage Threshold:');
    } else {
      console.log('❌ VoltageThreshold chỉ từ 2.5 đến 3.3');
    }
    

    }
      if (successList.length || errorList.length) {
      let msg = '';

      if (successList.length) {
        msg += '✅ Ghi thành công:\n• ' + successList.join('\n• ') + '\n\n';
      }

      if (errorList.length) {
        msg += '❌ Ghi thất bại:\n• ' + errorList.join('\n• ');
      }

      Alert.alert('Kết quả ghi dữ liệu', msg.trim());
    }
};
