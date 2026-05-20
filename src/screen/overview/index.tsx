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

/* ─── group definitions: one checkbox → multiple fields ─── */
const GROUPS = [
  {
    label: 'Thông tin thiết bị',
    sub: 'Serial, Seri ĐH, Loại module, QCCID',
    keys: ['chkModuleNo', 'chkMeterNo', 'chkModuleType', 'chkQCCID'],
  },
  {
    label: 'Thời gian',
    sub: 'Đồng hồ RTC, múi giờ',
    keys: ['chkRTC', 'chkTimeZone'],
  },
  {
    label: 'Chỉ số đo đếm',
    sub: 'Xuôi, ngược, tổng, Q3, lít/vòng',
    keys: ['chkImpData', 'chkQ3', 'chkLPR'],
  },
  {
    label: 'Kết nối & Gửi dữ liệu',
    sub: 'IP, chu kỳ, thời điểm, sự kiện',
    keys: ['chkIPPORT', 'chkPushMethod', 'chkPushPeriod', 'chkPushTime1', 'chkPushTime2', 'chkPushEventMethod', 'chkRandomMin'],
  },
  {
    label: 'Cấu hình thiết bị',
    sub: 'Chu kỳ lưu, sự kiện, kích hoạt',
    keys: ['chkLatchPeriod', 'chkEventConfig', 'chkEnableDevice'],
  },
  {
    label: 'Phiên bản & Pin',
    sub: 'Firmware, Boot, điện áp, pin',
    keys: ['chkFirmwareVer', 'chkBootVer', 'chkVoltage', 'chkRemainBattery', 'chkBatteryCapacity'],
  },
  {
    label: 'Trạng thái',
    sub: 'Reset gần nhất, số lần reset',
    keys: ['chkTemp', 'chkResetCount'],
  },
] as const;

const CMDS = [
  { label: 'Xóa dữ liệu',  key: 'chkClearData' },
  { label: 'Gửi ngay',     key: 'chkPushData' },
  { label: 'Reset Module', key: 'chkResetModule' },
] as const;

const ALL_FIELD_KEYS = GROUPS.flatMap(g => g.keys as unknown as string[]);

/* ============================================================ */

