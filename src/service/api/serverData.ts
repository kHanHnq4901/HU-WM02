import axios from 'axios';

import { PropsCommonResponse } from '.';
import { store } from '../../screen/login/controller';
import { PropsInfoMeterEntity, PropsMeterModel, TABLE_NAME_INFO_LINE, TABLE_NAME_INFO_METER } from '../../database/entity';
import { toLocaleDateString } from '../../util';
import { InfoMeterRepository, checkTabelDBIfExist, getDBConnection } from '../../database/repository';
import { handleGetMeterByLineFromServer } from '../../screen/importMeter/handleButton';

const TAG = 'ServerData:';

export type AXIOS_ERROR_TYPE = {
  message: string;
  name: 'AxiosError';
  stack: string;
  config: {
    data: string;
  };
  code: string;
  status: number;
  response?: {
    data: string;
  };
};

const api = '';
export const endPoints = {
  login : '/api/Login',
  getMeterAccount : '/api/GetMeterAccount',
  getLineList :'/api/GetLineList',
  getMeterListByLine : '/api/GetMeterListByLine',
  saveActiveTotal : 'api/SaveActiveTotal',
};

function getUrl(endPoint: string): string {
  let url = '';
  const host = store.state.appSetting.server.host.trim();
  const port = store.state.appSetting.server.port.trim();
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

  return url;
}

