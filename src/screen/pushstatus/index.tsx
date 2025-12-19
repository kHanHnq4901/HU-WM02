import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { storeContext } from '../../store';
import { GetHookProps, hookProps } from './controller';
import { onReadData } from './handleButton';

export default function PushStatusScreen() {

  const hookProps = GetHookProps();
  const { state, setState } = hookProps;
  return (
  <View style={styles.container}>
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.filterBox}>
        <View style={styles.filterRow}>
          <Text style={styles.label}>Đọc trạng thái đẩy từ (1 - 100)</Text>
        </View>

        <View style={styles.filterInputs}>
          <TextInput
            style={[
              styles.input,
            ]}
            value={state.fromValue}
            onChangeText={t =>
              setState(p => ({ ...p, fromValue: t }))
            }
            placeholder="Từ"
            keyboardType="numeric"
          />
          <TextInput
            style={[
              styles.input,
            ]}
            value={state.toValue}
            onChangeText={t =>
              setState(p => ({ ...p, toValue: t }))
            }
            placeholder="Đến"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.col, { flex: 0.6 }]}>#</Text>
        <Text style={[styles.col, { flex: 1.6 }]}>Thời gian</Text>
        <Text style={[styles.col, { flex: 2 }]}>Trạng thái</Text>
      </View>
      {state.statusList.map(i => (
        <View key={i.id} style={styles.tableRow}>
          <Text style={[styles.cell, { flex: 0.6 }]}>{i.id}</Text>
          <Text style={[styles.cell, { flex: 1.6 }]}>{i.time}</Text>
          <Text style={[styles.cell, { flex: 2 }]}>{i.status}</Text>
        </View>
      ))}
    </ScrollView>

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
  container: {
    flex: 1,
    backgroundColor: '#f4f6f9',
    padding: 10,
  },
  scrollContent: {
  paddingBottom: 90, 
  },

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
  filterBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },

  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },

  filterInputs: {
    flexDirection: 'row',
    marginTop: 8,
  },

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

  inputDisable: {
    backgroundColor: '#eee',
  },


  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#388E3C',
    paddingVertical: 6,
    borderRadius: 6,
  },

  col: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },

  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingVertical: 6,
  },

  cell: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
  },
});
