// controller.ts
import React, { useContext, useState } from 'react';
import { Alert } from 'react-native';
import { PropsStore, storeContext } from '../../store';

export type HookState = {
  // Các trường cũ
  chkModuleNo: boolean;
  inputModuleNo: string;
  chkMeterNo: boolean;
  inputMeterNo: string;
  chkRTC: boolean;
  inputRTC: string;
  chkFirmwareVer: boolean;
  inputFirmwareVer: string;
  chkBootVer: boolean;
  inputBootVer: string;
  chkImpData: boolean;
  inputImpData: string;
  chkExpData: boolean;
  inputExpData: string;
  chkIPPORT: boolean;
  inputIPPORT: string;
  chkLatchPeriod: boolean;
  inputLatchPeriod: string;
  chkPushPeriod: boolean;
  inputPushPeriod: string;
  chkPushMethod: boolean;
  inputPushMethod: string;
  chkQ3: boolean;
  inputQ3: string;
  chkLPR: boolean;
  inputLPR: string;
  chkModuleType: boolean;
  inputModuleType: string;
  chkPushTime1: boolean;
  inputPushTime1: string;
  chkPushTime2: boolean;
  inputPushTime2: string;
  chkTemp: boolean;
  inputTemp: string;
  chkVoltage: boolean;
  inputVoltage: string;
  chkRemainBattery: boolean;
  inputRemainBattery: string;
  chkResetCount: boolean;
  inputResetCount: string;
  chkLatDataIndex: boolean;
  inputLatDataIndex: string;
  chkPushDataIndex: boolean;
  inputPushDataIndex: string;
  chkLatchEventIndex: boolean;
  inputLatchEventIndex: string;
  chkPushEventIndex: boolean;
  inputPushEventIndex: string;
  chkVoltageThreshold: boolean;
  inputVoltageThreshold: string;
  chkEnableDevice: boolean;
  inputEnableDevice: string;
  chkBatteryCapacity: boolean;
  inputBatteryCapacity: string;
  chkEventConfig: boolean;
  inputEventConfig: string;
  chkPushEventMethod: boolean;
  inputPushEventMethod: string;
  chkRandomMin: boolean;
  inputRandomMin: string;
  chkTimeZone: boolean;
  inputTimeZone: string;
  chkQCCID: boolean;
  inputQCCID: string;
  
  // Các field khác
  radCustomTime: boolean;
  chkClearData: boolean;
  chkPushData:boolean;
  chkResetModule:boolean;
  chkRTCNow: boolean;
  inputTotalData : string;
};

export type HookProps = {
  state: HookState;
  setState: React.Dispatch<React.SetStateAction<HookState>>;
};

export const hookProps = {} as HookProps;
export let store = {} as PropsStore;

export const GetHookProps = (): HookProps => {

  const [state, setState] = useState<HookState>({
    // Các trường cũ
    inputTotalData :'',
    chkRTCNow: false,
    chkModuleNo: false,
    inputModuleNo: '',
    chkMeterNo: false,
    inputMeterNo: '',
    chkRTC: false,
    inputRTC: '',
    chkFirmwareVer: false,
    inputFirmwareVer: '',
    chkBootVer: false,
    inputBootVer: '',
    chkImpData: false,
    inputImpData: '',
    chkExpData: false,
    inputExpData: '',
    chkIPPORT: false,
    inputIPPORT: '',
    chkLatchPeriod: false,
    inputLatchPeriod: '',
    chkPushPeriod: false,
    inputPushPeriod: '',
    chkPushMethod: false,
    inputPushMethod: '',
    chkQ3: false,
    inputQ3: '',
    chkLPR: false,
    inputLPR: '',
    chkModuleType: false,
    inputModuleType: '',
    chkPushTime1: false,
    inputPushTime1: '',
    chkPushTime2: false,
    inputPushTime2: '',
    chkTemp: false,
    inputTemp: '',
    chkVoltage: false,
    inputVoltage: '',
    chkRemainBattery: false,
    inputRemainBattery: '',
    chkResetCount: false,
    inputResetCount: '',
    chkLatDataIndex: false,
    inputLatDataIndex: '',
    chkPushDataIndex: false,
    inputPushDataIndex: '',
    chkLatchEventIndex: false,
    inputLatchEventIndex: '',
    chkPushEventIndex: false,
    inputPushEventIndex: '',
    chkVoltageThreshold: false,
    inputVoltageThreshold: '',
    chkEnableDevice: false,
    inputEnableDevice: '',
    chkBatteryCapacity: false,
    inputBatteryCapacity: '',
    chkEventConfig: false,
    inputEventConfig: '',
    chkPushEventMethod: false,
    inputPushEventMethod: '',
    chkRandomMin: false,
    inputRandomMin: '',
    chkTimeZone: false,
    inputTimeZone: '',
    chkQCCID: false,
    inputQCCID: '',
    
    // Các field khác
    radCustomTime: false,
    chkClearData:  false,
    chkPushData: false,
    chkResetModule: false,
  });

  store = useContext(storeContext) as PropsStore;

  hookProps.state = state;
  hookProps.setState = setState;

  return hookProps;
};
export function formatRTC(date: Date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');

  const dd = String(date.getDate()).padStart(2, '0');
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();

  return `${hh}:${mm}:${ss}, ${dd}/${MM}/${yyyy}`;
}
