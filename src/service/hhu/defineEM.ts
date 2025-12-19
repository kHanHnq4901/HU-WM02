
export enum ERROR_TABLE {
  E_SUCCESS = 0,
  E_NOT_PROCESS = 1,
  E_ERROR_INVALID_PARAM = 2,
  E_ERROR_TIMEOUT = 3,
  E_ERROR_OUT_OF_MEMORY = 4,
  E_ERROR_SPI_FAILURE = 5,
  E_ERROR_DB_EMPTY = 6,
  E_ERROR_DB_OUT_OF_MEMORY = 7,
  E_ERROR_INVALID_FORMAT = 8,
  E_ERROR_RTC_FAILURE = 9,
  E_ERROR_INVALID_COMMAND = 10,
  E_ERROR_INVALID_COMMAND_CODE = 11,
  E_ERROR_CRC_FAILURE = 12,
  E_ERROR_PERMISSION_DENIED = 13,
  E_ERROR_NULL_POINTER = 14,
  E_ERROR_TRANSMISSION = 15,
  E_ERROR_LEN_TOO_SHORT = 16,
  E_ERROR_CRYPT_FAILURE = 17,
  E_MAX_ERROR = 18,
}
export const ERROR_MESSAGES: Record<ERROR_TABLE, string> = {
  [ERROR_TABLE.E_SUCCESS]: "Thành công",
  [ERROR_TABLE.E_NOT_PROCESS]: "Chưa xử lý",
  [ERROR_TABLE.E_ERROR_INVALID_PARAM]: "Tham số không hợp lệ",
  [ERROR_TABLE.E_ERROR_TIMEOUT]: "Hết thời gian chờ",
  [ERROR_TABLE.E_ERROR_OUT_OF_MEMORY]: "Hết bộ nhớ",
  [ERROR_TABLE.E_ERROR_SPI_FAILURE]: "Lỗi SPI",
  [ERROR_TABLE.E_ERROR_DB_EMPTY]: "Cơ sở dữ liệu rỗng",
  [ERROR_TABLE.E_ERROR_DB_OUT_OF_MEMORY]: "Cơ sở dữ liệu hết bộ nhớ",
  [ERROR_TABLE.E_ERROR_INVALID_FORMAT]: "Định dạng không hợp lệ",
  [ERROR_TABLE.E_ERROR_RTC_FAILURE]: "Lỗi RTC",
  [ERROR_TABLE.E_ERROR_INVALID_COMMAND]: "Lệnh không hợp lệ",
  [ERROR_TABLE.E_ERROR_INVALID_COMMAND_CODE]: "Mã lệnh không hợp lệ",
  [ERROR_TABLE.E_ERROR_CRC_FAILURE]: "Lỗi kiểm tra CRC",
  [ERROR_TABLE.E_ERROR_PERMISSION_DENIED]: "Từ chối quyền truy cập",
  [ERROR_TABLE.E_ERROR_NULL_POINTER]: "Con trỏ null",
  [ERROR_TABLE.E_ERROR_TRANSMISSION]: "Lỗi truyền dữ liệu",
  [ERROR_TABLE.E_ERROR_LEN_TOO_SHORT]: "Độ dài quá ngắn",
  [ERROR_TABLE.E_ERROR_CRYPT_FAILURE]: "Lỗi mã hóa",
  [ERROR_TABLE.E_MAX_ERROR]: "Lỗi không xác định",
};

export enum PARAM_ID {
  LORA_WAKEUP_TIME = 0x00,
  LORA_WAKEUP_SPECIFIC_DAYS_ID = 0x01,
  LORA_PERIOD_LATCH_ID = 0x02,
}
export enum WMType {
  WM01 = 0x01,
  WM02 = 0x02,
  WM03 = 0x03,
  WM04 = 0x04,
  WM05 = 0x05,
  WM06 = 0x06,
  WM07 = 0x07,
  WM08 = 0x08, // Sử dụng
  WM09 = 0x09,
  WM10 = 0x0A,
}
export enum LoraCommandCode {
  QUERY_DATA = 0x00,              // query data
  QUERY_DATA_DETAIL = 0x01,       // query data
  SETTING = 0x02,                 // setting
  TIME_WAKEUP = 0x03,             // setting
  WAKEUP_SPECIFIC_DAYS = 0x04,    // setting
  PERIOD_LATCH = 0x05,            // setting
  WAKEUP_DEVICE = 0x06,           // wakeup
}
export enum CommandType {
  LORA_WAKEUP = 0x00,        // wakeup
  LORA_QUERY_DATA = 0x01,    // query data
  LORA_SET_PARAM = 0x02,     // setting
  LORA_GET_PARAM = 0x03,     // setting
}
export enum LoraCommandCode {
  LORA_CMD_QUERY_DATA = 0x00,             // Query data
  LORA_CMD_QUERY_DATA_DETAIL = 0x01,      // Query data detail
  LORA_CMD_SETTING = 0x02,                // Setting
  LORA_CMD_TIME_WAKEUP = 0x03,            // Time wakeup
  LORA_CMD_WAKEUP_SPECIFIC_DAYS = 0x04,   // Wakeup specific days
  LORA_CMD_PERIOD_LATCH = 0x05,           // Period latch
  LORA_CMD_WAKEUP_DEVICE = 0x06,          // Wakeup device
}