import { useNavigation, NavigationProp } from '@react-navigation/native';
import React, { useState } from 'react';
import { PropsStore, storeContext } from '../../store';

// 1. ĐỊNH NGHĨA DANH SÁCH MÀN HÌNH TỪ APPNAVIGATOR
export type RootStackParamList = {
  MainTabs: undefined;
  BLEScreen: undefined;
  BarcodeScreen: { onScanSuccess: (value: string) => void } | undefined; // Nhận params
};

// 2. Tạo Type cho đối tượng Navigation dựa trên danh sách trên
export type AppNavigationProp = NavigationProp<RootStackParamList>;

export type HookState = {};

export type HookProps = {
  state: HookState;
  setState: React.Dispatch<React.SetStateAction<HookState>>;
};

const TAG = ' Controller: ';

export const hookProps = {} as HookProps;
export let store = {} as PropsStore;

// 3. SỬA QUAN TRỌNG: Gán kiểu AppNavigationProp cho biến navigation toàn cục
export let navigation = {} as AppNavigationProp; 

export const GetHookProps = (): HookProps => {
  const [state, setState] = useState<HookState>({});
  
  hookProps.state = state;
  hookProps.setState = setState;
  
  store = React.useContext(storeContext) as PropsStore;
  
  // 4. SỬA QUAN TRỌNG: Ép kiểu cho useNavigation
  navigation = useNavigation<AppNavigationProp>();

  return hookProps;
};

export const onInit = async () => {};

export const onDeInit = () => {};