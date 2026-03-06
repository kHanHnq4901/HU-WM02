import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Animated,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';

import { GetHookProps } from './controller';
import { scale } from '../../util/responsive'; 
import { useNavigation, useRoute } from '@react-navigation/native'; 
import { handleCodeScanned } from './handleButton';

// Kích thước khung quét
const SCAN_FRAME_SIZE = scale(250);

export default function BarcodeScreen() {
  const navigation = useNavigation();
  const route = useRoute(); 
  const { state } = GetHookProps();

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  // Animation cho thanh Laser chạy lên xuống
  const laserAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // ✅ TỐI ƯU: Quản lý vòng đời của Animation chuẩn xác hơn
  useEffect(() => {
    const loopAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(laserAnim, {
          toValue: SCAN_FRAME_SIZE - scale(4), // Chạy tới đáy khung
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(laserAnim, {
          toValue: 0, // Quay lại đỉnh khung
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    if (state.isActive) {
      loopAnimation.start();
    } else {
      loopAnimation.stop();
      laserAnim.setValue(0); // Reset vị trí laser khi tạm dừng
    }

    // Cleanup function để dọn dẹp animation khi unmount component
    return () => loopAnimation.stop();
  }, [state.isActive, laserAnim]);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13', 'code-128'],
    onCodeScanned: (codes) => {
      if (codes.length > 0 && codes[0].value) {
        handleCodeScanned(codes[0].value, navigation, route);
      }
    },
  });

  // --- RENDER UI ---

  if (hasPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.infoText}>Đang kiểm tra quyền camera...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Bạn chưa cấp quyền sử dụng Camera.</Text>
        <TouchableOpacity style={styles.btnAction} onPress={() => Linking.openSettings()}>
          <Text style={styles.btnText}>MỞ CÀI ĐẶT</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Không tìm thấy Camera trên thiết bị này.</Text>
      </View>
    );
  }

  // Chọn màu viền dựa trên trạng thái (Tạm dừng thì đỏ, đang quét thì xanh)
  const frameColor = state.isActive ? '#00e676' : '#F44336';

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={state.isActive}
          codeScanner={codeScanner}
        />
        
        {/* ✅ ĐÃ SỬA LỖI CÚ PHÁP COMMENT TRONG JSX TẠI ĐÂY */}
        {/* LỚP PHỦ GIAO DIỆN HIỆN ĐẠI */}
        <View style={styles.overlay}>
          {/* Vùng mờ bên trên */}
          <View style={styles.maskRow} />
          
          <View style={styles.maskCenter}>
            {/* Vùng mờ bên trái */}
            <View style={styles.maskCol} />
            
            {/* KHUNG QUÉT TRONG SUỐT */}
            <View style={[styles.scanFrame, { width: SCAN_FRAME_SIZE, height: SCAN_FRAME_SIZE }]}>
              {/* 4 Góc chữ L */}
              <View style={[styles.corner, styles.topLeft, { borderColor: frameColor }]} />
              <View style={[styles.corner, styles.topRight, { borderColor: frameColor }]} />
              <View style={[styles.corner, styles.bottomLeft, { borderColor: frameColor }]} />
              <View style={[styles.corner, styles.bottomRight, { borderColor: frameColor }]} />

              {/* Thanh Laser Animation */}
              {state.isActive && (
                <Animated.View
                  style={[
                    styles.laserLine,
                    { transform: [{ translateY: laserAnim }] },
                  ]}
                />
              )}
            </View>
            
            {/* Vùng mờ bên phải */}
            <View style={styles.maskCol} />
          </View>

          {/* Vùng mờ bên dưới & Hướng dẫn */}
          <View style={[styles.maskRow, styles.bottomMask]}>
            <Text style={styles.instructionText}>
              {state.isActive ? 'Di chuyển mã vạch vào khung hình' : 'Đã dừng quét'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff', padding: scale(20) },
  infoText: { marginTop: scale(10), fontSize: scale(14), color: '#757575' },
  errorText: { fontSize: scale(14), color: '#F44336', fontWeight: '600', textAlign: 'center', marginBottom: scale(20) },
  btnAction: { backgroundColor: '#2196F3', height: scale(44), justifyContent: 'center', alignItems: 'center', borderRadius: scale(4), paddingHorizontal: scale(20) },
  btnText: { color: '#fff', fontWeight: '800', letterSpacing: 1 },
  
  cameraContainer: { flex: 1, position: 'relative', backgroundColor: '#000' },
  
  // KIỂU DÁNG CHO OVERLAY HIỆN ĐẠI
  overlay: { ...StyleSheet.absoluteFillObject },
  maskRow: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  maskCol: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  maskCenter: { flexDirection: 'row' },
  bottomMask: { alignItems: 'center', paddingTop: scale(30) },
  
  instructionText: { color: '#ffffff', fontSize: scale(14), fontWeight: '500', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, overflow: 'hidden' },

  scanFrame: { position: 'relative', backgroundColor: 'transparent' },
  
  // 4 Góc vuông chữ L
  corner: { position: 'absolute', width: scale(40), height: scale(40), borderWidth: scale(4) },
  topLeft: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: scale(12) },
  topRight: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: scale(12) },
  bottomLeft: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: scale(12) },
  bottomRight: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: scale(12) },

  // Thanh Laser
  laserLine: { width: '100%', height: scale(2), backgroundColor: '#00e676', shadowColor: '#00e676', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10, elevation: 5 },
});