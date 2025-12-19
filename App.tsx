import React from 'react';
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import BottomBar from './src/navigation/BottomBar';
import { StoreProvider } from './src/store';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <StoreProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          />
          <BottomBar />
        </NavigationContainer>
      </SafeAreaProvider>
    </StoreProvider>
  );
}

export default App;

const styles = StyleSheet.create({
  container: { flex: 1 },
});
