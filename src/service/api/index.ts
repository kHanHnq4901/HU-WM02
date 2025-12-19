import axios from 'axios';
import { showAlert } from '../../util';
import { ObjSend, onOKAlertNeedUpdatePress } from '../hhu/hhuFunc';
import { PropsMaCongToStorage } from '../storage/maCongTo';
import { store } from '../../screen/overview/controller';
const api = '';
export const endPoints = {
  getVersionHU: '/HU_03/version.txt',
  getFirmware: '/HU_03/firmware.txt',
  getListChangeTypeMeter: '/300k.txt',
  getListMatchVersionTypeMeter: '/DVKH/METERLIST_HU01/listSeriVersion.txt',
  getVersionAppMobile: '/HU_01/AppMobile/version.txt',
  getHDSD: '/HU_01/HDSD_HU_01.pdf',
  getMaCongTo: '/HU_01/phanBietMaCongTo.txt',
};

export function getNsxUrl(endPoint: string): string {
  let url = '';
  const host = store.state.appSetting.hhu.host;
  const port = store.state.appSetting.hhu.port;
  if (host.includes('http')) {
  } else {
    url += 'http://';
  }
  url += host;
  if (port.length > 0) {
    url += ':' + port;
  }
  url += api;
  url += endPoint;
  url += `?timestamp=${new Date().getTime()}`;
  return url;
}

export type PropsCommonResponse = {
  bSucceed: boolean;
  obj: any;
  strMessage: string;
};

type PropsReturnGetVerion = {
  bResult: boolean;
  message: string;
  version: string;
  dateIssue: string;
  priority: 'Cao' | 'Bình thường';
};

type PropsReturnGetFirmware = {
  bResult: boolean;
  message: string;
  strFirmware: string;
};

const TAG = 'API:';

const getTimeFromString = (time: string): string | undefined => {
  //console.log('time:', time);
  let index = 0;
  const year = Number(time.substring(index, index + 4));

  index += 4;
  const month = time.substring(index, index + 2);
  index += 2;
  const date = time.substring(index, index + 2);
  index += 2;
  const hour = time.substring(index, index + 2);
  index += 2;
  const minute = time.substring(index, index + 2);
  index += 2;
  let second: string;
  if (time.length > 12) {
    second = time.substring(index, index + 2);
    index += 2;
  } else {
    second = '00';
  }
  const str =
    year.toString() +
    '-' +
    month +
    '-' +
    date +
    ' ' +
    hour +
    ':' +
    minute +
    ':' +
    second;

  return str;
};

export async function checkUpdateHHU(
  props?: PropsReturnGetVerion,
  showAlertNewestVersion?: boolean,
) {
  try {
    if (store?.state.hhu.shortVersion !== '') {
      let currentVersion = store?.state.hhu.shortVersion;
      let restVersion = {} as PropsReturnGetVerion;
      if (props) {
        restVersion = props;
      } else {
        restVersion = await getVersion();
      }
      if (restVersion.bResult === true) {
        if (currentVersion !== restVersion.version) {
          let status = `Đã có phiên bản mới cho thiết bị cầm tay ${restVersion.version}\r\n`;
          if (restVersion.priority === 'Cao') {
            status += '(Quan trọng)';
            ObjSend.isNeedUpdate = true;
            showAlert(status, {
              label: 'Cập nhật',
              func: onOKAlertNeedUpdatePress,
            });
          } else {
            ObjSend.isNeedUpdate = false;
            showAlert(status);
          }
          console.log('rest version:', restVersion.version);
          console.log('current version:', currentVersion);
        } else {
          console.log('Không có bản cập nhật nào');
          if (showAlertNewestVersion) {
            showAlert('Đã là phiên bản phần mềm mới nhất');
          }
        }
      }
    }
  } catch (err: any) {
    console.log(TAG, err.message);
  }
}

export const getVersion = async (): Promise<PropsReturnGetVerion> => {
  const ret = {} as PropsReturnGetVerion;
  ret.bResult = false;
  ret.message = '';
  ret.version = '';
  ret.dateIssue = '';
  ret.priority = 'Cao';
  try {
    const url = getNsxUrl(endPoints.getVersionHU);
    const rest = await axios.get(url);
    const arr: string[] = rest?.data.split('_');
    console.log(arr)
    if (arr.length < 2) {
      console.log('error arr');
      ret.message = 'Lỗi dữ liệu';
    } else {
      const strDate = getTimeFromString(arr[0]);
      const strVersion = arr[1];
      ret.bResult = true;
      ret.version = strVersion;
      ret.dateIssue = strDate as string;
      ret.priority = arr[2]
        ? arr[2] === '0'
          ? 'Bình thường'
          : 'Cao'
        : 'Bình thường';
    }
  } catch (err: any) {
    console.log(TAG, err);
    ret.message = 'Lỗi: ' + err.message;
  }

  return ret;
};


export const getStringFirmware = async (): Promise<PropsReturnGetFirmware> => {
  const ret: PropsReturnGetFirmware = {
    bResult: false,
    message: '',
    strFirmware: '',
  };

  try {
    const url = getNsxUrl(endPoints.getFirmware);

    // lấy file dưới dạng binary
    const response = await axios.get<ArrayBuffer>(url, {
      responseType: "arraybuffer",
    });

    const buffer = new Uint8Array(response.data);

    // chuyển sang chuỗi hex giống hex editor
    const hexString = Array.from(buffer)
      .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
      .join("");

    ret.bResult = true;
    ret.strFirmware = hexString;
  } catch (err: any) {
    ret.message = err.message;
  }

  return ret;
};

