import { Platform, PermissionsAndroid } from 'react-native';
import * as permission from 'react-native-permissions';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';

const TAG = '[Permission]';

async function checkAndRequest(perId: any, name: string): Promise<boolean> {
  try {
    let result = await check(perId);
    if (result === RESULTS.GRANTED || result === RESULTS.LIMITED) {
      console.log(TAG, name, 'GRANTED');
      return true;
    }

    if (result === RESULTS.DENIED) {
      console.log(TAG, name, 'DENIED → requesting...');
      result = await request(perId);
      return result === RESULTS.GRANTED || result === RESULTS.LIMITED;
    }

    if (result === RESULTS.BLOCKED) {
      console.warn(TAG, name, 'BLOCKED → need open settings');
      return false;
    }

    console.warn(TAG, name, 'UNAVAILABLE');
    return false;
  } catch (err: any) {
    console.log(TAG, name, 'ERROR:', err.message);
    return false;
  }
}


export const requestPermissionGPSIos = async (): Promise<boolean> => {
  return checkAndRequest(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE, 'LOCATION_WHEN_IN_USE');
};


export const requestPermissionGPSAndroid = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  return checkAndRequest(permission.PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION, 'ACCESS_FINE_LOCATION');
};


export async function requestPermissionBleConnectAndroid(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const osVer = Number(Platform.constants.Version);
  if (osVer >= 31) {
    return checkAndRequest(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT, 'BLUETOOTH_CONNECT');
  }
  return true;
}


export const requestPermissionWriteExternalStorage = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') return true;
  return checkAndRequest(permission.PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE, 'WRITE_EXTERNAL_STORAGE');
};


export const requestPermissionScan = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    const osVer = Number(Platform.constants.Version);
    if (osVer >= 31) {
      return checkAndRequest(permission.PERMISSIONS.ANDROID.BLUETOOTH_SCAN, 'BLUETOOTH_SCAN');
    }
    return true;
  } else {
    return checkAndRequest(permission.PERMISSIONS.IOS.BLUETOOTH, 'BLUETOOTH');
  }
};

/* Camera */
export async function requestCameraPermissions(): Promise<boolean> {
  if (Platform.OS === 'ios') return true;
  return checkAndRequest(permission.PERMISSIONS.ANDROID.CAMERA, 'CAMERA');
}
export async function requestBluetoothPermissions() {
  if (Platform.OS === 'android') {
    const permissions = [];
    if (Platform.Version >= 23 && Platform.Version <= 30) {
      permissions.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    } else if (Platform.Version >= 31) {
      permissions.push(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      );
    }

    if (permissions.length === 0) {
      return true;
    }
    const granted = await PermissionsAndroid.requestMultiple(permissions);
    return Object.values(granted).every(
      result => result === PermissionsAndroid.RESULTS.GRANTED,
    );
  }
  return true;
}