export default function Overview() {
  useEffect(() => { requestBlePermission(); }, []);
  const { state, setState } = GetHookProps();
  const connected = store?.state?.hhu?.connect === 'CONNECTED';
  const busy = state.isReading || state.isWriting;

  /* RTC live timer */
  const rtcTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (state.chkRTC && state.chkRTCNow) {
      rtcTimer.current = setInterval(() => {
        setState(p => ({ ...p, inputRTC: formatRTC(new Date()) }));
      }, 1000);
    }
    return () => { if (rtcTimer.current) { clearInterval(rtcTimer.current); rtcTimer.current = null; } };
  }, [state.chkRTC, state.chkRTCNow]);

  /* Auto total */
  useEffect(() => {
    const imp = Number(state.inputImpData || 0);
    const exp = Number(state.inputExpData || 0);
    setState(p => ({ ...p, inputTotalData: (imp - exp).toString() }));
  }, [state.inputImpData, state.inputExpData]);

  const set  = (key: any, v: string) => setState(p => ({ ...p, [key]: v }));

  /* group toggle: all on → all off, else all on */
  const toggleGroup = (keys: readonly string[]) => {
    const allOn = keys.every(k => (state as any)[k]);
    setState(p => {
      const n = { ...p };
      keys.forEach(k => (n as any)[k] = !allOn);
      return n;
    });
  };

  const isGroupOn = (keys: readonly string[]) => keys.some(k => (state as any)[k]);
  const isGroupFull = (keys: readonly string[]) => keys.every(k => (state as any)[k]);

  const selectAll   = () => setState(p => { const n = {...p}; ALL_FIELD_KEYS.forEach(k => (n as any)[k] = true);  return n; });
  const unselectAll = () => setState(p => { const n = {...p}; ALL_FIELD_KEYS.forEach(k => (n as any)[k] = false); return n; });

  /* ─── build table rows for all enabled fields ─── */
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

  const tableRows: React.ReactNode[] = [];

  if (state.chkModuleNo)   tableRows.push(TR('mn',  'Serial Module',       'inputModuleNo'));
  if (state.chkMeterNo)    tableRows.push(TR('me',  'Số seri đồng hồ',     'inputMeterNo'));
  if (state.chkModuleType) tableRows.push(TR('mt',  'Loại Module',         'inputModuleType'));
  if (state.chkQCCID)      tableRows.push(TR('qc',  'QCCID',               'inputQCCID'));

  if (state.chkRTC)
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
    );

  if (state.chkTimeZone) tableRows.push(TR('tz', 'Múi giờ (UTC+x)', 'inputTimeZone', true));

  if (state.chkImpData) {
    tableRows.push(TR('xuoi',  'Chỉ số xuôi',         'inputImpData', true));
    tableRows.push(TR('nguoc', 'Chỉ số ngược',         'inputExpData', true));
    tableRows.push(TR('tong',  'Tổng (Xuôi − Ngược)',  'inputTotalData', false, false));
  }
  if (state.chkQ3)  tableRows.push(TR('q3',  'Lưu lượng Q3',  'inputQ3',  true));
  if (state.chkLPR) tableRows.push(TR('lpr', 'Số lít / vòng', 'inputLPR', true));

  if (state.chkIPPORT) tableRows.push(TR('ip', 'Địa chỉ IP : Cổng', 'inputIPPORT'));

  if (state.chkPushMethod)
    tableRows.push(
      <View key="pm" style={styles.tr}>
        <Text style={styles.trLabel}>Phương thức gửi DL</Text>
        <View style={styles.trRadio}>
          <Radio label="Chu kỳ"    checked={state.inputPushMethod === '1'} onPress={() => set('inputPushMethod', '1')} />
          <Radio label="Thời điểm" checked={state.inputPushMethod === '2'} onPress={() => set('inputPushMethod', '2')} />
        </View>
      </View>
    );

  if (state.chkPushPeriod) tableRows.push(TR('pp',  'Chu kỳ gửi (phút)',   'inputPushPeriod', true));
  if (state.chkPushTime1)  tableRows.push(TR('pt1', 'Thời điểm gửi 1',     'inputPushTime1'));
  if (state.chkPushTime2)  tableRows.push(TR('pt2', 'Thời điểm gửi 2',     'inputPushTime2'));

  if (state.chkPushEventMethod)
    tableRows.push(
      <View key="pem" style={styles.tr}>
        <Text style={styles.trLabel}>Phương thức gửi SK</Text>
        <View style={styles.trRadio}>
          <Radio label="Chu kỳ"   checked={state.inputPushEventMethod == '0'} onPress={() => set('inputPushEventMethod', '0')} />
          <Radio label="Tức thời" checked={state.inputPushEventMethod == '1'} onPress={() => set('inputPushEventMethod', '1')} />
        </View>
      </View>
    );

  if (state.chkRandomMin)   tableRows.push(TR('rm',  'Ngẫu nhiên (phút)',  'inputRandomMin',   true));
  if (state.chkLatchPeriod) tableRows.push(TR('lp',  'Chu kỳ lưu (phút)', 'inputLatchPeriod',  true));
  if (state.chkEventConfig) tableRows.push(TR('ec',  'Cấu hình sự kiện',  'inputEventConfig'));

  if (state.chkEnableDevice)
    tableRows.push(
      <View key="ed" style={styles.tr}>
        <Text style={styles.trLabel}>Kích hoạt thiết bị</Text>
        <View style={styles.trRadio}>
          <Radio label="Tắt" checked={state.inputEnableDevice === '0'} onPress={() => set('inputEnableDevice', '0')} />
          <Radio label="Bật" checked={state.inputEnableDevice === '1'} onPress={() => set('inputEnableDevice', '1')} />
        </View>
      </View>
    );

  if (state.chkFirmwareVer)     tableRows.push(TR('fw',  'Firmware',        'inputFirmwareVer',     false, false));
  if (state.chkBootVer)         tableRows.push(TR('bv',  'Boot ver',        'inputBootVer',         false, false));
  if (state.chkVoltage)         tableRows.push(TR('vt',  'Điện áp (V)',     'inputVoltage',         false, false));
  if (state.chkRemainBattery)   tableRows.push(TR('rb',  'Pin còn lại',     'inputRemainBattery',   false, false));
  if (state.chkBatteryCapacity) tableRows.push(TR('bc',  'Dung lượng pin',  'inputBatteryCapacity', false, false));
  if (state.chkTemp)            tableRows.push(TR('tmp', 'Trạng thái reset','inputTemp',            false, false));
  if (state.chkResetCount)      tableRows.push(TR('rc',  'Số lần reset',    'inputResetCount',      false, false));

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
          <TouchableOpacity style={[styles.pill, { backgroundColor: '#1976D2' }]} onPress={selectAll}   disabled={busy}>
            <Text style={styles.pillTxt}>✔ Chọn tất cả</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pill, { backgroundColor: '#757575' }]} onPress={unselectAll} disabled={busy}>
            <Text style={styles.pillTxt}>✖ Bỏ chọn</Text>
          </TouchableOpacity>
        </View>

        {/* group checkboxes – 2 per row */}
        <View style={styles.groupGrid}>
          {GROUPS.map(g => {
            const full = isGroupFull(g.keys);
            const partial = !full && isGroupOn(g.keys);
            return (
              <TouchableOpacity
                key={g.label}
                style={[styles.groupCard, full && styles.groupCardOn, partial && styles.groupCardPartial]}
                onPress={() => toggleGroup(g.keys)}
                activeOpacity={0.75}
              >
                <View style={[styles.box, full && styles.boxOn, partial && styles.boxPartial]}>
                  {full    && <Text style={styles.tick}>✓</Text>}
                  {partial && <Text style={styles.tick}>−</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.groupLabel, (full || partial) && styles.groupLabelOn]}>
                    {g.label}
                  </Text>
                  <Text style={styles.groupSub} numberOfLines={1}>{g.sub}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* command row */}
        <Text style={styles.cmdTitle}>LỆNH ĐIỀU KHIỂN</Text>
        <View style={styles.cmdRow}>
          {CMDS.map(cmd => {
            const on = !!(state as any)[cmd.key];
            return (
              <TouchableOpacity
                key={cmd.key}
                style={[styles.cmdCard, on && styles.cmdCardOn]}
                onPress={() => setState(p => ({ ...p, [cmd.key]: !p[cmd.key as keyof typeof p] }))}
                activeOpacity={0.75}
              >
                <View style={[styles.box, on && styles.boxRed]}>
                  {on && <Text style={styles.tick}>✓</Text>}
                </View>
                <Text style={[styles.cmdLabel, on && styles.cmdLabelOn]}>{cmd.label}</Text>
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

  selectRow: {
    flexDirection: 'row', gap: 8,
    marginHorizontal: 12, marginTop: 8, marginBottom: 6,
    justifyContent: 'flex-end',
  },
  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  pillTxt: { color: '#fff', fontSize: 13, fontWeight: '600' },

  /* group cards – 2 per row */
  groupGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 8 },
  groupCard: {
    flexBasis: '47%', margin: '1.5%',
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 1.5, borderColor: '#ddd',
    paddingVertical: 12, paddingHorizontal: 10,
    minHeight: 64,
    elevation: 1,
  },
  groupCardOn:      { borderColor: '#1976D2', backgroundColor: '#E3F2FD' },
  groupCardPartial: { borderColor: '#90CAF9', backgroundColor: '#F0F8FF' },

  box: {
    width: 24, height: 24, borderRadius: 5,
    borderWidth: 2, borderColor: '#bbb',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10, flexShrink: 0,
  },
  boxOn:      { borderColor: '#1976D2', backgroundColor: '#1976D2' },
  boxPartial: { borderColor: '#90CAF9', backgroundColor: '#90CAF9' },
  boxRed:     { borderColor: '#C62828', backgroundColor: '#C62828' },
  tick: { color: '#fff', fontSize: 13, fontWeight: 'bold' },

  groupLabel:   { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 2 },
  groupLabelOn: { color: '#1565C0' },
  groupSub:     { fontSize: 11, color: '#999' },

  /* commands */
  cmdTitle: {
    marginHorizontal: 14, marginTop: 10, marginBottom: 4,
    fontSize: 11, fontWeight: 'bold', color: '#999', letterSpacing: 0.8,
  },
  cmdRow: { flexDirection: 'row', marginHorizontal: 8, gap: 6 },
  cmdCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 1.5, borderColor: '#ddd',
    paddingVertical: 10, paddingHorizontal: 10,
    minHeight: 52,
  },
  cmdCardOn: { borderColor: '#C62828', backgroundColor: '#FFF3F3' },
  cmdLabel:   { fontSize: 12, color: '#555', flex: 1 },
  cmdLabelOn: { color: '#C62828', fontWeight: '700' },

  /* table */
  table: {
    marginHorizontal: 12, marginTop: 12,
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
    minHeight: 44, paddingHorizontal: 12,
  },
  trLabel:   { flex: 1.1, fontSize: 12, color: '#444', paddingRight: 6 },
  trInput: {
    flex: 1, height: 34,
    borderWidth: 1, borderColor: '#ddd', borderRadius: 6,
    paddingHorizontal: 8, fontSize: 12, color: '#222', backgroundColor: '#fafafa',
  },
  trReadonly: { backgroundColor: '#f2f2f2', color: '#888' },

  trRtc: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  nowBtn:    { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#1976D2' },
  nowBtnOn:  { backgroundColor: '#1976D2' },
  nowBtnTxt: { fontSize: 11, color: '#1976D2', fontWeight: '600' },

  trRadio: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', paddingVertical: 4 },

  /* bottom */
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', padding: 10, gap: 8,
    backgroundColor: '#f4f6f9', borderTopWidth: 1, borderColor: '#ddd',
  },
  btn:         { flex: 1, height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  btnRead:     { backgroundColor: '#1976D2' },
  btnWrite:    { backgroundColor: '#D32F2F' },
  btnDisabled: { backgroundColor: '#9E9E9E' },
  btnRow:  { flexDirection: 'row', alignItems: 'center' },
  btnTxt:  { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
