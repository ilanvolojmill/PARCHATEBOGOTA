# App nativa (Capacitor)

ParchexBogotá usa **Capacitor** para empaquetar la PWA como app nativa en App Store y Play Store.

## Requisitos

- Node.js 20+
- Xcode (macOS) para iOS
- Android Studio para Android
- Cuenta de desarrollador Apple / Google Play Console

## Pasos

```bash
cd apps/web
npm install
npm run cap:sync
```

### iOS

```bash
npm run cap:ios
```

En Xcode: selecciona tu equipo, configura signing y ejecuta en simulador o dispositivo.

### Android

```bash
npm run cap:android
```

En Android Studio: sincroniza Gradle: Gradle y ejecuta en emulador o dispositivo.

## Publicar

1. **iOS:** Archive → Distribute App → App Store Connect
2. **Android:** Build → Generate Signed Bundle/APK → Play Console

## Notas

- Ejecuta `npm run cap:sync` después de cada cambio web antes de compilar nativo.
- Push notifications reales requieren Firebase (Android) y APNs (iOS) — la demo web usa notificaciones locales del navegador.
- Permisos de cámara y ubicación deben declararse en `Info.plist` (iOS) y `AndroidManifest.xml` (Android); Capacitor los añade al sincronizar plugins.
