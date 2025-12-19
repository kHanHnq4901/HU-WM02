import struct from '../../../util/cstruct';
import { Buffer } from 'buffer';
import { uint16_t, uint8_t } from '../define';

export const Rtc_TimeType = struct(`
  uint8_t u8Year;
  uint8_t u8Month;
  uint8_t u8Date;
  uint8_t u8Day;
  uint8_t u8Hour;
  uint8_t u8Minute;
  uint8_t u8Second;

`);

export type Rtc_TimeProps = {
  u8Year: number;
  u8Month: number;
  u8Date: number;
  u8Day: number;
  u8Hour: number;
  u8Minute: number;
  u8Second: number;
};

export const Aps_HeaderType = struct`
  uint8_t u8StartByte;
  uint16_t u16Length;
  uint8_t u8Rssi;
  uint8_t u8Reserve;
  uint8_t u8MeterSpecies;
  uint8_t u8TypeMeter;
  uint8_t au8Seri[6];
  uint8_t u8Command;
`;

export type Aps_HeaderProps = {
  u8StartByte: uint8_t;
  u16Length: uint16_t;
  u8Rssi: uint8_t;
  u8Reserve: uint8_t;
  u8MeterSpecies: uint8_t;
  u8TypeMeter: uint8_t;
  au8Seri: Buffer;
  u8Command: uint8_t;
};

export const Aps_HHUType = struct(`
  uint8_t u8StartDate;   
  uint8_t u8NumberActiveDay;
`);

export type Aps_HHUProps = {
  u8StartDate: number;
  u8NumberActiveDay: number;
};

export type Aps_TransientProps = {
  u16UsedCapacity: number; // // Dung lượng pin đã sử dụng
  u8Temp: number; // Nhiệt độ
  u8Voltage: number; // Điện áp
  u8NumResets: number; // Số lần reset
  u16TimeSlot: number; // Khe thời gian

  u16NumSent2GateWay: number; // số lần gửi lên gateway
  //RadioConfig: Aps_RfConfigProps; // cấu hình RF
};

export const Aps_TransientType = struct`
  uint16_t u16UsedCapacity;
  uint8_t u8Temp; 
  uint8_t u8Voltage;
  uint8_t u8NumResets; 
  uint16_t u16TimeSlot;

  uint16_t u16NumSent2GateWay;
  
`;

// export type DataManager_IlluminateRecordProps = {
//   SimpleTime: Rtc_SimpleTimeProps;
//   au8CwData: Buffer;
//   au8UcwData: Buffer;
// };

// export const DataManager_IlluminateRecordType = struct`
//   ${Rtc_SimpleTimeType} SimpleTime;
//   uint8_t au8CwData[4];
//   uint8_t au8UcwData[4];
// `;

export const DataManager_DataType = struct`
  uint8_t au8CwData[4];
  uint8_t au8UcwData[4];
`;

export type DataManager_DataProps = {
  au8CwData: Buffer;
  au8UcwData: Buffer;
};

export const Aps_DataType = struct`
  ${DataManager_DataType} Data;
`;

export type Aps_DataProps = {
  Data: DataManager_DataProps;
};

export const Aps_TimeFirstDataType = struct` 
  uint8_t u8Year;
  uint8_t u8Month;
  uint8_t u8Date;
  uint8_t u8Hour;`;

export type Aps_TimeFirstDataProps = {
  u8Year: number;
  u8Month: number;
  u8Date: number;
  u8Hour: number;
};

export const BroadcastMeterType = struct` 
  uint8_t seri[6];
  uint8_t spec;
  uint8_t rssi`;

export type BroadcastMeterProps = {
  seri: Buffer;
  spec: number;
  rssi: number;
};
