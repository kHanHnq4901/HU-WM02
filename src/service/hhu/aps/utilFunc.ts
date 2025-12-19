import { Buffer } from 'buffer';
import { CommandRF, PropsMeterSpecies } from '../defineEM';
import { HhuObj } from '../hhuFunc';
import {
  PropsResponse,
  arrTitleCodePower,
  arrTitleUI3phase,
  arrTitleCodeMaxDemand,
  PropsLabel,
} from './hhuAps';
import { get4byteDataDLMS, getTimeDLMS, getTimeIEC } from './util';
export const getTimeoutByLabelMeter = (
  labelMeter: string,
  isPmax?: boolean,
): number => {
  let timeout = 0;

  if (isPmax === true) {
    if (labelMeter === 'CE-14') {
      timeout = 14000;
    } else if (labelMeter === 'Elster') {
      timeout = 20000;
    } else {
      timeout = 12000;
    }
    return timeout;
  }

  const label = labelMeter as keyof PropsMeterSpecies;

  switch (label) {
    case 'CE-18G':
      timeout = 5000;
      break;
    case 'CE-18':
      timeout = 5000;
      break;
    case 'CE-14':
      timeout = 7000;
      break;
    case 'ME-40':
      timeout = 7000;
      break;
    case 'ME-41':
      timeout = 7000;
      break;
    case 'ME-42':
      timeout = 7000;
      break;
    case 'Elster':
      timeout = 10000;
      break;
    case 'Repeater':
      timeout = 7000;
      break;
    case 'Dcu':
      timeout = 8000;
      break;
    case 'Broadcast_Meter':
      timeout = 30000;
      break;
    default:
      timeout = 6000;
  }
  return timeout + 1000;
};

export const getTimeoutInAps = (
  command: number,
  label: keyof PropsMeterSpecies,
): number => {
  let u32Timeout: number;
  switch (command) {
    case CommandRF.INSTANT_POWER:
    case CommandRF.POWER_0H:
    case CommandRF.UI_PF:
    case CommandRF.READ_CE18_BY_REPEATER:
      u32Timeout = getTimeoutByLabelMeter(label);
      break;
    case CommandRF.PMAX_NEAREST:
      u32Timeout = getTimeoutByLabelMeter(label, true);
      break;
    case CommandRF.TU_TI:
      u32Timeout = getTimeoutByLabelMeter(label);
      break;
    case CommandRF.INIT_RF_MODULE:
    case CommandRF.SEARCH_METER:
    case CommandRF.RESET_RF_MODULE:
      u32Timeout = 5000;
      break;
    case CommandRF.RESET_RF_MODULE:
      u32Timeout = 5000;
      break;
    case CommandRF.FIND_BROADCAST:
      u32Timeout = getTimeoutByLabelMeter(label);
      break;
    default:
      u32Timeout = 6000;
  }
  return u32Timeout;
};

export const getUnitByLabel = (label: PropsLabel) => {
  let unit = '';

  switch (label) {
    case '180':
    case '181':
    case '182':
    case '183':
    case '280':
    case '281':
    case '282':
    case '283':
      unit = ' (kWh)';
      break;
    case '380':
    case '480':
      unit = ' (kvarh)';
      break;
    case '1601':
    case '1611':
    case '1621':
    case '1631':
    case '2601':
    case '2611':
    case '2621':
    case '2631':
      unit = ' (kW)';
      break;
    case 'Thời điểm':
      break;
    case 'U':
    case 'Ua':
    case 'Ub':
    case 'Uc':
      unit = ' (V)';
      break;
    case 'I':
    case 'Ia':
    case 'Ib':
    case 'Ic':
      unit = ' (A)';
      break;
    case 'Rssi':
    case 'Rssi 18G':
      unit = ' (dBm)';
  }
  return unit;
};

export const crcAps = (buffer: Buffer, offset: number, length: number) => {
  let u8Crc = 0;
  for (let i = offset; i < offset + length; i++) {
    u8Crc = 0xff & (u8Crc ^ buffer[i]);
  }
  return u8Crc;
};

export const commonGetInstantPowerManyPriceDLMS = (
  apsResponse: PropsResponse,
  buffer: Buffer,
  offset: number,
  factor?: 1 | 10 | 100 | 1000,
): number => {
  let index = offset;
  for (let k = 0; k < 10; k++) {
    const strPower = get4byteDataDLMS(HhuObj.buffRx, index, factor ?? 1000);
    index += 4;
    apsResponse.obj.Power?.push({
      [arrTitleCodePower[k]]: strPower,
    });
  }
  apsResponse.bSucceed = true;
  return index;
};
export const commonGetInstantPowerManyPriceIEC = (
  apsResponse: PropsResponse,
  arr: string[],
) => {
  for (let k = 0; k < 10; k++) {
    apsResponse.obj.Power?.push({
      [arrTitleCodePower[k]]: arr[k],
    });
  }
  apsResponse.bSucceed = true;
};

