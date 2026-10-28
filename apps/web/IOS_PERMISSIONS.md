# Permisos nativos (Android / iOS)

## Android (`AndroidManifest.xml`) — ya incluidos
- `INTERNET`
- `ACCESS_COARSE_LOCATION` / `ACCESS_FINE_LOCATION`
- `CAMERA`
- `POST_NOTIFICATIONS`

## iOS — agregar en `Info.plist` al crear el proyecto (`npx cap add ios`)

```xml
<key>NSCameraUsageDescription</key>
<string>Para confirmar tu selfie de perfil y subir fotos de parches y spots.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Para elegir fotos de parches y spots desde tu galería.</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>Para mostrar parches cerca de ti, publicar ubicación y navegación.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Para alertas de parches cercanos cuando uses la app.</string>
```

## Plugins Capacitor en uso
- `@capacitor/camera`
- `@capacitor/geolocation`
- `@capacitor/push-notifications`
- `@capacitor/status-bar`
- `@capacitor/haptics`
- `@capacitor/splash-screen`
- `@capacitor/app`

Tras instalar: `npm run cap:sync`
