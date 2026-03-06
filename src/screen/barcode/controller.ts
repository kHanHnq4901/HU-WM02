import { useContext, useState } from 'react';
import { Alert } from 'react-native';
// Nếu bạn có dùng store chung của app thì import vào, không thì có thể bỏ qua
// import { PropsStore, storeContext } from '../../store'; 

// --- TYPES ---
export type HookState = {
  isActive: boolean; // Trạng thái camera đang quét hay tạm dừng
  scannedValue: string; // Lưu lại mã vừa quét được (nếu cần hiển thị lên UI)
};

export type HookProps = {
  state: HookState;
  setState: React.Dispatch<React.SetStateAction<HookState>>;
};

// --- GLOBAL VARIABLES ---
export const hookProps = {} as HookProps;
// export let store = {} as PropsStore;

// --- INITIAL STATE ---
export const GetHookProps = (): HookProps => {
  const [state, setState] = useState<HookState>({
    isActive: true,
    scannedValue: '',
  });

  // store = useContext(storeContext) as PropsStore;

  hookProps.state = state;
  hookProps.setState = setState;

  return hookProps;
};

// Cần truyền navigation và route từ index.tsx vào hàm này