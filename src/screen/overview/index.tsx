import React, { useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, ActivityIndicator, Platform,
} from 'react-native';
import { requestBlePermission } from '../../util/ble';
import { formatRTC, GetHookProps, store } from './controller';
import { Read, Write } from './handleButton';
import { Radio } from '../../component/radio';
import SystemHeader from '../../component/SystemHeader';

/* ---- chip definitions ---- */
const CHIPS = [
  { label: 'Serial Module',    chkKey: 'chkModuleNo' },
  { label: 'Seri đồng hồ',    chkKey: 'chkMeterNo' },
  { label: 'Loại Module',      chkKey: 'chkModuleType' },
  { label: 'QCCID',            chkKey: 'chkQCCID' },
  { label: 'Thời gian RTC',    chkKey: 'chkRTC' },
  { label: 'Múi giờ',          chkKey: 'chkTimeZone' },
  { label: 'Chỉ số ĐH',        chkKey: 'chkImpData' },
  { label: 'Lưu lượng Q3',     chkKey: 'chkQ3' },
  { label: 'Số lít / vòng',    chkKey: 'chkLPR' },
  { label: 'IP : Cổng',        chkKey: 'chkIPPORT' },
  { label: 'PT gửi DL',        chkKey: 'chkPushMethod' },
  { label: 'Chu kỳ gửi',       chkKey: 'chkPushPeriod' },
  { label: 'Gửi lúc 1',        chkKey: 'chkPushTime1' },
  { label: 'Gửi lúc 2',        chkKey: 'chkPushTime2' },
  { label: 'PT gửi SK',        chkKey: 'chkPushEventMethod' },
  { label: 'Ngẫu nhiên',       chkKey: 'chkRandomMin' },
  { label: 'Chu kỳ lưu',       chkKey: 'chkLatchPeriod' },
  { label: 'Cấu hình SK',      chkKey: 'chkEventConfig' },
  { label: 'Kích hoạt TB',     chkKey: 'chkEnableDevice' },
  { label: 'Firmware',         chkKey: 'chkFirmwareVer' },
  { label: 'Boot ver',         chkKey: 'chkBootVer' },
  { label: 'Điện áp (V)',      chkKey: 'chkVoltage' },
  { label: 'Pin còn lại',      chkKey: 'chkRemainBattery' },
  { label: 'Dung lượng pin',   chkKey: 'chkBatteryCapacity' },
  { label: 'Tr.thái reset',    chkKey: 'chkTemp' },
  { label: 'Số lần reset',     chkKey: 'chkResetCount' },
] as const;

const ALL_CHK = CHIPS.map(c => c.chkKey as string);

const CMDS = [
  { label: 'Xóa dữ liệu', chkKey: 'chkClearData' },
  { label: 'Gửi ngay',    chkKey: 'chkPushData' },
  { label: 'Reset Module', chkKey: 'chkResetModule' },
] as const;

/* ============================================================ */

