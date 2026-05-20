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

const GROUPS = [
  { label: 'Thông tin thiết bị',    sub: 'Serial · Seri ĐH · Loại module · QCCID', keys: ['chkModuleNo','chkMeterNo','chkModuleType','chkQCCID'] },
  { label: 'Thời gian',             sub: 'Đồng hồ RTC · Múi giờ',                  keys: ['chkRTC','chkTimeZone'] },
  { label: 'Chỉ số đo đếm',         sub: 'Xuôi · Ngược · Tổng · Q3 · Lít/vòng',   keys: ['chkImpData','chkQ3','chkLPR'] },
  { label: 'Kết nối & Gửi dữ liệu', sub: 'IP · Chu kỳ · Thời điểm · Sự kiện',     keys: ['chkIPPORT','chkPushMethod','chkPushPeriod','chkPushTime1','chkPushTime2','chkPushEventMethod','chkRandomMin'] },
  { label: 'Cấu hình thiết bị',     sub: 'Chu kỳ lưu · Cấu hình SK · Kích hoạt',  keys: ['chkLatchPeriod','chkEventConfig','chkEnableDevice'] },
  { label: 'Phiên bản & Pin',        sub: 'Firmware · Boot · Điện áp · Pin',        keys: ['chkFirmwareVer','chkBootVer','chkVoltage','chkRemainBattery','chkBatteryCapacity'] },
  { label: 'Trạng thái',             sub: 'Reset gần nhất · Số lần reset',          keys: ['chkTemp','chkResetCount'] },
] as const;

const CMDS = [
  { label: 'Xóa dữ liệu',  key: 'chkClearData' },
  { label: 'Gửi ngay',     key: 'chkPushData' },
  { label: 'Reset Module', key: 'chkResetModule' },
] as const;

