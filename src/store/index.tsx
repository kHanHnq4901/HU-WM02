import React, { Dispatch, SetStateAction, useState } from 'react';
import { getDefaultStorageValue, PropsAppSetting } from '../service/storage';
import { Platform } from 'react-native';

export type TYPE_TOUCH_ID = 'FaceID' | 'TouchID' | 'NoSupport';

export type PropsInfoUser = {
  userId: string;
  userName: string;
  passWord: string;
  token: string;
};

type PropsState = {
  hhu: {
    characteristicUUID: string;
    serviceUUID: string;
    isConnected: boolean;
    connect: 'DISCONNECTED' | 'CONNECTED' | 'CONNECTING';
    idConnected: string;
    name: string;
    // 🔥 THÊM 2 TRƯỜNG LƯU TRỮ LỊCH SỬ KẾT NỐI
    idConnectLast: string;
    nameConnectLast: string; 
    
    version: string;
    shortVersion: string;
    rssi: number;
  };
  net: {
    netconnected: boolean;
    netReachAble: boolean;
  };
  app: {
    mdVersion: boolean;
    enableDebug: boolean;
  };
  alert: {
    show: boolean;
  };
  appSetting: PropsAppSetting;
  modal: {
    showInfo: boolean;
    showWriteRegister: boolean;
    modalAlert: {
      title: string;
      content: string;
      onDissmiss: (value?: any) => void;
      onOKPress: () => void;
    };
  };

  userRole: 'customer' | 'dvkh' | 'admin' | 'sx';
  typeTouchID: TYPE_TOUCH_ID;

  infoUser: {
    moreInfoUser: PropsInfoUser;
  };
  isCredential: boolean;
};

export type PropsStore = {
  state: PropsState;
  setState: Dispatch<React.SetStateAction<PropsState>>;
};

export const storeContext = React.createContext<PropsStore>(null);

export const StoreProvider = ({ children }) => {
  const [hook, setHook] = useState<PropsState>({
    hhu: {
      isConnected: false,
      connect: 'DISCONNECTED',
      idConnected: '',
      name: '',
      // 🔥 Khởi tạo giá trị rỗng cho 2 trường lịch sử
      idConnectLast: '', 
      nameConnectLast: '',

      version: '',
      shortVersion: '',
      rssi: 0,
      serviceUUID: '',          
      characteristicUUID: '',
    },
    net: {
      netReachAble: false,
      netconnected: false,
    },
    app: {
      enableDebug: false,
      mdVersion: false,
    },
    alert: {
      show: false,
    },
    appSetting: getDefaultStorageValue(),
    modal: {
      showInfo: false,
      showWriteRegister: false,
      modalAlert: {
        title: '',
        content: '',
        onDissmiss: (value?: any) => {},
        onOKPress: () => {},
      },
    },
    userRole: 'customer',
    typeTouchID: Platform.OS === 'ios' ? 'FaceID' : 'TouchID',
    infoUser: {
      moreInfoUser : {
        userName: '',
        passWord: '',
        token: '',
        userId: ''
      }
    },
    isCredential: false,
  });

  const initialalue: PropsStore = {
    state: hook,
    setState: setHook,
  };

  return (
    <storeContext.Provider value={initialalue}>
      {children}
    </storeContext.Provider>
  );
};