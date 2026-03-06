import React from 'react';
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

// Sửa đường dẫn import cho đúng với cấu trúc thư mục của bạn

import { StoreProvider } from './src/store';
import AppNavigator from './src/navigation/Navigator';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <StoreProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          />
          {/* Thay thế BottomBar bằng AppNavigator */}
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </StoreProvider>
  );
}

export default App;

const styles = StyleSheet.create({
  container: { flex: 1 },
});