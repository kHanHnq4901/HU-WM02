// controller.ts
import React, { useContext, useState } from 'react';
import { Alert } from 'react-native';
import { PropsStore, storeContext } from '../../store';

export type DataItem = {
  id: number;
  time: string;
  forward: number;
  reverse: number;
  flow: number;
};
export type HookState = {
  fromValue: string;
  toValue: string;
  dataList: DataItem[];
  isReading: boolean;
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
    dataList: [],
    isReading: false,
  });


  store = useContext(storeContext) as PropsStore;

  hookProps.state = state;
  hookProps.setState = setState;

  return hookProps;
};
/* ====== STATUS NAME ====== */
export const getEventNameFromId = (eventId: number): string => {
  const map: Record<number, string> = {
    9: "Sự kiện bắt đầu tháo rỡ",
    10: "Sự kiện kết thúc tháo rỡ",
    11: "Sự kiện bắt đầu từ trường xuất hiện",
    12: "Sự kiện kết thúc từ trường xuất hiện",
    13: "Bắt đầu lượng nước tăng đột biến",
    14: "Kết thúc lượng nước tăng đột biến",
    15: "Bắt đầu vượt lưu lượng định mức",
    16: "Kết thúc vượt lưu lượng định mức",
    17: "Bắt đầu chảy ngược",
    18: "Kết thúc chảy ngược",
    19: "Bắt đầu pin yếu",
    20: "Kết thúc pin yếu",
    21: "Bắt đầu rò rỉ",
    22: "Kết thúc rò rỉ",
    23: "Reset",
  };
  return map[eventId] ?? "Không rõ";
};


