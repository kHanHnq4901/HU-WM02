import React, { useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { Colors } from '../../theme';
import {
  GetHookProps,
  PropsItemBle,
  hookProps,
  store,
  onInit,
  onDeInit,
} from './controller';
import { connectHandle, disConnect, onScanPress } from './handleButton';

const getRssiDisplay = (rssi: number) => {
  if (rssi > -60) {
    return { icon: '📶', color: '#4CAF50', label: 'Mạnh' };
  }
  if (rssi > -80) {
    return { icon: '📶', color: '#FFC107', label: 'Trung bình' };
  }
  return { icon: '📶', color: '#F44336', label: 'Yếu' };
};

const BleItem = (props: PropsItemBle & { statusLabel?: string }) => {
  const isConnected = props.id === store.state.hhu.idConnected;
  const rssiUI =
    props.rssi !== undefined ? getRssiDisplay(props.rssi) : null;

  return (
    <TouchableOpacity
      style={[
        styles.deviceCard,
        isConnected && {
          borderLeftColor: '#4CAF50',
          borderLeftWidth: 4,
        },
      ]}
      onPress={() => connectHandle(props.id, props.name)}
    >
      {/* ICON */}
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: isConnected ? '#4CAF50' : Colors.primary },
        ]}
      >
        <Text style={{ fontSize: 18, color: '#fff' }}>
          {isConnected ? '🔗' : '📡'}
        </Text>
      </View>

      {/* INFO */}
      <View style={{ flex: 1 }}>
        <Text style={styles.deviceName} numberOfLines={1}>
          {props.name || 'Không tên'}
        </Text>
        <Text style={styles.deviceId} numberOfLines={1}>
          ID: {props.id}
        </Text>
        {props.statusLabel && (
          <Text
            style={[
              styles.deviceStatus,
              { color: isConnected ? '#4CAF50' : '#999' },
            ]}
          >
            {props.statusLabel}
          </Text>
        )}
      </View>

      {/* RSSI */}
      {rssiUI && (
        <View style={styles.rssiContainer}>
          <Text style={{ fontSize: 14, color: rssiUI.color }}>
            {rssiUI.icon}
          </Text>
          <Text style={[styles.rssiText, { color: rssiUI.color }]}>
            {props.rssi} dBm
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function BLEScreen() {
  GetHookProps();

  useEffect(() => {
    onInit();
    onScanPress();
    return () => onDeInit();
  }, []);

  return (
    <LinearGradient colors={['#f9fbfd', '#eef3f7']} style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={{ fontSize: 18 }}>📡</Text>
        <Text style={styles.headerTitle}>Quản lý thiết bị BLE</Text>
        {hookProps.state.ble.isScan && (
          <ActivityIndicator size="small" color="#007bff" />
        )}
      </View>

      <View style={styles.dashboard}>
        <View style={[styles.card, { backgroundColor: '#4CAF50' }]}>
          <Text style={{ fontSize: 20 }}>🔗</Text>
          <Text style={styles.cardValue}>
            {store.state.hhu.connect === 'CONNECTED' ? 1 : 0}
          </Text>
          <Text style={styles.cardLabel}>Đang kết nối</Text>
        </View>

        <View style={[styles.card, { backgroundColor: '#007bff' }]}>
          <Text style={{ fontSize: 20 }}>📡</Text>
          <Text style={styles.cardValue}>
            {hookProps.state.ble.listNewDevice.length}
          </Text>
          <Text style={styles.cardLabel}>Mới quét</Text>
        </View>

        <View style={[styles.card, { backgroundColor: '#ff9800' }]}>
          <Text style={{ fontSize: 20 }}>🕘</Text>
          <Text style={styles.cardValue}>
            {hookProps.state.ble.listBondedDevice.length}
          </Text>
          <Text style={styles.cardLabel}>Đã từng</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
      >
        {store.state.hhu.connect === 'CONNECTED' && (
          <>
            <Text style={styles.sectionTitle}>🔗 Đang kết nối</Text>
            <BleItem
              id={store.state.hhu.idConnected as string}
              name={store.state.hhu.name as string}
              rssi={store.state.hhu.rssi || undefined}
              statusLabel="Kết nối thành công"
            />
          </>
        )}

        <Text style={styles.sectionTitle}>📡 Thiết bị khả dụng</Text>

        {hookProps.state.ble.listNewDevice.length > 0 ? (
          hookProps.state.ble.listNewDevice.map(item => (
            <BleItem
              key={item.id}
              id={item.id}
              name={item.name}
              rssi={item.rssi}
              statusLabel="Chưa kết nối"
            />
          ))
        ) : (
          <Text style={styles.emptyText}>Không tìm thấy thiết bị mới</Text>
        )}

        {hookProps.state.ble.listBondedDevice.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>🕘 Đã từng kết nối</Text>
            {hookProps.state.ble.listBondedDevice.map(item => (
              <BleItem
                key={item.id}
                id={item.id}
                name={item.name}
                rssi={item.rssi}
                statusLabel="Đã kết nối trước đây"
              />
            ))}
          </>
        )}
      </ScrollView>

      {store.state.hhu.connect === 'CONNECTED' && (
        <TouchableOpacity
          onPress={() => disConnect(store.state.hhu.idConnected)}
          style={[styles.fab, { bottom: 90, backgroundColor: '#d9534f' }]}
        >
          <Text style={{ fontSize: 22, color: '#fff' }}>❌</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={onScanPress} style={styles.fab}>
        {hookProps.state.ble.isScan ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={{ fontSize: 22, color: '#fff' }}>🔍</Text>
        )}
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fff',
    elevation: 2,
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  dashboard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  card: {
    flex: 1,
    marginHorizontal: 6,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  cardLabel: {
    fontSize: 12,
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
    marginVertical: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  deviceId: {
    fontSize: 12,
    color: '#777',
  },
  deviceStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  rssiContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  rssiText: {
    fontSize: 11,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: Colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});
