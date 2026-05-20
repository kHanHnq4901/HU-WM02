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
import { GetHookProps, PushStatusItem, store } from './controller';
import { onReadData } from './handleButton';
import SystemHeader from '../../component/SystemHeader';

const ITEM_HEIGHT = 44;

const StatusRow = React.memo(({ item }: { item: PushStatusItem }) => (
  <View style={styles.tableRow}>
    <Text style={[styles.cell, { flex: 0.5 }]}>{item.id}</Text>
    <Text style={[styles.cell, { flex: 1.6 }]}>{item.time}</Text>
    <Text style={[styles.cell, { flex: 2, color: item.status === 'Thành công' ? '#388E3C' : '#D32F2F' }]}>
      {item.status}
    </Text>
  </View>
));

export default function PushStatusScreen() {
  const { state, setState } = GetHookProps();
  const connected = store?.state?.hhu?.connect === 'CONNECTED';

  const renderItem = useCallback(({ item }: { item: PushStatusItem }) => (
    <StatusRow item={item} />
  ), []);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index,
  }), []);

  const progressPercent = state.progress
    ? Math.round((state.progress.done / state.progress.total) * 100)
    : 0;

  const clearData = () => setState(p => ({ ...p, statusList: [] }));

  return (
    <View style={styles.container}>
      <SystemHeader title="TRẠNG THÁI ĐẨY" subTitle="" />

      {/* NHẬP PHẠM VI */}
      <View style={styles.inputCard}>
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Từ bản tin</Text>
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
            <Text style={styles.inputLabel}>Đến bản tin</Text>
            <TextInput
              style={[styles.input, state.isReading && styles.inputDisabled]}
              value={state.toValue}
              onChangeText={t => setState(p => ({ ...p, toValue: t.replace(/[^0-9]/g, '') }))}
              placeholder="100"
              keyboardType="numeric"
              editable={!state.isReading}
            />
          </View>
        </View>
        <Text style={styles.rangeHint}>Phạm vi hợp lệ: 1 – 100</Text>
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
          <Text style={styles.progressSub}>Đã nhận {state.statusList.length} bản tin</Text>
        </View>
      )}

      {/* HEADER BẢNG */}
      <View style={styles.tableHeaderRow}>
        <View style={styles.tableHeaderLeft}>
          <Text style={[styles.col, { flex: 0.5 }]}>#</Text>
          <Text style={[styles.col, { flex: 1.6 }]}>Thời gian</Text>
          <Text style={[styles.col, { flex: 2 }]}>Trạng thái</Text>
        </View>
        {!state.isReading && state.statusList.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearData}>
            <Text style={styles.clearBtnText}>Xóa</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* DANH SÁCH */}
      <FlatList
        data={state.statusList}
        renderItem={renderItem}
        keyExtractor={item => String(item.id)}
        getItemLayout={getItemLayout}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={5}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
        contentContainerStyle={
          state.statusList.length === 0 ? styles.emptyContainer : { paddingBottom: 110 }
        }
        ListEmptyComponent={
          !state.isReading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Chưa có dữ liệu</Text>
              <Text style={styles.emptySubTitle}>Nhập phạm vi và nhấn ĐỌC TRẠNG THÁI</Text>
            </View>
          ) : null
        }
      />

      {/* THANH DƯỚI */}
      <View style={styles.bottomBar}>
        {!state.isReading && state.statusList.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{state.statusList.length} bản tin</Text>
          </View>
        )}
        <TouchableOpacity
          style={[
            styles.btnRead,
            state.isReading && styles.btnStop,
            !connected && !state.isReading && styles.btnDisabled,
          ]}
          onPress={onReadData}
          disabled={!connected && !state.isReading}
          activeOpacity={0.8}
        >
          {state.isReading ? (
            <View style={styles.btnInner}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={[styles.btnText, { marginLeft: 8 }]}>DỪNG ĐỌC</Text>
            </View>
          ) : (
            <Text style={styles.btnText}>ĐỌC TRẠNG THÁI</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8', padding: 10 },

  inputCard: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: '#DDE3EB',
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end' },
  inputGroup: { flex: 1 },
  inputLabel: { fontSize: 11, color: '#64748B', marginBottom: 3, fontWeight: '600' },
  input: {
    height: 36, borderWidth: 1, borderColor: '#DDE3EB', borderRadius: 8,
    paddingHorizontal: 10, fontSize: 14, backgroundColor: '#fff', color: '#1E293B',
  },
  inputDisabled: { backgroundColor: '#F8FAFB', color: '#94A3B8' },
  inputSeparator: { paddingHorizontal: 8, paddingBottom: 7, justifyContent: 'flex-end' },
  separatorText: { fontSize: 14, color: '#94A3B8' },
  rangeHint: { marginTop: 3, fontSize: 10, color: '#94A3B8', textAlign: 'right' },

  progressCard: {
    backgroundColor: '#EFF6FF', borderRadius: 10, padding: 10,
    marginBottom: 8, borderWidth: 1, borderColor: '#BBDEFB',
  },
  progressTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  progressLabel: { flex: 1, fontSize: 12, color: '#1565C0', fontWeight: '600' },
  progressPercent: { fontSize: 12, color: '#1565C0', fontWeight: '700' },
  progressBarBg: { height: 5, backgroundColor: '#BBDEFB', borderRadius: 4, overflow: 'hidden', marginBottom: 3 },
  progressBarFill: { height: 5, backgroundColor: '#1976D2', borderRadius: 4 },
  progressSub: { fontSize: 10, color: '#1565C0', textAlign: 'right' },

  tableHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#263238', borderRadius: 8,
    paddingVertical: 7, paddingLeft: 0, paddingRight: 8, marginBottom: 1,
  },
  tableHeaderLeft: { flex: 1, flexDirection: 'row' },
  col: { flex: 1, color: '#fff', fontWeight: '700', fontSize: 11, textAlign: 'center' },
  clearBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 10,
  },
  clearBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  tableRow: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderColor: '#F0F4F8',
    height: ITEM_HEIGHT, alignItems: 'center',
  },
  cell: { flex: 1, fontSize: 12, textAlign: 'center', color: '#1E293B' },

  emptyContainer: { flex: 1, justifyContent: 'center' },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#94A3B8', marginBottom: 6 },
  emptySubTitle: { fontSize: 12, color: '#B0BEC5', textAlign: 'center' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 10, backgroundColor: '#F0F4F8',
    borderTopWidth: 1, borderColor: '#DDE3EB',
  },
  countBadge: {
    alignSelf: 'center', marginBottom: 5,
    backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 3,
    borderRadius: 12, borderWidth: 1, borderColor: '#BBDEFB',
  },
  countText: { fontSize: 11, color: '#1565C0', fontWeight: '700' },
  btnRead: { height: 46, backgroundColor: '#1565C0', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  btnStop: { backgroundColor: '#C62828' },
  btnDisabled: { backgroundColor: '#B0BEC5' },
  btnInner: { flexDirection: 'row', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
