#!/bin/bash

# Script para crear .ipa manualmente
echo "Creando archivo .ipa..."

# Crear directorio Payload
mkdir -p Payload

# Copiar la app compilada (asumiendo que ya está compilada)
cp -r build/CryptoTradingCalculator.app Payload/

# Crear el .ipa
zip -r CryptoTradingCalculator.ipa Payload/

# Limpiar
rm -rf Payload

echo "Archivo .ipa creado: CryptoTradingCalculator.ipa"
echo "Puedes enviar este archivo para instalarlo en otros iPhones" 