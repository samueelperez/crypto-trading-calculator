# Guía para publicar en TestFlight

Esta guía explica cómo convertir nuestra PWA de trading en una aplicación nativa de iOS para distribución a través de TestFlight.

## Requisitos previos

- Una cuenta de desarrollador de Apple ($99/año)
- Una Mac para ejecutar Xcode (obligatorio para compilar apps de iOS)
- Node.js instalado en tu máquina
- Xcode instalado (última versión)
- CocoaPods instalado (`sudo gem install cocoapods`)

## Paso 1: Preparar el proyecto para Capacitor

1. Instala Capacitor en tu proyecto:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
```

2. Inicializa Capacitor:

```bash
npx cap init CryptoTradingPlatform io.cryptotrading.app --web-dir=out
```

3. Modifica tu script de build en `package.json` para incluir la exportación estática:

```json
"scripts": {
  "build": "next build && next export"
}
```

4. Construye tu aplicación:

```bash
npm run build
```

5. Añade iOS como plataforma:

```bash
npx cap add ios
```

## Paso 2: Configurar el proyecto de Xcode

1. Abre el proyecto en Xcode:

```bash
npx cap open ios
```

2. En Xcode, selecciona tu proyecto en el navegador de proyectos.

3. En la pestaña "General", configura:
   - Display Name: "Crypto Trading"
   - Bundle Identifier: "io.cryptotrading.app"
   - Version: "1.0"
   - Build: "1"

4. Configura capacidades (Capabilities):
   - Navega a la pestaña "Signing & Capabilities"
   - Asegúrate de que tu Apple Developer Account esté seleccionada
   - Activa "Automatically manage signing"
   - Añade las capacidades:
     - Push Notifications
     - Background Modes (si necesitas actualizaciones en tiempo real)

## Paso 3: Personalizar la app nativa

1. Ajusta `ios/App/App/capacitor.config.json`:

```json
{
  "appId": "io.cryptotrading.app",
  "appName": "Crypto Trading",
  "webDir": "out",
  "bundledWebRuntime": false,
  "server": {
    "iosScheme": "https"
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#121212",
      "androidSplashResourceName": "splash",
      "androidScaleType": "CENTER_CROP",
      "showSpinner": false,
      "splashFullScreen": true,
      "splashImmersive": true
    }
  }
}
```

2. Modifica el comportamiento del navegador en `ios/App/App/Info.plist`:
   - Abre el archivo `Info.plist` en Xcode
   - Asegúrate de que estas configuraciones estén presentes:

```xml
<key>WKAppBoundDomains</key>
<array>
  <string>tu-dominio-de-produccion.com</string>
</array>
<key>UIViewControllerBasedStatusBarAppearance</key>
<true/>
```

3. Añade tus propios íconos y pantallas de splash:
   - Reemplaza las imágenes en `ios/App/App/Assets.xcassets/`
   - Puedes usar un generador como [App Icon Generator](https://appicon.co/)

## Paso 4: Subir a TestFlight

1. Actualiza la configuración de Capacitor para reflejar los cambios:

```bash
npx cap copy ios
```

2. En Xcode, selecciona "Product" > "Archive" para crear un archivo de la aplicación.

3. Una vez completado el proceso de archivado, aparecerá el Organizador de Xcode.

4. Haz clic en "Distribute App" > "App Store Connect" > "Upload".

5. Sigue las instrucciones para completar la subida.

6. Inicia sesión en [App Store Connect](https://appstoreconnect.apple.com/)

7. Navega a tu aplicación > TestFlight > Grupos internos/externos

8. Añade testers proporcionando sus direcciones de correo electrónico.

## Paso 5: Actualizar la aplicación

Para enviar actualizaciones a TestFlight:

1. Realiza cambios en tu código
2. Incrementa el número de versión o de build en Xcode
3. Ejecuta `npm run build` para construir tu web app
4. Ejecuta `npx cap copy ios` para actualizar los archivos en la app iOS
5. Abre Xcode con `npx cap open ios`
6. Crea un nuevo archivo y súbelo a TestFlight

## Consideraciones adicionales

- **Gestión de APIs nativas**: Usa los plugins de Capacitor para acceder a funcionalidades nativas como la cámara, notificaciones push, etc.
- **Debugging**: Usa Safari Web Inspector para depurar problemas de WebView.
- **Rendimiento**: Optimiza tu app para el entorno móvil nativo.

## Recursos útiles

- [Documentación oficial de Capacitor](https://capacitorjs.com/docs)
- [TestFlight - Guía de Apple](https://developer.apple.com/testflight/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) 