type PropsLogin = {
  userName: string;
  password: string;
};
type PropsSaveActiveTotal= {
   
 	meterNo: string;
  dataTime: string;
  activeTotal : string;
  negactiveTotal : string;
};
type PropsGetMeterAccount= {
  userID: string;
  token: string;
};
/// NPC
type PropsGetMeterByLine = {
  lineID : string;
  token: string;
  dateMiss?: string ;
}
export type PropsLoginReturn = {
  data: string;
  message: null | string;
  statusCode: number;
};
export const login = async (
  props: PropsLogin,
): Promise<PropsCommonResponse> => {
  const ret: PropsCommonResponse = {
    bSucceed: false,
    obj: undefined,
    strMessage: '',
  };

  console.log("✅ Đã vào hàm login");

  try {
    const url = getUrl(endPoints.login); // VD: http://14.225.244.63:8088/api/Login
    console.log('🌐 URL:', url);

    const params = {
      UserAccount: props.userName,
      Password: props.password,
    };

    const { data } = await axios.get(url, { params });
    store.setState(state => {
      state.infoUser.moreInfoUser.token = data.TOKEN;
      state.infoUser.moreInfoUser.userId = data.USER_ID;
      return { ...state };
    });
    console.log('📥 Response data:', data);

    // Kiểm tra mã phản hồi từ server
    if (data.CODE === "1") {
      ret.bSucceed = true;
      ret.obj = data; // Hoặc ép kiểu nếu cần: data as PropsLoginServerDLHNReturn
    } else {
      ret.strMessage = data.MESSAGE || 'Đăng nhập không thành công';
    }
  } catch (err: any) {
    console.log('❌ Error:', err);
    if (err.message) {
      const strErr = err.message as string;
      if (strErr.includes('status code 400')) {
        ret.strMessage = 'Thông tin đăng nhập không chính xác (400)';
      } else {
        ret.strMessage = err.message;
      }
    } else {
      ret.strMessage = 'Đã xảy ra lỗi khi kết nối tới server';
    }
  }

  return ret;
};
export const saveActiveTotal = async (
  props: PropsSaveActiveTotal,
): Promise<PropsCommonResponse> => {
  const ret: PropsCommonResponse = {
    bSucceed: false,
    obj: undefined,
    strMessage: '',
  };

  console.log("✅ Đã vào hàm login");

  try {
    const url = getUrl(endPoints.saveActiveTotal); 
    console.log('🌐 URL:', url);

    const params = {
      MeterNo: props.meterNo,
      DataTime: props.dataTime,
      ActiveTotal : props.activeTotal,
      NegactiveTotal : props.negactiveTotal,
      Token : store.state.infoUser.moreInfoUser.token
    };

    const { data } = await axios.get(url, { params });
    console.log('📥 Response data:', data);

    // Kiểm tra mã phản hồi từ server
    if (data.CODE === "1") {
      ret.bSucceed = true;
      ret.obj = data; // Hoặc ép kiểu nếu cần: data as PropsLoginServerDLHNReturn
      ret.strMessage = "Đẩy dữ liệu thành công";
    } else {
      ret.strMessage = data.MESSAGE || 'Đẩy dữ liệu thất bại';
    }
  } catch (err: any) {
    console.log('❌ Error:', err);
    if (err.message) {
      const strErr = err.message as string;
      if (strErr.includes('status code 400')) {
        ret.strMessage = 'Thông tin dữ liệu không chính xác (400)';
      } else {
        ret.strMessage = err.message;
      }
    } else {
      ret.strMessage = 'Đã xảy ra lỗi khi kết nối tới server';
    }
  }

  return ret;
};
export const GetMeterAccount = async (
  props: PropsGetMeterAccount,
): Promise<PropsCommonResponse> => {
  const ret: PropsCommonResponse = {
    bSucceed: false,
    obj: undefined,
    strMessage: '',
  };

  try {
    const url = getUrl(endPoints.getMeterAccount);
    console.log('🌐 URL:', url);

    const params = {
      UserID: props.userID,
      Token: props.token,
    };

    const { data } = await axios.get(url, { params });
    console.log('📥 Response data get Meter:', data);

    ret.bSucceed = true;
    ret.obj = data;
  } catch (err: any) {
    console.log('❌ Error:', err);
    ret.strMessage = err?.message ?? 'Lỗi không xác định';
  }

  return ret;
};
export const GetLineAccount = async (
  props: PropsGetMeterAccount,
): Promise<PropsCommonResponse> => {
  const ret: PropsCommonResponse = {
    bSucceed: false,
    obj: undefined,
    strMessage: '',
  };

  try {
    const url = getUrl(endPoints.getLineList);
    console.log('🌐 URL:', url);

    const params = {
      UserID: props.userID,
      Token: props.token,
    };

    const { data } = await axios.get(url, { params });
    console.log('📥 Response data get Meter:', data);

    ret.bSucceed = true;
    ret.obj = data;
  } catch (err: any) {
    console.log('❌ Error:', err);
    ret.strMessage = err?.message ?? 'Lỗi không xác định';
  }

  return ret;
};
export const GetMeterByLine = async (
  props: PropsGetMeterByLine,
): Promise<PropsCommonResponse> => {
  const ret: PropsCommonResponse = {
    bSucceed: false,
    obj: undefined,
    strMessage: '',
  };

  try {
    const url = getUrl(endPoints.getMeterListByLine);
    console.log('🌐 URL:', url);
    console.log ('🌐 lineID:',props.lineID)
    console.log ('🌐 token:',props.token)
    const params = {
      LineID: props.lineID,
      DateMiss : props.dateMiss,
      Token: props.token,
    };

    const { data } = await axios.get(url, { params });
    console.log('📥 Response data get Meter:', data);

    ret.bSucceed = true;
    ret.obj = data;
  } catch (err: any) {
    console.log('❌ Error:', err);
    ret.strMessage = err?.message ?? 'Lỗi không xác định';
  }

  return ret;
};
type SaveMode = "replace" | "append";

