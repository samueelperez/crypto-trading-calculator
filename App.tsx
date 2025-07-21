import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { theme, colors } from './src/theme';
import CalculatorScreen from './src/screens/CalculatorScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <StatusBar style="dark" backgroundColor={colors.background} />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Calculator"
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.card,
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            },
            headerTintColor: colors.cardForeground,
            headerTitleStyle: {
              fontWeight: '600',
              fontSize: 18,
            },
            headerShadowVisible: false,
            headerTitleAlign: 'center',
          }}
        >
          <Stack.Screen 
            name="Calculator" 
            component={CalculatorScreen}
            options={{ 
              title: 'Trading Calculator',
              headerShown: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
} 