// "30" => 0x30

import { Buffer } from 'buffer';
import { uint32_t } from '../define';
export const ConvertBCDToByte = (str: string): number => {
  let num: number = 0;
  num |= (str.charCodeAt(0) - 48) & 0x0f;
  num <<= 4;
  num |= (str.charCodeAt(1) - 48) & 0x0f;

  return num;
};
// 0x30 => "30"
export const ConvertByteToBCD = (num: number): string => {
  let str = '';
  str += String.fromCharCode(((num >> 4) & 0x0f) + 48);
  str += String.fromCharCode((num & 0x0f) + 48);
  return str;
};

interface IConvert {
  ToByte: (val: string, radix?: 2 | 8 | 10 | 16) => number;
  ToInt16: (str: string, radix?: 2 | 8 | 10 | 16) => number;
  ToInt32: (str: string, radix?: 2 | 8 | 10 | 16) => number;
  ToString: (val: string | number, radix?: 2 | 8 | 10 | 16) => string;
  ToChar: (val: number) => string;
  ToInt64: (str: string, radix?: 2 | 8 | 10 | 16) => number;
  ToDouble: (val: any) => number;
  ToDecimal: (val: any) => number;
  ToBoolean: (val: any) => boolean;
}

export const Convert = {} as IConvert;

Convert.ToByte = (val: string, radix?: 2 | 8 | 10 | 16) => {
  if (radix) {
    return parseInt(val, radix);
  } else {
    return Number(val) & 0xff;
  }
};

Convert.ToInt16 = (str: string, radix?: 2 | 8 | 10 | 16) => {
  return parseInt(str, radix) & 0xffff;
};
Convert.ToInt32 = (str: string, radix?: 2 | 8 | 10 | 16) => {
  return parseInt(str, radix) & 0xffffffff;
};

Convert.ToString = (val: string | number, radix?: 2 | 8 | 10 | 16) => {
  return val.toString(radix ?? 10);
};

Convert.ToChar = (val: number) => {
  return String.fromCharCode(val);
};

Convert.ToInt64 = (str: string, radix?: 2 | 8 | 10 | 16) => {
  return parseInt(str, radix);
  //return Number(str);
};
Convert.ToDouble = (str: any) => {
  return Number(str);
};

Convert.ToDecimal = (str: any) => {
  return Number(str);
};

Convert.ToBoolean = (str: string) => {
  if (str === '' || str === 'false') {
    return false;
  }

  return true;
};

export const GetSerialFromBuffer = (
  buff: Buffer,
  offset: number,
  size?: number,
): string => {
  let serial = '';
  for (let k = 0 + offset; k < (size ?? 6) + offset; k++) {
    serial += ConvertByteToBCD(buff[k]);
  }

  return serial;
};

export function isValidDate(date: Date): boolean {
  return date.getTime() === date.getTime();
}

export const formatDateTimeDB = (date: Date | string): string => {
  let str: string = '';
  let newDate: Date;
  if (typeof date === 'string') {
    newDate = new Date(date);
  } else {
    newDate = date;
  }

  if (isValidDate(newDate) === false) {
    newDate = new Date('1970/1/1');
  }

  str =
    //newDate.toLocaleDateString('vi') + ' ' + newDate.toLocaleTimeString('vi');

    newDate.getFullYear().toString() +
    '-' +
    (newDate.getMonth() + 1).toString().padStart(2, '0').slice(-2) +
    '-' +
    newDate.getDate().toString().padStart(2, '0').slice(-2) +
    'T' +
    newDate.getHours().toString().padStart(2, '0').slice(-2) +
    ':' +
    newDate.getMinutes().toString().padStart(2, '0').slice(-2) +
    ':' +
    newDate.getSeconds().toString().padStart(2, '0').slice(-2);

  return str;
};

export const get4byteDataDLMS = (
  buff: Buffer,
  offset: number,
  factor?: 1 | 10 | 100 | 1000,
): string => {
  return (buff.readUintBE(offset, 4) / (factor ?? 100)).toFixed(3);
};
export const get4byteDataBCD = (
  buff: Buffer,
  offset: number,
  factor?: 1 | 10 | 100 | 1000,
): string => {
  let index = offset;
  let str = '';
  for (let i = 0; i < 4; i++) {
    str += ConvertByteToBCD(buff[index]);
    index++;
  }
  str = (Number(str) / (factor ?? 100)).toString();
  return str;
};
export const get2byteDataDLMS = (
  buff: Buffer,
  offset: number,
  factor?: 1 | 10 | 100 | 1000,
): string => {
  return (buff.readUintBE(offset, 2) / (factor ?? 100)).toFixed(3);
};

