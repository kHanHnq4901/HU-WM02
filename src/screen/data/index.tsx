import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { GetHookProps } from './controller';
import { onReadData } from './handleButton';

type DataItem = {
  id: number;
  time: string;
  forward: number;
  reverse: number;
  flow: number;
};

export default function DataScreen() {
  const hookProps = GetHookProps();
  const { state, setState } = hookProps;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ================= FILTER ================= */}
        <View style={styles.filterBox}>
          <Text style={styles.label}>Đọc dữ liệu (1 - 720)</Text>

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

        {/* ================= TABLE HEADER ================= */}
        <View style={styles.tableHeader}>
          <Text style={[styles.col, { flex: 0.5 }]}>#</Text>
          <Text style={[styles.col, { flex: 1.8 }]}>Thời gian</Text>
          <Text style={styles.col}>Chỉ số xuôi</Text>
          <Text style={styles.col}>Chỉ số ngược</Text>
          <Text style={styles.col}>Lưu lượng</Text>
        </View>

        {/* ================= TABLE BODY ================= */}
        {state.dataList?.map((item: DataItem) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={[styles.cell, { flex: 0.5 }]}>{item.id}</Text>
            <Text style={[styles.cell, { flex: 1.8 }]}>{item.time}</Text>
            <Text style={styles.cell}>{item.forward}</Text>
            <Text style={styles.cell}>{item.reverse}</Text>
            <Text style={styles.cell}>{item.flow}</Text>
          </View>
        ))}
      </ScrollView>

      {/* ================= BOTTOM BAR ================= */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.btnRead,
            state.isReading && { backgroundColor: '#D32F2F' },
          ]}
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

/* ===================== STYLE ===================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9', padding: 10 },
  scrollContent: { paddingBottom: 90 },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: '#f4f6f9',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },

  btnRead: {
    height: 45,
    backgroundColor: '#388E3C',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  filterBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },

  filterInputs: { flexDirection: 'row', marginTop: 8 },

  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },

  input: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 8,
    marginRight: 6,
    fontSize: 13,
    backgroundColor: '#fff',
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#388E3C',
    paddingVertical: 6,
    borderRadius: 6,
  },

  col: { flex: 1, color: '#fff', fontWeight: 'bold', fontSize: 12, textAlign: 'center' },

  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingVertical: 6,
  },

  cell: { flex: 1, fontSize: 12, textAlign: 'center', color: '#333' },
});