export default function Overview() {
  useEffect(() => { requestBlePermission(); }, []);
  const { state, setState } = GetHookProps();
  const connected = store?.state?.hhu?.connect === 'CONNECTED';
  const busy = state.isReading || state.isWriting;

  const rtcTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (state.chkRTC && state.chkRTCNow) {
      rtcTimer.current = setInterval(() => {
        setState(p => ({ ...p, inputRTC: formatRTC(new Date()) }));
      }, 1000);
    }
    return () => { if (rtcTimer.current) { clearInterval(rtcTimer.current); rtcTimer.current = null; } };
  }, [state.chkRTC, state.chkRTCNow]);

  useEffect(() => {
    const imp = Number(state.inputImpData || 0);
    const exp = Number(state.inputExpData || 0);
    setState(p => ({ ...p, inputTotalData: (imp - exp).toString() }));
  }, [state.inputImpData, state.inputExpData]);

  const toggle = (key: any) => setState(p => ({ ...p, [key]: !p[key] }));
  const set    = (key: any, v: string) => setState(p => ({ ...p, [key]: v }));
  const selectAll   = () => setState(p => { const n = {...p}; ALL_CHK.forEach(k => (n as any)[k] = true);  return n; });
  const unselectAll = () => setState(p => { const n = {...p}; ALL_CHK.forEach(k => (n as any)[k] = false); return n; });

  /* ---- table rows (built from selected chips) ---- */
  const tableRows: React.ReactNode[] = [];

  const TR = (key: string, label: string, inputKey: any, numeric = false, editable = true) => (
    <View key={key} style={styles.tr}>
      <Text style={styles.trLabel}>{label}</Text>
      <TextInput
        style={[styles.trInput, !editable && styles.trReadonly]}
        value={String((state as any)[inputKey] ?? '')}
        editable={editable}
        onChangeText={v => set(inputKey, v)}
        keyboardType={numeric ? 'numeric' : 'default'}
        placeholder="—"
        placeholderTextColor="#ccc"
      />
    </View>
  );

  CHIPS.forEach(chip => {
    if (!(state as any)[chip.chkKey]) return;
    switch (chip.chkKey) {
      case 'chkModuleNo':        tableRows.push(TR('mn',  'Serial Module',       'inputModuleNo')); break;
      case 'chkMeterNo':         tableRows.push(TR('me',  'Số seri đồng hồ',     'inputMeterNo')); break;
      case 'chkModuleType':      tableRows.push(TR('mt',  'Loại Module',         'inputModuleType')); break;
      case 'chkQCCID':           tableRows.push(TR('qc',  'QCCID',               'inputQCCID')); break;
      case 'chkRTC':
        tableRows.push(
          <View key="rtc" style={styles.tr}>
            <Text style={styles.trLabel}>Thời gian RTC</Text>
            <View style={styles.trRtc}>
              <TextInput
                style={[styles.trInput, { flex: 1, marginRight: 6 }, state.chkRTCNow && styles.trReadonly]}
                value={state.inputRTC}
                editable={!state.chkRTCNow}
                onChangeText={v => set('inputRTC', v)}
                placeholder="—"
                placeholderTextColor="#ccc"
              />
              <TouchableOpacity
                style={[styles.nowBtn, state.chkRTCNow && styles.nowBtnOn]}
                onPress={() => setState(p => ({ ...p, chkRTCNow: !p.chkRTCNow }))}
              >
                <Text style={[styles.nowBtnTxt, state.chkRTCNow && { color: '#fff' }]}>Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        ); break;
      case 'chkTimeZone':        tableRows.push(TR('tz',  'Múi giờ (UTC+x)',     'inputTimeZone', true)); break;
      case 'chkImpData':
        tableRows.push(TR('xuoi', 'Chỉ số xuôi',        'inputImpData', true));
        tableRows.push(TR('nguoc','Chỉ số ngược',        'inputExpData', true));
        tableRows.push(TR('tong', 'Tổng (Xuôi − Ngược)', 'inputTotalData', false, false));
        break;
      case 'chkQ3':              tableRows.push(TR('q3',  'Lưu lượng Q3',        'inputQ3', true)); break;
      case 'chkLPR':             tableRows.push(TR('lpr', 'Số lít / vòng',       'inputLPR', true)); break;
      case 'chkIPPORT':          tableRows.push(TR('ip',  'Địa chỉ IP : Cổng',   'inputIPPORT')); break;
      case 'chkPushMethod':
        tableRows.push(
          <View key="pm" style={styles.tr}>
            <Text style={styles.trLabel}>Phương thức gửi DL</Text>
            <View style={styles.trRadio}>
              <Radio label="Chu kỳ"    checked={state.inputPushMethod === '1'} onPress={() => set('inputPushMethod', '1')} />
              <Radio label="Thời điểm" checked={state.inputPushMethod === '2'} onPress={() => set('inputPushMethod', '2')} />
            </View>
          </View>
        ); break;
      case 'chkPushPeriod':      tableRows.push(TR('pp',  'Chu kỳ gửi (phút)',   'inputPushPeriod', true)); break;
      case 'chkPushTime1':       tableRows.push(TR('pt1', 'Thời điểm gửi 1',     'inputPushTime1')); break;
      case 'chkPushTime2':       tableRows.push(TR('pt2', 'Thời điểm gửi 2',     'inputPushTime2')); break;
      case 'chkPushEventMethod':
        tableRows.push(
          <View key="pem" style={styles.tr}>
            <Text style={styles.trLabel}>Phương thức gửi SK</Text>
            <View style={styles.trRadio}>
              <Radio label="Chu kỳ"   checked={state.inputPushEventMethod == '0'} onPress={() => set('inputPushEventMethod', '0')} />
              <Radio label="Tức thời" checked={state.inputPushEventMethod == '1'} onPress={() => set('inputPushEventMethod', '1')} />
            </View>
          </View>
        ); break;
      case 'chkRandomMin':       tableRows.push(TR('rm',  'Ngẫu nhiên (phút)',   'inputRandomMin', true)); break;
      case 'chkLatchPeriod':     tableRows.push(TR('lp',  'Chu kỳ lưu (phút)',   'inputLatchPeriod', true)); break;
      case 'chkEventConfig':     tableRows.push(TR('ec',  'Cấu hình sự kiện',    'inputEventConfig')); break;
      case 'chkEnableDevice':
        tableRows.push(
          <View key="ed" style={styles.tr}>
            <Text style={styles.trLabel}>Kích hoạt thiết bị</Text>
            <View style={styles.trRadio}>
              <Radio label="Tắt" checked={state.inputEnableDevice === '0'} onPress={() => set('inputEnableDevice', '0')} />
              <Radio label="Bật" checked={state.inputEnableDevice === '1'} onPress={() => set('inputEnableDevice', '1')} />
            </View>
          </View>
        ); break;
      case 'chkFirmwareVer':     tableRows.push(TR('fw',  'Firmware',            'inputFirmwareVer',     false, false)); break;
      case 'chkBootVer':         tableRows.push(TR('bv',  'Boot ver',            'inputBootVer',         false, false)); break;
      case 'chkVoltage':         tableRows.push(TR('vt',  'Điện áp (V)',         'inputVoltage',         false, false)); break;
      case 'chkRemainBattery':   tableRows.push(TR('rb',  'Pin còn lại',         'inputRemainBattery',   false, false)); break;
      case 'chkBatteryCapacity': tableRows.push(TR('bc',  'Dung lượng pin',      'inputBatteryCapacity', false, false)); break;
      case 'chkTemp':            tableRows.push(TR('tmp', 'Trạng thái reset',    'inputTemp',            false, false)); break;
      case 'chkResetCount':      tableRows.push(TR('rc',  'Số lần reset',        'inputResetCount',      false, false)); break;
    }
  });

  /* ============================================================ */

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <SystemHeader title="CẤU HÌNH" subTitle="ĐỌC / GHI CẤU HÌNH ĐỒNG HỒ" />

        {/* select all / none */}
        <View style={styles.selectRow}>
          <TouchableOpacity style={[styles.pill, { backgroundColor: '#1976D2' }]} onPress={selectAll} disabled={busy}>
            <Text style={styles.pillTxt}>✔ Tất cả</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pill, { backgroundColor: '#757575' }]} onPress={unselectAll} disabled={busy}>
            <Text style={styles.pillTxt}>✖ Bỏ chọn</Text>
          </TouchableOpacity>
        </View>

        {/* checkbox chip grid */}
        <View style={styles.chipGrid}>
          {CHIPS.map(chip => {
            const on = !!(state as any)[chip.chkKey];
            return (
              <TouchableOpacity
                key={chip.chkKey}
                style={[styles.chip, on && styles.chipOn]}
                onPress={() => toggle(chip.chkKey)}
                activeOpacity={0.7}
              >
                <View style={[styles.box, on && styles.boxOn]}>
                  {on && <Text style={styles.tick}>✓</Text>}
                </View>
                <Text style={[styles.chipTxt, on && styles.chipTxtOn]} numberOfLines={2}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* commands */}
        <View style={styles.cmdRow}>
          {CMDS.map(cmd => {
            const on = !!(state as any)[cmd.chkKey];
            return (
              <TouchableOpacity
                key={cmd.chkKey}
                style={[styles.cmdChip, on && styles.cmdChipOn]}
                onPress={() => toggle(cmd.chkKey)}
                activeOpacity={0.7}
              >
                <View style={[styles.box, on && styles.boxRed]}>
                  {on && <Text style={styles.tick}>✓</Text>}
                </View>
                <Text style={[styles.chipTxt, on && { color: '#C62828', fontWeight: '600' }]} numberOfLines={1}>
                  {cmd.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* data table */}
        {tableRows.length > 0 && (
          <View style={styles.table}>
            <View style={styles.thead}>
              <Text style={[styles.th, { flex: 1.1 }]}>Thông số</Text>
              <Text style={[styles.th, { flex: 1 }]}>Giá trị</Text>
            </View>
            {tableRows}
          </View>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* bottom buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.btn, styles.btnRead, (!connected || busy) && styles.btnDisabled]}
          onPress={Read}
          disabled={!connected || busy}
          activeOpacity={0.8}
        >
          {state.isReading ? (
            <View style={styles.btnRow}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={[styles.btnTxt, { marginLeft: 8 }]}>ĐANG ĐỌC...</Text>
            </View>
          ) : <Text style={styles.btnTxt}>ĐỌC CẤU HÌNH</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.btnWrite, (!connected || busy) && styles.btnDisabled]}
          onPress={Write}
          disabled={!connected || busy}
          activeOpacity={0.8}
        >
          {state.isWriting ? (
            <View style={styles.btnRow}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={[styles.btnTxt, { marginLeft: 8 }]}>ĐANG GHI...</Text>
            </View>
          ) : <Text style={styles.btnTxt}>GHI CẤU HÌNH</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ============================================================ */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  scroll: { paddingBottom: 110 },

  selectRow: { flexDirection: 'row', gap: 8, marginHorizontal: 12, marginTop: 8, marginBottom: 4, justifyContent: 'flex-end' },
  pill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  pillTxt: { color: '#fff', fontSize: 13, fontWeight: '600' },

  /* chip grid: 3 per row */
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 8, marginTop: 4 },
  chip: {
    flexBasis: '31%', margin: '1.1%',
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 8,
    borderWidth: 1, borderColor: '#ddd',
    paddingVertical: 8, paddingHorizontal: 8,
    minHeight: 48,
  },
  chipOn: { borderColor: '#1976D2', backgroundColor: '#E3F2FD' },
  box: {
    width: 20, height: 20, borderRadius: 4,
    borderWidth: 1.5, borderColor: '#bbb',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 6, flexShrink: 0,
  },
  boxOn:  { borderColor: '#1976D2', backgroundColor: '#1976D2' },
  boxRed: { borderColor: '#C62828', backgroundColor: '#C62828' },
  tick:   { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  chipTxt:   { flex: 1, fontSize: 11.5, color: '#555', lineHeight: 15 },
  chipTxtOn: { color: '#1565C0', fontWeight: '600' },

  /* command chips: stretch to fill row */
  cmdRow: { flexDirection: 'row', marginHorizontal: 8, marginTop: 2, gap: 6 },
  cmdChip: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 8,
    borderWidth: 1, borderColor: '#ddd',
    paddingVertical: 8, paddingHorizontal: 8,
    minHeight: 44,
  },
  cmdChipOn: { borderColor: '#C62828', backgroundColor: '#FFF3F3' },

  /* data table */
  table: {
    marginHorizontal: 12, marginTop: 10,
    backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 1, borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  thead: {
    flexDirection: 'row',
    backgroundColor: '#37474F',
    paddingVertical: 8, paddingHorizontal: 12,
  },
  th: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  tr: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderColor: '#f0f0f0',
    minHeight: 42, paddingHorizontal: 12,
  },
  trLabel: { flex: 1.1, fontSize: 12, color: '#444', paddingRight: 6 },
  trInput: {
    flex: 1,
    height: 34, borderWidth: 1, borderColor: '#ddd', borderRadius: 6,
    paddingHorizontal: 8, fontSize: 12, color: '#222', backgroundColor: '#fafafa',
  },
  trReadonly: { backgroundColor: '#f2f2f2', color: '#888' },

  /* RTC row */
  trRtc: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  nowBtn: {
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 6, borderWidth: 1, borderColor: '#1976D2',
  },
  nowBtnOn: { backgroundColor: '#1976D2' },
  nowBtnTxt: { fontSize: 11, color: '#1976D2', fontWeight: '600' },

  /* Radio row */
  trRadio: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', paddingVertical: 4 },

  /* bottom */
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', padding: 10, gap: 8,
    backgroundColor: '#f4f6f9', borderTopWidth: 1, borderColor: '#ddd',
  },
  btn: { flex: 1, height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  btnRead:     { backgroundColor: '#1976D2' },
  btnWrite:    { backgroundColor: '#D32F2F' },
  btnDisabled: { backgroundColor: '#9E9E9E' },
  btnRow: { flexDirection: 'row', alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
