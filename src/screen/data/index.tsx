import React, { useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { GetHookProps, store } from './controller';
import { onReadData } from './handleButton';
import SystemHeader from '../../component/SystemHeader';

type DataItem = {
  id: number;
  time: string;
  forward: number;
  reverse: number;
  flow: number;
};

const ITEM_HEIGHT = 44;

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
  const isConnected = store.state.hhu.connect === 'CONNECTED';

  const renderItem = useCallback(({ item }: { item: DataItem }) => (
    <TableRow item={item} />
  ), []);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  const progressPercent = state.progress
    ? Math.round((state.progress.done / state.progress.total) * 100)
    : 0;

  const clearData = () => setState(p => ({ ...p, dataList: [] }));

  return (
    <View style={styles.container}>
      <SystemHeader title="ĐỌC DỮ LIỆU" subTitle="" />

      {/* NHẬP PHẠM VI */}
      <View style={styles.inputCard}>
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Từ bản ghi</Text>
            <TextInput
              style={[styles.input, state.isReading && styles.inputDisabled]}
              value={state.fromValue}
              onChangeText={t => setState(p => ({ ...p, fromValue: t.replace(/[^0-9]/g, '') }))}
              placeholder="1"
              keyboardType="numeric"
              editable={!state.isReading}
            />
          </View>
          <View style={styles.inputSeparator}>
            <Text style={styles.separatorText}>—</Text>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Đến bản ghi</Text>
            <TextInput
              style={[styles.input, state.isReading && styles.inputDisabled]}
              value={state.toValue}
              onChangeText={t => setState(p => ({ ...p, toValue: t.replace(/[^0-9]/g, '') }))}
              placeholder="720"
              keyboardType="numeric"
              editable={!state.isReading}
            />
          </View>
        </View>
        <Text style={styles.rangeHint}>Phạm vi hợp lệ: 1 – 720</Text>
      </View>

      {/* THANH TIẾN TRÌNH */}
      {state.isReading && state.progress && (
        <View style={styles.progressCard}>
          <View style={styles.progressTopRow}>
            <ActivityIndicator size="small" color="#1976D2" />
            <Text style={styles.progressLabel}>
              {'  '}Đang đọc khối {state.progress.done}/{state.progress.total}
            </Text>
            <Text style={styles.progressPercent}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` as any }]} />
          </View>
          <Text style={styles.progressSub}>Đã nhận {state.dataList.length} bản ghi</Text>
        </View>
      )}

      {/* HEADER BẢNG */}
      <View style={styles.tableHeaderRow}>
        <View style={styles.tableHeaderLeft}>
          <Text style={[styles.col, { flex: 0.5 }]}>#</Text>
          <Text style={[styles.col, { flex: 1.8 }]}>Thời gian</Text>
          <Text style={styles.col}>Xuôi</Text>
          <Text style={styles.col}>Ngược</Text>
          <Text style={styles.col}>Lưu lượng</Text>
        </View>
        {!state.isReading && state.dataList.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearData}>
            <Text style={styles.clearBtnText}>Xóa</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* DANH SÁCH */}
      <FlatList
        data={state.dataList}
        renderItem={renderItem}
        keyExtractor={item => String(item.id)}
        getItemLayout={getItemLayout}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={5}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
        contentContainerStyle={
          state.dataList.length === 0 ? styles.emptyContainer : { paddingBottom: 110 }
        }
        ListEmptyComponent={
          !state.isReading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Chưa có dữ liệu</Text>
              <Text style={styles.emptySubTitle}>Nhập phạm vi bản ghi và nhấn ĐỌC DỮ LIỆU</Text>
            </View>
          ) : null
        }
      />

      {/* THANH DƯỚI */}
      <View style={styles.bottomBar}>
        {!state.isReading && state.dataList.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{state.dataList.length} bản ghi</Text>
          </View>
        )}
        <TouchableOpacity
          style={[
            styles.btnRead,
            state.isReading && styles.btnStop,
            !isConnected && !state.isReading && styles.btnDisabled,
          ]}
          onPress={onReadData}
          disabled={!isConnected && !state.isReading}
          activeOpacity={0.8}
        >
          {state.isReading ? (
            <View style={styles.btnInner}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={[styles.btnText, { marginLeft: 8 }]}>DỪNG ĐỌC</Text>
            </View>
          ) : (
            <Text style={styles.btnText}>ĐỌC DỮ LIỆU</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9', padding: 8 },

  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, paddingHorizontal: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '500' },

  inputCard: {
    backgroundColor: '#fff', borderRadius: 8, padding: 8,
    marginBottom: 6, borderWidth: 1, borderColor: '#ddd',
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end' },
  inputGroup: { flex: 1 },
  inputLabel: { fontSize: 11, color: '#666', marginBottom: 3, fontWeight: '500' },
  input: {
    height: 34, borderWidth: 1, borderColor: '#ccc', borderRadius: 6,
    paddingHorizontal: 8, fontSize: 14, backgroundColor: '#fff', color: '#333',
  },
  inputDisabled: { backgroundColor: '#f5f5f5', color: '#999' },
  inputSeparator: { paddingHorizontal: 6, paddingBottom: 8, justifyContent: 'flex-end' },
  separatorText: { fontSize: 14, color: '#aaa' },
  rangeHint: { marginTop: 4, fontSize: 10, color: '#aaa', textAlign: 'right' },

  progressCard: {
    backgroundColor: '#E3F2FD', borderRadius: 8, padding: 8,
    marginBottom: 6, borderWidth: 1, borderColor: '#BBDEFB',
  },
  progressTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  progressLabel: { flex: 1, fontSize: 12, color: '#1565C0', fontWeight: '500' },
  progressPercent: { fontSize: 12, color: '#1565C0', fontWeight: '700' },
  progressBarBg: {
    height: 5, backgroundColor: '#BBDEFB', borderRadius: 4, overflow: 'hidden', marginBottom: 3,
  },
  progressBarFill: { height: 5, backgroundColor: '#1976D2', borderRadius: 4 },
  progressSub: { fontSize: 10, color: '#1565C0', textAlign: 'right' },

  tableHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#388E3C', borderRadius: 6,
    paddingVertical: 6, paddingLeft: 0, paddingRight: 6, marginBottom: 1,
  },
  tableHeaderLeft: { flex: 1, flexDirection: 'row' },
  col: { flex: 1, color: '#fff', fontWeight: 'bold', fontSize: 11, textAlign: 'center' },
  clearBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 10,
  },
  clearBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  tableRow: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderColor: '#eee',
    height: ITEM_HEIGHT, alignItems: 'center',
  },
  cell: { flex: 1, fontSize: 12, textAlign: 'center', color: '#333' },

  emptyContainer: { flex: 1, justifyContent: 'center' },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#aaa', marginBottom: 6 },
  emptySubTitle: { fontSize: 12, color: '#bbb', textAlign: 'center' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 8, backgroundColor: '#f4f6f9',
    borderTopWidth: 1, borderColor: '#ddd',
  },
  countBadge: {
    alignSelf: 'center', marginBottom: 4,
    backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 2,
    borderRadius: 10, borderWidth: 1, borderColor: '#C8E6C9',
  },
  countText: { fontSize: 11, color: '#388E3C', fontWeight: '600' },
  btnRead: {
    height: 44, backgroundColor: '#388E3C',
    borderRadius: 8, justifyContent: 'center', alignItems: 'center',
  },
  btnStop: { backgroundColor: '#D32F2F' },
  btnDisabled: { backgroundColor: '#9E9E9E' },
  btnInner: { flexDirection: 'row', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
