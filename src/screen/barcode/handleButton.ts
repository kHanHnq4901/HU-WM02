import { hookProps } from "./controller";

export const handleCodeScanned = (value: string, navigation: any, route: any) => {
  if (!hookProps.state.isActive) return;

  // Tạm dừng camera
  hookProps.setState(prev => ({ ...prev, isActive: false, scannedValue: value }));

  // Lấy hàm callback onScanSuccess từ màn hình trước truyền sang
  const { onScanSuccess } = route.params || {};

  if (onScanSuccess) {
    onScanSuccess(value); // Trả mã quét được về màn hình trước
    navigation.goBack();  // Tự động đóng màn hình camera
  } else {
    // Fallback nếu không có callback (test độc lập)
    console.log('Mã đã quét:', value);
    // Alert.alert('Thành công', value, [
    //   { text: 'OK', onPress: () => hookProps.setState(prev => ({ ...prev, isActive: true })) }
    // ]);
  }
};