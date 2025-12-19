import { checkUpdateHHU } from '../../service/api';
import { BleFunc_SaveStorage, BleFunc_StartNotification } from '../../service/hhu/bleHhuFunc';
import { ObjSend } from '../../service/hhu/hhuFunc';
import { requestBluetoothPermissions } from '../../service/permission';
import BleManager from 'react-native-ble-manager';
import * as Ble from '../../util/ble';
import { showAlert, sleep } from '../../util';
import { hookProps, setStatus, store } from './controller';
import { EventSubscription, NativeEventEmitter, NativeModules, Platform } from 'react-native';

const TAG = 'handleBtn Ble:';
const bleManagerEmitter = new NativeEventEmitter(NativeModules.BleManager);
let onDiscoverPeripheral: EventSubscription | null = null;
export const connectHandle = async (id: string, name: string) => {
  try {
    // Ngắt kết nối cũ nếu khác id
    if (store?.state.hhu.connect === 'CONNECTED' && store?.state.hhu.idConnected !== id) {
      await BleManager.disconnect(store.state.hhu.idConnected, true);
      await BleManager.removePeripheral(store.state.hhu.idConnected).catch(() => {});
    }

    if (name) {
      setStatus('Đang kết nối tới ' + name + ' ...');
      store?.setState(state => {
        state.hhu.name = name;
        return { ...state };
      });
    }

    store?.setState(state => {
      state.hhu.connect = 'CONNECTING';
      return { ...state };
    });

    let succeed = false;
    try {
      succeed = await Ble.connect(id);
    } catch (err: any) {
      store?.setState(state => {
        state.hhu.idConnected = '';
        state.hhu.connect = 'DISCONNECTED';
        return { ...state };
      });
      setStatus('Kết nối thất bại: ' + err.message);
      return;
    }

    if (!succeed) {
      setStatus('Kết nối thất bại');
      return;
    }

    // Nếu kết nối thành công
    setStatus('Kết nối thành công');
    BleFunc_StartNotification(id);

    store?.setState(state => {
      state.hhu.idConnected = id;
      state.hhu.connect = 'CONNECTED';
      state.hhu.rssi = 0;
      return { ...state };
    });

    // Lưu device
    BleFunc_SaveStorage(id);

    // Xóa thiết bị vừa kết nối khỏi list scan
    hookProps.setState(state => {
      state.ble.listNewDevice = state.ble.listNewDevice.filter(item => item.id !== id);
      return { ...state };
    });
  } catch (err: any) {
    console.log(TAG, err);
    setStatus('Kết nối thất bại: ' + err.message);
  }
};

// Hàm scan (ưu tiên lấy tên từ advertising.localName)
export const onScanPress = async () => {
  if (hookProps.state.ble.isScan) return;

  console.log('🚀 START SCAN');

  hookProps.setState(state => {
    state.status = '';
    return { ...state };
  });

  const requestScanPermission = await requestBluetoothPermissions();
  console.log('🔐 Permission:', requestScanPermission);

  try {
    if (!requestScanPermission) {
      console.log('❌ Permission denied');
      return;
    }

    await BleManager.enableBluetooth();
    console.log('✅ Bluetooth enabled');

    if (Platform.OS === 'android') {
      await BleManager.start({ showAlert: false });
      console.log('✅ BLE Module initialized');
    }

    hookProps.setState(state => {
      state.ble.listNewDevice = [];
      return { ...state };
    });

    console.log('🧹 Clear device list');

    // 🔥 remove listener cũ nếu còn
    onDiscoverPeripheral?.remove();

    // 🔥 Listener phát hiện thiết bị
    onDiscoverPeripheral = bleManagerEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      peripheral => {
        console.log(
          '📡 RAW PERIPHERAL:',
          JSON.stringify(peripheral, null, 2)
        );

        if (!peripheral?.id) return;

        const advName = peripheral?.advertising?.localName;
        const deviceName =
          advName || peripheral.name || 'Unknown';

        console.log(
          `📡 FOUND → id=${peripheral.id}, name=${deviceName}, rssi=${peripheral.rssi}`
        );

        hookProps.setState(state => {
          const exists = state.ble.listNewDevice.some(
            d => d.id === peripheral.id
          );

          if (!exists) {
            state.ble.listNewDevice.push({
              id: peripheral.id,
              name: deviceName,
              rssi: peripheral.rssi ?? 0,
            });
          }
          return { ...state };
        });
      }
    );

    console.log('⏳ Delay 500ms before scan');
    await sleep(500);

    // ✅ API ĐÚNG – OBJECT (Map)
    console.log('🔍 CALL BleManager.scan');
    await BleManager.scan({
      serviceUUIDs: [],
      seconds: 5,
      allowDuplicates: true,
    });

    hookProps.setState(state => {
      state.ble.isScan = true;
      return { ...state };
    });

    const stopListener = bleManagerEmitter.addListener(
      'BleManagerStopScan',
      () => {
        console.log('🛑 Native STOP SCAN event');
      }
    );

    setTimeout(async () => {
      await BleManager.stopScan();
      console.log('🛑 stopScan() called');

      hookProps.setState(state => {
        state.ble.isScan = false;
        return { ...state };
      });

      onDiscoverPeripheral?.remove();
      onDiscoverPeripheral = null;
      stopListener.remove();

      console.log('✅ SCAN FINISHED');
    }, 5000);

  } catch (err: any) {
    console.log('❌ SCAN ERROR:', err);
    showAlert('Thiết bị cần được bật Bluetooth');
  }
};



export const disConnect = async (id: string) => {
  try {
    console.log('🔌 Disconnect peripheral:', id);
    await BleManager.disconnect(id, true);

    // Xóa cache sau khi disconnect
    await BleManager.removePeripheral(id).catch(() => {});
    if (Platform.OS === 'android') {
      await BleManager.removeBond(id).catch(() => {});
    }

    store.setState(state => {
      state.hhu.name = '';
      state.hhu.idConnected = '';
      state.hhu.connect = 'DISCONNECTED';
      return { ...state };
    });

    ObjSend.id = null;
  } catch (err) {
    console.log("⚠️ disconnect error:", err);
  }
};
export const getRssiDisplay = (rssi: number) => {
  if (rssi > -60) {
    return { icon: '📶', color: '#4CAF50' }; // mạnh
  }
  if (rssi > -80) {
    return { icon: '📶', color: '#FFC107' }; // trung bình
  }
  return { icon: '📶', color: '#F44336' }; // yếu
};