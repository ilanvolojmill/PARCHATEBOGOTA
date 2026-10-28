# ParchexBogotá — Updates de profesionalización + checklist tuyo

Fecha: agosto 2026  
Versión código: 2.1 (hardening interno)

---

## 1. Qué se implementó en el código (ya hecho)

### Seguridad y confianza
- Migración nueva: `supabase/migrations/20260807140000_hardening.sql`
  - Trigger que **impide** auto-cambiar `verified`, `is_admin`, `is_banned`
  - RPC `confirm_profile_selfie()` (sello solo server-side si hay selfie)
  - RPC `check_rate_limit()` anti-spam
  - RPC `delete_own_account()`
  - Bucket **`faces` privado** + policies por `user_id`
  - Policies de **`photos`** restringidas a paths propios
- API cliente ya **no escribe** `verified` / admin / ban
- Admin en producción: solo `is_admin` en DB (PIN solo demo local)

### Producto / UX
- Copy honesto: **“Selfie confirmada” ≠ KYC legal**
- Age gate **18+**
- Eliminar cuenta en Perfil
- Compresión de imágenes antes de subir
- Offline: cola con límite de reintentos + UI de pendientes
- Moderación: unban por UUID
- Loading de sesión
- Attribution OSM/CARTO en el mapa
- Legal actualizado (privacidad/términos)

### Nativo
- Wrappers Capacitor: `Camera` + `Geolocation` (`src/lib/native.ts`)
- Dependencias añadidas en `package.json`
- Botón “cámara nativa” al publicar parche

### Observabilidad
- Stub `VITE_SENTRY_DSN` (`src/lib/sentry.ts`)
- Edge Function plantilla: `supabase/functions/delete-account`

### Docs / env
- `.env.example` actualizado

---

## 2. Qué TÚ debes establecer (obligatorio)

### A. Supabase (crítico)
1. Crear proyecto Supabase (si no existe)
2. Ejecutar en SQL Editor, en orden:
   1. `supabase/migrations/20260523120000_production.sql`
   2. `supabase/migrations/20260807140000_hardening.sql`
3. Crear buckets si no existen:
   - `photos` → público
   - `faces` → **privado** (la migración lo declara)
4. Realtime ON en: `parches`, `spots`, `comments`, `dm_messages`, `going_entries`, `checkins`
5. Auth providers (Email mínimo; Google/Apple recomendados)
6. Redirect URLs con tu dominio + `parchexbogota://app`
7. Primer admin:
```sql
update public.profiles set is_admin = true where handle = 'tu.handle.bog';
```
8. Variables en Vercel / `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_URL`

### B. Hosting web
1. Repo en GitHub
2. Deploy Vercel (`apps/web`)
3. Dominio + HTTPS
4. Verificar:
   - `https://tu-dominio/.well-known/assetlinks.json` (Android)
   - `apple-app-site-association` (iOS) — debes crear el archivo con tu Team ID

### C. Android (Play Store)
1. Google Play Console (25 USD)
2. Android Studio
3. `npm i` + `npm run cap:sync` + `npm run cap:android`
4. Firebase Android + `google-services.json`
5. Keystore de release (respáldalo)
6. SHA-256 en `assetlinks.json`
7. AAB firmado → Internal testing → Production
8. Política de privacidad URL + Data safety

### D. iOS (App Store) — requiere Mac
1. Apple Developer (99 USD/año)
2. Xcode + `npm run cap:ios`
3. Signing, Push, Associated Domains
4. `GoogleService-Info.plist` + APNs key en Firebase
5. TestFlight → App Review (cuenta demo para revisores)

### E. Push real (opcional pero recomendado)
1. Firebase FCM
2. `supabase secrets set FIREBASE_SERVER_KEY=...` (o migrar a HTTP v1)
3. `supabase functions deploy notify-nearby`
4. Cron/nearby logic (hoy el cliente solo notifica local si hay parche ≤500 m con la app abierta)

### F. Borrado total de Auth users
1. Desplegar `supabase functions deploy delete-account`
2. (Opcional) cablear el cliente para llamarla además de la RPC

### G. Legal / ops (tú)
- Revisar textos con abogado (Colombia / Ley 1581)
- Emails `hola@` y `privacidad@`
- Screenshots, icono 1024, feature graphic
- Decidir si más adelante contratas KYC real (Truora/Onfido/Veriff)

---

## 3. Qué queda pendiente en código (no bloquea demo; sí escala)

| Item | Estado |
|------|--------|
| KYC real (Onfido/etc.) | Pendiente — hoy selfie honesta |
| Push nearby en background | Plantilla; falta cron + FCM prod |
| Clustering de mapa | Pendiente |
| Sentry SDK completo | Stub; falta `@sentry/browser` |
| Tests e2e de auth/publish | Solo smoke |
| i18n / a11y profunda | Pendiente |

---

## 4. Comandos locales después de este update

```bash
cd apps/web
npm install
npm run test
npm run build
npm run cap:sync   # cuando tengas Android/iOS listos
```

---

## 5. Orden recomendado para ti (esta semana)

1. Ejecutar migración `hardening` en Supabase  
2. Variables + deploy web  
3. Probar: age gate → selfie → publicar → eliminar cuenta  
4. Play Console + primer AAB (internal)  
5. Cuando tengas Mac: TestFlight  

---

## 6. Resumen en una frase

**El código ya endureció seguridad, honestidad de verificación, legal, rate limits, storage, age gate, delete account y nativo camera/GPS; tú debes conectar Supabase/Vercel/Firebase/tiendas y completar assets + cuentas de desarrollador.**
