import { Alert, Platform } from "react-native";
import { store } from "../../screen/overview/controller";
import { navigation } from "./controller";
import BleManager from 'react-native-ble-manager';
//import { reconnectLastDevice } from "../../service/ble";
import { showToast } from "../../util";
import { reconnectHandle } from "../../util/ble";

export const onBleLongPress = () => {
    // 3. Sử dụng navigation được truyền vào
    if (navigation) {
      navigation.navigate('BLEScreen');
    }
  };

export async function onBlePress() {
  console.log('👆 onBlePress triggered');
  
  // Xin quyền nếu cần (bỏ comment nếu dự án của bạn yêu cầu)
  // await requestBlePermissions();

  const connectState = store.state.hhu.connect;
  console.log('Trạng thái kết nối hiện tại:', connectState);

  // 1. NẾU ĐANG NGẮT KẾT NỐI -> Thử kết nối lại thiết bị cũ
  if (connectState === 'DISCONNECTED') {
    // Hàm reconnectLastDevice đã tự có try-catch và showToast bên trong rồi nên chỉ cần gọi
    await reconnectHandle();
    return;
  }

  // 2. NẾU ĐANG KẾT NỐI DỞ DANG -> Báo người dùng đợi, tránh spam nút bấm
  if (connectState === 'CONNECTING') {
    showToast('Đang xử lý kết nối, vui lòng đợi...');
    console.log('⏳ Đang kết nối, bỏ qua thao tác...');
    return;
  }

  // 3. NẾU ĐÃ KẾT NỐI -> Hỏi xem có muốn ngắt kết nối không
  if (connectState === 'CONNECTED') {
    const currentDeviceName = store.state.hhu.name || 'thiết bị này';
    
    Alert.alert(
      'Ngắt kết nối',
      `Bạn có chắc chắn muốn ngắt kết nối với ${currentDeviceName}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Ngắt kết nối',
          style: 'destructive', // iOS sẽ bôi đỏ chữ này để cảnh báo
          onPress: async () => {
            try {
              let peripheralId = store.state.hhu.idConnected;
  
              // Fallback tìm thiết bị đã Paired trên Android nếu mất ID
              if (!peripheralId && Platform.OS === 'android') {
                const peripherals = await BleManager.getBondedPeripherals();
                if (peripherals.length > 0) {
                  peripheralId = peripherals[0].id;
                }
              }
  
              if (peripheralId) {
                showToast('Đang ngắt kết nối...');
                console.log('🔌 Ngắt kết nối với:', peripheralId);
                await BleManager.disconnect(peripheralId);
                showToast('Đã ngắt kết nối thành công');
              } else {
                showToast('Không tìm thấy thiết bị để ngắt kết nối.');
              }

              // Luôn dọn dẹp State sạch sẽ sau khi ngắt
              store.setState(prev => ({
                ...prev,
                hhu: {
                  ...prev.hhu,
                  idConnected: '',
                  name: '',
                  connect: 'DISCONNECTED',
                  isConnected: false,
                  version: '', // Xoá version cũ
                }
              }));

            } catch (err) {
              console.log('❌ Lỗi khi ngắt kết nối:', err);
              showToast('Có lỗi xảy ra khi ngắt kết nối');
            }
          },
        },
      ]
    );
  }
}