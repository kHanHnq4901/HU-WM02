import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';

import BottomBar from './BottomBar'; 

import ble from '../screen/ble'; 
import { scale } from '../theme'; // scale lúc này là số (ví dụ: 1.047)
import BarcodeScreen from '../screen/barcode';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: '#fff' },
        animation: 'slide_from_right', 
      }}
    >
      <Stack.Screen name="MainTabs" component={BottomBar} />

      <Stack.Screen 
        name="BarcodeScreen" 
        component={BarcodeScreen} 
        options={{ 
           headerShown: true, 
           title: 'Quét Barcode',
           headerTitleAlign: 'center',
           headerShadowVisible: false,
           headerStyle: { 
             backgroundColor: '#fff', 
             height: 56 * scale // Ép chiều cao chuẩn theo tỉ lệ
           },
           // FIX: Tắt tự động tính lề Status Bar để Header nhảy lên Top 0
           ...({ 
             headerTopInsetEnabled: false,
             headerStatusBarHeight: 0,
             statusBarTranslucent: true 
           } as any),
        }} 
      />

      <Stack.Screen 
        name="BLEScreen" 
        component={ble} 
        options={{ 
           headerShown: true, 
           title: 'Quản lý BLE',
           headerShadowVisible: false,
           headerStyle: { backgroundColor: '#fff', height: 56 * scale },
           ...({ 
             headerTopInsetEnabled: false,
             headerStatusBarHeight: 0,
             statusBarTranslucent: true 
           } as any),
        }}
      />
    </Stack.Navigator>
  );
}