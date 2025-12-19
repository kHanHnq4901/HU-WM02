import RNFS from 'react-native-fs';
import { getFilExtension, showToast, toLocaleString } from '../util';
import { PATH_EXPORT_LOG } from './path';
import { toLocaleDateString } from '../util/index';

const TAG = 'FILE: ';

export type PropsFileInfo = {
  checked: boolean;
  name: string;
  time: number;
  path: string;
  date: string;
};

export const deleteFile = async (filePath: string) => {
  try {
    console.log(TAG, 'Delete :', filePath);
    await RNFS.unlink(filePath);
  } catch (err :any) {
    console.log(TAG, 'Error her: ', err.message);
  }
};

export const writeXmlFile = async (
  path: string,
  strXml: string,
): Promise<boolean> => {
  try {
    console.log(TAG, 'path:', path);

    await RNFS.writeFile(path, strXml);
    //console.log('result xml:', result);
    return true;
  } catch (err :any) {
    console.log(TAG, 'Error: ', err.message, err.code);
    // showToast(err.message);
  }
  return false;
};

export const getListFileFromStorage = async (
  path: string,
  expectExtension?: string
): Promise<PropsFileInfo[]> => {
  console.log('load file');
  let listFile: PropsFileInfo[] = [];
  try {
    const result = await RNFS.readDir(path);
    //console.log('result xml:', result);
    for (let e of result) {
      if (getFilExtension(e.name.toLocaleLowerCase()) === (expectExtension ?? 'xml')) {
        listFile.push({
          name: e.name,
          checked: false,
          time: new Date(e.mtime).getTime(),
          path: e.path,
          date: toLocaleString(new Date(e.mtime)),
        });
      }
    }
  } catch (err :any) {
    console.log(TAG, 'Error: ', err.message, err.code);
    showToast(err.message);
  }

  if(listFile.length)
  {
    listFile = listFile.sort((a, b) => b.time - a.time);
  }

  return listFile;
};

export async function WriteLog(TAG: string, message: string)
{
  try {
    const date = new Date();

    let nameFile = 'Log_' + (date.getDate() ).toString().padStart(2, '0') + date.getMonth().toString().padStart(2, '0') + date.getFullYear().toString() + '.txt';

    const time = toLocaleString(date);
    let text : string = TAG + ':' + time + ':';
    text += message;
    text += '\r\n';

    const filePath = PATH_EXPORT_LOG + '/' +nameFile;
    // console.log('Log:', filePath);
    
    await RNFS.appendFile(filePath, text);
  } catch (err :any) {
    console.log(TAG, 'Error WriteLog: ', err.message);
  }
  

}
