import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Alert,
  Keyboard,
  Dimensions,
  Platform,
  StyleSheet,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Text,
  useTheme,
  FAB,
  Divider,
  Surface,
} from 'react-native-paper';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface LossOption {
  label: string;
  value: string;
  amount: number;
}

const lossOptions: LossOption[] = [
  { label: '$300', value: '300', amount: 300 },
  { label: '$170', value: '170', amount: 170 },
  { label: '$130', value: '130', amount: 130 },
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      minHeight: isWeb ? '100vh' : '100%',
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: isWeb ? Math.max(20, (width - 800) / 2) : 20,
      paddingTop: isWeb ? 40 : 60,
      paddingBottom: isWeb ? 40 : 100,
    },
    header: {
      alignItems: 'center',
      marginBottom: 32,
      paddingHorizontal: 20,
    },
    title: {
      fontSize: isWeb ? 32 : 28,
      fontWeight: 'bold',
      color: theme.colors.primary,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: isWeb ? 16 : 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 22,
    },
    card: {
      marginBottom: 24,
      borderRadius: 16,
      elevation: 2,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    cardContent: {
      padding: isWeb ? 32 : 24,
    },
    sectionTitle: {
      fontSize: isWeb ? 20 : 18,
      fontWeight: '600',
      color: theme.colors.primary,
      marginBottom: 20,
    },
    inputRow: {
      flexDirection: isWeb ? 'row' : 'column',
      gap: 16,
      marginBottom: 16,
    },
    inputColumn: {
      flex: 1,
    },
    input: {
      backgroundColor: theme.colors.surface,
      marginBottom: 0,
    },
    lossButtonsContainer: {
      flexDirection: isWeb ? 'row' : 'column',
      gap: 12,
      flexWrap: 'wrap',
    },
    lossButton: {
      flex: isWeb ? 1 : undefined,
      minWidth: isWeb ? 120 : undefined,
    },
    calculateButton: {
      marginTop: 8,
      marginBottom: 24,
      paddingVertical: 8,
    },
    resultsGrid: {
      flexDirection: isWeb ? 'row' : 'column',
      gap: 16,
      marginBottom: 24,
    },
    resultCard: {
      flex: 1,
      padding: 20,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      alignItems: 'center',
    },
    resultLabel: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 8,
      textAlign: 'center',
    },
    resultValue: {
      fontSize: isWeb ? 24 : 20,
      fontWeight: 'bold',
      color: theme.colors.primary,
      textAlign: 'center',
    },
    leverageGrid: {
      flexDirection: isWeb ? 'row' : 'column',
      gap: 12,
    },
    leverageCard: {
      flex: 1,
      padding: 20,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      alignItems: 'center',
    },
    leverageLabel: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 8,
    },
    leverageValue: {
      fontSize: isWeb ? 20 : 18,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    profitValue: {
      color: theme.colors.tertiary,
    },
    lossValue: {
      color: theme.colors.error,
    },
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.primary,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={true}
        alwaysBounceVertical={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Calculadora de Trading
          </Text>
          <Text style={styles.subtitle}>
            Calcula el tamaño de posición para perder exactamente lo que quieres
          </Text>
        </View>

        {/* Inputs */}
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.sectionTitle}>
              Precios
            </Text>
            
            <View style={styles.inputRow}>
              <View style={styles.inputColumn}>
                <TextInput
                  label="Precio de entrada"
                  value={entryPrice}
                  onChangeText={setEntryPrice}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                  placeholder="Ej: 4.00"
                />
              </View>
              
              <View style={styles.inputColumn}>
                <TextInput
                  label="Take profit (objetivo)"
                  value={targetPrice}
                  onChangeText={setTargetPrice}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                  placeholder="Ej: 9.00"
                />
              </View>
            </View>
            
            <View style={styles.inputRow}>
              <View style={styles.inputColumn}>
                <TextInput
                  label="Stop loss"
                  value={stopLoss}
                  onChangeText={setStopLoss}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                  placeholder="Ej: 3.00"
                />
              </View>
              
              <View style={styles.inputColumn}>
                {/* Espacio vacío para mantener el layout */}
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Loss Selection */}
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.sectionTitle}>
              ¿Cuánto quieres perder?
            </Text>
            
            <View style={styles.lossButtonsContainer}>
              {lossOptions.map((option) => (
                <Button
                  key={option.value}
                  mode={selectedLoss === option.value ? "contained" : "outlined"}
                  onPress={() => setSelectedLoss(option.value)}
                  style={styles.lossButton}
                  contentStyle={{ paddingVertical: 8 }}
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
          style={styles.calculateButton}
          contentStyle={{ paddingVertical: 12 }}
          labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
        >
          Calcular Posición
        </Button>

        {/* Results */}
        {positionSize > 0 && (
          <>
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <Text style={styles.sectionTitle}>
                  Resultados
                </Text>
                
                <View style={styles.resultsGrid}>
                  <View style={styles.resultCard}>
                    <Text style={styles.resultLabel}>
                      Tamaño de posición total
                    </Text>
                    <Text style={styles.resultValue}>
                      ${positionSize.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.resultCard}>
                    <Text style={styles.resultLabel}>
                      Ratio R/R
                    </Text>
                    <Text style={styles.resultValue}>
                      {riskRewardRatio.toFixed(2)}:1
                    </Text>
                  </View>
                </View>

                <Divider style={{ marginVertical: 16 }} />

                <View style={styles.resultsGrid}>
                  <View style={styles.resultCard}>
                    <Text style={styles.resultLabel}>
                      Ganancia potencial
                    </Text>
                    <Text style={[styles.resultValue, styles.profitValue]}>
                      ${potentialProfit.toFixed(2)}
                    </Text>
                  </View>
                  
                  <View style={styles.resultCard}>
                    <Text style={styles.resultLabel}>
                      Pérdida potencial
                    </Text>
                    <Text style={[styles.resultValue, styles.lossValue]}>
                      ${potentialLoss.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Leverage Options */}
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <Text style={styles.sectionTitle}>
                  Margen requerido por apalancamiento
                </Text>
                
                <View style={styles.leverageGrid}>
                  {leverageOptions.map((leverage) => (
                    <View key={leverage} style={styles.leverageCard}>
                      <Text style={styles.leverageLabel}>
                        {leverage}x
                      </Text>
                      <Text style={styles.leverageValue}>
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
          style={styles.fab}
          onPress={calculatePosition}
        />
      )}
    </View>
  );
} 