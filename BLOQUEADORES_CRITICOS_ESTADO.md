# Estado de bloqueadores críticos + lo que TÚ debes hacer

Fecha: agosto 2026

---

## Estado de los 8 bloqueadores

| # | Bloqueador | Estado en código | Qué te falta a ti |
|---|------------|------------------|------------------|
| 1 | Verificación facial falsa | **Resuelto en producto**: ya no se vende KYC. Es “selfie confirmada” + RPC server-side | Si quieres KYC real: contratar Truora/Onfido/Veriff y conectar |
| 2 | Seguridad perfiles rota | **Resuelto en SQL**: trigger bloquea `verified`/`is_admin`/`is_banned` | **Ejecutar migración** `20260807140000_hardening.sql` en Supabase |
| 3 | Selfies en bucket público | **Resuelto**: bucket `faces` privado + signed URLs | Crear/verificar bucket `faces` (privado) al correr la migración |
| 4 | Storage sin aislamiento | **Resuelto**: policies por `user_id` en paths | Misma migración en tu proyecto Supabase |
| 5 | Admin PIN en cliente | **Resuelto en prod**: solo `is_admin` en DB | Marcarte admin con SQL; PIN solo sirve en demo local |
| 6 | Push “parche cerca” | **Código listo**: scan + tokens + ubicación; falta tu Firebase | Firebase + secrets + deploy function + cron |
| 7 | Capacitor incompleto | **Resuelto en deps**: Camera, Geolocation, StatusBar, Haptics, Splash, App | `npm run cap:sync` + textos iOS al crear proyecto iOS |
| 8 | Legal desalineado | **Resuelto**: copy honesto, delete account, export ARCO | Revisar con abogado + emails reales del dominio |

Tests: **13/13** · Build: **OK**

---

## Migraciones que DEBES ejecutar en Supabase (SQL Editor)

En este orden:

1. `supabase/migrations/20260523120000_production.sql` (si aún no)
2. `supabase/migrations/20260807140000_hardening.sql`
3. `supabase/migrations/20260807150000_nearby_push.sql`

Luego:

```sql
update public.profiles set is_admin = true where handle = 'TU_HANDLE.bog';
```

---

## Checklist tuyo (lo que el código no puede hacer)

### Obligatorios para publicar “en serio”
- [ ] Proyecto Supabase + las 3 migraciones
- [ ] Buckets: `photos` (público) + `faces` (privado)
- [ ] Realtime en tablas clave
- [ ] Auth (Email mínimo; Google/Apple recomendados)
- [ ] Variables `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` + `VITE_APP_URL`
- [ ] Deploy web (Vercel) + dominio HTTPS
- [ ] Política de privacidad accesible por URL (tiendas lo exigen)
- [ ] Google Play Console (25 USD) + AAB firmado + keystore respaldado
- [ ] Apple Developer (99 USD/año) + Mac/Xcode + TestFlight (solo iOS)

### Push remoto (si quieres “parche cerca” de verdad)
- [ ] Proyecto Firebase (Android + iOS)
- [ ] `google-services.json` / `GoogleService-Info.plist`
- [ ] Secret en Supabase: `FIREBASE_SERVER_KEY` (o FCM v1)
- [ ] `supabase functions deploy notify-nearby`
- [ ] Cron cada 5–10 min: `POST .../notify-nearby` con `{ "mode": "scan" }`

### Opcional / después
- [ ] KYC real (Truora/Onfido/Veriff) si quieres sello de identidad legal
- [ ] Abogado Ley 1581
- [ ] Contacto: `ivolojsavdie@gmail.com`
- [ ] Screenshots + icono 1024 para tiendas
- [ ] Edge Function `delete-account` para borrar también `auth.users`

---

## Resumen

**En código, los 8 bloqueadores críticos ya están cerrados o honestamente mitigados.**  
**A ti te falta la infraestructura real: Supabase (migraciones), hosting, Firebase/push, y cuentas de las tiendas.**

Sin ejecutar las migraciones en *tu* Supabase, la app local demo funciona, pero producción sigue vulnerable / incompleta.
