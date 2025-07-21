#!/bin/bash

echo "🚀 Iniciando build de la app..."

# Ir al directorio iOS
cd ios

# Limpiar builds anteriores
echo "🧹 Limpiando builds anteriores..."
xcodebuild clean -workspace CryptoTradingCalculator.xcworkspace -scheme CryptoTradingCalculator

# Intentar build para dispositivo genérico
echo "🔨 Compilando app..."
xcodebuild -workspace CryptoTradingCalculator.xcworkspace -scheme CryptoTradingCalculator -configuration Release -destination 'platform=iOS,id=dvtdevice-DVTiPhonePlaceholder-iphoneos:placeholder' build

# Buscar el archivo .app compilado
echo "🔍 Buscando archivo .app..."
APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData -name "CryptoTradingCalculator.app" -type d 2>/dev/null | head -1)

if [ -z "$APP_PATH" ]; then
    echo "❌ No se encontró el archivo .app compilado"
    echo "💡 Intenta compilar desde Xcode manualmente:"
    echo "   1. Abre CryptoTradingCalculator.xcworkspace en Xcode"
    echo "   2. Selecciona tu iPhone en el dropdown"
    echo "   3. Presiona Product → Build"
    exit 1
fi

echo "✅ Archivo .app encontrado en: $APP_PATH"

# Crear directorio Payload
echo "📦 Creando estructura .ipa..."
mkdir -p Payload
cp -r "$APP_PATH" Payload/

# Crear el .ipa
echo "📱 Generando archivo .ipa..."
zip -r CryptoTradingCalculator.ipa Payload/

# Limpiar
rm -rf Payload

echo "🎉 ¡Archivo .ipa creado exitosamente!"
echo "📁 Ubicación: $(pwd)/CryptoTradingCalculator.ipa"
echo ""
echo "📋 Para instalar en iPhone:"
echo "   1. Usa herramientas como 3uTools, iMazing, etc."
echo "   2. O instala directamente desde Xcode"
echo "   3. O sube a TestFlight para distribución" 