export const SaveMeterDataToDB = async (
  item: { LINE_ID: string; LINE_NAME: string; ADDRESS: string; CODE: string; countMeter: number },
  options: { mode: "replace" | "append" }
): Promise<boolean> => {
  try {
    const db = await getDBConnection();
    if (!db) return false;

    await checkTabelDBIfExist();

    // === REPLACE MODE ===
    if (options.mode === "replace") {
      await db.executeSql(
        `INSERT INTO ${TABLE_NAME_INFO_LINE} (LINE_ID, LINE_NAME, ADDRESS, CODE) 
         VALUES (?, ?, ?, ?)`,
        [item.LINE_ID, item.LINE_NAME, item.ADDRESS, item.CODE]
      );

      console.log("✅ Saved line data (replace mode):", item.LINE_ID);

      const meterList: PropsMeterModel[] = await handleGetMeterByLineFromServer(item.LINE_ID);
      if (meterList && meterList.length > 0) {
        for (const meter of meterList) {
          const statusValue = meter.STATUS ?? "0"; // ✅ STATUS là string
          const lineIdToInsert = meter.LINE_ID ?? item.LINE_ID;

          await db.executeSql(
            `INSERT INTO ${TABLE_NAME_INFO_METER} 
             (METER_NO, METER_NAME, METER_MODEL_DESC, MODULE_NO, CUSTOMER_CODE, CUSTOMER_NAME,
              ADDRESS, PHONE, EMAIL, CREATED, LINE_NAME, COORDINATE, LINE_ID, METER_MODEL_ID, STATUS) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              meter.METER_NO ?? "",
              meter.METER_NAME ?? "",
              meter.METER_MODEL_DESC ?? "",
              meter.MODULE_NO ?? "",
              meter.CUSTOMER_CODE ?? "",
              meter.CUSTOMER_NAME ?? "",
              meter.ADDRESS ?? "",
              meter.PHONE ?? "",
              meter.EMAIL ?? "",
              meter.CREATED ?? "",
              meter.LINE_NAME ?? "",
              meter.COORDINATE ?? "",
              lineIdToInsert,
              meter.METER_MODEL_ID ?? "",
              statusValue,
            ]
          );
        }
        console.log(`✅ Đã lưu ${meterList.length} meter vào DB (replace mode).`);
      }
    }

    // === APPEND MODE ===
    if (options.mode === "append") {
      const existingLine = await db.executeSql(
        `SELECT LINE_ID FROM ${TABLE_NAME_INFO_LINE} WHERE LINE_ID = ?`,
        [item.LINE_ID]
      );

      if (existingLine[0].rows.length === 0) {
        await db.executeSql(
          `INSERT INTO ${TABLE_NAME_INFO_LINE} (LINE_ID, LINE_NAME, ADDRESS, CODE) 
           VALUES (?, ?, ?, ?)`,
          [item.LINE_ID, item.LINE_NAME, item.ADDRESS, item.CODE]
        );
        console.log("✅ Saved line data (append mode):", item.LINE_ID);
      } else {
        console.log(`ℹ️ LINE_ID ${item.LINE_ID} đã tồn tại → bỏ qua append LINE.`);
      }

      const meterList: PropsMeterModel[] = await handleGetMeterByLineFromServer(item.LINE_ID);
      if (meterList && meterList.length > 0) {
        for (const meter of meterList) {
          const existingMeter = await db.executeSql(
            `SELECT METER_NO FROM ${TABLE_NAME_INFO_METER} WHERE METER_NO = ?`,
            [meter.METER_NO]
          );

          if (existingMeter[0].rows.length === 0) {
            const statusValue = meter.STATUS ?? "0";
            const lineIdToInsert = meter.LINE_ID ?? item.LINE_ID;

            await db.executeSql(
              `INSERT INTO ${TABLE_NAME_INFO_METER} 
               (METER_NO, METER_NAME, METER_MODEL_DESC, MODULE_NO, CUSTOMER_CODE, CUSTOMER_NAME,
                ADDRESS, PHONE, EMAIL, CREATED, LINE_NAME, COORDINATE, LINE_ID, METER_MODEL_ID, STATUS) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                meter.METER_NO ?? "",
                meter.METER_NAME ?? "",
                meter.METER_MODEL_DESC ?? "",
                meter.MODULE_NO ?? "",
                meter.CUSTOMER_CODE ?? "",
                meter.CUSTOMER_NAME ?? "",
                meter.ADDRESS ?? "",
                meter.PHONE ?? "",
                meter.EMAIL ?? "",
                meter.CREATED ?? "",
                meter.LINE_NAME ?? "",
                meter.COORDINATE ?? "",
                lineIdToInsert,
                meter.METER_MODEL_ID ?? "",
                statusValue,
              ]
            );
          } else {
            console.log(`ℹ️ METER_NO ${meter.METER_NO} đã tồn tại → bỏ qua.`);
          }
        }
        console.log(`✅ Đã xử lý xong ${meterList.length} meter (append mode).`);
      } else {
        console.log("⚠️ Không có meter nào để lưu.");
      }
    }

    return true;
  } catch (error) {
    console.log("❌ Error saving line data:", error);
    return false;
  }
};








