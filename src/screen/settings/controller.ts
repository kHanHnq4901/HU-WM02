// controller.ts
import React, { useContext, useState } from 'react';
import { Alert } from 'react-native';
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
  });

  store = useContext(storeContext) as PropsStore;

  hookProps.state = state;
  hookProps.setState = setState;

  return hookProps;
};
