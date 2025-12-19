import { Buffer } from 'buffer';
//import struct from './cstruct';

export function Array2Struct(
  buff: Buffer,
  startIndex: number,
  typeStruct: any,
  endianness?: 'BE' | 'LE',
) {
  let obj;
  if (endianness === 'BE') {
    obj = typeStruct.readBE(buff, startIndex);
  } else {
    obj = typeStruct.readLE(buff, startIndex);
  }

  return obj;
}
export function Struct2Array(
  typeStruct,
  objStruct,
  buff: Buffer,
  startIndex: number,
  length?: number,
  endianness?: 'BE' | 'LE',
) {
  const len = length
    ? length > typeStruct.byteLength
      ? typeStruct.byteLength
      : length
    : typeStruct.byteLength;

  let buffStruct = typeStruct.write(objStruct);
  if (endianness === 'BE') {
    buffStruct = typeStruct.writeBE(objStruct);
  } else {
    buffStruct = typeStruct.writeLE(objStruct);
  }
  buffStruct.copy(buff, startIndex, 0, len);
  return;
}

export function sizeof(typeStruct): number {
  return typeStruct.byteLength;
}
