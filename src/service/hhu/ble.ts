import { EventSubscription, PermissionsAndroid, Platform } from 'react-native';
import BleManager from 'react-native-ble-manager';

import { Buffer } from 'buffer'; // cần import Buffer
import { crc16 } from '../../util/crc16';
import { sleep } from '../../util';
const TAG = 'Ble.ts:';

let service: string ;
let characteristic: string;
let hhuReceiveDataListener: EventSubscription | null = null;

export const requestBlePermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android' && Platform.Version >= 23) {
    try {
      let allow = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (allow) {
        return true;
      } else {
        let granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        console.log(granted);
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('permission is ok');
        } else {
          console.log('permission is denied');
        }
      }
    } catch {}
  }
  return Promise.resolve(true);
};




export const addBleListener = (callback: (data: { value: number[] }) => void) => {
  if (hhuReceiveDataListener) {
    hhuReceiveDataListener.remove();
    hhuReceiveDataListener = null;
  }
  hhuReceiveDataListener = BleManager.onDidUpdateValueForCharacteristic(callback);
};

export const removeBleListener = () => {
  if (hhuReceiveDataListener) {
    hhuReceiveDataListener.remove();
    hhuReceiveDataListener = null;
  }
};

export const connect = async (id: string): Promise<boolean> => {
  for (let i = 0; i < 2; i++) {
    try {
      await BleManager.stopScan();
      // let waitOk = false;
      // setTimeout(() => {
      //   if (waitOk === false) {
      //     console.log('connect timeout, disconnect');

      //     BleManager.disconnect(id);
      //   }
      // }, 5000);
      await BleManager.connect(id);
      //waitOk = true;
      //BleManager.createBond(id);
      return true;
    } catch (err: any) {
      console.log(TAG, err);
      console.log('aaa id:', id);

      //Promise.reject(err);
    }
    await sleep(1000);
  }
  return false;
};

export const startNotification = async (idPeripheral: string) => {
  try {
    const res = await BleManager.retrieveServices(idPeripheral);

    const info = res as unknown as {
      characteristics: {
        characteristic: string;
        service: string;
        properties?: {
          Notify?: 'Notify';
          Read?: 'Read';
          Write?: 'Write';
          WriteWithoutResponse?: 'WriteWithoutResponse';
        };
      }[];
    };


    let element = info.characteristics.find(element => {
      return (
        element.characteristic &&
        element.properties?.Write &&
        element.properties?.Notify &&
        element.service
      );
    });
    console.log('element:', element);
    if (!element) {
      console.log(TAG, 'no find element');
      return;
    }
    service = element.service;
    characteristic = element.characteristic;
    
    BleManager.startNotification(
      idPeripheral, service, characteristic
    )
      .then(() => {
        
        console.log("Notification started");
      })
      .catch((error) => {
        // Failure code
        console.log(error);
      });
   
  } catch (err: any) {
    console.log(TAG, err);
  }
};

export const send = async (idPeripheral: string, data: number[]) => {
  try {
    BleManager.write(
      idPeripheral, service, characteristic,data,256
    )
      .then(async () => {
      })
      .catch((error) => {
        // Failure code
        console.log(error);
      });
  } catch (err: any) {
    console.log(TAG + 'here:', err);
  }
};
function toHexString(byteArray: number[]) {
  return byteArray
    .map(b => b.toString(16).padStart(2, '0')) // Chuyển sang hex, thêm 0 nếu 1 ký tự
    .join(' ');
}
export const stopNotification = async (idPeripheral: string) => {
  try {
    await BleManager.stopNotification(idPeripheral, service, characteristic);
  } catch (err: any) {
    console.log(TAG, err);
  }
};
export async function sendLoraCommand(
  device: Device,
  commandType: number,
  meterSerial: number,
  commandCode: number,
  payload: number[] = []
) {
  const STX = 0x02;
  const MODULE_TYPE = 0x08;

  // Convert MeterSerial -> 4 byte
  const serialBytes = [
    (meterSerial >> 24) & 0xff,
    (meterSerial >> 16) & 0xff,
    (meterSerial >> 8) & 0xff,
    meterSerial & 0xff,
  ];

  // Payload = [CommandCode, ...payload]
  const fullPayload = [commandCode, ...payload];
  const lenPayload = fullPayload.length;

  // Frame chưa có CRC
  const frameWithoutCRC = [
    STX,
    MODULE_TYPE,
    commandType,
    lenPayload,
    ...serialBytes,
    ...fullPayload,
  ];

  // Tính CRC16
  const crc = crc16(new Uint8Array(frameWithoutCRC));
  const crcBytes = [crc & 0xff, (crc >> 8) & 0xff]; // Little endian

  // Frame hoàn chỉnh
  const frame = [...frameWithoutCRC, ...crcBytes];

  console.log("Frame gửi BLE:", frame.map((x) => x.toString(16).padStart(2, "0")));

  // Gửi qua BLE
  const buffer = Buffer.from(frame);
  await device.writeCharacteristicWithResponseForService(
    SERVICE_UUID,
    CHARACTERISTIC_UUID,
    buffer.toString("base64")
  );
}