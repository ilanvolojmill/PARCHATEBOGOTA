# ParchexBogotá — Guía de producción

Esta guía deja la app lista para recibir usuarios reales. El código ya está preparado; solo faltan **tus credenciales y cuentas externas**.

## Checklist rápido

| Paso | Estado en código | Tú debes hacer |
|------|------------------|----------------|
| Backend Supabase | ✅ Migración SQL lista | Crear proyecto y ejecutar SQL |
| Auth (Google/Apple/email/SMS) | ✅ Integrado | Activar proveedores en Supabase |
| Storage fotos | ✅ Políticas en SQL | Crear bucket `photos` (público) |
| Realtime | ✅ Cliente suscrito | Activar tablas en Replication |
| Deploy web (Vercel) | ✅ vercel.json | Conectar repo + env vars |
| Android (Capacitor) | ✅ Permisos + deep links | Firebase + Play Console |
| iOS | ⚠️ Requiere Mac | Xcode + App Store Connect |
| Push notifications | ✅ Edge Function FCM | Firebase server key |
| Moderación admin | ✅ UI + RLS | Asignar `is_admin` en DB |

---

## 1. Supabase (obligatorio)

### 1.1 Crear proyecto
1. Ve a [supabase.com](https://supabase.com) → New project
2. Región recomendada: **South America (São Paulo)** o la más cercana
3. Guarda la **URL** y la **anon key** (Settings → API)

### 1.2 Ejecutar migración
En **SQL Editor**, pega y ejecuta el archivo completo:

```
supabase/migrations/20260523120000_production.sql
```

### 1.3 Storage
1. Storage → New bucket → nombre: `photos` → **Public bucket: ON**
2. Las políticas RLS ya vienen en la migración

### 1.4 Realtime
Database → Replication → habilita estas tablas:
- `parches`, `spots`, `comments`, `dm_messages`, `going_entries`, `checkins`

### 1.5 Auth providers
Authentication → Providers:
- **Email** (magic link) — activar
- **Google** — Client ID/Secret de Google Cloud Console
- **Apple** — Service ID + key (para iOS/web)
- **Phone** — Twilio o Supabase SMS

Redirect URLs en Auth → URL Configuration:
```
https://TU_DOMINIO.com
https://TU_PROYECTO.supabase.co/auth/v1/callback
parchexbogota://app
```

### 1.6 Primer admin
Tras registrarte, en SQL Editor:
```sql
update public.profiles set is_admin = true where handle = 'tu.handle.bog';
```

---

## 2. Variables de entorno

Copia `apps/web/.env.example` → `apps/web/.env` (local) o configúralas en Vercel:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_APP_URL=https://parchexbogota.com
VITE_ADMIN_PIN=tu_pin_secreto_largo
VITE_PLAUSIBLE_DOMAIN=parchexbogota.com
VITE_MIXPANEL_TOKEN=mp_...
```

Verifica antes del deploy:
```bash
cd apps/web
npm run env:check:strict
```

> En build de producción, la app **no arranca** sin `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

---

## 3. Deploy web (Vercel)

1. Importa el repo en [vercel.com](https://vercel.com)
2. Root directory: `apps/web`
3. Build command: `npm run build`
4. Output: `dist`
5. Añade todas las variables `VITE_*`
6. Dominio custom → apunta DNS a Vercel

El archivo `vercel.json` ya incluye SPA rewrites y headers de seguridad.

---

## 4. Android (Google Play)

```bash
cd apps/web
npm run cap:sync
npm run cap:android
```

### 4.1 Firebase
1. [Firebase Console](https://console.firebase.google.com) → proyecto Android `com.parchexbogota.app`
2. Descarga `google-services.json` → `android/app/`
3. Copia **Server key** → secret `FIREBASE_SERVER_KEY` en Supabase Edge Functions

### 4.2 Deep links
1. Genera SHA-256 del keystore de release:
   ```bash
   keytool -list -v -keystore tu-release.keystore -alias tu-alias
   ```
2. Reemplaza el fingerprint en `public/.well-known/assetlinks.json`
3. Verifica en [Digital Asset Links](https://developers.google.com/digital-asset-links/tools/generator)

### 4.3 Play Console
- Política de privacidad: URL de tu sitio + `/legal` o sheet in-app
- Clasificación de contenido, screenshots, descripción
- Subir AAB firmado

---

## 5. Push notifications (Edge Function)

```bash
supabase login
supabase link --project-ref TU_REF
supabase secrets set FIREBASE_SERVER_KEY=tu_clave
supabase functions deploy notify-nearby
```

La app guarda tokens en `push_tokens` al activar notificaciones.

---

## 6. Verificación facial

La verificación actual es **simulada** (selfie + ID local). Para KYC real en Colombia, integra un proveedor como **Onfido**, **Veriff** o **Truora** y actualiza `src/lib/verify.ts`.

---

## 7. Legal (Colombia)

Antes de publicar:
- Revisa textos en `LegalSheet.tsx` con un abogado
- Registra tratamiento de datos ante la SIC si aplica (Ley 1581/2012)
- Emails sugeridos: `hola@`, `privacidad@` en tu dominio

---

## 8. Comandos útiles

```bash
cd apps/web
npm run dev          # desarrollo local (modo demo sin .env)
npm run test         # tests unitarios
npm run test:e2e     # smoke Playwright
npm run build        # build producción
npm run cap:sync     # sincronizar Capacitor
```

---

## 9. Lo que NO puede hacer el código por ti

- Crear cuentas Supabase, Firebase, Vercel, Play Store, App Store
- Obtener certificados Apple (requiere Mac)
- Dominio DNS y correo corporativo
- Asesoría legal definitiva

Una vez completes los pasos 1–3 con tus credenciales, **la app está lista para usuarios reales**.