const ALL_KEYS = GROUPS.flatMap(g => g.keys as unknown as string[]);

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
    setState(p => ({ ...p, inputTotalData: (Number(p.inputImpData||0) - Number(p.inputExpData||0)).toString() }));
  }, [state.inputImpData, state.inputExpData]);

  const set = (k: any, v: string) => setState(p => ({ ...p, [k]: v }));

  const toggleGroup = (keys: readonly string[]) => {
    const allOn = keys.every(k => (state as any)[k]);
    setState(p => { const n={...p}; keys.forEach(k=>(n as any)[k]=!allOn); return n; });
  };

  const selectAll   = () => setState(p => { const n={...p}; ALL_KEYS.forEach(k=>(n as any)[k]=true);  return n; });
  const unselectAll = () => setState(p => { const n={...p}; ALL_KEYS.forEach(k=>(n as any)[k]=false); return n; });

  /* ─── table rows ─── */
  const TR = (key: string, label: string, ik: any, num=false, edit=true) => (
    <View key={key} style={styles.tr}>
      <Text style={styles.trLbl}>{label}</Text>
      <TextInput
        style={[styles.trIn, !edit && styles.trRO]}
        value={String((state as any)[ik]??'')}
        editable={edit}
        onChangeText={v=>set(ik,v)}
        keyboardType={num?'numeric':'default'}
        placeholder="—" placeholderTextColor="#ccc"
      />
    </View>
  );

  const rows: React.ReactNode[] = [];
  if (state.chkModuleNo)   rows.push(TR('mn',  'Serial Module',      'inputModuleNo'));
  if (state.chkMeterNo)    rows.push(TR('me',  'Số seri đồng hồ',    'inputMeterNo'));
  if (state.chkModuleType) rows.push(TR('mt',  'Loại Module',        'inputModuleType'));
  if (state.chkQCCID)      rows.push(TR('qc',  'QCCID',              'inputQCCID'));
  if (state.chkRTC) rows.push(
    <View key="rtc" style={styles.tr}>
      <Text style={styles.trLbl}>Thời gian RTC</Text>
      <View style={{flex:1,flexDirection:'row',alignItems:'center'}}>
        <TextInput
          style={[styles.trIn,{flex:1,marginRight:6},state.chkRTCNow&&styles.trRO]}
          value={state.inputRTC} editable={!state.chkRTCNow}
          onChangeText={v=>set('inputRTC',v)} placeholder="—" placeholderTextColor="#ccc"
        />
        <TouchableOpacity
          style={[styles.nowBtn,state.chkRTCNow&&styles.nowOn]}
          onPress={()=>setState(p=>({...p,chkRTCNow:!p.chkRTCNow}))}
        >
          <Text style={[styles.nowTxt,state.chkRTCNow&&{color:'#fff'}]}>Now</Text>
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
    <View key="pm" style={styles.tr}>
      <Text style={styles.trLbl}>PT gửi dữ liệu</Text>
      <View style={styles.radRow}>
        <Radio label="Chu kỳ"    checked={state.inputPushMethod==='1'} onPress={()=>set('inputPushMethod','1')}/>
        <Radio label="Thời điểm" checked={state.inputPushMethod==='2'} onPress={()=>set('inputPushMethod','2')}/>
      </View>
    </View>
  );
  if (state.chkPushPeriod) rows.push(TR('pp','Chu kỳ gửi (phút)','inputPushPeriod',true));
  if (state.chkPushTime1)  rows.push(TR('p1','Thời điểm gửi 1','inputPushTime1'));
  if (state.chkPushTime2)  rows.push(TR('p2','Thời điểm gửi 2','inputPushTime2'));
  if (state.chkPushEventMethod) rows.push(
    <View key="pem" style={styles.tr}>
      <Text style={styles.trLbl}>PT gửi sự kiện</Text>
      <View style={styles.radRow}>
        <Radio label="Chu kỳ"   checked={state.inputPushEventMethod=='0'} onPress={()=>set('inputPushEventMethod','0')}/>
        <Radio label="Tức thời" checked={state.inputPushEventMethod=='1'} onPress={()=>set('inputPushEventMethod','1')}/>
      </View>
    </View>
  );
  if (state.chkRandomMin)   rows.push(TR('rm','Ngẫu nhiên (phút)','inputRandomMin',true));
  if (state.chkLatchPeriod) rows.push(TR('lc','Chu kỳ lưu (phút)','inputLatchPeriod',true));
  if (state.chkEventConfig) rows.push(TR('ec','Cấu hình sự kiện','inputEventConfig'));
  if (state.chkEnableDevice) rows.push(
    <View key="ed" style={styles.tr}>
      <Text style={styles.trLbl}>Kích hoạt thiết bị</Text>
      <View style={styles.radRow}>
        <Radio label="Tắt" checked={state.inputEnableDevice==='0'} onPress={()=>set('inputEnableDevice','0')}/>
        <Radio label="Bật" checked={state.inputEnableDevice==='1'} onPress={()=>set('inputEnableDevice','1')}/>
      </View>
    </View>
  );
  if (state.chkFirmwareVer)     rows.push(TR('fw','Firmware',        'inputFirmwareVer',    false,false));
  if (state.chkBootVer)         rows.push(TR('bv','Boot ver',        'inputBootVer',        false,false));
  if (state.chkVoltage)         rows.push(TR('vt','Điện áp (V)',     'inputVoltage',        false,false));
  if (state.chkRemainBattery)   rows.push(TR('rb','Pin còn lại',     'inputRemainBattery',  false,false));
  if (state.chkBatteryCapacity) rows.push(TR('bc','Dung lượng pin',  'inputBatteryCapacity',false,false));
  if (state.chkTemp)            rows.push(TR('tm','Trạng thái reset','inputTemp',           false,false));
  if (state.chkResetCount)      rows.push(TR('rc','Số lần reset',    'inputResetCount',     false,false));

  return (
    <KeyboardAvoidingView style={styles.wrap} behavior={Platform.OS==='ios'?'padding':undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <SystemHeader title="CẤU HÌNH" subTitle="ĐỌC / GHI CẤU HÌNH ĐỒNG HỒ" />

        {/* select pills */}
        <View style={styles.pillRow}>
          <TouchableOpacity style={[styles.pill,{backgroundColor:'#1976D2'}]} onPress={selectAll}   disabled={busy}><Text style={styles.pillTxt}>✔ Chọn tất cả</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.pill,{backgroundColor:'#757575'}]} onPress={unselectAll} disabled={busy}><Text style={styles.pillTxt}>✖ Bỏ chọn</Text></TouchableOpacity>
        </View>

        {/* group list – one card */}
        <View style={styles.card}>
          {GROUPS.map((g,i) => {
            const full    = (g.keys as unknown as string[]).every(k=>(state as any)[k]);
            const partial = !full && (g.keys as unknown as string[]).some(k=>(state as any)[k]);
            return (
              <React.Fragment key={g.label}>
                {i>0 && <View style={styles.sep}/>}
                <TouchableOpacity style={styles.gRow} onPress={()=>toggleGroup(g.keys)} activeOpacity={0.6}>
                  <View style={[styles.chk, full&&styles.chkOn, partial&&styles.chkPart]}>
                    <Text style={styles.chkTick}>{full?'✓':partial?'−':''}</Text>
                  </View>
                  <View style={{flex:1}}>
                    <Text style={[styles.gName,(full||partial)&&styles.gNameOn]}>{g.label}</Text>
                    <Text style={styles.gSub}>{g.sub}</Text>
                  </View>
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>

        {/* commands */}
        <View style={styles.cmdRow}>
          {CMDS.map(cmd=>{
            const on=!!(state as any)[cmd.key];
            return (
              <TouchableOpacity key={cmd.key} style={[styles.cmdBtn,on&&styles.cmdBtnOn]}
                onPress={()=>setState(p=>({...p,[cmd.key]:!(p as any)[cmd.key]}))} activeOpacity={0.7}>
                <View style={[styles.chk,on&&styles.chkRed]}><Text style={styles.chkTick}>{on?'✓':''}</Text></View>
                <Text style={[styles.cmdTxt,on&&styles.cmdTxtOn]}>{cmd.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* data table */}
        {rows.length>0 && (
          <View style={styles.table}>
            <View style={styles.thead}>
              <Text style={[styles.th,{flex:1.1}]}>Thông số</Text>
              <Text style={[styles.th,{flex:1}]}>Giá trị</Text>
            </View>
            {rows}
          </View>
        )}
        <View style={{height:12}}/>
      </ScrollView>

      <View style={styles.bar}>
        <TouchableOpacity style={[styles.btn,styles.btnR,(!connected||busy)&&styles.btnDis]} onPress={Read} disabled={!connected||busy} activeOpacity={0.8}>
          {state.isReading
            ? <View style={styles.bRow}><ActivityIndicator size="small" color="#fff"/><Text style={[styles.bTxt,{marginLeft:8}]}>ĐANG ĐỌC...</Text></View>
            : <Text style={styles.bTxt}>ĐỌC CẤU HÌNH</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn,styles.btnW,(!connected||busy)&&styles.btnDis]} onPress={Write} disabled={!connected||busy} activeOpacity={0.8}>
          {state.isWriting
            ? <View style={styles.bRow}><ActivityIndicator size="small" color="#fff"/><Text style={[styles.bTxt,{marginLeft:8}]}>ĐANG GHI...</Text></View>
            : <Text style={styles.bTxt}>GHI CẤU HÌNH</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex:1, backgroundColor:'#f4f6f9' },
  scroll: { paddingBottom:108 },

  pillRow: { flexDirection:'row', gap:8, margin:10, justifyContent:'flex-end' },
  pill:    { paddingHorizontal:12, paddingVertical:6, borderRadius:20 },
  pillTxt: { color:'#fff', fontSize:13, fontWeight:'600' },

  /* group card */
  card: { marginHorizontal:10, backgroundColor:'#fff', borderRadius:10, borderWidth:1, borderColor:'#e0e0e0', overflow:'hidden' },
  sep:  { height:1, backgroundColor:'#f0f0f0', marginLeft:46 },
  gRow: { flexDirection:'row', alignItems:'center', paddingVertical:10, paddingHorizontal:12 },
  chk:  { width:22, height:22, borderRadius:4, borderWidth:2, borderColor:'#bbb', alignItems:'center', justifyContent:'center', marginRight:12, flexShrink:0 },
  chkOn:   { borderColor:'#1976D2', backgroundColor:'#1976D2' },
  chkPart: { borderColor:'#90CAF9', backgroundColor:'#90CAF9' },
  chkRed:  { borderColor:'#C62828', backgroundColor:'#C62828' },
  chkTick: { color:'#fff', fontSize:12, fontWeight:'bold' },
  gName:   { fontSize:14, fontWeight:'600', color:'#333' },
  gNameOn: { color:'#1565C0' },
  gSub:    { fontSize:11, color:'#aaa', marginTop:1 },

  /* commands */
  cmdRow: { flexDirection:'row', gap:6, marginHorizontal:10, marginTop:8 },
  cmdBtn: { flex:1, flexDirection:'row', alignItems:'center', backgroundColor:'#fff', borderRadius:8, borderWidth:1, borderColor:'#ddd', paddingVertical:8, paddingHorizontal:10 },
  cmdBtnOn: { borderColor:'#C62828', backgroundColor:'#FFF3F3' },
  cmdTxt:   { fontSize:12, color:'#555', flex:1 },
  cmdTxtOn: { color:'#C62828', fontWeight:'700' },

  /* table */
  table: { marginHorizontal:10, marginTop:10, backgroundColor:'#fff', borderRadius:10, borderWidth:1, borderColor:'#e0e0e0', overflow:'hidden' },
  thead: { flexDirection:'row', backgroundColor:'#37474F', paddingVertical:7, paddingHorizontal:10 },
  th:    { color:'#fff', fontSize:12, fontWeight:'bold' },
  tr:    { flexDirection:'row', alignItems:'center', borderBottomWidth:1, borderColor:'#f0f0f0', minHeight:40, paddingHorizontal:10 },
  trLbl: { flex:1.1, fontSize:12, color:'#444', paddingRight:4 },
  trIn:  { flex:1, height:32, borderWidth:1, borderColor:'#ddd', borderRadius:5, paddingHorizontal:7, fontSize:12, color:'#222', backgroundColor:'#fafafa' },
  trRO:  { backgroundColor:'#f2f2f2', color:'#888' },
  radRow:{ flex:1, flexDirection:'row', flexWrap:'wrap', paddingVertical:4 },

  nowBtn: { paddingHorizontal:8, paddingVertical:5, borderRadius:5, borderWidth:1, borderColor:'#1976D2' },
  nowOn:  { backgroundColor:'#1976D2' },
  nowTxt: { fontSize:11, color:'#1976D2', fontWeight:'600' },

  /* bottom */
  bar: { position:'absolute', bottom:0, left:0, right:0, flexDirection:'row', padding:10, gap:8, backgroundColor:'#f4f6f9', borderTopWidth:1, borderColor:'#ddd' },
  btn:    { flex:1, height:48, borderRadius:10, justifyContent:'center', alignItems:'center' },
  btnR:   { backgroundColor:'#1976D2' },
  btnW:   { backgroundColor:'#D32F2F' },
  btnDis: { backgroundColor:'#9E9E9E' },
  bRow:   { flexDirection:'row', alignItems:'center' },
  bTxt:   { color:'#fff', fontWeight:'bold', fontSize:15 },
});
