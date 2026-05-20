import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { requestBlePermission } from '../../util/ble';
import { formatRTC, GetHookProps, store } from './controller';
import { Read, Write } from './handleButton';
import { Radio } from '../../component/radio';
import SystemHeader from '../../component/SystemHeader';

/* ============================================================ */
/*  SUB-COMPONENTS                                               */
/* ============================================================ */

const SectionHeader = ({ title, color }: { title: string; color: string }) => (
  <View style={[styles.sectionHeader, { backgroundColor: color }]}>
    <Text style={styles.sectionHeaderText}>{title}</Text>
  </View>
);

const Divider = () => <View style={styles.divider} />;

/* ============================================================ */
/*  MAIN SCREEN                                                  */
/* ============================================================ */

export default function Overview() {
  useEffect(() => { requestBlePermission(); }, []);

  const { state, setState } = GetHookProps();
  const connected = store?.state?.hhu?.connect === 'CONNECTED';
  const busy = state.isReading || state.isWriting;

  /* ---- RTC live timer ---- */
  const rtcTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (state.chkRTC && state.chkRTCNow) {
      rtcTimer.current = setInterval(() => {
        setState(p => ({ ...p, inputRTC: formatRTC(new Date()) }));
      }, 1000);
    }
    return () => {
      if (rtcTimer.current) { clearInterval(rtcTimer.current); rtcTimer.current = null; }
    };
  }, [state.chkRTC, state.chkRTCNow]);

  /* ---- Auto total ---- */
  useEffect(() => {
    const imp = Number(state.inputImpData || 0);
    const exp = Number(state.inputExpData || 0);
    setState(p => ({ ...p, inputTotalData: (imp - exp).toString() }));
  }, [state.inputImpData, state.inputExpData]);

  /* ---- Helpers ---- */
  const toggle = (key: any) => setState(p => ({ ...p, [key]: !p[key] }));
  const set = (key: any, v: string) => setState(p => ({ ...p, [key]: v }));

  const ALL_CHK_KEYS = [
    'chkModuleNo','chkMeterNo','chkModuleType','chkQCCID',
    'chkRTC','chkTimeZone',
    'chkImpData','chkQ3','chkLPR',
    'chkIPPORT','chkPushMethod','chkPushPeriod','chkPushTime1','chkPushTime2','chkPushEventMethod','chkRandomMin',
    'chkLatchPeriod','chkEventConfig','chkEnableDevice',
    'chkFirmwareVer','chkBootVer','chkVoltage','chkRemainBattery','chkBatteryCapacity',
    'chkTemp','chkResetCount',
  ];

  const selectAll   = () => setState(p => { const n = {...p}; ALL_CHK_KEYS.forEach(k => (n as any)[k] = true);  return n; });
  const unselectAll = () => setState(p => { const n = {...p}; ALL_CHK_KEYS.forEach(k => (n as any)[k] = false); return n; });

  /* ---- Generic field card ---- */
  const Field = ({
    label, chkKey, inputKey, numeric, editable,
  }: {
    label: string;
    chkKey: keyof typeof state;
    inputKey: keyof typeof state;
    numeric?: boolean;
    editable?: boolean;
  }) => {
    const on = !!state[chkKey];
    const isEditable = editable !== undefined ? editable : true;
    return (
      <View style={styles.fieldCard}>
        <TouchableOpacity
          style={styles.fieldRow}
          onPress={() => toggle(chkKey)}
          activeOpacity={0.7}
        >
          <Text style={[styles.fieldLabel, !on && styles.fieldLabelOff]}>{label}</Text>
          <Switch
            value={on}
            onValueChange={() => toggle(chkKey)}
            trackColor={{ false: '#ddd', true: '#a5d6a7' }}
            thumbColor={on ? '#388E3C' : '#bbb'}
          />
        </TouchableOpacity>
        {on && (
          <>
            <Divider />
            <TextInput
              value={String(state[inputKey] ?? '')}
              editable={isEditable}
              onChangeText={v => set(inputKey, v)}
              keyboardType={numeric ? 'numeric' : 'default'}
              style={[styles.fieldInput, !isEditable && styles.fieldInputReadonly]}
              placeholder="—"
            />
          </>
        )}
      </View>
    );
  };

  /* ---- RTC field (special) ---- */
  const RtcField = () => {
    const on = state.chkRTC;
    return (
      <View style={styles.fieldCard}>
        <TouchableOpacity style={styles.fieldRow} onPress={() => toggle('chkRTC')} activeOpacity={0.7}>
          <Text style={[styles.fieldLabel, !on && styles.fieldLabelOff]}>Thời gian RTC</Text>
          <Switch
            value={on}
            onValueChange={() => toggle('chkRTC')}
            trackColor={{ false: '#ddd', true: '#a5d6a7' }}
            thumbColor={on ? '#388E3C' : '#bbb'}
          />
        </TouchableOpacity>
        {on && (
          <>
            <Divider />
            <TextInput
              value={state.inputRTC}
              editable={!state.chkRTCNow}
              onChangeText={v => set('inputRTC', v)}
              style={[styles.fieldInput, state.chkRTCNow && styles.fieldInputReadonly]}
              placeholder="YYYY-MM-DD HH:MM:SS"
            />
            <TouchableOpacity
              style={styles.subToggleRow}
              onPress={() => setState(p => ({ ...p, chkRTCNow: !p.chkRTCNow }))}
              activeOpacity={0.7}
            >
              <Switch
                value={state.chkRTCNow}
                onValueChange={v => setState(p => ({ ...p, chkRTCNow: v }))}
                trackColor={{ false: '#ddd', true: '#90caf9' }}
                thumbColor={state.chkRTCNow ? '#1976D2' : '#bbb'}
              />
              <Text style={styles.subToggleLabel}>Lấy thời gian hiện tại</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  /* ---- ImpData field (special) ---- */
  const ImpDataField = () => {
    const on = state.chkImpData;
    return (
      <View style={styles.fieldCard}>
        <TouchableOpacity style={styles.fieldRow} onPress={() => toggle('chkImpData')} activeOpacity={0.7}>
          <Text style={[styles.fieldLabel, !on && styles.fieldLabelOff]}>Chỉ số đồng hồ</Text>
          <Switch
            value={on}
            onValueChange={() => toggle('chkImpData')}
            trackColor={{ false: '#ddd', true: '#a5d6a7' }}
            thumbColor={on ? '#388E3C' : '#bbb'}
          />
        </TouchableOpacity>
        {on && (
          <>
            <Divider />
            <View style={styles.subInputGroup}>
              <Text style={styles.subInputLabel}>Chỉ số xuôi (lít)</Text>
              <TextInput
                value={state.inputImpData}
                editable={on}
                onChangeText={v => setState(p => ({ ...p, inputImpData: v }))}
                keyboardType="numeric"
                style={styles.fieldInput}
                placeholder="0"
              />
            </View>
            <View style={styles.subInputGroup}>
              <Text style={styles.subInputLabel}>Chỉ số ngược (lít)</Text>
              <TextInput
                value={state.inputExpData}
                editable={on}
                onChangeText={v => setState(p => ({ ...p, inputExpData: v }))}
                keyboardType="numeric"
                style={styles.fieldInput}
                placeholder="0"
              />
            </View>
            <View style={styles.subInputGroup}>
              <Text style={styles.subInputLabel}>Tổng (Xuôi − Ngược)</Text>
              <TextInput
                value={state.inputTotalData}
                editable={false}
                style={[styles.fieldInput, styles.fieldInputReadonly]}
              />
            </View>
          </>
        )}
      </View>
    );
  };

  /* ---- Radio field ---- */
  const RadioField = ({
    label, chkKey, options,
  }: {
    label: string;
    chkKey: keyof typeof state;
    options: { label: string; value: string; inputKey: keyof typeof state }[];
  }) => {
    const on = !!state[chkKey];
    const inputKey = options[0].inputKey;
    return (
      <View style={styles.fieldCard}>
        <TouchableOpacity style={styles.fieldRow} onPress={() => toggle(chkKey)} activeOpacity={0.7}>
          <Text style={[styles.fieldLabel, !on && styles.fieldLabelOff]}>{label}</Text>
          <Switch
            value={on}
            onValueChange={() => toggle(chkKey)}
            trackColor={{ false: '#ddd', true: '#a5d6a7' }}
            thumbColor={on ? '#388E3C' : '#bbb'}
          />
        </TouchableOpacity>
        {on && (
          <>
            <Divider />
            <View style={styles.radioGroup}>
              {options.map(opt => (
                <Radio
                  key={opt.value}
                  label={opt.label}
                  checked={state[inputKey] == opt.value}
                  disabled={!on}
                  onPress={() => set(inputKey, opt.value)}
                />
              ))}
            </View>
          </>
        )}
      </View>
    );
  };

  /* ---- Command toggle ---- */
  const CmdField = ({ label, chkKey }: { label: string; chkKey: keyof typeof state }) => {
    const on = !!state[chkKey];
    return (
      <TouchableOpacity
        style={[styles.cmdCard, on && styles.cmdCardOn]}
        onPress={() => toggle(chkKey)}
        activeOpacity={0.7}
      >
        <Switch
          value={on}
          onValueChange={() => toggle(chkKey)}
          trackColor={{ false: '#ddd', true: '#ef9a9a' }}
          thumbColor={on ? '#D32F2F' : '#bbb'}
        />
        <Text style={[styles.cmdLabel, on && styles.cmdLabelOn]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  /* ============================================================ */
  /*  RENDER                                                       */
  /* ============================================================ */

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <SystemHeader title="CẤU HÌNH" subTitle="ĐỌC / GHI CẤU HÌNH ĐỒNG HỒ" />

        {/* SELECT ALL / UNSELECT ALL */}
        <View style={styles.selectRow}>
          <TouchableOpacity
            style={[styles.selectPill, styles.selectAllPill, busy && styles.pillDisabled]}
            onPress={selectAll}
            disabled={busy}
          >
            <Text style={styles.selectPillText}>✔ Chọn tất cả</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.selectPill, styles.unselectPill, busy && styles.pillDisabled]}
            onPress={unselectAll}
            disabled={busy}
          >
            <Text style={styles.selectPillText}>✖ Hủy tất cả</Text>
          </TouchableOpacity>
        </View>

        {/* ======= SECTION: NHẬN DẠNG ======= */}
        <SectionHeader title="NHẬN DẠNG" color="#1976D2" />
        <Field label="Serial Module"      chkKey="chkModuleNo"   inputKey="inputModuleNo" />
        <Field label="Số seri đồng hồ"   chkKey="chkMeterNo"    inputKey="inputMeterNo" />
        <Field label="Loại Module"        chkKey="chkModuleType" inputKey="inputModuleType" />
        <Field label="QCCID"              chkKey="chkQCCID"      inputKey="inputQCCID" />

        {/* ======= SECTION: THỜI GIAN ======= */}
        <SectionHeader title="THỜI GIAN" color="#00796B" />
        <RtcField />
        <Field label="Múi giờ (UTC+x)" chkKey="chkTimeZone" inputKey="inputTimeZone" numeric />

        {/* ======= SECTION: CHỈ SỐ ĐO ĐẾM ======= */}
        <SectionHeader title="CHỈ SỐ ĐO ĐẾM" color="#E65100" />
        <ImpDataField />
        <Field label="Lưu lượng Q3"    chkKey="chkQ3"  inputKey="inputQ3"  numeric />
        <Field label="Số lít mỗi vòng" chkKey="chkLPR" inputKey="inputLPR" numeric />

        {/* ======= SECTION: KẾT NỐI & GỬI DỮ LIỆU ======= */}
        <SectionHeader title="KẾT NỐI & GỬI DỮ LIỆU" color="#6A1B9A" />
        <Field label="Địa chỉ IP : Cổng" chkKey="chkIPPORT"     inputKey="inputIPPORT" />
        <RadioField
          label="Phương thức gửi dữ liệu"
          chkKey="chkPushMethod"
          options={[
            { label: 'Gửi theo chu kỳ',   value: '1', inputKey: 'inputPushMethod' },
            { label: 'Gửi theo thời điểm', value: '2', inputKey: 'inputPushMethod' },
          ]}
        />
        <Field label="Chu kỳ gửi (phút)"  chkKey="chkPushPeriod"      inputKey="inputPushPeriod"  numeric />
        <Field label="Thời điểm gửi 1"    chkKey="chkPushTime1"       inputKey="inputPushTime1" />
        <Field label="Thời điểm gửi 2"    chkKey="chkPushTime2"       inputKey="inputPushTime2" />
        <RadioField
          label="Phương thức gửi sự kiện"
          chkKey="chkPushEventMethod"
          options={[
            { label: 'Gửi theo chu kỳ', value: '0', inputKey: 'inputPushEventMethod' },
            { label: 'Gửi tức thời',    value: '1', inputKey: 'inputPushEventMethod' },
          ]}
        />
        <Field label="Thời gian ngẫu nhiên (phút)" chkKey="chkRandomMin" inputKey="inputRandomMin" numeric />

        {/* ======= SECTION: CẤU HÌNH THIẾT BỊ ======= */}
        <SectionHeader title="CẤU HÌNH THIẾT BỊ" color="#2E7D32" />
        <Field label="Chu kỳ lưu (phút)"  chkKey="chkLatchPeriod"  inputKey="inputLatchPeriod"  numeric />
        <Field label="Cấu hình sự kiện"   chkKey="chkEventConfig"  inputKey="inputEventConfig" />
        <RadioField
          label="Trạng thái kích hoạt thiết bị"
          chkKey="chkEnableDevice"
          options={[
            { label: 'Tắt', value: '0', inputKey: 'inputEnableDevice' },
            { label: 'Bật', value: '1', inputKey: 'inputEnableDevice' },
          ]}
        />

        {/* ======= SECTION: PHIÊN BẢN & PIN ======= */}
        <SectionHeader title="PHIÊN BẢN & PIN" color="#0277BD" />
        <Field label="Phiên bản Firmware"    chkKey="chkFirmwareVer"     inputKey="inputFirmwareVer"     editable={false} />
        <Field label="Phiên bản Boot"        chkKey="chkBootVer"         inputKey="inputBootVer"         editable={false} />
        <Field label="Điện áp (V)"           chkKey="chkVoltage"         inputKey="inputVoltage"         editable={false} />
        <Field label="Thời gian pin còn lại" chkKey="chkRemainBattery"   inputKey="inputRemainBattery"   editable={false} />
        <Field label="Dung lượng pin"        chkKey="chkBatteryCapacity" inputKey="inputBatteryCapacity" editable={false} />

        {/* ======= SECTION: TRẠNG THÁI ======= */}
        <SectionHeader title="TRẠNG THÁI" color="#546E7A" />
        <Field label="Trạng thái reset gần nhất" chkKey="chkTemp"       inputKey="inputTemp"       editable={false} />
        <Field label="Số lần Reset"              chkKey="chkResetCount" inputKey="inputResetCount" editable={false} />

        {/* ======= SECTION: LỆNH ĐIỀU KHIỂN ======= */}
        <SectionHeader title="LỆNH ĐIỀU KHIỂN" color="#C62828" />
        <View style={styles.cmdRow}>
          <CmdField label="Xóa dữ liệu"    chkKey="chkClearData" />
          <CmdField label="Gửi dữ liệu ngay" chkKey="chkPushData" />
          <CmdField label="Reset Module"    chkKey="chkResetModule" />
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ======= BOTTOM BUTTONS ======= */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.btn, styles.btnRead, (!connected || busy) && styles.btnDisabled]}
          onPress={Read}
          disabled={!connected || busy}
          activeOpacity={0.8}
        >
          {state.isReading ? (
            <View style={styles.btnInner}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={[styles.btnText, { marginLeft: 8 }]}>ĐANG ĐỌC...</Text>
            </View>
          ) : (
            <Text style={styles.btnText}>ĐỌC CẤU HÌNH</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.btnWrite, (!connected || busy) && styles.btnDisabled]}
          onPress={Write}
          disabled={!connected || busy}
          activeOpacity={0.8}
        >
          {state.isWriting ? (
            <View style={styles.btnInner}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={[styles.btnText, { marginLeft: 8 }]}>ĐANG GHI...</Text>
            </View>
          ) : (
            <Text style={styles.btnText}>GHI CẤU HÌNH</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ============================================================ */
/*  STYLES                                                       */
/* ============================================================ */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  scroll: { paddingBottom: 110 },

  /* Section header */
  sectionHeader: {
    marginHorizontal: 12, marginTop: 14, marginBottom: 4,
    paddingVertical: 7, paddingHorizontal: 14,
    borderRadius: 8,
  },
  sectionHeaderText: { color: '#fff', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 },

  /* Select pills */
  selectRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginHorizontal: 12, marginTop: 10 },
  selectPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  selectAllPill:  { backgroundColor: '#1976D2' },
  unselectPill:   { backgroundColor: '#757575' },
  pillDisabled:   { opacity: 0.4 },
  selectPillText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  /* Field card */
  fieldCard: {
    marginHorizontal: 12, marginBottom: 6,
    backgroundColor: '#fff', borderRadius: 10,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2,
  },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 14,
  },
  fieldLabel: { flex: 1, fontSize: 14, color: '#222', fontWeight: '500' },
  fieldLabelOff: { color: '#aaa' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 14 },
  fieldInput: {
    marginHorizontal: 14, marginVertical: 10,
    borderWidth: 1, borderColor: '#ddd', borderRadius: 7,
    paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 14, color: '#333', backgroundColor: '#fafafa',
  },
  fieldInputReadonly: { backgroundColor: '#f2f2f2', color: '#888' },

  /* Sub-toggle (RTC "Now") */
  subToggleRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 14, marginBottom: 10, marginTop: 2,
  },
  subToggleLabel: { marginLeft: 8, fontSize: 13, color: '#555' },

  /* Sub-input group (ImpData) */
  subInputGroup: { marginHorizontal: 14, marginBottom: 4 },
  subInputLabel: { fontSize: 12, color: '#888', marginBottom: 2, marginTop: 6 },

  /* Radio group */
  radioGroup: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 10, paddingVertical: 8, gap: 6,
  },

  /* Command cards */
  cmdRow: { flexDirection: 'row', marginHorizontal: 12, gap: 8, flexWrap: 'wrap' },
  cmdCard: {
    flex: 1, minWidth: 100,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#ddd',
    elevation: 1,
  },
  cmdCardOn: { borderColor: '#ef9a9a', backgroundColor: '#fff8f8' },
  cmdLabel: { marginLeft: 8, fontSize: 13, color: '#555', flex: 1 },
  cmdLabelOn: { color: '#C62828', fontWeight: '600' },

  /* Bottom bar */
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', padding: 10, gap: 8,
    backgroundColor: '#f0f2f5',
    borderTopWidth: 1, borderColor: '#ddd',
  },
  btn: { flex: 1, height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  btnRead:  { backgroundColor: '#1976D2' },
  btnWrite: { backgroundColor: '#D32F2F' },
  btnDisabled: { backgroundColor: '#9E9E9E' },
  btnInner: { flexDirection: 'row', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
