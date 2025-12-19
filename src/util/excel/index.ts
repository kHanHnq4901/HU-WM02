import { writeFile } from 'react-native-fs';
import XLSX from 'xlsx';
import {
  KHCMISModelFields,
  PropsKHCMISModel,
} from '../../database/model/index';
import { PATH_EXPORT_EXCEL } from '../../shared/path';
import Share from 'react-native-share';
import {
  GetLoaiDocRFString,
  GetVersionMeterString,
  TYPE_READ_RF,
} from '../../service/hhu/defineEM';

type PropsExportExcel = Partial<PropsKHCMISModel>;

const dumyData: PropsExportExcel = {
  MA_TRAM: '',
  MA_QUYEN: '',
  MA_COT: '',

  MA_KHANG: '',

  SERY_CTO: '',
  LOAI_BCS: '',
  TEN_KHANG: '',
  DIA_CHI: '',
  MA_CTO: '',

  CS_CU: 0,
  SL_CU: 0,
  SL_TTIEP: 0,
  CS_MOI: 0,
  SL_MOI: 0,
  NGAY_MOI: '',

  PMAX: 0,
  NGAY_PMAX: '',
  RF: '1',

  KY: '',
  THANG: '',
  NAM: '',
  MA_DVIQLY: '',
  MA_GC: '',
  MA_NVGCS: '',
  X: '',
  Y: '',

  LoaiDoc: '',

  loginMode: 'KH Lẻ',
  isSent: '0',
  GhiChu: '',
};

export async function exportDateToExcel(
  nameFile: string,
  nameSheet: string,
  dataArr: PropsKHCMISModel[],
) {
  //   const data = [
  //     { name: 'John', city: 'Seattle' },
  //     { name: 'Mike', city: 'Los Angeles' },
  //     { name: 'Zach', city: 'New York' },
  //   ];
  const data: { [K in keyof PropsExportExcel]: string }[] = [];

  for (let kh of dataArr) {
    const row: PropsExportExcel = {};
    for (let col in dumyData) {
      const _key = col as keyof PropsExportExcel;

      const value: string | number = kh[_key];

      let content: string = value.toString();
      if (_key === 'LoaiDoc') {
        content = GetLoaiDocRFString(content as TYPE_READ_RF);
      } else if (_key === 'RF') {
        content = GetVersionMeterString(content);
      }

      row[_key] = content;
    }
    data.push(row);
  }

  const ws = XLSX.utils.json_to_sheet(data);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, nameSheet);

  const wbout = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });
  //var RNFS = require('react-native-fs');
  const file = PATH_EXPORT_EXCEL + '/' + nameFile + '.xlsx';
  let succeed = false;
  await writeFile(file, wbout, 'ascii')
    .then(r => {
      /* :) */
      succeed = true;
      console.log('create file excel succeed');
    })
    .catch(e => {
      /* :( */
    });

  if (succeed) {
    Share.open({
      title: 'Chia sẻ qua',
      urls: ['file://' + file],
      //filenames: ['test12'],
      type: 'application/vnd.ms-excel', //'text/plain', //
      showAppsToView: true,
    })
      .then(res => {
        console.log(res);
        if (res.success) {
          // checkUpdateFromStore();
          console.log('share file excel succeed');
        }
      })
      .catch(err => {
        err && console.log(err);
      });
  }
}
