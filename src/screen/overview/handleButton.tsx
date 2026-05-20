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

  if (state.isReading || state.isWriting) return;

  if (!connectedId) {
    Alert.alert('Chưa kết nối', 'Vui lòng kết nối thiết bị BLE trước khi đọc.');
    return;
  }

  setState(p => ({ ...p, isReading: true }));

  // Re-throws timeout so the outer catch can detect and alert; swallows other errors
  const send = async (paramId: number, timeout = 5000): Promise<Uint8Array | null> => {
    try {
      const frame = buildEwmFrame(6, buildOptReadPayload([paramId]));
      const recv = await sendAndReceiveQueued(connectedId, frame, timeout);
      if (!recv?.length) return null;
      return parseDecryptedPayload(new Uint8Array(recv));
    } catch (e: any) {
      if (e?.message === 'EWM timeout') throw e;
      return null;
    }
  };

  try {
    if (state.chkModuleNo) {
      setState(p => ({ ...p, inputModuleNo: '' }));
      const pld = await send(6);
      if (pld) setState(p => ({ ...p, inputModuleNo: String.fromCharCode(...pld.slice(0, 15)).trim() }));
    }

    if (state.chkMeterNo) {
      setState(p => ({ ...p, inputMeterNo: '' }));
      const pld = await send(5);
      if (pld) setState(p => ({ ...p, inputMeterNo: String.fromCharCode(...pld.slice(0, 15)).trim() }));
    }

    if (state.chkRTC) {
      setState(p => ({ ...p, inputRTC: '' }));
      const pld = await send(1);
      if (pld && pld.length >= 6) {
        const dateObj = new Date(2000 + pld[0], pld[1] - 1, pld[2], pld[3], pld[4], pld[5]);
        setState(p => ({ ...p, inputRTC: dateObj.toLocaleString() }));
      }
    }

    if (state.chkFirmwareVer) {
      setState(p => ({ ...p, inputFirmwareVer: '' }));
      const pld = await send(4);
      if (pld) setState(p => ({ ...p, inputFirmwareVer: String.fromCharCode(...pld.slice(0, 10)).trim() }));
    }

    if (state.chkBootVer) {
      setState(p => ({ ...p, inputBootVer: '' }));
      const pld = await send(40);
      if (pld) setState(p => ({ ...p, inputBootVer: String.fromCharCode(...pld.slice(0, 10)).trim() }));
    }

    if (state.chkImpData) {
      setState(p => ({ ...p, inputImpData: '', inputExpData: '', inputTotalData: '' }));
      const impPld = await send(2);
      const expPld = await send(3);
      if (impPld && expPld) {
        const imp = readUInt32LE(impPld, 0);
        const exp = readUInt32LE(expPld, 0);
        setState(p => ({ ...p, inputImpData: imp.toString(), inputExpData: exp.toString(), inputTotalData: (imp - exp).toString() }));
      }
    }

    if (state.chkIPPORT) {
      setState(p => ({ ...p, inputIPPORT: '' }));
      const pld = await send(11);
      if (pld && pld.length >= 25) setState(p => ({ ...p, inputIPPORT: byteToAscii(pld.slice(0, 25)) }));
    }

    if (state.chkLatchPeriod) {
      setState(p => ({ ...p, inputLatchPeriod: '' }));
      const pld = await send(16);
      if (pld && pld.length >= 2) setState(p => ({ ...p, inputLatchPeriod: new DataView(pld.buffer).getInt16(0, true).toString() }));
    }

    if (state.chkPushPeriod) {
      setState(p => ({ ...p, inputPushPeriod: '' }));
      const pld = await send(18);
      if (pld && pld.length >= 2) setState(p => ({ ...p, inputPushPeriod: new DataView(pld.buffer).getInt16(0, true).toString() }));
    }

    if (state.chkTemp) {
      setState(p => ({ ...p, inputTemp: '' }));
      const pld = await send(22);
      if (pld?.length) setState(p => ({ ...p, inputTemp: pld[0].toString() }));
    }

    if (state.chkResetCount) {
      setState(p => ({ ...p, inputResetCount: '' }));
      const pld = await send(24);
      if (pld?.length) setState(p => ({ ...p, inputResetCount: pld[0].toString() }));
    }

    if (state.chkQ3) {
      setState(p => ({ ...p, inputQ3: '' }));
      const pld = await send(14);
      if (pld && pld.length >= 4) setState(p => ({ ...p, inputQ3: new DataView(pld.buffer).getInt32(0, true).toString() }));
    }

    if (state.chkPushEventIndex) {
      setState(p => ({ ...p, inputPushEventIndex: '' }));
      const pld = await send(34);
      if (pld && pld.length >= 4) setState(p => ({ ...p, inputPushEventIndex: new DataView(pld.buffer).getUint32(0, true).toString() }));
    }

    if (state.chkLPR) {
      setState(p => ({ ...p, inputLPR: '' }));
      const pld = await send(15);
      if (pld?.length) setState(p => ({ ...p, inputLPR: pld[0].toString() }));
    }

    if (state.chkModuleType) {
      setState(p => ({ ...p, inputModuleType: '' }));
      const pld = await send(13);
      if (pld?.length) setState(p => ({ ...p, inputModuleType: pld[0].toString() }));
    }

    if (state.chkPushTime1) {
      setState(p => ({ ...p, inputPushTime1: '' }));
      const pld = await send(19);
      if (pld && pld.length >= 2) setState(p => ({ ...p, inputPushTime1: `${pld[0].toString().padStart(2,'0')}:${pld[1].toString().padStart(2,'0')}` }));
    }

    if (state.chkPushTime2) {
      setState(p => ({ ...p, inputPushTime2: '' }));
      const pld = await send(20);
      if (pld && pld.length >= 2) setState(p => ({ ...p, inputPushTime2: `${pld[0].toString().padStart(2,'0')}:${pld[1].toString().padStart(2,'0')}` }));
    }

    if (state.chkVoltage) {
      setState(p => ({ ...p, inputVoltage: '' }));
      const pld = await send(23);
      if (pld?.length) setState(p => ({ ...p, inputVoltage: (pld[0] / 40.0).toFixed(2) }));
    }

    if (state.chkRemainBattery) {
      setState(p => ({ ...p, inputRemainBattery: '' }));
      const pld = await send(21);
      if (pld && pld.length >= 2) setState(p => ({ ...p, inputRemainBattery: new DataView(pld.buffer).getInt16(0, true).toString() }));
    }

    if (state.chkLatDataIndex) {
      setState(p => ({ ...p, inputLatDataIndex: '' }));
      const pld = await send(31);
      if (pld && pld.length >= 4) setState(p => ({ ...p, inputLatDataIndex: new DataView(pld.buffer).getUint32(0, true).toString() }));
    }

    if (state.chkPushDataIndex) {
      setState(p => ({ ...p, inputPushDataIndex: '' }));
      const pld = await send(32);
      if (pld && pld.length >= 4) setState(p => ({ ...p, inputPushDataIndex: new DataView(pld.buffer).getUint32(0, true).toString() }));
    }

    if (state.chkLatchEventIndex) {
      setState(p => ({ ...p, inputLatchEventIndex: '' }));
      const pld = await send(33);
      if (pld && pld.length >= 4) setState(p => ({ ...p, inputLatchEventIndex: new DataView(pld.buffer).getUint32(0, true).toString() }));
    }

    if (state.chkVoltageThreshold) {
      setState(p => ({ ...p, inputVoltageThreshold: '' }));
      const pld = await send(36);
      if (pld?.length) setState(p => ({ ...p, inputVoltageThreshold: (pld[0] / 10.0).toFixed(1) }));
    }

    if (state.chkBatteryCapacity) {
      setState(p => ({ ...p, inputBatteryCapacity: '' }));
      const pld = await send(41);
      if (pld && pld.length >= 2) setState(p => ({ ...p, inputBatteryCapacity: new DataView(pld.buffer).getInt16(0, true).toString() }));
    }

    if (state.chkEventConfig) {
      setState(p => ({ ...p, inputEventConfig: '' }));
      const pld = await send(26);
      if (pld?.length) setState(p => ({ ...p, inputEventConfig: pld[0].toString() }));
    }

    if (state.chkRandomMin) {
      setState(p => ({ ...p, inputRandomMin: '' }));
      const pld = await send(43);
      if (pld?.length) setState(p => ({ ...p, inputRandomMin: pld[0].toString() }));
    }

    if (state.chkTimeZone) {
      setState(p => ({ ...p, inputTimeZone: '' }));
      const pld = await send(44);
      if (pld?.length) setState(p => ({ ...p, inputTimeZone: pld[0].toString() }));
    }

    if (state.chkQCCID) {
      setState(p => ({ ...p, inputQCCID: '' }));
      const pld = await send(7);
      if (pld) setState(p => ({ ...p, inputQCCID: asciiBytesToString(pld.slice(0, 20)) }));
    }

    if (state.chkPushMethod) {
      setState(p => ({ ...p, inputPushMethod: '' }));
      const pld = await send(17);
      if (pld?.length) setState(p => ({ ...p, inputPushMethod: pld[0].toString() }));
    }

    if (state.chkEnableDevice) {
      setState(p => ({ ...p, inputEnableDevice: '' }));
      const pld = await send(28);
      if (pld?.length) {
        const v = pld[0] & 0xff;
        if (v === 0 || v === 1) setState(p => ({ ...p, inputEnableDevice: v.toString() }));
      }
    }

    if (state.chkPushEventMethod) {
      setState(p => ({ ...p, inputPushEventMethod: '' }));
      const pld = await send(42);
      if (pld?.length) setState(p => ({ ...p, inputPushEventMethod: pld[0].toString() }));
    }

    } catch (ex: any) {
      if (ex?.message === 'EWM timeout') {
        Alert.alert(
          'Thiết bị không phản hồi',
          'Quá thời gian chờ. Kiểm tra lại kết nối BLE và thử đọc lại.',
          [{ text: 'Đã hiểu' }],
        );
      } else {
        Alert.alert('Lỗi đọc', ex.toString());
      }
    } finally {
      setState(p => ({ ...p, isReading: false }));
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

function byteToAscii(bytes: Uint8Array): string {
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
  const { state, setState } = hookProps;

  if (state.isReading || state.isWriting) return;

  if (!connectedId) {
    Alert.alert('Chưa kết nối', 'Vui lòng kết nối thiết bị BLE trước khi ghi.');
    return;
  }

  setState(p => ({ ...p, isWriting: true }));
  try {
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

    if (state.chkExpData) {
      const v = Number(state.inputExpData);
      if (Number.isInteger(v) && v >= 0 && v <= 0xffffffff) {
        const buf = new ArrayBuffer(4);
        new DataView(buf).setUint32(0, v, true);
        const payload = buildOptSetPayload([{ paramId: 3, data: Array.from(new Uint8Array(buf)) }]);
        const frame = buildEwmFrame(5, payload);
        const recv = await sendAndReceiveQueued(connectedId, frame);
        pushResult(!!recv?.length, 'ExpData');
      }
    }

    if (state.chkIPPORT) {
      const ipport = (state.inputIPPORT || '').padEnd(25, '\0');
      console.log(ipport)
      const payload = buildOptSetPayload([{ paramId: 11, data: Array.from(stringToAsciiBytes(ipport)) }]);
      const frame = buildEwmFrame(5, payload);
      const recv = await sendAndReceiveQueued(connectedId, frame);
      pushResult(!!recv?.length, 'IPPORT');
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
    if (state.chkPushMethod) {
      const v = Number(state.inputPushMethod);
      if (v === 1 || v === 2) {
        const payload = buildOptSetPayload([{ paramId: 17, data: [v] }]);
        const frame = buildEwmFrame(5, payload);
        const recv = await sendAndReceiveQueued(connectedId, frame);
        pushResult(!!recv?.length, 'PushMethod');
      }
    }

    if (state.chkEnableDevice) {
      const value = Number(state.inputEnableDevice);
      if (value === 0 || value === 1) {
        const payload = buildOptSetPayload([{ paramId: 28, data: Uint8Array.from([value]) }]);
        const frame = buildEwmFrame(5, payload);
        const recv = await sendAndReceiveQueued(connectedId, frame);
        pushResult(!!recv?.length, 'Enable Device');
      }
    }

    if (state.chkPushEventMethod) {
      const value = Number(state.inputPushEventMethod);
      if (value >= 0 && value <= 255) {
        const payload = buildOptSetPayload([{ paramId: 42, data: Uint8Array.from([value]) }]);
        const frame = buildEwmFrame(5, payload);
        const recv = await sendAndReceiveQueued(connectedId, frame);
        pushResult(!!recv?.length, 'Push Event Method');
      }
    }

    if (successList.length || errorList.length) {
      let msg = '';
      if (successList.length) msg += 'Thành công:\n• ' + successList.join('\n• ') + '\n\n';
      if (errorList.length) msg += 'Thất bại:\n• ' + errorList.join('\n• ');
      Alert.alert('Kết quả ghi', msg.trim());
    }
  } finally {
    setState(p => ({ ...p, isWriting: false }));
  }
};
