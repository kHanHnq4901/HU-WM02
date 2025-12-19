import Geolocation from '@react-native-community/geolocation';
import React, { useContext, useEffect, useState } from 'react';
import { EmitterSubscription, EventSubscription, NativeEventEmitter, NativeModules, Platform } from 'react-native';
import * as permission from 'react-native-permissions';
import {
  requestBluetoothPermissions,
  requestPermissionBleConnectAndroid,
  requestPermissionGPSAndroid,
  requestPermissionGPSIos,
  requestPermissionScan,
} from '../../service/permission';
import { PropsStore, storeContext } from '../../store';
import BleManager from 'react-native-ble-manager';
import { onScanPress } from './handleButton';
import { showAlert, showToast } from '../../util';
import { ObjSend } from '../../service/hhu/hhuFunc';
import { onBleData } from '../../util/ble';
  let hhuDiscoverPeripheral: EventSubscription | null= null;
  let hhuDisconnectListener: EventSubscription | null = null;
  let hhuReceiveDataListener: EventSubscription | null = null;
export type PropsItemBle = {
  isConnectable?: boolean;
  name: string;
  id: string;
  rssi?: number;
};

type PropsBLE = {
  isScan: boolean;

  listBondedDevice: PropsItemBle[];
  listNewDevice: { name: string; id: string; rssi: number }[];
  // idConnected: string | null;
};

export type HookState = {
  status: string;
  ble: PropsBLE;
};

export type HookProps = {
  state: HookState;
  setState: React.Dispatch<React.SetStateAction<HookState>>;
};

const TAG = 'Ble Controller: ';

export const hookProps = {} as HookProps;

export let store = {} as PropsStore;


const BleManagerModule = NativeModules.BleManager;

let enableLocationHook = {} as {
  enabled: any;
  requestResolution: () => void;
};

export const requestGps = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    return true;
  }
  try {
    const value = await turnOnLocation();
    if (value === true) {
      if (Platform.OS === 'android') {
        if (enableLocationHook.enabled !== true) {
          enableLocationHook.requestResolution();
          return true;
        } else {
        }
      }

      return true;
    }
    if (value === false) {
      setStatus('Bật GPS cho chức năng tìm kiếm thiết bị Bluetooth');
    }
  } catch (err :any) {
    setStatus('Lỗi: ' + err.message);
  }

  return false;
};

export const GetHookProps = (): HookProps => {
  const [state, setState] = useState<HookState>({
    status: '',
    ble: {
      isScan: false,
      listBondedDevice: [],
      listNewDevice: [],
    },
  });
  hookProps.state = state;
  hookProps.setState = setState;

  store = useContext(storeContext) as PropsStore;


  return hookProps;
};

const handleStopScan = async () => {
  console.log('event stop scan');

  hookProps.setState(state => {
    state.ble.isScan = false;
    return { ...state };
  });
  // const ret = await BleManager.getDiscoveredPeripherals([]);
  // console.log('ret:', ret);
};

export const setStatus = (status: string) => {
  hookProps.setState(state => {
    state.status = status;
    return { ...state };
  });
};

const handleDidUpdateState = (obj: { state: any; }) => {
  console.log('handleDidUpdateState:', obj.state);
  // const state = obj.state;
  // if (state === 'on') {
  //   console.log('state:', state);
  //   BleManager.scan([], 15, false)
  //     .then(() => {
  //       hookProps.setState(state => {
  //         state.ble.isScan = true;
  //         return { ...state };
  //       });
  //     })
  //     .catch(resFail => {
  //       console.log('fail: ', resFail);
  //     });
  // }
};
export const hhuHandleDisconnectedPeripheral = async (data: any) => {
  store.setState(state => {
    state.hhu.name = '';
    state.hhu.idConnected = '';
    state.hhu.connect = 'DISCONNECTED';
    return { ...state };
  });
  console.log (store.state.hhu.connect)
  ObjSend.id = null;
  showToast('Thiết bị đã ngắt kết nối')
};
const handleDiscoverPeripheral = (peripheral: any) => {
  const connectedId = store?.state.hhu.idConnected;

  // Tạo Map từ list hiện tại
  const peripherals = new Map(
    hookProps.state.ble.listNewDevice.map(itm => [itm.id, itm])
  );

  let res = peripheral as {
    advertising: {
      isConnectable: boolean;
      manufacturerData: any;
      serviceData: any;
      serviceUUIDs: [];
      txPowerLevel: number;
    };
    id: string;
    name: null | string;
    rssi: number;
  };

  // Bỏ qua nếu là thiết bị đang connect
  if (res.id === connectedId) {
    return;
  }

  // Chỉ lưu thiết bị có tên & có thể kết nối
  if (res.name && res.advertising?.isConnectable) {
    peripherals.set(res.id, {
      name: res.name,
      id: res.id,
      rssi: res.rssi
    });

    hookProps.setState(state => {
      state.ble.listNewDevice = Array.from(peripherals.values());
      return { ...state };
    });
  }
};


