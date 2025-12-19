import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';

import OverviewScreen from '../screen/overview';
import DataScreen from '../screen/data';
import EventScreen from '../screen/event';
import PushStatusScreen from '../screen/pushstatus';
import BLEScreen from '../screen/ble';
import SettingsScreen from '../screen/settings'; // ✅ THÊM
import { storeContext } from '../store';

const Tab = createBottomTabNavigator();

export default function BottomBar() {
  const { state } = useContext(storeContext);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconText: string;

          if (route.name === 'Cấu hình') {
            iconText = '📊';
          } else if (route.name === 'Dữ liệu') {
            iconText = '📋';
          } else if (route.name === 'Sự kiện') {
            iconText = '⚠️';
          } else if (route.name === 'Trạng thái đẩy') {
            iconText = '📤';
          } else if (route.name === 'HU') {
            iconText = '📶';
          } else if (route.name === 'Cài đặt') {
            iconText = '⚙️'; // ✅ ICON SETTING
          } else {
            iconText = '○';
          }

          return (
            <View style={{ position: 'relative' }}>
              <Text style={{ fontSize: 20 }}>{iconText}</Text>
            </View>
          );
        },
        tabBarLabel: ({ focused, color }) => {
          let label = route.name;
          return <Text style={{ color, fontSize: 10 }}>{label}</Text>;
        },
        tabBarActiveTintColor: '#1976D2',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Cấu hình" component={OverviewScreen} />
      <Tab.Screen name="Dữ liệu" component={DataScreen} />
      <Tab.Screen name="Sự kiện" component={EventScreen} />
      <Tab.Screen name="Trạng thái đẩy" component={PushStatusScreen} />
      <Tab.Screen name="HU" component={BLEScreen} />
      <Tab.Screen name="Cài đặt" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
