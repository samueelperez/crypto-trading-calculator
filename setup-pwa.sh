   #!/bin/bash

   # Navegar al directorio raíz del proyecto
   cd /Users/samuelperez/crypto-trading-platform

   # 1. Crear las carpetas necesarias
   mkdir -p public/splashscreens

   # 2. Renombrar/copiar los archivos de iconos
   cp public/icons/icon-192x192.png public/icons/icon-192x192.png 2>/dev/null || echo "icon-192x192.png ya existe"
   cp public/icons/icon-512x512.png public/icons/icon-512x512.png 2>/dev/null || echo "icon-512x512.png ya existe"
   cp public/icons/apple-touch-icon.png public/icons/apple-icon-180x180.png
   cp public/icons/apple-touch-icon.png public/icons/apple-icon-192x192.png
   cp public/icons/apple-touch-icon.png public/icons/apple-icon-512x512.png

   # 3. Redimensionar para crear los tamaños faltantes
   cp public/icons/favicon-96x96.png public/icons/icon-96x96.png
   sips -z 72 72 public/icons/icon-96x96.png --out public/icons/icon-72x72.png
   sips -z 128 128 public/icons/icon-192x192.png --out public/icons/icon-128x128.png
   sips -z 144 144 public/icons/icon-192x192.png --out public/icons/icon-144x144.png
   sips -z 152 152 public/icons/icon-192x192.png --out public/icons/icon-152x152.png
   sips -z 384 384 public/icons/icon-512x512.png --out public/icons/icon-384x384.png

   # 4. Crear splash screens simples
   for device in "iphone5" "iphone6" "iphoneplus" "iphonex" "iphonexr" "iphonexsmax" "ipad" "ipadpro1" "ipadpro2" "ipadpro3"; do
     cp public/icons/icon-512x512.png public/splashscreens/${device}_splash.png
   done

   echo "¡Configuración básica completada!"
