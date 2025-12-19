import { Buffer } from 'buffer';
import { sleep } from '../../../util';
import { uint8_t } from '../define';
import {
  CommandRF,
  getLabelAndIsManyPriceByCodeMeter,
  meterSpecies,
  VALUE_TYPE_METER,
  VersionMeter,
} from '../defineEM';
import { DONT_CARE, PropsApsReadRf, PropsResponse, _readRf } from './hhuAps';
import { Aps_HeaderProps, Rtc_TimeProps } from './radioProtocol';
import { ConvertBCDToByte } from './util';
import { getTimeoutInAps } from './utilFunc';

type Props = {
  seri: string;
  codeMeterInDB: string;
  rfCode: string;
  is0h: boolean;
  dateLatch: Date;
  numRetries: number;
  hasRequestPmax: boolean;
  setStatus?: (status: string) => void;
};

export const apsReadRfGCS = async (propsGCS: Props) => {
  let response: PropsResponse = {
    bSucceed: false,
    strMessage: '',
    obj: {},
  };
  console.log('propsGCS:', propsGCS);

  propsGCS.numRetries = propsGCS.numRetries <= 0 ? 1 : propsGCS.numRetries;

  const labelAndIsManyPrice = getLabelAndIsManyPriceByCodeMeter(
    propsGCS.codeMeterInDB,
    propsGCS.seri,
  );

  let is0h = propsGCS.is0h;

  // if (store?.state.userRole !== 'admin' && store?.state.userRole !== 'dvkh') {
  if (true) {
    if (labelAndIsManyPrice.isManyPrice === false) {
      is0h = false;
    }
  }

  const props = {
    seri: propsGCS.seri,
    labelMeterSpecies: labelAndIsManyPrice.label,
    typeMeter: propsGCS.rfCode === VersionMeter.IEC ? 'IEC' : 'DLMS',
    is1Ch: propsGCS.rfCode === VersionMeter.DLMS_ONE_CHANEL ? true : false,
    is0h: is0h,
    date: propsGCS.dateLatch,
  } as PropsApsReadRf;

  if (labelAndIsManyPrice.label === 'CE-18G') {
    props.typeMeter = 'DLMS';
    props.is1Ch = false;
  }

  console.log('propsReadRf:', props);

  let command: uint8_t;
  const seri: string = props.seri.padStart(12, '0');
  const valueMeterSpecies: uint8_t = meterSpecies[props.labelMeterSpecies]
    ?.value as unknown as number;
  if (!valueMeterSpecies) {
    response.bSucceed = false;
    response.strMessage = 'Chưa hỗ trợ đồng hồ này';
    return response;
  }
  const typeMeter: uint8_t =
    props.typeMeter === 'IEC'
      ? VALUE_TYPE_METER.IEC
      : props.is1Ch
      ? VALUE_TYPE_METER.DLMS_1C
      : VALUE_TYPE_METER.DLMS_16C;
  if (valueMeterSpecies === meterSpecies.Repeater.value) {
    command = CommandRF.READ_CE18_BY_REPEATER;
  } else {
    command =
      props.command === CommandRF.INSTANT_POWER
        ? props.is0h
          ? CommandRF.POWER_0H
          : props.command
        : props.command;
  }

  const au8Serial = Buffer.alloc(6);
  for (let i = 0; i < 6; i++) {
    au8Serial[i] = ConvertBCDToByte(seri[i * 2] + seri[i * 2 + 1]);
  }
  let time: Rtc_TimeProps = {
    u8Year: props.date.getFullYear() - 2000,
    u8Month: props.date.getMonth() + 1,
    u8Date: props.date.getDate(),
    u8Day: props.date.getDay(),
    u8Hour: props.date.getHours(),
    u8Minute: props.date.getMinutes(),
    u8Second: props.date.getSeconds(),
  };

  const header: Aps_HeaderProps = {
    au8Seri: au8Serial,
    u8Command: command,
    u16Length: DONT_CARE,
    u8MeterSpecies: valueMeterSpecies,
    u8Reserve: DONT_CARE,
    u8Rssi: DONT_CARE,
    u8TypeMeter: typeMeter,
    u8StartByte: DONT_CARE,
  };

  let u32Timeout: number;

  let responsePower = {} as PropsResponse;
  let responsePmax = {} as PropsResponse;

  if (valueMeterSpecies === meterSpecies['ME-41'].value) {
    if (props.typeMeter === 'DLMS') {
      if (true) {
        // read TU TI
        header.u8Command = CommandRF.TU_TI;
        u32Timeout = getTimeoutInAps(header.u8Command, props.labelMeterSpecies);
        let responseTUTI = {} as PropsResponse;
        for (let i = 0; i < propsGCS.numRetries; i++) {
          responseTUTI = await _readRf(props.seri, header, u32Timeout, time);
          if (responseTUTI.bSucceed === true) {
            console.log('Read TU TI succeed');
            break;
          } else {
            console.log('Read TU TI failed');
            if (i !== propsGCS.numRetries - 1) {
              console.log('Reties..');
              if (propsGCS.setStatus) {
                propsGCS.setStatus('Thử lại lần ' + (i + 1) + '...');
              }
            } else {
              response.bSucceed = false;
              response.strMessage = 'Đọc TU TI thất bại';
              return response;
            }
          }
        }

        let TU: number;
        let TI: number;
        await sleep(500);
        console.log('TU TI:', responseTUTI.obj);

        try {
          const arrTU = responseTUTI.obj.TU?.split('/') ?? [];
          const arrTI = responseTUTI.obj.TI?.split('/') ?? [];

          if (arrTU.length !== 2 || arrTI.length !== 2) {
            response.bSucceed = false;
            response.strMessage = 'Err TU_TI';
            return response;
          }
          TU = Number(arrTU[0]) / Number(arrTU[1]); //Number(response.obj.TU);
          TI = Number(arrTI[0]) / Number(arrTI[1]); //Number(response.obj.TI);
        } catch (err: any) {
          response.bSucceed = false;
          response.strMessage = 'Err TU_TI';
          return response;
        }
        // then read real command;

        header.u8Command = props.is0h
          ? CommandRF.POWER_0H
          : CommandRF.INSTANT_POWER;
        u32Timeout = getTimeoutInAps(header.u8Command, props.labelMeterSpecies);
        for (let i = 0; i < propsGCS.numRetries; i++) {
          await sleep(300);
          responsePower = await _readRf(props.seri, header, u32Timeout, time);
          if (responsePower.bSucceed === true) {
            console.log('Read Power succeed');
            break;
          } else {
            console.log('Điện năng thất bại');
            if (i !== propsGCS.numRetries - 1) {
              console.log('Reties..');
              if (propsGCS.setStatus) {
                propsGCS.setStatus('Thử lại lần ' + (i + 1) + '...');
              }
            } else {
              response.bSucceed = false;
              response.strMessage = 'Điện năng thất bại';
              return response;
            }
          }
        }

        for (let item of responsePower.obj.Power ?? []) {
          for (let obj in item) {
            item[obj] = (Number(item[obj]) * TU * TI).toFixed(3);
          }
        }
        if (propsGCS.hasRequestPmax === true) {
          header.u8Command = CommandRF.PMAX_NEAREST;
          u32Timeout = getTimeoutInAps(
            header.u8Command,
            props.labelMeterSpecies,
          );
          for (let i = 0; i < propsGCS.numRetries; i++) {
            await sleep(300);
            responsePmax = await _readRf(props.seri, header, u32Timeout, time);
            if (responsePmax.bSucceed === true) {
              console.log('Read Pmax succeed');
              break;
            } else {
              console.log('Pmax thất bại');
              if (i !== propsGCS.numRetries - 1) {
                console.log('Retries..');
                if (propsGCS.setStatus) {
                  propsGCS.setStatus('Thử lại lần ' + (i + 1) + '...');
                }
              } else {
                response.bSucceed = false;
                response.strMessage = 'Pmax thất bại';
                return response;
              }
            }
          }
          for (let item of responsePmax.obj.MaxDemand ?? []) {
            for (let obj in item) {
              if (obj !== 'Thời điểm') {
                item[obj] = (Number(item[obj]) * TU * TI).toFixed(3);
              }
            }
          }
        }

        response.bSucceed = true;
        response.obj.Serial = props.seri;

        response.obj.Power = responsePower.obj.Power;
        response.obj['Ngày chốt'] = responsePower.obj['Ngày chốt'];

        if (propsGCS.hasRequestPmax === true) {
          response.obj.MaxDemand = responsePmax.obj.MaxDemand;

          console.log('responsePmax.obj:', responsePmax.obj);
        }

        return response;
      }
    }
  }

  // other else , not me41 dlms

  header.u8Command = props.is0h ? CommandRF.POWER_0H : CommandRF.INSTANT_POWER;
  u32Timeout = getTimeoutInAps(header.u8Command, props.labelMeterSpecies);
  for (let i = 0; i < propsGCS.numRetries; i++) {
    responsePower = await _readRf(props.seri, header, u32Timeout, time);
    if (responsePower.bSucceed === true) {
      console.log('Read Power succeed');
      break;
    } else {
      console.log('Điện năng thất bại');
      if (i !== propsGCS.numRetries - 1) {
        console.log('Reties..');
        if (propsGCS.setStatus) {
          propsGCS.setStatus('Thử lại lần ' + (i + 1) + '...');
        }
      } else {
        response.bSucceed = false;
        response.strMessage = 'Điện năng thất bại';
        return response;
      }
    }
  }
  if (labelAndIsManyPrice.isManyPrice === true) {
    if (propsGCS.hasRequestPmax === true) {
      await sleep(300);
      header.u8Command = CommandRF.PMAX_NEAREST;
      u32Timeout = getTimeoutInAps(header.u8Command, props.labelMeterSpecies);
      for (let i = 0; i < propsGCS.numRetries; i++) {
        responsePmax = await _readRf(props.seri, header, u32Timeout, time);
        if (responsePmax.bSucceed === true) {
          console.log('Read Pmax succeed');
          break;
        } else {
          console.log('Pmax thất bại');
          if (i !== propsGCS.numRetries - 1) {
            console.log('Reties..');
            if (propsGCS.setStatus) {
              propsGCS.setStatus('Thử lại lần ' + (i + 1) + '...');
            }
          } else {
            response.bSucceed = false;
            response.strMessage = 'Pmax thất bại';
            return response;
          }
        }
      }
      response.obj.MaxDemand = responsePmax.obj.MaxDemand;
      response.obj['Ngày chốt'] = responsePower.obj['Ngày chốt'];
    }
  }
  //console.log('here');

  response.bSucceed = true;
  response.obj.Serial = props.seri;

  response.obj.Power = responsePower.obj.Power;

  return response;
};
