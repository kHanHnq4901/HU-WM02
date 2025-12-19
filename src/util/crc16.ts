import { Buffer } from 'buffer';
import { uint16_t } from '../service/hhu/define';


export function crc16_offset(buf: Buffer, u16Offset: number, len: uint16_t) {
  let crc: uint16_t = 0xffff;
  let pos: uint16_t = 0;
  let i = 0;
  for (pos = u16Offset; pos < len + u16Offset; pos++) {
    crc ^= 0xffff & buf[pos]; // XOR byte into least sig. byte of crc
    for (
      i = 8;
      i !== 0;
      i-- // Loop over each bit
    ) {
      if ((crc & 0x0001) !== 0) {
        // If the LSB is set
        crc >>= 1; // Shift right and XOR 0xA001
        crc ^= 0xa001;
      } else {
        // Else LSB is not set
        crc >>= 1;
      } // Just shift right
    }
  }
  return crc;
}
export function crc16(buf: Buffer, len: uint16_t) {
  let crc: uint16_t = 0xffff;
  let pos: uint16_t = 0;
  let i = 0;
  for (pos = 0; pos < len + 0; pos++) {
    crc ^= 0xffff & buf[pos]; // XOR byte into least sig. byte of crc
    for (
      i = 8;
      i !== 0;
      i-- // Loop over each bit
    ) {
      if ((crc & 0x0001) !== 0) {
        // If the LSB is set
        crc >>= 1; // Shift right and XOR 0xA001
        crc ^= 0xa001;
      } else {
        // Else LSB is not set
        crc >>= 1;
      } // Just shift right
    }
  }
  return crc;
}

