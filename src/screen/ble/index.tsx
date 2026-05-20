import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { GetHookProps, PropsItemBle, hookProps, store, onInit, onDeInit } from './controller';
import { connectHandle, disConnect, onScanPress } from './handleButton';
import SystemHeader from '../../component/SystemHeader';

const rssiInfo = (rssi: number) => {
  if (rssi > -60) return { bar: '▂▄▆█', color: '#388E3C' };
  if (rssi > -80) return { bar: '▂▄▆_', color: '#F57C00' };
  return { bar: '▂▄__', color: '#D32F2F' };
};

const BleItem = (props: PropsItemBle) => {
  const isConn = props.id === store.state.hhu.idConnected;
  const ri = props.rssi !== undefined ? rssiInfo(props.rssi) : null;

  return (
    <TouchableOpacity
      style={[styles.deviceCard, isConn && styles.deviceCardConn]}
      onPress={() => connectHandle(props.id, props.name)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, { backgroundColor: isConn ? '#388E3C' : '#1565C0' }]}>
        <Text style={styles.iconTxt}>{isConn ? '✓' : '⬡'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.devName} numberOfLines={1}>{props.name || 'Không tên'}</Text>
        <Text style={styles.devId}  numberOfLines={1}>{props.id}</Text>
      </View>
      {ri && (
        <View style={styles.rssiBox}>
          <Text style={[styles.rssiBar, { color: ri.color }]}>{ri.bar}</Text>
          <Text style={[styles.rssiVal, { color: ri.color }]}>{props.rssi} dBm</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function BLEScreen() {
  GetHookProps();
  useEffect(() => { onInit(); onScanPress(); return () => onDeInit(); }, []);

  const scanning = hookProps.state.ble.isScan;

  return (
    <View style={styles.container}>
      <SystemHeader title="KẾT NỐI BLE" subTitle="Quét và kết nối thiết bị" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {store.state.hhu.connect === 'CONNECTED' && (
          <>
            <Text style={styles.sectionTitle}>Đang kết nối</Text>
            <BleItem
              id={store.state.hhu.idConnected as string}
              name={store.state.hhu.name as string}
              rssi={store.state.hhu.rssi || undefined}
            />
          </>
        )}

        <Text style={styles.sectionTitle}>Thiết bị khả dụng</Text>
        {hookProps.state.ble.listNewDevice.length > 0
          ? hookProps.state.ble.listNewDevice.map(item => (
              <BleItem key={item.id} id={item.id} name={item.name} rssi={item.rssi} />
            ))
          : <Text style={styles.emptyTxt}>{scanning ? 'Đang quét...' : 'Không tìm thấy thiết bị'}</Text>
        }

        {hookProps.state.ble.listBondedDevice.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Đã từng kết nối</Text>
            {hookProps.state.ble.listBondedDevice.map(item => (
              <BleItem key={item.id} id={item.id} name={item.name} rssi={item.rssi} />
            ))}
          </>
        )}
      </ScrollView>

      {/* bottom bar */}
      <View style={styles.bar}>
        {store.state.hhu.connect === 'CONNECTED' && (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#D32F2F', flex: 1 }]}
            onPress={() => disConnect(store.state.hhu.idConnected)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnTxt}>Ngắt kết nối</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: '#1565C0', flex: 1 }]}
          onPress={onScanPress}
          activeOpacity={0.8}
        >
          {scanning
            ? <View style={styles.btnRow}><ActivityIndicator size="small" color="#fff" /><Text style={[styles.btnTxt, { marginLeft: 8 }]}>Đang quét...</Text></View>
            : <Text style={styles.btnTxt}>Quét thiết bị</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  scroll: { padding: 8, paddingBottom: 72 },

  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: '#64748B',
    letterSpacing: 0.5, marginTop: 6, marginBottom: 4, marginLeft: 2,
  },

  deviceCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', padding: 10,
    marginBottom: 6, borderRadius: 10,
    borderWidth: 1, borderColor: '#DDE3EB',
  },
  deviceCardConn: { borderColor: '#388E3C', borderLeftWidth: 3, backgroundColor: '#F0FDF4' },

  iconCircle: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  iconTxt: { fontSize: 16, color: '#fff', fontWeight: 'bold' },

  devName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  devId:   { fontSize: 11, color: '#64748B', marginTop: 1 },

  rssiBox: { alignItems: 'flex-end', marginLeft: 8 },
  rssiBar: { fontSize: 11, fontWeight: 'bold' },
  rssiVal: { fontSize: 11, marginTop: 1 },

  emptyTxt: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 24, fontStyle: 'italic' },

  bar: {
    flexDirection: 'row', padding: 8, gap: 8,
    backgroundColor: '#F0F4F8', borderTopWidth: 1, borderColor: '#DDE3EB',
  },
  btn:    { height: 46, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  btnRow: { flexDirection: 'row', alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
