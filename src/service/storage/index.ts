import AsyncStorage from '@react-native-async-storage/async-storage';
import { PATH_EXECUTE_CSDL, PATH_EXPORT_XML } from '../../shared/path';

const KEY_SETTING = 'APP_SETTING';
const TAG = 'STORAGE SERVICE:';
export const KEY_USER = 'KEY_USER';
export const KEY_DLHN = 'KEY_DLHN';
export const KEY_MA_CONG_TO = 'KEY_MA_CONG_TO';

export type PropsSettingAndAlarm = {
  distance: string;
  zoomLevel: string;
  vehicle : "driving" | "walking" | "motorcycling" | "truck";
  typeAlarm: 'Value' | 'Percent';
  upperThresholdPercent: number;
  lowerThresholdPercent: number;
  upperThresholdValue: number;
  lowerThresholdValue: number;
  retryCount : number;
  typeWM : 'wm02'|'wm02a';
};

export type PropsAppSetting = {
  password: string;
  setting: PropsSettingAndAlarm;
  numRetriesRead: string;
  CMISPath: string;
  showResultOKInWriteData: boolean;
  timeSynchronization : string;
  server: {
    host: string;
    port: string;
  };
  hhu: {
    host: string;
    port: string;
    enableReadNotGelex: boolean;
    isOnlyGetIntegers: boolean;
  };
};

export const getDefaultStorageValue = (): PropsAppSetting => ({
  password: '',
  setting: {
    distance: '500',
    zoomLevel: '15',
    vehicle : 'motorcycling',
    typeAlarm: 'Value',
    upperThresholdPercent: 500,
    lowerThresholdPercent: 0,
    upperThresholdValue: 500,
    lowerThresholdValue: 0,
    retryCount : 1,
    typeWM : 'wm02',
  },
  numRetriesRead: '1',
  CMISPath: '',
  showResultOKInWriteData: false,
  timeSynchronization : '',
  server: {
    host: 'kh.emic.com.vn',
    port: '80',
  },
  hhu: {
    host: '14.225.244.63',
    port: '5050',
    enableReadNotGelex: false,
    isOnlyGetIntegers: true,
  },
});

/**
 * Hợp nhất object với giá trị mặc định, tránh field bị undefined.
 */
const mergeWithDefault = (stored: Partial<PropsAppSetting>): PropsAppSetting => {
  const defaults = getDefaultStorageValue();
  return {
    ...defaults,
    ...stored,
    setting: {
      ...defaults.setting,
      ...(stored.setting ?? {}),
    },
    server: {
      ...defaults.server,
      ...(stored.server ?? {}),
    },
    hhu: {
      ...defaults.hhu,
      ...(stored.hhu ?? {}),
    },
  };
};

export const updateValueAppSettingFromNvm = async (): Promise<PropsAppSetting> => {
  try {
    const result = await AsyncStorage.getItem(KEY_SETTING);
    if (result) {
      const storageVar = JSON.parse(result) as Partial<PropsAppSetting>;
      return mergeWithDefault(storageVar);
    } else {
      console.log('meet here 1 - no saved data, using defaults');
      return getDefaultStorageValue();
    }
  } catch (err: any) {
    console.log(TAG, err.message);
    console.log('meet here 2 - error reading storage, using defaults');
    return getDefaultStorageValue();
  }
};

export const saveValueAppSettingToNvm = async (value: PropsAppSetting) => {
  try {
    console.log('value to asyncstorage:', value);
    await AsyncStorage.setItem(KEY_SETTING, JSON.stringify(value));
  } catch (err: any) {
    console.log(TAG, err.message);
  }
};
