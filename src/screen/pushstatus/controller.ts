import React, { useContext, useState } from 'react';
import { PropsStore, storeContext } from '../../store';

export type PushStatusItem = {
  id: number;
  time: string;
  status: string;
};

export type HookState = {
  fromValue: string;
  toValue: string;
  statusList: PushStatusItem[];
  isReading: boolean;
  progress: { done: number; total: number } | null;
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
    statusList: [],
    isReading: false,
    progress: null,
  });

  store = useContext(storeContext) as PropsStore;
  hookProps.state = state;
  hookProps.setState = setState;

  return hookProps;
};

export const getPushStatusNameFromId = (statusId: number): string => {
  const map: Record<number, string> = {
    0: 'Thành công',
    1: 'Không có IP',
    2: 'Pin yếu',
    3: 'Kết nối TCP/IP thất bại',
    4: 'Gửi thất bại',
    5: 'Không nhận được phản hồi',
  };
  return map[statusId] ?? 'Không rõ';
};
