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

/* ── nhóm: 1 chip = nhiều trường ── */
const GROUPS = [
  { id: 'info',  label: 'Thông tin',  keys: ['chkModuleNo','chkMeterNo','chkModuleType','chkQCCID'] },
  { id: 'time',  label: 'Thời gian',  keys: ['chkRTC','chkTimeZone'] },
  { id: 'data',  label: 'Chỉ số',     keys: ['chkImpData','chkQ3','chkLPR'] },
  { id: 'net',   label: 'Kết nối',    keys: ['chkIPPORT','chkPushMethod','chkPushPeriod','chkPushTime1','chkPushTime2','chkPushEventMethod','chkRandomMin'] },
  { id: 'cfg',   label: 'Cấu hình',   keys: ['chkLatchPeriod','chkEventConfig','chkEnableDevice'] },
  { id: 'bat',   label: 'Pin & FW',   keys: ['chkFirmwareVer','chkBootVer','chkVoltage','chkRemainBattery','chkBatteryCapacity'] },
  { id: 'stat',  label: 'Trạng thái', keys: ['chkTemp','chkResetCount'] },
] as const;

const CMDS = [
  { key: 'chkClearData',   label: 'Xóa DL' },
  { key: 'chkPushData',    label: 'Gửi ngay' },
  { key: 'chkResetModule', label: 'Reset' },
] as const;

const ALL_KEYS = GROUPS.flatMap(g => g.keys as unknown as string[]);

/* ══════════════════════════════════════════════════ */

