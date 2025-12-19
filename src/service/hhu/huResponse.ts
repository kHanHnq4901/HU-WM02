// huResponse.ts

export enum HuResponseCode {
    CMD_RESP_SUCCESS = 0x00,
    CMD_RESP_CRC_FAIL = 0x01,
    CMD_RESP_INVALID_COMMAND = 0x02,
    CMD_RESP_TRANS_LORA_FAIL = 0x03,
    CMD_RESP_OPTICAL_DISCONNECT = 0x04,
    CMD_RESP_OPTICAL_NOT_READY = 0x05,
    CMD_RESP_OPTICAL_BUSY = 0x06,
    CMD_RESP_OPTICAL_INCORRECT_DEVICE = 0x07,
    CMD_RESP_NAME_TOO_LONG = 0x08,
  }
  
  export const HuResponseMsg: Record<number, string> = {
    [HuResponseCode.CMD_RESP_SUCCESS]: "Thành công",
    [HuResponseCode.CMD_RESP_CRC_FAIL]: "Mã CRC không chính xác",
    [HuResponseCode.CMD_RESP_INVALID_COMMAND]: "Lệnh gửi xuống không hợp lệ",
    [HuResponseCode.CMD_RESP_TRANS_LORA_FAIL]: "Truyền dữ liệu qua LORA thất bại",
    [HuResponseCode.CMD_RESP_OPTICAL_DISCONNECT]: "Cổng quang chưa được kết nối",
    [HuResponseCode.CMD_RESP_OPTICAL_NOT_READY]:
      "Cổng quang chưa sẵn sàng nhận dữ liệu (đang cấu hình)",
    [HuResponseCode.CMD_RESP_OPTICAL_BUSY]: "Cổng quang đang bận",
    [HuResponseCode.CMD_RESP_OPTICAL_INCORRECT_DEVICE]:
      "Cổng USB phát hiện không đúng loại thiết bị",
    [HuResponseCode.CMD_RESP_NAME_TOO_LONG]: "Tên đặt cho BLE quá dài",
  };
  export enum FotaResponseCode {
    FOTA_RESP_SUCCESS = 0x00,
    FOTA_RESP_UNKNOWN_CMD = 0x01,
    FOTA_RESP_UNEXPECTED_CMD = 0x02,
    FOTA_RESP_ERR_CRC = 0x03,
    FOTA_RESP_NEW_FW_TOO_LARGE = 0x04,
    FOTA_RESP_WRITE_FW_ERR = 0x05,
    FOTA_RESP_ERASE_ERR = 0x06,
    FOTA_RESP_INDEX_OUT_OF_RANGE = 0x07,
    FOTA_RESP_ERR_VERSION_TOO_LONG = 0x08,
  }
  
  // Bản đồ Response → thông điệp
  export const FotaResponseMsg: Record<number, string> = {
    [FotaResponseCode.FOTA_RESP_SUCCESS]: "Thực hiện lệnh thành công",
    [FotaResponseCode.FOTA_RESP_UNKNOWN_CMD]: "Nhận lệnh không hợp lệ",
    [FotaResponseCode.FOTA_RESP_UNEXPECTED_CMD]: "Lệnh hợp lệ nhưng sai trình tự",
    [FotaResponseCode.FOTA_RESP_ERR_CRC]: "Kiểm tra CRC của firmware thất bại",
    [FotaResponseCode.FOTA_RESP_NEW_FW_TOO_LARGE]: "Firmware mới vượt quá dung lượng flash",
    [FotaResponseCode.FOTA_RESP_WRITE_FW_ERR]: "Lỗi khi ghi firmware xuống flash",
    [FotaResponseCode.FOTA_RESP_ERASE_ERR]: "Lỗi khi xóa flash",
    [FotaResponseCode.FOTA_RESP_INDEX_OUT_OF_RANGE]: "Index frame vượt phạm vi cho phép",
    [FotaResponseCode.FOTA_RESP_ERR_VERSION_TOO_LONG]: "Chuỗi version FW quá dài",
  };
  // Hàm tiện ích để lấy message
  export function getHuResponseMsg(code: number): string {
    return HuResponseMsg[code] ?? `Mã phản hồi không xác định: 0x${code.toString(16)}`;
  }
  