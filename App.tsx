import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from './src/theme';
import CalculatorScreen from './src/screens/CalculatorScreen';
import { Platform, View, StyleSheet } from 'react-native';

export default function App() {
  const isWeb = Platform.OS === 'web';
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      minHeight: isWeb ? '100vh' : '100%',
    },
  });

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <View style={styles.container}>
          <StatusBar style="auto" />
          <CalculatorScreen />
        </View>
      </PaperProvider>
    </SafeAreaProvider>
  );
} 