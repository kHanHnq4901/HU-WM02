// controller.ts
import React, { useContext, useState } from 'react';
import { PropsStore, storeContext } from '../../store';

export type EventItem = {
  id: number;
  time: string;
  event: string;
};

export type HookState = {
  fromValue: string;
  toValue: string;
  eventList: EventItem[];

  currentVersion: string;
  remoteVersion: string;
  loadingCurrentVersion: boolean;
  loadingRemoteVersion: boolean;

  // ===== OTA =====
  otaProgress: number;
  otaSent: number;
  otaTotal: number;
  otaRunning: boolean;
};


export type HookProps = {
  state: HookState;
  setState: React.Dispatch<React.SetStateAction<HookState>>;
};

export const hookProps = {} as HookProps;
export let store = {} as PropsStore;

export const GetHookProps = (): HookProps => {

  const [state, setState] = useState<HookState>({
    fromValue: '1',
    toValue: '10',
    eventList: [],

    currentVersion: '',
    remoteVersion: '',
    loadingCurrentVersion: false,
    loadingRemoteVersion: false,

    otaProgress: 0,
    otaSent: 0,
    otaTotal: 0,
    otaRunning: false,
  });


  store = useContext(storeContext) as PropsStore;

  hookProps.state = state;
  hookProps.setState = setState;

  return hookProps;
};
