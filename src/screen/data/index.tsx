import React, { useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { GetHookProps } from './controller';
import { onReadData } from './handleButton';
import SystemHeader from '../../component/SystemHeader';

type DataItem = {
  id: number;
  time: string;
  forward: number;
  reverse: number;
  flow: number;
};

// 1. Cố định chiều cao của 1 dòng để dùng cho getItemLayout
const ITEM_HEIGHT = 45;

const TableRow = React.memo(({ item }: { item: DataItem }) => (
  <View style={styles.tableRow}>
    <Text style={[styles.cell, { flex: 0.5 }]}>{item.id}</Text>
    <Text style={[styles.cell, { flex: 1.8 }]}>{item.time}</Text>
    <Text style={styles.cell}>{item.forward}</Text>
    <Text style={styles.cell}>{item.reverse}</Text>
    <Text style={styles.cell}>{item.flow}</Text>
  </View>
));

export default function DataScreen() {
  const { state, setState } = GetHookProps();

  const renderItem = useCallback(({ item }: { item: DataItem }) => (
    <TableRow item={item} />
  ), []);

  // 2. Thêm hàm getItemLayout để bỏ qua bước tính toán layout của React Native
  const getItemLayout = useCallback((data: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  return (
    <View style={styles.container}>
      <SystemHeader title="ĐỌC DỮ LIỆU" subTitle="TỪ (1-720)" />

      <View style={styles.filterBox}>
        <View style={styles.filterInputs}>
          <TextInput
            style={styles.input}
            value={state.fromValue}
            onChangeText={t => setState(p => ({ ...p, fromValue: t }))}
            placeholder="Từ"
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={state.toValue}
            onChangeText={t => setState(p => ({ ...p, toValue: t }))}
            placeholder="Đến"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.col, { flex: 0.5 }]}>#</Text>
        <Text style={[styles.col, { flex: 1.8 }]}>Thời gian</Text>
        <Text style={styles.col}>Chỉ số xuôi</Text>
        <Text style={styles.col}>Chỉ số ngược</Text>
        <Text style={styles.col}>Lưu lượng</Text>
      </View>

      <FlatList
        data={state.dataList}
        renderItem={renderItem}
        keyExtractor={item => String(item.id)}
        getItemLayout={getItemLayout} // <--- Áp dụng tại đây
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={5}
        removeClippedSubviews={true}
        contentContainerStyle={{ paddingBottom: 100 }}
        // Tránh giật UI khi cuộn siêu nhanh
        updateCellsBatchingPeriod={50}
      />

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.btnRead, state.isReading && { backgroundColor: '#D32F2F' }]}
          onPress={onReadData}
        >
          <Text style={styles.btnText}>
            {state.isReading ? 'DỪNG' : 'ĐỌC DỮ LIỆU'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9', padding: 10 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 15, backgroundColor: '#f4f6f9', borderTopWidth: 1, borderColor: '#ddd',
  },
  btnRead: { height: 48, backgroundColor: '#388E3C', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  filterBox: { backgroundColor: '#fff', borderRadius: 8, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#ddd' },
  filterInputs: { flexDirection: 'row' },
  input: { flex: 1, height: 40, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 8, marginRight: 6, fontSize: 14, backgroundColor: '#fff' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#388E3C', paddingVertical: 8, borderRadius: 6 },
  col: { flex: 1, color: '#fff', fontWeight: 'bold', fontSize: 12, textAlign: 'center' },
  
  // 3. Đảm bảo height của tableRow khớp chuẩn xác với ITEM_HEIGHT đã khai báo
  tableRow: { 
    flexDirection: 'row', 
    backgroundColor: '#fff',   
    borderBottomWidth: 1, 
    borderColor: '#eee', 
    height: ITEM_HEIGHT, // Cố định chiều cao
    alignItems: 'center' // Căn giữa nội dung thay vì dùng paddingVertical
  },
  cell: { flex: 1, fontSize: 12, textAlign: 'center', color: '#333' },
});