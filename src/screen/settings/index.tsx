import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { GetHookProps, store } from './controller';

export default function SettingsScreen() {
  const hookProps = GetHookProps();
  const { state, setState } = hookProps;

  const typeWM = store.state.appSetting.setting.typeWM;

  // ✅ SET TYPE WM BẰNG store.setState
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cài đặt hệ thống</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Loại Water Meter</Text>

        {/* WM02 */}
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

        {/* WM02A */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f9',
    padding: 16,
  },

  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#1976D2',
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
});
