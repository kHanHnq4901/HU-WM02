import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator 
} from 'react-native';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';


import { store } from '../../screen/overview/controller';
import { onBleLongPress, onBlePress } from './handleButton'; 
import { GetHookProps } from './controller';
import { scale } from '../../util/responsive';


interface Props {
  title: string;
  subTitle?: string;
}

export default function SystemHeader({
  title,
  subTitle,
}: Props) {
  GetHookProps();
  
  const connectState = store?.state.hhu.connect;
  const idConnected = store?.state.hhu.idConnected; // Lấy thêm ID thiết bị

  // 1. TẠO CẤU HÌNH GIAO DIỆN ĐỘNG DỰA TRÊN TRẠNG THÁI
  let statusUI = {
    // Nếu chưa có ID -> Báo người dùng "Giữ để kết nối"
    // Nếu có ID rồi -> Báo "Chạm để kết nối" (hoặc kết nối lại)
    text: idConnected ? 'Chạm để kết nối' : 'Giữ để tìm BLE', 
    icon: 'bluetooth-disabled',
    color: '#757575',       // Chữ/Icon Xám
    bgColor: '#F5F5F5',     // Nền Xám nhạt
  };

  if (connectState === 'CONNECTED') {
    statusUI = {
      text: 'Đã kết nối',
      icon: 'bluetooth-connected',
      color: '#2E7D32',     // Chữ/Icon Xanh lá đậm
      bgColor: '#E8F5E9',   // Nền Xanh lá nhạt
    };
  } else if (connectState === 'CONNECTING') {
    statusUI = {
      text: 'Đang kết nối',
      icon: '',
      color: '#1565C0',     // Chữ Xanh dương đậm
      bgColor: '#E3F2FD',   // Nền Xanh dương nhạt
    };
  }

  return (
    <View style={styles.systemBar}>
      {/* KHỐI TRÁI: TIÊU ĐỀ */}
      <View>
        <Text style={styles.systemTitle}>{title}</Text>
        {subTitle && (
          <Text style={styles.systemSub}>{subTitle}</Text>
        )}
      </View>

      {/* KHỐI PHẢI: NÚT TRẠNG THÁI HIỆN ĐẠI (PILL CHIP) */}
       <TouchableOpacity
         activeOpacity={0.7}
         onLongPress={() => {
           onBleLongPress();
         }}
         onPress={onBlePress}
         style={[styles.statusChip, { backgroundColor: statusUI.bgColor }]}
       >
         {connectState === 'CONNECTING' ? (
           <ActivityIndicator size={16} color={statusUI.color} style={{ marginRight: 6 }} />
         ) : (
           <MaterialIcons
             name={statusUI.icon}
             size={18}
             color={statusUI.color}
             style={{ marginRight: 4 }}
           />
         )}
         
         <Text style={[styles.statusText, { color: statusUI.color }]}>
           {statusUI.text}
         </Text>
       </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  systemBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(10),
    paddingBottom: scale(12),
    borderBottomWidth: 1,
    borderColor: '#EEEEEE'
  },
  systemTitle: {
    color: '#1565C0',
    fontSize: scale(16),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  systemSub: {
    color: '#78909C',
    fontSize: scale(10),
    marginTop: 2,
    fontWeight: '500',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    borderRadius: 20, 
  },
  statusText: {
    fontSize: scale(11),
    fontWeight: '700',
  }
});