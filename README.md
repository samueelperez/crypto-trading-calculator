# Crypto Trading Calculator

Una aplicación móvil React Native para calcular posiciones de trading con gestión de riesgo.

## 🚀 Características

- **Cálculo de posición:** Determina el tamaño de posición necesario para perder exactamente la cantidad especificada
- **Múltiples apalancamientos:** Calcula margen requerido para 10x, 20x y 50x
- **Gestión de riesgo:** Ratio riesgo/recompensa automático
- **Interfaz moderna:** Diseño inspirado en shadcn/ui
- **Compatible con móviles:** Optimizado para iPhone y Android

## 📱 Instalación

### Requisitos
- Node.js 18+
- Expo CLI
- Xcode (para iOS)
- Android Studio (para Android)

### Pasos

1. **Clonar el repositorio:**
```bash
git clone <tu-repositorio>
cd crypto-trading-platform
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Ejecutar la aplicación:**
```bash
npm start
```

4. **Escanear QR con Expo Go** o presionar `i` para iOS simulator

## 🧮 Cómo usar

1. **Ingresa los precios:**
   - Precio de entrada
   - Take profit (objetivo)
   - Stop loss

2. **Selecciona la pérdida deseada:**
   - $120
   - $60
   - $30

3. **Presiona calcular** para obtener:
   - Tamaño de posición total
   - Margen requerido por apalancamiento
   - Ratio riesgo/recompensa
   - Ganancia/pérdida potencial

## 📦 Build para distribución

### Crear .ipa para iPhone:
```bash
./build-ipa.sh
```

### Usar EAS Build:
```bash
npx eas build --platform ios --profile preview
```

## 🛠️ Tecnologías

- **React Native** con Expo
- **TypeScript**
- **React Native Paper** (UI)
- **React Navigation**
- **EAS Build** (distribución)

## 📄 Licencia

MIT License 