import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Alert,
  Keyboard,
  Dimensions,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Text,
  useTheme,
  FAB,
  Divider,
} from 'react-native-paper';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface LossOption {
  label: string;
  value: string;
  amount: number;
}

const lossOptions: LossOption[] = [
  { label: '$120', value: '120', amount: 120 },
  { label: '$60', value: '60', amount: 60 },
  { label: '$30', value: '30', amount: 30 },
];

const leverageOptions = [10, 20, 50];

export default function CalculatorScreen() {
  const theme = useTheme();
  const [entryPrice, setEntryPrice] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [selectedLoss, setSelectedLoss] = useState<string>('');
  const [positionSize, setPositionSize] = useState<number>(0);
  const [riskRewardRatio, setRiskRewardRatio] = useState<number>(0);
  const [potentialProfit, setPotentialProfit] = useState<number>(0);
  const [potentialLoss, setPotentialLoss] = useState<number>(0);
  const [positionsByLeverage, setPositionsByLeverage] = useState<{ [key: string]: number }>({});

  const calculatePosition = () => {
    Keyboard.dismiss();
    
    const entry = parseFloat(entryPrice);
    const stop = parseFloat(stopLoss);
    const target = parseFloat(targetPrice);

    if (!selectedLoss) {
      Alert.alert('Error', 'Por favor selecciona cuánto quieres perder');
      return;
    }

    if (isNaN(entry) || isNaN(stop) || isNaN(target)) {
      Alert.alert('Error', 'Por favor, completa todos los campos con valores válidos');
      return;
    }

    if (entry <= 0 || stop <= 0 || target <= 0) {
      Alert.alert('Error', 'Los precios deben ser mayores a 0');
      return;
    }

    if (stop >= entry && target <= entry) {
      Alert.alert('Error', 'El stop loss debe estar por debajo del precio de entrada y el objetivo por encima');
      return;
    }

    // Obtener la pérdida deseada
    const selectedLossOption = lossOptions.find(option => option.value === selectedLoss);
    const desiredLoss = selectedLossOption?.amount || 0;

    // Calcular el porcentaje de pérdida al stop loss
    const priceDifference = Math.abs(entry - stop);
    const lossPercentage = priceDifference / entry;

    // Calcular el tamaño de posición total necesario
    // Si quieres perder $120 y la pérdida es del 25%, necesitas: $120 ÷ 0.25 = $480
    const positionSizeValue = desiredLoss / lossPercentage;
    setPositionSize(positionSizeValue);

    // Calcular ratio riesgo/recompensa
    const potentialGain = Math.abs(target - entry);
    const gainPercentage = potentialGain / entry;
    const riskReward = gainPercentage / lossPercentage;
    setRiskRewardRatio(riskReward);

    // Calcular ganancia/pérdida potencial
    const profit = positionSizeValue * gainPercentage;
    const loss = positionSizeValue * lossPercentage;
    setPotentialProfit(profit);
    setPotentialLoss(loss);

    // Calcular margen requerido para cada apalancamiento
    const positionsCalc: { [key: string]: number } = {};
    leverageOptions.forEach(leverage => {
      positionsCalc[`${leverage}x`] = positionSizeValue / leverage;
    });
    setPositionsByLeverage(positionsCalc);
  };

  const containerStyle = {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: isWeb ? Math.max(20, (width - 600) / 2) : 20,
  };

  const cardStyle = {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  };

  const inputStyle = {
    marginBottom: 16,
  };

  const buttonStyle = {
    marginTop: 8,
    marginBottom: 16,
  };

  return (
    <View style={containerStyle}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{ marginBottom: 24, alignItems: 'center' }}>
          <Text variant="headlineMedium" style={{ 
            color: theme.colors.primary, 
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            Calculadora de Trading
          </Text>
          <Text variant="bodyMedium" style={{ 
            color: theme.colors.onSurfaceVariant,
            textAlign: 'center',
            marginTop: 8
          }}>
            Calcula el tamaño de posición para perder exactamente lo que quieres
          </Text>
        </View>

        {/* Inputs */}
        <Card style={cardStyle}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 16, color: theme.colors.primary }}>
              Precios
            </Text>
            
            <TextInput
              label="Precio de entrada"
              value={entryPrice}
              onChangeText={setEntryPrice}
              keyboardType="numeric"
              mode="outlined"
              style={inputStyle}
              placeholder="Ej: 4.00"
            />
            
            <TextInput
              label="Take profit (objetivo)"
              value={targetPrice}
              onChangeText={setTargetPrice}
              keyboardType="numeric"
              mode="outlined"
              style={inputStyle}
              placeholder="Ej: 9.00"
            />
            
            <TextInput
              label="Stop loss"
              value={stopLoss}
              onChangeText={setStopLoss}
              keyboardType="numeric"
              mode="outlined"
              style={inputStyle}
              placeholder="Ej: 3.00"
            />
          </Card.Content>
        </Card>

        {/* Loss Selection */}
        <Card style={cardStyle}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 16, color: theme.colors.primary }}>
              ¿Cuánto quieres perder?
            </Text>
            
            <View style={{ 
              flexDirection: isWeb ? 'row' : 'column', 
              gap: 12,
              flexWrap: 'wrap'
            }}>
              {lossOptions.map((option) => (
                <Button
                  key={option.value}
                  mode={selectedLoss === option.value ? "contained" : "outlined"}
                  onPress={() => setSelectedLoss(option.value)}
                  style={{ 
                    flex: isWeb ? 1 : undefined,
                    minWidth: isWeb ? 100 : undefined
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Calculate Button */}
        <Button
          mode="contained"
          onPress={calculatePosition}
          style={buttonStyle}
          contentStyle={{ paddingVertical: 8 }}
          labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
        >
          Calcular Posición
        </Button>

        {/* Results */}
        {positionSize > 0 && (
          <>
            <Card style={cardStyle}>
              <Card.Content>
                <Text variant="titleMedium" style={{ marginBottom: 16, color: theme.colors.primary }}>
                  Resultados
                </Text>
                
                <View style={{ marginBottom: 16 }}>
                  <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                    Tamaño de posición total:
                  </Text>
                  <Text variant="headlineSmall" style={{ 
                    color: theme.colors.primary, 
                    fontWeight: 'bold' 
                  }}>
                    ${positionSize.toFixed(2)}
                  </Text>
                </View>

                <Divider style={{ marginVertical: 12 }} />

                <View style={{ marginBottom: 16 }}>
                  <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                    Ratio R/R:
                  </Text>
                  <Text variant="headlineSmall" style={{ 
                    color: theme.colors.primary, 
                    fontWeight: 'bold' 
                  }}>
                    {riskRewardRatio.toFixed(2)}:1
                  </Text>
                </View>

                <View style={{ 
                  flexDirection: isWeb ? 'row' : 'column',
                  gap: 16
                }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                      Ganancia potencial:
                    </Text>
                    <Text variant="titleMedium" style={{ 
                      color: theme.colors.tertiary, 
                      fontWeight: 'bold' 
                    }}>
                      ${potentialProfit.toFixed(2)}
                    </Text>
                  </View>
                  
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                      Pérdida potencial:
                    </Text>
                    <Text variant="titleMedium" style={{ 
                      color: theme.colors.error, 
                      fontWeight: 'bold' 
                    }}>
                      ${potentialLoss.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Leverage Options */}
            <Card style={cardStyle}>
              <Card.Content>
                <Text variant="titleMedium" style={{ marginBottom: 16, color: theme.colors.primary }}>
                  Margen requerido por apalancamiento
                </Text>
                
                <View style={{ 
                  flexDirection: isWeb ? 'row' : 'column',
                  gap: 12
                }}>
                  {leverageOptions.map((leverage) => (
                    <View key={leverage} style={{ 
                      flex: 1,
                      padding: 16,
                      backgroundColor: theme.colors.surfaceVariant,
                      borderRadius: 12,
                      alignItems: 'center'
                    }}>
                      <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {leverage}x
                      </Text>
                      <Text variant="titleLarge" style={{ 
                        color: theme.colors.primary, 
                        fontWeight: 'bold' 
                      }}>
                        ${positionsByLeverage[`${leverage}x`]?.toFixed(2) || '0.00'}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card.Content>
            </Card>
          </>
        )}
      </ScrollView>

      {/* FAB for mobile */}
      {!isWeb && (
        <FAB
          icon="calculator"
          style={{
            position: 'absolute',
            margin: 16,
            right: 0,
            bottom: 0,
            backgroundColor: theme.colors.primary,
          }}
          onPress={calculatePosition}
        />
      )}
    </View>
  );
} 