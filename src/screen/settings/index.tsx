import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import { GetHookProps, store } from './controller';

import {
  handleCheckFirmware,
  handleCheckRemoteVersion,
  handleUpdateFirmware,
} from './handleButton';

import SystemHeader from '../../component/SystemHeader';

export default function SettingsScreen() {

  const hookProps = GetHookProps();
  const { state } = hookProps;

  const typeWM = store.state.appSetting.setting.typeWM;

  // ===== SET TYPE WM =====
  const setTypeWM = (type: 'wm02' | 'wm02a') => {
    store.setState(prev => ({
      ...prev,
      appSetting: {
        ...prev.appSetting,
        setting: {
          ...prev.appSetting.setting,
          typeWM: type,
        },
      },
    }));
  };

  useEffect(() => {
    handleCheckRemoteVersion();
  }, []);

  const isNewVersion =
    state.remoteVersion &&
    state.remoteVersion !== state.currentVersion;

  return (

    <View style={styles.container}>

      <SystemHeader title="CÀI ĐẶT" subTitle="" />

      {/* ================= WM TYPE ================= */}

      <View style={styles.card}>

        <Text style={styles.label}>Loại Water Meter</Text>

        <TouchableOpacity
          style={[
            styles.option,
            typeWM === 'wm02' && styles.optionActive,
          ]}
          onPress={() => setTypeWM('wm02')}
        >

          <View style={styles.radio}>
            {typeWM === 'wm02' && <View style={styles.radioDot} />}
          </View>

          <Text style={styles.optionText}>WM02</Text>

        </TouchableOpacity>


        <TouchableOpacity
          style={[
            styles.option,
            typeWM === 'wm02a' && styles.optionActive,
          ]}
          onPress={() => setTypeWM('wm02a')}
        >

          <View style={styles.radio}>
            {typeWM === 'wm02a' && <View style={styles.radioDot} />}
          </View>

          <Text style={styles.optionText}>WM02A</Text>

        </TouchableOpacity>

      </View>


      {/* ================= FIRMWARE ================= */}

      <View style={[styles.card, { marginTop: 16 }]}>

        <Text style={styles.label}>Firmware WM02A</Text>

        {/* CURRENT VERSION */}

        <View style={styles.row}>

          <Text style={styles.versionText}>
            Phiên bản hiện tại:
            {state.loadingCurrentVersion
              ? ' Đang đọc...'
              : ` ${state.currentVersion || '---'}`}
          </Text>

          {state.loadingCurrentVersion && (
            <ActivityIndicator
              size="small"
              color="#1976D2"
              style={{ marginLeft: 8 }}
            />
          )}

        </View>


        {/* REMOTE VERSION */}

        <View style={styles.row}>

          <Text style={styles.versionText}>
            Phiên bản mới nhất:
            {state.loadingRemoteVersion
              ? ' Đang kiểm tra...'
              : ` ${state.remoteVersion || '---'}`}
          </Text>

          {state.loadingRemoteVersion && (
            <ActivityIndicator
              size="small"
              color="#1976D2"
              style={{ marginLeft: 8 }}
            />
          )}

        </View>


        {/* CHECK VERSION */}

        <TouchableOpacity
          style={styles.checkBtn}
          onPress={handleCheckFirmware}
        >
          <Text style={styles.btnText}>
            Kiểm tra phiên bản
          </Text>
        </TouchableOpacity>


        {/* UPDATE */}

        {isNewVersion && (

          <TouchableOpacity
            style={styles.updateBtn}
            onPress={handleUpdateFirmware}
          >
            <Text style={styles.btnText}>
              Cập nhật Firmware
            </Text>
          </TouchableOpacity>

        )}


        {/* ===== OTA PROGRESS ===== */}

        {state.otaRunning && (

          <View style={styles.progressBox}>

            <Text style={styles.progressText}>
              Tiến trình cập nhật: {state.otaProgress}%
            </Text>

            <View style={styles.progressBar}>

              <View
                style={[
                  styles.progressFill,
                  { width: `${state.otaProgress}%` },
                ]}
              />

            </View>

            <Text style={styles.sizeText}>

              {(state.otaSent / 1024).toFixed(1)} KB /
              {(state.otaTotal / 1024).toFixed(1)} KB

            </Text>

          </View>

        )}

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

  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ddd',
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },

  optionActive: {
    borderColor: '#1976D2',
    backgroundColor: '#E3F2FD',
  },

  optionText: {
    fontSize: 14,
    marginLeft: 10,
    color: '#333',
    fontWeight: '500',
  },

  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#1976D2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1976D2',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  versionText: {
    fontSize: 14,
    marginBottom: 6,
    color: '#333',
  },

  checkBtn: {
    marginTop: 12,
    backgroundColor: '#607D8B',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  updateBtn: {
    marginTop: 10,
    backgroundColor: '#1976D2',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  btnText: {
    color: '#fff',
    fontWeight: '600',
  },

  progressBox: {
    marginTop: 16,
  },

  progressText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },

  progressBar: {
    height: 10,
    backgroundColor: '#ddd',
    borderRadius: 6,
    overflow: 'hidden',
  },

  progressFill: {
    height: 10,
    backgroundColor: '#1976D2',
  },

  sizeText: {
    marginTop: 4,
    fontSize: 12,
    color: '#555',
  },

});
