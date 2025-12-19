import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEY_USER as KEY } from './index';

const TAG = 'USER Storage';

export type PropsUserStorage = {
  userAccount: string;
  pwd: string;
  code: string;
  unitCode: string;
  teamCode: string;
};

function getDefaultUser(): PropsUserStorage {
  const defaultValue: PropsUserStorage = {
    userAccount: '',
    pwd: '',
    code: '',
    unitCode: '',
    teamCode: '',
  };

  return defaultValue;
}

export async function getUserStorage(): Promise<PropsUserStorage> {
  try {
    const strResult = await AsyncStorage.getItem(KEY);

    if (strResult) {
      const user: PropsUserStorage = JSON.parse(strResult);

      return user;
    } else {
      return getDefaultUser();
    }
  } catch (err: any) {
    console.log(TAG, 'Lỗi:', err.message);
  }
  return getDefaultUser();
}

export async function saveUserStorage(user: PropsUserStorage): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(user));
  } catch (err: any) {
    console.log(TAG, 'Lỗi:', err.message);
  }
  return;
}
