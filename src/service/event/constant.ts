import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

const pathSaveData = RNFS.DocumentDirectoryPath.substring(
  RNFS.DocumentDirectoryPath.indexOf('com'),
  RNFS.DocumentDirectoryPath.lastIndexOf('/'),
);

export const RECEIVE_FILE_XML = pathSaveData + 'RECEIVE_FILE_XML';
export const RECEIVE_FILE_CSDL = pathSaveData + 'RECEIVE_FILE_CSDL';
export const UPDATE_FW_HHU = pathSaveData + 'UPDATE_FW';

export const PACKAGE_NAME =
  Platform.OS === 'android' ? pathSaveData : 'com.gelex.emic.hu-01-esoft';