export const onInit = async () => {
  try {
    // Cấu hình GPS
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
      locationProvider: 'playServices',
    });
    Geolocation.requestAuthorization();

    // Xin quyền Bluetooth
   const requestScanPermission = await requestBluetoothPermissions();
console.log('🔐 requestBluetoothPermissions =', requestScanPermission);

if (requestScanPermission) {
  try {
    if (Platform.OS === 'android') {
      console.log('▶️ BleManager.start()');
      await BleManager.start({ showAlert: false });
      console.log('✅ BleManager.start OK');
    }

    console.log('▶️ BleManager.enableBluetooth()');
    await BleManager.enableBluetooth(); // không throw = đã bật
    console.log('✅ Bluetooth enabled');

    if (Platform.OS === 'android') {
      console.log('▶️ BleManager.getBondedPeripherals()');

      const list = await BleManager.getBondedPeripherals();
      console.log(
        '📦 Bonded peripherals raw:',
        JSON.stringify(list, null, 2)
      );

      hookProps.setState(state => {
        state.ble.listBondedDevice = list.map(item => ({
          id: item.id,
          isConnectable: item.advertising?.isConnectable ?? false,
          name: item.name ?? '',
        }));
        return { ...state };
      });

      console.log('✅ Saved bonded devices:', list.length);
    }
  } catch (err: any) {
    console.log('❌ BLE ERROR:', err);

    // log sâu hơn
    if (err?.message) console.log('❌ message:', err.message);
    if (err?.code) console.log('❌ code:', err.code);
    if (err?.stack) console.log('❌ stack:', err.stack);

    showAlert('Thiết bị cần được bật bluetooth');
  }
} else {
  console.log('❌ Permission denied');
}

     // 🔌 Setup BLE event listeners — đảm bảo chỉ 1 lần
      if (!hhuDiscoverPeripheral) {
        hhuDiscoverPeripheral = BleManager.onDiscoverPeripheral(
          handleDiscoverPeripheral
        );
      }

      if (!hhuReceiveDataListener) {
        hhuReceiveDataListener = BleManager.onDidUpdateValueForCharacteristic(
          onBleData
        );
      }

      if (!hhuDisconnectListener) {
        hhuDisconnectListener = BleManager.onDisconnectPeripheral(
          hhuHandleDisconnectedPeripheral
        );
      }
    BleManager.onStopScan(handleStopScan);

    // BleManager.onDisconnectPeripheral((data: { peripheral: any; }) => {
    //   console.log('Peripheral disconnected:', data.peripheral);
    // });setStatus('');
  } catch (err: any) {
    setStatus('Lỗi: ' + err.message);
  }
};

export const onDeInit = () => {

};


type PropsListBondBle = {
  advertising: {
    isConnectable?: boolean;
    localName?: string;
    manufacturerData?: any;
  };
  id: string;
  name: string;
  rssi: 0;
};
export const turnOnLocation = async (
  requestBle?: boolean
): Promise<boolean> => {
  let ok: boolean = false;

  let result: permission.PermissionStatus = 'denied';

  if (Platform.OS === 'ios') {
    return await requestPermissionGPSIos();
  } else {
    if (requestBle !== false) {
      ok = await requestPermissionBleConnectAndroid();
    }

    ok = await requestPermissionGPSAndroid();
    return ok;
  }
};