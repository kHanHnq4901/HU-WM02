import { Buffer } from 'buffer';
import { hookProps, setStatus, store } from '../../screen/boardBLE/controller';
import { int32_t, int64_t, uint32_t, uint8_t } from '../hhu/define';
import {
  analysisRx,
  hhuFunc_HeaderProps,
  hhuFunc_Send,
  ResponseRxProps,
  TYPE_HHU_CMD,
} from '../hhu/hhuFunc';
import { sendHHU } from '../../util/ble';
import { crc16 } from '../../util/crc16';
import { handleHuBootloaderUpdateResponse } from '../../screen/boardBLE/handleButton';
import { BootloaderCommandCode } from '../hhu/aps/hhuAps';
import BleManager from 'react-native-ble-manager';
const TAG = 'bootloader:';

type char = string;
function ASCIItoHEX(ch: char) {
  if (ch >= '0' && ch <= '9') {
    return 0xff & ((0xff & ch.charCodeAt(0)) - 0x30);
  }
  if (ch >= 'A' && ch <= 'F') {
    return 0xff & ((0xff & ch.charCodeAt(0)) - 0x41 + 10);
  }
  if (ch >= 'a' && ch <= 'f') {
    return 0xff & ((0xff & ch.charCodeAt(0)) - 0x61 + 10);
  }
  return 0;
}

const bootVariable = {
  Flash: Buffer.alloc(0x40000),
  baseAddr: 0,
  currentPage: 0,
  pageSize: 256,
  BootSizeInt: 0,
  flashSize: 0,
  retries: 0,
  BytePtr: 0,
};

export const SendMessage = (msg: string) => {
  hookProps.setState(state => {
    state.status = msg;
    return { ...state };
  });
};

export const SetProgressBar = (value: number) => {
  hookProps.setState(state => {
    state.progressUpdate = value;
    return { ...state };
  });
};

enum Record_Type {
  DATA = 0,
  END_FILE = 1,
  EXTEND_SEGMENT = 2,
  BASE_ADDR = 4,
  START_ADDR_8086 = 5,
}
export function FillFlash(stringFirmware: string): boolean {
  bootVariable.flashSize = 0;
  bootVariable.currentPage = 0;

  let indexBuffFlash = 0;
  let currentLine = 0;
  let baseAddr = 0;

  const arrStr = stringFirmware.split(/\r?\n/);

  for (let str of arrStr) {
    if (!str || str[0] !== ":") {
      currentLine++;
      continue;
    }

    const numByteDataPerLine = parseInt(str.substr(1, 2), 16);
    const highAddr = parseInt(str.substr(3, 2), 16);
    const lowAddr = parseInt(str.substr(5, 2), 16);
    const recordType = parseInt(str.substr(7, 2), 16);

    let sum = numByteDataPerLine + highAddr + lowAddr + recordType;
    let index = 9; // bắt đầu data sau recordType

    switch (recordType) {
      case Record_Type.DATA: {
        bootVariable.flashSize += numByteDataPerLine;
        for (let i = 0; i < numByteDataPerLine; i++) {
          const byte = parseInt(str.substr(index, 2), 16);
          index += 2;
          bootVariable.Flash[indexBuffFlash++] = byte;
          sum += byte;
        }
        break;
      }

      case Record_Type.END_FILE: {
        // pad đến hết page
        bootVariable.Flash.fill(
          0xff,
          bootVariable.flashSize,
          (Math.floor(bootVariable.flashSize / bootVariable.pageSize) + 1) *
            bootVariable.pageSize
        );
        SendMessage(
          "Kích thước " + (bootVariable.flashSize / 1024).toFixed(1) + "kb"
        );
        console.log(
          "Flash sample (hex):",
          Array.from(bootVariable.Flash.slice(0, 32))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(" ")
        );
        return true;
      }

      case Record_Type.EXTEND_SEGMENT: {
        const high = parseInt(str.substr(index, 2), 16);
        const low = parseInt(str.substr(index + 2, 2), 16);
        index += 4;
        sum += high + low;
        baseAddr = ((high << 8) + low) << 4;
        break;
      }

      case Record_Type.BASE_ADDR: {
        const high = parseInt(str.substr(index, 2), 16);
        const low = parseInt(str.substr(index + 2, 2), 16);
        index += 4;
        sum += high + low;
        baseAddr = ((high << 8) + low) << 16;
        bootVariable.baseAddr = baseAddr;
        break;
      }
    }

    // checksum
    const checkSum = parseInt(str.substr(index, 2), 16);
    sum = (0x100 - (sum & 0xff)) & 0xff;
    if (checkSum !== sum) {
      SendMessage("File Firmware lỗi tại dòng " + currentLine);
      return false;
    }

    currentLine++;
  }

  return false; // nếu không gặp END_FILE
}