export type PropsReturnGetListChange = {
  bSucceed: boolean;
  listMeter: string[];
};

export async function GetListChangeTypeMeter(): Promise<PropsReturnGetListChange> {
  //SaveActiveTotal(string ModuleNo, string DataTime, string ActiveTotal, string NegactiveTotal, string Token)

  const response: PropsReturnGetListChange = {
    bSucceed: false,
    listMeter: [],
  };

  try {
    const url = getNsxUrl(endPoints.getListChangeTypeMeter);
    //console.log('url:', url);
    const timeStart = new Date();
    const rest = await axios.get(url);
    const timeEnd = new Date();
    console.log('time start:', timeStart.toLocaleTimeString('vi'));
    console.log('time end:', timeEnd.toLocaleTimeString('vi'));

    if (rest.data) {
      response.bSucceed = true;
    } else {
      response.bSucceed = false;
    }

    //console.log('Get list change type meter :', rest.data);

    return response;
  } catch (err: any) {
    console.log(TAG, 'err:', err.message);
  }
  return response;
}

export async function GetFileListMatchVersionMeter(): Promise<PropsCommonResponse> {
  //SaveActiveTotal(string ModuleNo, string DataTime, string ActiveTotal, string NegactiveTotal, string Token)

  const response: PropsCommonResponse = {
    bSucceed: false,
    obj: null,
    strMessage: '',
  };

  try {
    const url = getNsxUrl(endPoints.getListMatchVersionTypeMeter);
    //console.log('url:', url);
    const rest = await axios.get(url);
    if (rest.data) {
      response.bSucceed = true;
      response.obj = rest.data;
    } else {
      response.bSucceed = false;
    }

    //console.log('Get list change type meter :', rest.data);

    return response;
  } catch (err: any) {
    console.log(TAG, 'err:', err.message);
    response.bSucceed = false;
    response.strMessage = err.message;
  }
  return response;
}

export const getVersionAppMobile = async (): Promise<PropsReturnGetVerion> => {
  const ret = {} as PropsReturnGetVerion;
  ret.bResult = false;
  ret.message = '';
  ret.version = '';
  ret.dateIssue = '';
  ret.priority = 'Cao';
  try {
    const url = getNsxUrl(endPoints.getVersionAppMobile);
    const rest = await axios.get(url);
    const arr: string[] = rest?.data.split('_');
    if (arr.length < 2) {
      console.log('error arr');
      ret.message = 'Lỗi dữ liệu';
    } else {
      console.log(arr);
      const strDate = getTimeFromString(arr[0]);
      const strVersion = arr[1];
      ret.bResult = true;
      ret.version = strVersion;
      ret.dateIssue = strDate as string;
      ret.priority = arr[2]
        ? arr[2] === '0'
          ? 'Bình thường'
          : 'Cao'
        : 'Bình thường';
      //   console.log('date:', strDate);
      //   console.log('version:', strVersion);
      //status = 'Version: ' + strVersion + '. Ngày phát hành: ' + strDate;
    }
  } catch (err: any) {
    console.log(TAG, err);
    ret.message = 'Lỗi: ' + err.message;
  }

  return ret;
};

export async function checkUpdateAppMobile() {
  // const ret = await getVersionAppMobile();
  // if (ret.bResult) {
  //   if (ret.version !== version) {
  //     if (ret.priority === 'Cao') {
  //       showAlert(
  //         'Đã có phiên bản mới của ứng dụng. Vui lòng cập nhật ứng dụng',
  //         Platform.OS === 'android'
  //           ? {
  //               label: 'Đi đến trang cập nhật',
  //               func: async () => {
  //                 try {
  //                   const url =
  //                     Platform.OS === 'android'
  //                       ? 'https://play.google.com/store/apps/details?id=com.gelex.emic.hu_01_esoft'
  //                       : 'https://apps.apple.com/us/app/hu-01-esoft/id6458392785';
  //                   const canOpen = await Linking.canOpenURL(url);
  //                   if (canOpen === true) {
  //                     Linking.openURL(url);
  //                   }
  //                 } catch {}
  //               },
  //             }
  //           : undefined,
  //       );
  //     }
  //   }
  // }
}

export const GetMaCongToFromServer = async (): Promise<PropsCommonResponse> => {
  const ret: PropsCommonResponse = {
    bSucceed: false,
    obj: undefined,
    strMessage: '',
  };

  try {
    const url = getNsxUrl(endPoints.getMaCongTo);
    const rest = await axios.get(url);

    const b: string = rest.data;

    const strMaCongTO = b.substring(b.indexOf('{'), b.lastIndexOf('}') + 1);

    try {
      const objMaCongTo = JSON.parse(strMaCongTO);
      ret.bSucceed = true;
      ret.obj = objMaCongTo as PropsMaCongToStorage;
    } catch (err: any) {
      let strErorr = 'Cú pháp khai báo mã đồng hồ chưa đúng. Kiểm tra lại ...';
      showAlert(strErorr);
      ret.strMessage = strErorr;
    }
  } catch (err: any) {
    console.log(TAG, err);
    ret.strMessage = 'Lỗi: ' + err.message;
  }

  return ret;
};
