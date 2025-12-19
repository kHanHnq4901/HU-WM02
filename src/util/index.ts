import {
  Alert,
  AlertButton,
  Keyboard,
  Platform,
  ToastAndroid,
} from 'react-native';
import { Buffer } from 'buffer';
import Snackbar from 'react-native-snackbar';

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const getFilExtension = (filename: string): string => {
  return filename.split('.').pop().split(' ')[0];
};

export function isNumeric(str: any) {
  return (
    !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  ); // ...and ensure strings of whitespace fail
}

// export function showAlert(message: string, onOKPress?: () => void) {
//   Alert.alert('', message, [
//     {
//       text: 'OK',
//       onPress: onOKPress,
//     },
//   ]);
// }

export async function showAlert(
  message: string,
  one?: {
    label: string;
    func: () => void;
  },
  two?: {
    label: string;
    func: () => void;
  },
) {
  return new Promise<void>((resolve, reject) => {
    const alertButton: AlertButton[] = [];
    if (one) {
      alertButton.push({
        text: one.label,
        onPress: () => {
          one.func();
          resolve();
        },
      });
    }
    if (two) {
      alertButton.push({
        text: two.label,
        onPress: () => {
          two.func();
          resolve();
        },
      });
    }
    if (alertButton.length === 0) {
      alertButton.push({
        text: 'OK',
        onPress: () => {
          resolve();
        },
      });
    }
    if (message.length <= 40) {
      Alert.alert(message, '', alertButton);
    } else {
      Alert.alert('', message, alertButton);
    }
  });
}

export function showToast(message: string, gravity?: number): void {
  // if (Platform.OS === 'android') {
  //   ToastAndroid.showWithGravity(message, 2000, gravity ?? ToastAndroid.CENTER);
  // } else {
  //   Alert.alert('', message);
  // }
  Snackbar.show({
    text: message,
    duration: Snackbar.LENGTH_SHORT,
  });
}
export function showSnack(message: string): void {
  // if (Platform.OS === 'android') {
  //   ToastAndroid.showWithGravity(message, 2000, gravity ?? ToastAndroid.CENTER);
  // } else {
  //   Alert.alert('', message);
  // }
  Snackbar.show({
    text: message,
    duration: Snackbar.LENGTH_SHORT,
  });
}
export const getCurrentDate = (): string => {
  const today = new Date();
  const strDate =
    ('0' + today.getDate()).slice(-2) +
    '/' +
    ('0' + (today.getMonth() + 1)).slice(-2) +
    '/' +
    today.getFullYear();
  return strDate;
};
export const toLocaleDateString = (date: Date): string => {
  if (!date) {
    return '';
  }
  const today = date;
  const strDate =
    ('0' + today.getDate()).slice(-2) +
    '/' +
    ('0' + (today.getMonth() + 1)).slice(-2) +
    '/' +
    today.getFullYear();
  return strDate;
};
export const toLocaleString = (date: Date): string => {
  if (!date) {
    return '';
  }
  const today = date;
  const strDate =
    ('0' + today.getDate()).slice(-2) +
    '/' +
    ('0' + (today.getMonth() + 1)).slice(-2) +
    '/' +
    today.getFullYear();
  const strTime =
    ('0' + today.getHours()).slice(-2) +
    ':' +
    ('0' + today.getMinutes()).slice(-2) +
    ':' +
    ('0' + today.getSeconds()).slice(-2);

  return strTime + ' ' + strDate;
};
export const getCurrentTime = (): string => {
  const today = new Date();
  const strDate =
    ('0' + today.getHours()).slice(-2) +
    ':' +
    ('0' + today.getMinutes()).slice(-2) +
    ':' +
    ('0' + today.getSeconds()).slice(-2);
  return strDate;
};

export function ByteArrayToString(
  byteArray: number[],
  factor?: 0 | 2 | 8 | 16,
  addition?: boolean,
): string {
  let addStr = addition ? ' ' : '';
  return byteArray
    .map(value => ('0' + (value & 0xff).toString(factor)).slice(-2))
    .join(addStr);
}
export function BufferToString(
  buffer: Buffer,
  offset: number,
  length: number,
  factor?: 0 | 2 | 8 | 16,
  addition?: boolean,
): string {
  let str = '';
  for (let i = offset; i < length + offset; i++) {
    str += ('0' + buffer[i].toString(factor)).slice(-2);
    if (addition) {
      str += ' ';
    }
  }
  return str;
}

export const BufferToUtf16 = (
  buff: Buffer,
  startIndex: number,
  length: number,
) => {
  var str = '';
  for (var i = startIndex; i < startIndex + length; i++) {
    str += String.fromCharCode(buff[i]);
  }
  return str;
};

export function StringFromArray(
  buff: number[] | Buffer,
  offset: number,
  length: number,
): string {
  let str = '';
  for (let i = offset; i < offset + length; i++) {
    // if (buff[i] === 0) {
    //   break;
    // }
    str += String.fromCharCode(buff[i]);
  }

  return str;
}

export function isAllNumeric(value: string): boolean {
  return /^-?\d+$/.test(value);
}

export function isValidText(str: string) {
  return /^[0-9a-zA-Z()]+$/.test(str);
}
// export function ArrayBufferToString(
//   byteArray: ArrayBuffer,
//   factor?: 0 | 2 | 8 | 16,
// ): string {
//   let str = '';
//   for (let i = 0; i < byteArray.byteLength; i++) {
//     str += ('0' + (byteArray[i] & 0xff).toString(factor)).slice(-2);
//   }
//   return str;
// }
// export const ArrayToUtf16 = (intArray) => {
//   var str = '';
//   for (var i = 0; i < intArray.length; i++) {
//     str += String.fromCharCode(intArray[i]);
//   }
//   return str;
// };
// export function StringToArrayBuffer(str: string) {
//   const arr = new ArrayBuffer(str.length);
//   for (let i = 0; i < str.length; i++) {
//     arr[i] = str.charCodeAt(i);
//   }
//   return arr;
// }

export function GetByteArrayFromString(str: string): number[] {
  const arr = new Array(str.length);
  for (let i = 0; i < str.length; i++) {
    arr[i] = str.charCodeAt(i);
  }
  return arr;
}

const units = ['bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

export function niceBytes(x) {
  let l = 0,
    n = parseInt(x, 10) || 0;

  while (n >= 1024 && ++l) {
    n = n / 1024;
  }

  return n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + units[l];
}
export function parseDate(timeBytes: number[]): string {
  const [yy, MM, dd, hh, mm, ss] = timeBytes;0
  const year = 2000 + yy;
  return `${year}-${MM.toString().padStart(2, "0")}-${dd
    .toString()
    .padStart(2, "0")} ${hh.toString().padStart(2, "0")}:${mm
    .toString()
    .padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
}

export function parseUint32(bytes: number[]): number {
  // Nếu ít hơn 4 byte thì padding thêm 0
  const b0 = bytes[0] ?? 0;
  const b1 = bytes[1] ?? 0;
  const b2 = bytes[2] ?? 0;
  const b3 = bytes[3] ?? 0;

  return (b0 | (b1 << 8) | (b2 << 16) | (b3 << 24)) >>> 0;
}
export function parseUint16(bytes: number[]): number {
  // Nếu ít hơn 2 byte thì padding thêm 0
  const b0 = bytes[0] ?? 0;
  const b1 = bytes[1] ?? 0;

  // Gộp 2 byte theo little-endian
  return (b0 | (b1 << 8)) >>> 0;
}