export const getTimeDLMS = (
  buff: Buffer,
  offset: number,
  bSecond?: boolean,
): string | undefined => {
  let index = offset;

  const year = buff.readUintBE(index, 2);
  index += 2;
  if (year === 0) {
    return undefined;
  }
  const month = buff[index++];
  const date = buff[index++];
  const hour = buff[index++];
  const minute = buff[index++];
  let second;
  if (bSecond) {
    second = buff[index++];
  } else {
    second = 0;
  }

  const str =
    year.toString() +
    '-' +
    month.toString().padStart(2, '0').slice(-2) +
    '-' +
    date.toString().padStart(2, '0').slice(-2) +
    ' ' +
    hour.toString().padStart(2, '0').slice(-2) +
    ':' +
    minute.toString().padStart(2, '0').slice(-2) +
    ':' +
    second.toString().padStart(2, '0').slice(-2);

  return str;
};

export const getTimeIEC = (time: string): string | undefined => {
  //console.log('time:', time);
  let index = 0;
  const year = Number(time.substring(index, index + 2)) + 2000;
  if (year === 2000) {
    return undefined;
  }
  index += 2;
  const month = time.substring(index, index + 2);
  index += 2;
  const date = time.substring(index, index + 2);
  index += 2;
  const hour = time.substring(index, index + 2);
  index += 2;
  const minute = time.substring(index, index + 2);
  index += 2;
  let second: string;
  if (time.length > 10) {
    second = time.substring(index, index + 2);
    index += 2;
  } else {
    second = '00';
  }
  const str =
    year.toString() +
    '-' +
    month +
    '-' +
    date +
    ' ' +
    hour +
    ':' +
    minute +
    ':' +
    second;

  return str;
};

export const getArrDataFromString = (str: string): string[] => {
  const regexGetNumber = /\d+\.*\d*/g;
  const result: string[] = [];
  var match;
  while ((match = regexGetNumber.exec(str)) != null) {
    result.push(match[0]);
  }

  return result;
};

export const GetStringRssi = (RSSI_Value: number): string => {
  let strRSSI = '';
  // if (RSSI_Value >= 128) {
  //   RSSI_Value = (RSSI_Value - 256) / 2 - 74;
  // } else {
  //   RSSI_Value = RSSI_Value / 2 - 74;
  // }

  RSSI_Value = (RSSI_Value * 25) / 46 - 127;

  RSSI_Value = Math.round(RSSI_Value);

  if (RSSI_Value > 0) {
    strRSSI = '+' + RSSI_Value.toString();
  } else {
    strRSSI = RSSI_Value.toString();
  }

  return strRSSI;
};

export const ConvertBufferToBCD = (
  buff: Buffer,
  offset: number,
  length: number,
): string => {
  let str = '';
  for (let i = offset; i < offset + length; i++) {
    str += ConvertByteToBCD(buff[i]);
  }

  return str;
};
export function parseDateBCD(bytes: number[]): Date {
  const year = 2000 + bcdToDec(bytes[0]);
  const month = bcdToDec(bytes[1]) - 1; // JS month 0–11
  const day = bcdToDec(bytes[2]);
  const hour = bcdToDec(bytes[3]);
  const minute = bcdToDec(bytes[4]);
  const second = bcdToDec(bytes[5]);

  // ✅ tạo Date theo local time
  return new Date(year, month, day, hour, minute, second);
}


// 🆕 Hàm convert string dd/MM/yyyy HH:mm:ss → Date để tính toán
export function parseStringToDate(str: string): Date | null {
  const match = str.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, dd, MM, yyyy, hh, mm, ss] = match;
  return new Date(Number(yyyy), Number(MM) - 1, Number(dd), Number(hh), Number(mm), Number(ss));
}

function bcdToDec(bcd: number): number {
  return ((bcd >> 4) * 10) + (bcd & 0x0f);
}
