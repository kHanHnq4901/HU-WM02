import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Switch,
} from 'react-native';
import { requestBlePermission } from '../../util/ble';
import { GetHookProps } from './controller';
import { Read, Write } from './handleButton';
import { Radio } from '../../component/radio';


type FieldUI = {
  label: string;
  chkKey: keyof ReturnType<typeof GetHookProps>['state'];
  inputKey: keyof ReturnType<typeof GetHookProps>['state'];
};

/* ================= MAIN ================= */

export default function Overview() {
  useEffect(() => {
    requestBlePermission();
  }, []);

  const hookProps = GetHookProps();
  const { state, setState } = hookProps;

  /* ================= FIELD LIST ================= */

  const fieldList: FieldUI[] = useMemo(
    () => [
      { label: 'Serial Module', chkKey: 'chkModuleNo', inputKey: 'inputModuleNo' },
      { label: 'Số seri đồng hồ', chkKey: 'chkMeterNo', inputKey: 'inputMeterNo' },
      { label: 'Thời gian RTC', chkKey: 'chkRTC', inputKey: 'inputRTC' },
      { label: 'Phiên bản Firmware', chkKey: 'chkFirmwareVer', inputKey: 'inputFirmwareVer' },
      { label: 'Phiên bản Boot', chkKey: 'chkBootVer', inputKey: 'inputBootVer' },
      { label: 'Chỉ số xuôi (L)', chkKey: 'chkImpData', inputKey: 'inputImpData' },
      { label: 'Chỉ số ngược (L)', chkKey: 'chkExpData', inputKey: 'inputExpData' },
      { label: 'Địa chỉ IP', chkKey: 'chkIPPORT', inputKey: 'inputIPPORT' },
      { label: 'Chu kỳ lưu (phút)', chkKey: 'chkLatchPeriod', inputKey: 'inputLatchPeriod' },
      { label: 'Chu kỳ gửi (phút)', chkKey: 'chkPushPeriod', inputKey: 'inputPushPeriod' },

      // ===== RADIO =====
      { label: 'Phương thức gửi', chkKey: 'chkPushMethod', inputKey: 'inputPushMethod' },
      { label: 'Trạng thái kích hoạt thiết bị', chkKey: 'chkEnableDevice', inputKey: 'inputEnableDevice' },
      { label: 'Phương thức gửi sự kiện', chkKey: 'chkPushEventMethod', inputKey: 'inputPushEventMethod' },

      { label: 'Lưu lượng Q3', chkKey: 'chkQ3', inputKey: 'inputQ3' },
      { label: 'Số lít mỗi vòng', chkKey: 'chkLPR', inputKey: 'inputLPR' },
      { label: 'Loại Module', chkKey: 'chkModuleType', inputKey: 'inputModuleType' },
      { label: 'Thời điểm gửi 1', chkKey: 'chkPushTime1', inputKey: 'inputPushTime1' },
      { label: 'Thời điểm gửi 2', chkKey: 'chkPushTime2', inputKey: 'inputPushTime2' },
      { label: 'Trạng thái reset gần nhất', chkKey: 'chkTemp', inputKey: 'inputTemp' },
      { label: 'Điện áp (V)', chkKey: 'chkVoltage', inputKey: 'inputVoltage' },
      { label: 'Thời gian pin còn lại', chkKey: 'chkRemainBattery', inputKey: 'inputRemainBattery' },
      { label: 'Số lần Reset', chkKey: 'chkResetCount', inputKey: 'inputResetCount' },
      { label: 'Dung lượng pin', chkKey: 'chkBatteryCapacity', inputKey: 'inputBatteryCapacity' },
      { label: 'Cấu hình sự kiện', chkKey: 'chkEventConfig', inputKey: 'inputEventConfig' },
      { label: 'Thời gian ngẫu nhiên', chkKey: 'chkRandomMin', inputKey: 'inputRandomMin' },
      { label: 'Múi giờ', chkKey: 'chkTimeZone', inputKey: 'inputTimeZone' },
      { label: 'QCCID', chkKey: 'chkQCCID', inputKey: 'inputQCCID' },
    ],
    []
  );

  /* ================= HANDLER ================= */

  const toggleCheck = (key: any) => {
    setState(p => ({ ...p, [key]: !p[key] }));
  };

  const updateValue = (key: any, value: string) => {
    setState(p => ({ ...p, [key]: value }));
  };

  const selectAll = () => {
    setState(p => {
      const n = { ...p };
      fieldList.forEach(f => (n[f.chkKey] = true));
      return n;
    });
  };

  const unselectAll = () => {
    setState(p => {
      const n = { ...p };
      fieldList.forEach(f => (n[f.chkKey] = false));
      return n;
    });
  };

  /* ================= RENDER FIELD ================= */

  const renderField = (item: FieldUI) => {
    const enabled = !!state[item.chkKey];

    return (
      <View style={styles.field}>
        {/* CHECKBOX */}
        <View style={styles.checkRow}>
          <Switch
            value={enabled}
            onValueChange={() => toggleCheck(item.chkKey)}
          />
          <TouchableOpacity onPress={() => toggleCheck(item.chkKey)}>
            <Text style={styles.label}>{item.label}</Text>
          </TouchableOpacity>
        </View>

        {/* ===== RADIO 0 / 1 ===== */}
        {item.inputKey === 'inputEnableDevice' && (
          <View style={styles.radioRow}>
            <Radio
              label="Tắt"
              checked={state.inputEnableDevice === '0'}
              disabled={!enabled}
              onPress={() => updateValue(item.inputKey, '0')}
            />
            <Radio
              label="Bật"
              checked={state.inputEnableDevice === '1'}
              disabled={!enabled}
              onPress={() => updateValue(item.inputKey, '1')}
            />
          </View>
        )}

        {/* ===== RADIO 1 / 2 ===== */}
        {item.inputKey === 'inputPushMethod' && (
          <View style={styles.radioRow}>
            <Radio
              label="Chu kỳ"
              checked={state.inputPushMethod === '1'}
              disabled={!enabled}
              onPress={() => updateValue(item.inputKey, '1')}
            />
            <Radio
              label="Thời điểm"
              checked={state.inputPushMethod === '2'}
              disabled={!enabled}
              onPress={() => updateValue(item.inputKey, '2')}
            />
          </View>
        )}

        {item.inputKey === 'inputPushEventMethod' && (
          <View style={styles.radioRow}>
        
            <Radio
              label="Gửi theo chu kỳ"
              checked={state.inputPushEventMethod === '1'}
              disabled={!enabled}
              onPress={() => updateValue(item.inputKey, '1')}
            />
            <Radio
              label="Gửi tức thời"
              checked={state.inputPushEventMethod === '2'}
              disabled={!enabled}
              onPress={() => updateValue(item.inputKey, '2')}
            />
          </View>
        )}

        {/* ===== INPUT ===== */}
        {![
          'inputEnableDevice',
          'inputPushMethod',
          'inputPushEventMethod',
        ].includes(item.inputKey as string) && (
          <TextInput
            value={String(state[item.inputKey] ?? '')}
            editable={enabled}
            onChangeText={t => updateValue(item.inputKey, t)}
            style={[
              styles.input,
              !enabled && styles.inputDisable,
            ]}
          />
        )}
      </View>
    );
  };

  /* ================= RENDER ================= */

  return (
    <KeyboardAvoidingView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={styles.title}>CẤU HÌNH</Text>

        <View style={styles.selectRow}>
          <TouchableOpacity onPress={selectAll}>
            <Text style={styles.selectAll}>✔ Chọn tất cả</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={unselectAll}>
            <Text style={styles.unselectAll}>✖ Hủy chọn</Text>
          </TouchableOpacity>
        </View>

        {Array.from({ length: Math.ceil(fieldList.length / 2) }).map((_, i) => (
          <View key={i} style={styles.doubleRow}>
            {renderField(fieldList[i * 2])}
            {fieldList[i * 2 + 1] && renderField(fieldList[i * 2 + 1])}
          </View>
        ))}
        <View style={styles.commandBox}>
          <Text style={styles.commandTitle}>LỆNH ĐIỀU KHIỂN</Text>

          <View style={styles.commandItem}>
            <Switch
              value={state.chkClearData}
              onValueChange={() => toggleCheck('chkClearData')}
            />
            <Text style={styles.commandLabel}>Xóa dữ liệu</Text>
          </View>

          <View style={styles.commandItem}>
            <Switch
              value={state.chkPushData}
              onValueChange={() => toggleCheck('chkPushData')}
            />
            <Text style={styles.commandLabel}>Gửi dữ liệu ngay</Text>
          </View>

          <View style={styles.commandItem}>
            <Switch
              value={state.chkResetModule}
              onValueChange={() => toggleCheck('chkResetModule')}
            />
            <Text style={styles.commandLabel}>Reset Module</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.btnRead} onPress={() => Read()}>
          <Text style={styles.btnText}>ĐỌC</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnWrite} onPress={() => Write()}>
          <Text style={styles.btnText}>GHI</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  title: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', margin: 10 },
  selectRow: { flexDirection: 'row', justifyContent: 'space-between', margin: 10 },
  selectAll: { color: '#1976D2', fontWeight: 'bold' },
  unselectAll: { color: '#D32F2F', fontWeight: 'bold' },

  doubleRow: { flexDirection: 'row' },
  field: { flex: 1, margin: 6, backgroundColor: '#fff', padding: 8, borderRadius: 8 },

  checkRow: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 11, marginLeft: 6 },

  input: { borderWidth: 1, borderRadius: 5, padding: 6, marginTop: 6 },
  inputDisable: { backgroundColor: '#eee' },

  radioRow: { flexDirection: 'row', marginTop: 6, flexWrap: 'wrap' },
  radioItem: { flexDirection: 'row', alignItems: 'center', marginRight: 14 },
  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1976D2',
  },

  radioLabel: { marginLeft: 6 },

  bottomButtons: { flexDirection: 'row', padding: 8 },
  btnRead: { flex: 1, backgroundColor: '#1976D2', margin: 6, padding: 12, borderRadius: 8 },
  btnWrite: { flex: 1, backgroundColor: '#D32F2F', margin: 6, padding: 12, borderRadius: 8 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  commandBox: {
  margin: 10,
  padding: 10,
  backgroundColor: '#fff',
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#ddd',
},

commandTitle: {
  fontWeight: 'bold',
  marginBottom: 8,
  color: '#333',
},

commandItem: {
  flexDirection: 'row',
  alignItems: 'center',
  marginVertical: 6,
},

commandLabel: {
  marginLeft: 8,
  fontSize: 13,
},

});