export const commonGetPower0hManyPriceDLMS = (
  apsResponse: PropsResponse,
  buffer: Buffer,
  offset: number,
): number => {
  let index = offset;
  apsResponse.obj['Ngày chốt'] = getTimeDLMS(HhuObj.buffRx, index);
  index += 6;
  for (let k = 0; k < 10; k++) {
    const strPower = get4byteDataDLMS(HhuObj.buffRx, index, 1000);
    index += 4;
    apsResponse.obj.Power?.push({
      [arrTitleCodePower[k]]: strPower,
    });
  }
  apsResponse.bSucceed = true;
  return index;
};
export const commonGetPower0hManyPriceIEC = (
  apsResponse: PropsResponse,
  arr: string[],
) => {
  let index = 0;
  apsResponse.obj['Ngày chốt'] = getTimeIEC(arr[index]);
  index++;
  for (let k = 0; k < 10; k++) {
    apsResponse.obj.Power?.push({
      [arrTitleCodePower[k]]: arr[k + index],
    });
  }
  apsResponse.bSucceed = true;
};
export const commonGetUIcosPhi3phaseDLMS = (
  apsResponse: PropsResponse,
  buffer: Buffer,
  offset: number,
): number => {
  let index = offset;
  for (let k = 0; k < arrTitleUI3phase.length; k++) {
    apsResponse.obj[arrTitleUI3phase[k]] = get4byteDataDLMS(
      HhuObj.buffRx,
      index,
    );
    index += 4;
  }
  apsResponse.obj.cosφ = get4byteDataDLMS(HhuObj.buffRx, index, 1000);
  index += 4;

  apsResponse.bSucceed = true;
  return index;
};
export const commonGetUIcosPhi3phaseIEC = (
  apsResponse: PropsResponse,
  arrReg: string[],
) => {
  let k;
  for (k = 0; k < arrTitleUI3phase.length; k++) {
    apsResponse.obj[arrTitleUI3phase[k]] = arrReg[k];
  }
  apsResponse.obj.cosφ = arrReg[k];

  apsResponse.bSucceed = true;
};
export const commonGetUIcosPhi1phaseDLMS = (
  apsResponse: PropsResponse,
  buffer: Buffer,
  offset: number,
): number => {
  let index = offset;
  apsResponse.obj.U = get4byteDataDLMS(buffer, index);
  index += 4;
  apsResponse.obj.I = get4byteDataDLMS(buffer, index);
  index += 4;
  apsResponse.obj.cosφ = get4byteDataDLMS(buffer, index, 1000);
  // for (let i = 0; i < 4; i++) {
  //   console.log('-', buffer[index + i].toString(16));
  // }
  index += 4;
  apsResponse.bSucceed = true;

  return index;
};
export const commonGetUIcosPhi1phaseIEC = (
  apsResponse: PropsResponse,
  arrReg: string[],
) => {
  apsResponse.obj.U = arrReg[0];

  apsResponse.obj.I = arrReg[1];

  apsResponse.obj.cosφ = arrReg[2];

  apsResponse.bSucceed = true;
};
export const commonGetPmaxDLMS = (
  apsResponse: PropsResponse,
  buffer: Buffer,
  offset: number,
): number => {
  let index = offset;
  apsResponse.obj['Ngày chốt'] = getTimeDLMS(buffer, index);
  index += 6;
  for (let i = 0; i < arrTitleCodeMaxDemand.length; i++) {
    let data = get4byteDataDLMS(buffer, index, 1000);
    index += 4;
    let strDate = getTimeDLMS(buffer, index);
    index += 6;
    if (strDate === null) {
      continue;
    }
    apsResponse.obj.MaxDemand?.push({
      [arrTitleCodeMaxDemand[i]]: data,
      'Thời điểm': strDate,
    });
  }

  apsResponse.bSucceed = true;
  return index;
};
export const commonGetPmaxIEC = (
  apsResponse: PropsResponse,
  arrReg: string[],
) => {
  let index = 0;
  apsResponse.obj['Ngày chốt'] = arrReg[index];
  index++;
  for (let i = 0; i < arrTitleCodeMaxDemand.length; i++) {
    let data = arrReg[index];
    index += 1;
    let strDate = getTimeIEC(arrReg[index]);
    index += 1;
    if (strDate === null) {
      continue;
    }
    apsResponse.obj.MaxDemand?.push({
      [arrTitleCodeMaxDemand[i]]: data,
      'Thời điểm': strDate,
    });
  }

  apsResponse.bSucceed = true;
};