export default function Overview() {
  useEffect(() => { requestBlePermission(); }, []);
  const { state, setState } = GetHookProps();
  const connected = store?.state?.hhu?.connect === 'CONNECTED';
  const busy = state.isReading || state.isWriting;

  /* RTC live timer */
  const timer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (state.chkRTC && state.chkRTCNow) {
      timer.current = setInterval(() => setState(p => ({ ...p, inputRTC: formatRTC(new Date()) })), 1000);
    }
    return () => { if (timer.current) { clearInterval(timer.current); timer.current = null; } };
  }, [state.chkRTC, state.chkRTCNow]);

  /* auto total */
  useEffect(() => {
    setState(p => ({ ...p, inputTotalData: (Number(p.inputImpData||0) - Number(p.inputExpData||0)).toString() }));
  }, [state.inputImpData, state.inputExpData]);

  const set = (k: any, v: string) => setState(p => ({ ...p, [k]: v }));

  const toggleGroup = (keys: readonly string[]) => {
    const allOn = keys.every(k => (state as any)[k]);
    setState(p => { const n = {...p}; keys.forEach(k => (n as any)[k] = !allOn); return n; });
  };
  const groupOn = (keys: readonly string[]) => (keys as string[]).some(k => (state as any)[k]);

  const selectAll   = () => setState(p => { const n={...p}; ALL_KEYS.forEach(k=>(n as any)[k]=true);  return n; });
  const unselectAll = () => setState(p => { const n={...p}; ALL_KEYS.forEach(k=>(n as any)[k]=false); return n; });

  /* ── table rows ── */
  const TR = (key: string, lbl: string, ik: any, num=false, edit=true) => (
    <View key={key} style={s.tr}>
      <Text style={s.tLbl}>{lbl}</Text>
      <TextInput
        style={[s.tIn, !edit && s.tRO]}
        value={String((state as any)[ik]??'')}
        editable={edit}
        onChangeText={v=>set(ik,v)}
        keyboardType={num?'numeric':'default'}
        placeholder="—" placeholderTextColor="#c0c0c0"
      />
    </View>
  );

  const rows: React.ReactNode[] = [];
  if (state.chkModuleNo)   rows.push(TR('mn','Serial Module','inputModuleNo'));
  if (state.chkMeterNo)    rows.push(TR('me','Seri đồng hồ','inputMeterNo'));
  if (state.chkModuleType) rows.push(TR('mt','Loại Module','inputModuleType'));
  if (state.chkQCCID)      rows.push(TR('qc','QCCID','inputQCCID'));
  if (state.chkRTC) rows.push(
    <View key="rtc" style={s.tr}>
      <Text style={s.tLbl}>Thời gian RTC</Text>
      <View style={{flex:1,flexDirection:'row',alignItems:'center',gap:6}}>
        <TextInput style={[s.tIn,{flex:1},state.chkRTCNow&&s.tRO]}
          value={state.inputRTC} editable={!state.chkRTCNow}
          onChangeText={v=>set('inputRTC',v)} placeholder="—" placeholderTextColor="#c0c0c0"/>
        <TouchableOpacity style={[s.nowBtn,state.chkRTCNow&&s.nowOn]}
          onPress={()=>setState(p=>({...p,chkRTCNow:!p.chkRTCNow}))}>
          <Text style={[s.nowTxt,state.chkRTCNow&&{color:'#fff'}]}>Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  if (state.chkTimeZone)  rows.push(TR('tz','Múi giờ (UTC+x)','inputTimeZone',true));
  if (state.chkImpData) {
    rows.push(TR('xu','Chỉ số xuôi','inputImpData',true));
    rows.push(TR('ng','Chỉ số ngược','inputExpData',true));
    rows.push(TR('to','Tổng (Xuôi−Ngược)','inputTotalData',false,false));
  }
  if (state.chkQ3)  rows.push(TR('q3','Lưu lượng Q3','inputQ3',true));
  if (state.chkLPR) rows.push(TR('lp','Số lít / vòng','inputLPR',true));
  if (state.chkIPPORT) rows.push(TR('ip','Địa chỉ IP : Cổng','inputIPPORT'));
  if (state.chkPushMethod) rows.push(
    <View key="pm" style={s.tr}>
      <Text style={s.tLbl}>PT gửi dữ liệu</Text>
      <View style={s.radRow}>
        <Radio label="Chu kỳ"    checked={state.inputPushMethod==='1'} onPress={()=>set('inputPushMethod','1')}/>
        <Radio label="Thời điểm" checked={state.inputPushMethod==='2'} onPress={()=>set('inputPushMethod','2')}/>
      </View>
    </View>
  );
  if (state.chkPushPeriod) rows.push(TR('pp','Chu kỳ gửi (phút)','inputPushPeriod',true));
  if (state.chkPushTime1)  rows.push(TR('p1','Thời điểm gửi 1','inputPushTime1'));
  if (state.chkPushTime2)  rows.push(TR('p2','Thời điểm gửi 2','inputPushTime2'));
  if (state.chkPushEventMethod) rows.push(
    <View key="pem" style={s.tr}>
      <Text style={s.tLbl}>PT gửi sự kiện</Text>
      <View style={s.radRow}>
        <Radio label="Chu kỳ"   checked={state.inputPushEventMethod=='0'} onPress={()=>set('inputPushEventMethod','0')}/>
        <Radio label="Tức thời" checked={state.inputPushEventMethod=='1'} onPress={()=>set('inputPushEventMethod','1')}/>
      </View>
    </View>
  );
  if (state.chkRandomMin)   rows.push(TR('rm','Ngẫu nhiên (phút)','inputRandomMin',true));
  if (state.chkLatchPeriod) rows.push(TR('lc','Chu kỳ lưu (phút)','inputLatchPeriod',true));
  if (state.chkEventConfig) rows.push(TR('ec','Cấu hình sự kiện','inputEventConfig'));
  if (state.chkEnableDevice) rows.push(
    <View key="ed" style={s.tr}>
      <Text style={s.tLbl}>Kích hoạt thiết bị</Text>
      <View style={s.radRow}>
        <Radio label="Tắt" checked={state.inputEnableDevice==='0'} onPress={()=>set('inputEnableDevice','0')}/>
        <Radio label="Bật" checked={state.inputEnableDevice==='1'} onPress={()=>set('inputEnableDevice','1')}/>
      </View>
    </View>
  );
  if (state.chkFirmwareVer)     rows.push(TR('fw','Firmware',         'inputFirmwareVer',    false,false));
  if (state.chkBootVer)         rows.push(TR('bv','Boot ver',         'inputBootVer',        false,false));
  if (state.chkVoltage)         rows.push(TR('vt','Điện áp (V)',      'inputVoltage',        false,false));
  if (state.chkRemainBattery)   rows.push(TR('rb','Pin còn lại',      'inputRemainBattery',  false,false));
  if (state.chkBatteryCapacity) rows.push(TR('bc','Dung lượng pin',   'inputBatteryCapacity',false,false));
  if (state.chkTemp)            rows.push(TR('tm','Trạng thái reset', 'inputTemp',           false,false));
  if (state.chkResetCount)      rows.push(TR('rc','Số lần reset',     'inputResetCount',     false,false));

  /* ══════════════════════════════════════════════════ */

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS==='ios'?'padding':undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <SystemHeader title="CẤU HÌNH" subTitle="ĐỌC / GHI CẤU HÌNH ĐỒNG HỒ" />

        {/* ── PANEL CHỌN NHÓM ── */}
        <View style={s.panel}>

          {/* header panel */}
          <View style={s.panelHead}>
            <Text style={s.panelTitle}>Chọn nhóm cần đọc / ghi</Text>
            <View style={s.panelActions}>
              <TouchableOpacity onPress={selectAll}   disabled={busy}><Text style={s.actTxt}>Tất cả</Text></TouchableOpacity>
              <Text style={s.actDot}>·</Text>
              <TouchableOpacity onPress={unselectAll} disabled={busy}><Text style={[s.actTxt,{color:'#888'}]}>Bỏ chọn</Text></TouchableOpacity>
            </View>
          </View>

          {/* group chips – 3 per row */}
          <View style={s.chipWrap}>
            {GROUPS.map(g => {
              const on = groupOn(g.keys);
              return (
                <TouchableOpacity
                  key={g.id}
                  style={[s.chip, on && s.chipOn]}
                  onPress={() => toggleGroup(g.keys)}
                  activeOpacity={0.7}
                >
                  {on && <Text style={s.chipDot}>✓ </Text>}
                  <Text style={[s.chipTxt, on && s.chipTxtOn]}>{g.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* divider */}
          <View style={s.divider}/>

          {/* command chips */}
          <View style={s.cmdWrap}>
            <Text style={s.cmdHint}>Lệnh điều khiển  </Text>
            {CMDS.map(c => {
              const on = !!(state as any)[c.key];
              return (
                <TouchableOpacity
                  key={c.key}
                  style={[s.cmdChip, on && s.cmdChipOn]}
                  onPress={() => setState(p => ({ ...p, [c.key]: !(p as any)[c.key] }))}
                  activeOpacity={0.7}
                >
                  {on && <Text style={s.cmdDot}>✓ </Text>}
                  <Text style={[s.cmdTxt, on && s.cmdTxtOn]}>{c.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── BẢNG DỮ LIỆU ── */}
        {rows.length > 0 && (
          <View style={s.table}>
            <View style={s.thead}>
              <Text style={[s.th,{flex:1.1}]}>Thông số</Text>
              <Text style={[s.th,{flex:1}]}>Giá trị</Text>
            </View>
            {rows}
          </View>
        )}

        <View style={{height:12}}/>
      </ScrollView>

      {/* ── NÚT ĐỌC / GHI ── */}
      <View style={s.bar}>
        <TouchableOpacity
          style={[s.btn, s.btnR, (!connected||busy) && s.btnDis]}
          onPress={Read} disabled={!connected||busy} activeOpacity={0.8}
        >
          {state.isReading
            ? <View style={s.bRow}><ActivityIndicator size="small" color="#fff"/><Text style={[s.bTxt,{marginLeft:8}]}>ĐANG ĐỌC...</Text></View>
            : <Text style={s.bTxt}>ĐỌC CẤU HÌNH</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.btn, s.btnW, (!connected||busy) && s.btnDis]}
          onPress={Write} disabled={!connected||busy} activeOpacity={0.8}
        >
          {state.isWriting
            ? <View style={s.bRow}><ActivityIndicator size="small" color="#fff"/><Text style={[s.bTxt,{marginLeft:8}]}>ĐANG GHI...</Text></View>
            : <Text style={s.bTxt}>GHI CẤU HÌNH</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ══════════════════════════════════════════════════ */

const s = StyleSheet.create({
  root:   { flex:1, backgroundColor:'#f4f6f9' },
  scroll: { paddingBottom:92 },
  pillRow: { flexDirection:'row', gap:6, marginHorizontal:8, marginTop:4, marginBottom:2, justifyContent:'flex-end' },
  pill:    { paddingHorizontal:10, paddingVertical:4, borderRadius:14 },
  pillTxt: { color:'#fff', fontSize:12, fontWeight:'600' },

  /* ── panel ── */
  panel: {
    margin:8, backgroundColor:'#fff',
    borderRadius:10, borderWidth:1, borderColor:'#E8E8E8',
    paddingBottom:8,
  },
  panelHead: {
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    paddingHorizontal:10, paddingTop:8, paddingBottom:6,
  },
  panelTitle: { fontSize:12, fontWeight:'700', color:'#888', letterSpacing:0.4 },
  panelActions: { flexDirection:'row', alignItems:'center', gap:4 },
  actTxt: { fontSize:12, color:'#1976D2', fontWeight:'600' },
  actDot: { fontSize:12, color:'#ccc' },

  /* group chips */
  chipWrap: { flexDirection:'row', flexWrap:'wrap', paddingHorizontal:8, gap:6 },
  chip: {
    flexDirection:'row', alignItems:'center',
    paddingVertical:5, paddingHorizontal:10,
    borderRadius:16, borderWidth:1, borderColor:'#D0D0D0',
    backgroundColor:'#F7F7F7',
  },
  chipOn:    { borderColor:'#1976D2', backgroundColor:'#E3F2FD' },
  chipDot:   { fontSize:11, color:'#1976D2', fontWeight:'bold' },
  chipTxt:   { fontSize:12, color:'#555' },
  chipTxtOn: { color:'#1565C0', fontWeight:'700' },

  divider: { height:1, backgroundColor:'#F0F0F0', marginVertical:7, marginHorizontal:10 },

  /* command chips */
  cmdWrap: { flexDirection:'row', alignItems:'center', flexWrap:'wrap', paddingHorizontal:8, gap:6 },
  cmdHint: { fontSize:11, color:'#bbb' },
  cmdChip: {
    flexDirection:'row', alignItems:'center',
    paddingVertical:4, paddingHorizontal:10,
    borderRadius:16, borderWidth:1, borderColor:'#D0D0D0',
    backgroundColor:'#F7F7F7',
  },
  cmdChipOn: { borderColor:'#C62828', backgroundColor:'#FFF0F0' },
  cmdDot:    { fontSize:11, color:'#C62828', fontWeight:'bold' },
  cmdTxt:    { fontSize:12, color:'#555' },
  cmdTxtOn:  { color:'#C62828', fontWeight:'700' },

  /* table */
  table: {
    marginHorizontal:8, marginTop:6,
    backgroundColor:'#fff',
    borderRadius:10, borderWidth:1, borderColor:'#E8E8E8',
    overflow:'hidden',
  },
  thead: { flexDirection:'row', backgroundColor:'#263238', paddingVertical:6, paddingHorizontal:10 },
  th:    { color:'#fff', fontSize:12, fontWeight:'700' },
  tr:    { flexDirection:'row', alignItems:'center', borderBottomWidth:1, borderColor:'#F5F5F5', minHeight:48, paddingHorizontal:10, paddingVertical:6 },
  tLbl:  { flex:1.1, fontSize:13, color:'#444', paddingRight:4 },
  tIn:   { flex:1, height:36, borderWidth:1, borderColor:'#E0E0E0', borderRadius:5, paddingHorizontal:8, fontSize:13, color:'#222', backgroundColor:'#FAFAFA' },
  tRO:   { backgroundColor:'#F5F5F5', color:'#999', borderColor:'#EEE' },
  radRow:{ flex:1, flexDirection:'row', flexWrap:'wrap', paddingVertical:4, gap:6 },

  nowBtn: { paddingHorizontal:8, paddingVertical:4, borderRadius:5, borderWidth:1, borderColor:'#1976D2' },
  nowOn:  { backgroundColor:'#1976D2' },
  nowTxt: { fontSize:11, color:'#1976D2', fontWeight:'700' },

  /* bottom bar */
  bar: {
    position:'absolute', bottom:0, left:0, right:0,
    flexDirection:'row', padding:8, gap:8,
    backgroundColor:'#f4f6f9', borderTopWidth:1, borderColor:'#ddd',
  },
  btn:    { flex:1, height:44, borderRadius:8, justifyContent:'center', alignItems:'center' },
  btnR:   { backgroundColor:'#1976D2' },
  btnW:   { backgroundColor:'#D32F2F' },
  btnDis: { backgroundColor:'#BDBDBD' },
  bRow:   { flexDirection:'row', alignItems:'center' },
  bTxt:   { color:'#fff', fontWeight:'bold', fontSize:15, letterSpacing:0.3 },
});
