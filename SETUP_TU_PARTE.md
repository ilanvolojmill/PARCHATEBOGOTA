# Lo que TÚ debes hacer — ParchexBogotá v2

El código ya incluye backend Supabase, auth, storage, sync en tiempo real, inbox, check-in, Capacitor, Mixpanel, CI y tests. **Estas tareas requieren cuentas externas, dinero o hardware que solo tú puedes configurar.**

---

## 1. Supabase (obligatorio para producción)

1. Crea proyecto en [supabase.com](https://supabase.com)
2. **SQL Editor** → pega y ejecuta `supabase/schema.sql`
3. **Storage** → bucket `photos` → **Public**
4. **Authentication** → activa proveedores:
   - Google OAuth (Client ID/Secret de Google Cloud)
   - Apple (requiere Apple Developer)
   - Email magic link
   - Phone SMS (requiere Twilio u otro proveedor en Supabase)
5. **Database → Replication** → activa Realtime en: `parches`, `spots`, `comments`, `dm_messages`, `going_entries`, `checkins`
6. Copia URL y anon key a `apps/web/.env`:

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

7. Hazte admin (SQL):

```sql
update profiles set is_admin = true where handle = 'tuhandle.bog';
```

---

## 2. Push notifications reales (FCM + APNs)

1. Crea proyecto en [Firebase Console](https://console.firebase.google.com)
2. Añade app Android e iOS → descarga `google-services.json` y configura APNs
3. En Supabase, despliega Edge Function `supabase/functions/notify-nearby` (stub incluido — conéctala a FCM)
4. Programa un **cron** (pg_cron o GitHub Action) que envíe push cuando hay parches a ≤500 m de usuarios con token en `push_tokens`
5. En iOS: sube certificado APNs a Firebase

**Sin esto:** solo funcionan notificaciones locales en navegador/app abierta.

---

## 3. App Store y Play Store

1. `cd apps/web && npm install && npm run cap:sync`
2. **Android:** instala Android Studio → abre con `npm run cap:android` → genera keystore firmado → Play Console
3. **iOS:** necesitas **Mac + Xcode** → `npm run cap:ios` → Archive → App Store Connect
4. Iconos/splash: genera con [capacitor-assets](https://github.com/ionic-team/capacitor-assets) (1024×1024 + splash)
5. **Deep links:** configura `parchexbogota.com` en:
   - Android: App Links (`assetlinks.json`)
   - iOS: Universal Links (`apple-app-site-association`)
6. Declara permisos cámara, ubicación y notificaciones en stores

---

## 4. Analytics

| Servicio | Qué hacer |
|----------|-----------|
| **Plausible** | Cuenta en plausible.io → dominio → `VITE_PLAUSIBLE_DOMAIN=...` |
| **Mixpanel** | Cuenta en mixpanel.com → Project Token → `VITE_MIXPANEL_TOKEN=...` |

Dashboard de barrios: en Mixpanel crea funnel/insights con evento `Neighborhood Action`.

---

## 5. Legal (Colombia)

- [ ] Contratar abogado para revisar textos de privacidad/T&C in-app
- [ ] Registrar tratamiento de datos ante SIC si aplica (fotos + ubicación + biometría simulada)
- [ ] Política de cookies: banner ya incluido; ajusta texto con tu abogado

---

## 6. Verificación de identidad real (cédula / KYC)

La selfie de perfil **no** es KYC. Para cédula real:

1. Contrata **Truora**, MetaMap, Sumsub o Veriff
2. Ejecuta migración `supabase/migrations/20260922100000_kyc_identity.sql`
3. Despliega `supabase/functions/kyc-webhook` + secrets `KYC_WEBHOOK_SECRET`, `KYC_PROVIDER`
4. En el cliente: `VITE_KYC_ENABLED=true` y `VITE_KYC_PROVIDER=truora` (u otro)
5. Cablea el SDK/WebView del proveedor en `IdentityVerifySheet` (hoy inicia sesión `pending`)

Detalle: `KYC_Y_PUBLICACION.md`

---

## 7. Instagram Story

Limitación de la web: no se puede abrir Stories directamente. Opciones:
- Mantener flujo actual (descargar foto + copiar link)
- O integrar **Instagram Graph API** (requiere app Meta Business verificada)

---

## 8. Deploy web

1. Sube repo a GitHub
2. Vercel → root `apps/web` → añade env vars Supabase + analytics
3. Dominio: `parchexbogota.com` (o el que elijas) → `VITE_APP_URL`

---

## 9. Checklist rápido antes de lanzar

- [ ] Supabase schema + bucket + auth providers
- [ ] `.env` en local y Vercel
- [ ] Usuario admin en DB
- [ ] Probar publicar parche → otro dispositivo lo ve
- [ ] Probar DM entre dos cuentas
- [ ] Firebase + push en Android/iOS
- [ ] `npm run cap:sync` + build firmado
- [ ] Revisión legal
- [ ] Plausible/Mixpanel activos

---

## Modo demo (sin Supabase)

Si **no** configuras `.env`, la app sigue funcionando en local con mock data y localStorage — útil para demos, no para usuarios reales.
