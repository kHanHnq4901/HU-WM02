import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { GetHookProps, store } from './controller';
import { handleCheckFirmware, handleCheckRemoteVersion, handleUpdateFirmware } from './handleButton';
import { saveValueAppSettingToNvm } from '../../service/storage';
import SystemHeader from '../../component/SystemHeader';

export default function SettingsScreen() {
  const hookProps = GetHookProps();
  const { state } = hookProps;
  const typeWM = store.state.appSetting.setting.typeWM;

  const setTypeWM = (type: 'wm02' | 'wm02a' | 'wm06') => {
    const newAppSetting = {
      ...store.state.appSetting,
      setting: { ...store.state.appSetting.setting, typeWM: type },
    };
    store.setState(prev => ({ ...prev, appSetting: newAppSetting }));
    saveValueAppSettingToNvm(newAppSetting);
  };

  useEffect(() => { handleCheckRemoteVersion(); }, []);

  const isNewVersion = state.remoteVersion && state.remoteVersion !== state.currentVersion;

  return (
    <View style={styles.container}>
      <SystemHeader title="CÀI ĐẶT" subTitle="" />

      {/* loại water meter */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Loại Water Meter</Text>
        {(['wm02', 'wm02a', 'wm06'] as const).map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.option, typeWM === type && styles.optionOn]}
            onPress={() => setTypeWM(type)}
            activeOpacity={0.7}
          >
            <View style={[styles.radio, typeWM === type && styles.radioOn]}>
              {typeWM === type && <View style={styles.radioDot} />}
            </View>
            <Text style={[styles.optionTxt, typeWM === type && styles.optionTxtOn]}>
              {type.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* firmware */}
      <View style={[styles.card, { marginTop: 10 }]}>
        <Text style={styles.cardTitle}>Firmware WM02A</Text>

        <View style={styles.versionRow}>
          <Text style={styles.versionLbl}>Phiên bản hiện tại</Text>
          <View style={styles.versionVal}>
            {state.loadingCurrentVersion
              ? <ActivityIndicator size="small" color="#1565C0" />
              : <Text style={styles.versionTxt}>{state.currentVersion || '---'}</Text>}
          </View>
        </View>

        <View style={styles.versionRow}>
          <Text style={styles.versionLbl}>Phiên bản mới nhất</Text>
          <View style={styles.versionVal}>
            {state.loadingRemoteVersion
              ? <ActivityIndicator size="small" color="#1565C0" />
              : <Text style={[styles.versionTxt, isNewVersion && { color: '#1565C0', fontWeight: '700' }]}>
                  {state.remoteVersion || '---'}
                </Text>}
          </View>
        </View>

        <TouchableOpacity style={styles.btnGray} onPress={handleCheckFirmware} activeOpacity={0.8}>
          <Text style={styles.btnTxt}>Kiểm tra phiên bản</Text>
        </TouchableOpacity>

        {isNewVersion && (
          <TouchableOpacity style={[styles.btnGray, { backgroundColor: '#1565C0', marginTop: 6 }]} onPress={handleUpdateFirmware} activeOpacity={0.8}>
            <Text style={styles.btnTxt}>Cập nhật Firmware</Text>
          </TouchableOpacity>
        )}

        {state.otaRunning && (
          <View style={styles.progressBox}>
            <View style={styles.progressHead}>
              <Text style={styles.progressLbl}>Đang cập nhật</Text>
              <Text style={styles.progressPct}>{state.otaProgress}%</Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${state.otaProgress}%` as any }]} />
            </View>
            <Text style={styles.sizeTxt}>
              {(state.otaSent / 1024).toFixed(1)} KB / {(state.otaTotal / 1024).toFixed(1)} KB
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8', padding: 8 },

  card: {
    backgroundColor: '#fff', borderRadius: 10,
    padding: 10, borderWidth: 1, borderColor: '#DDE3EB',
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 8, letterSpacing: 0.3 },

  option: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 10,
    borderRadius: 10, marginBottom: 6,
    borderWidth: 1, borderColor: '#DDE3EB',
  },
  optionOn:  { borderColor: '#1565C0', backgroundColor: '#EFF6FF' },
  optionTxt: { fontSize: 14, marginLeft: 10, color: '#1E293B', fontWeight: '500' },
  optionTxtOn: { color: '#1565C0', fontWeight: '700' },

  radio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: '#94A3B8',
    alignItems: 'center', justifyContent: 'center',
  },
  radioOn:  { borderColor: '#1565C0' },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#1565C0' },

  versionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 7, borderBottomWidth: 1, borderColor: '#F0F4F8',
  },
  versionLbl: { flex: 1, fontSize: 13, color: '#64748B' },
  versionVal: { flexDirection: 'row', alignItems: 'center' },
  versionTxt: { fontSize: 13, color: '#1E293B', fontWeight: '600' },

  btnGray: {
    marginTop: 10, height: 46, backgroundColor: '#607D8B',
    borderRadius: 10, justifyContent: 'center', alignItems: 'center',
  },
  btnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },

  progressBox: { marginTop: 12 },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  progressLbl: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  progressPct: { fontSize: 13, fontWeight: '700', color: '#1565C0' },
  progressBg:   { height: 6, backgroundColor: '#DDE3EB', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: '#1565C0', borderRadius: 4 },
  sizeTxt: { marginTop: 4, fontSize: 11, color: '#64748B', textAlign: 'right' },
});
