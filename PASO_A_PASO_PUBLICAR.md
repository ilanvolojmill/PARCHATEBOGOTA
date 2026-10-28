# Cómo publicar Parcháte Bogotá

El código de la app ya está listo. Lo que falta son **cuentas, claves y un dominio**: eso solo lo puedes hacer tú. Sigue este archivo **en orden**. Cuando un recuadro esté hecho, pásalo.

Dominio previsto: `https://parchatebogota.app`

---

## Lo que ya está hecho en el código

- App web (mapa, spots tipo Tinder, publicar, mensajes, perfil, invitaciones)
- PWA, cabeceras de seguridad, páginas públicas de privacidad y términos
- Migraciones SQL, login Google / Microsoft / Apple, fotos, tiempo real
- Configuración de Vercel (`apps/web/vercel.json`)

Sin las claves de Supabase, en internet la app **no arranca** (pantalla de configuración). En tu PC sí corre en modo demo.

---

## Paso 1 — Cuenta de GitHub y subir el código

1. Crea una cuenta (o entra) en [github.com](https://github.com)
2. **New repository** → nombre `parchexbogota` → **Private**
3. En tu PC, en la carpeta del proyecto, abre PowerShell:

```powershell
cd RUTA\A\parchexbogota
git init
git add .
git commit -m "Listo para publicar Parcháte Bogotá"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/parchexbogota.git
git push -u origin main
```

Sustituye `TU_USUARIO`. Si GitHub te pide login, usa un Personal Access Token (no la contraseña).

**No subas** archivos `.env`. El `.gitignore` ya los excluye.

Checklist:
- [ ] Repo en GitHub
- [ ] `git push` sin errores

---

## Paso 2 — Proyecto en Supabase (base de datos)

1. Entra a [supabase.com](https://supabase.com) → **New project**
2. Nombre: `parchexbogota`
3. Región: **South America (São Paulo)** si aparece
4. Guarda la contraseña de la base en un lugar seguro
5. Espera a que el proyecto quede **Active**
6. **Project Settings → API** y copia:
   - **Project URL** → esto es `VITE_SUPABASE_URL`
   - **anon public** → esto es `VITE_SUPABASE_ANON_KEY`

Checklist:
- [ ] Proyecto Active
- [ ] URL y anon key copiadas

---

## Paso 3 — Ejecutar el SQL (en este orden)

En Supabase: **SQL Editor → New query**. Abre cada archivo, pega TODO el contenido, **Run**, espera “Success”, y pasa al siguiente:

1. `supabase/migrations/20260523120000_production.sql`
2. `supabase/migrations/20260807140000_hardening.sql`
3. `supabase/migrations/20260807150000_nearby_push.sql`
4. `supabase/migrations/20260917160000_whatsapp_contact.sql`
5. `supabase/migrations/20260922100000_kyc_identity.sql`
6. `supabase/migrations/20261028120000_invite_only_and_vibes.sql`

Si dice “already exists”, sigue. Si falla otra cosa, copia el error y revísalo antes de continuar.

Checklist:
- [ ] Las 6 consultas corrieron

---

## Paso 4 — Fotos y tiempo real

**Storage**
1. **Storage → New bucket**
2. Nombre exacto: `photos`
3. **Public bucket: ON**
4. El bucket privado `faces` (selfies) lo crea el SQL del paso 3. Si no aparece, créalo a mano: nombre `faces`, **Public: OFF**.

**Realtime**
**Database → Publications / Replication** y activa:
- `parches`
- `spots`
- `comments`
- `dm_messages`
- `going_entries`
- `checkins`
- `invite_requests`

Checklist:
- [ ] Bucket `photos` público
- [ ] Tablas en Realtime

---

## Paso 5 — Login con Google (el mínimo para lanzar)

Microsoft y Apple pueden esperar. Google sí hace falta.

### En Google Cloud
1. [console.cloud.google.com](https://console.cloud.google.com/) → crea o elige un proyecto
2. **APIs & Services → OAuth consent screen** → External → guarda
3. **Credentials → Create OAuth client ID** → **Web application**
4. **Authorized redirect URIs** (pon esta, cambiando `TU_REF`):

```
https://TU_REF.supabase.co/auth/v1/callback
```

`TU_REF` es la parte de tu Project URL (ejemplo: `abcdefghijk`).

5. Copia **Client ID** y **Client Secret**

### En Supabase
1. **Authentication → Providers → Google** → ON → pega ID y Secret → Save
2. **Authentication → URL Configuration**:
   - **Site URL:** `https://parchatebogota.app` (si el dominio aún no apunta, usa primero la URL de Vercel del paso 7)
   - **Redirect URLs**, añade todas estas:

```
http://127.0.0.1:5180
http://localhost:5180
https://parchatebogota.app
https://TU_PROYECTO.vercel.app
```

Checklist:
- [ ] Google ON en Supabase
- [ ] Redirect de Google Cloud = callback de Supabase
- [ ] Redirect URLs de la app añadidas

---

## Paso 6 — Probar en tu PC (opcional pero recomendado)

En `apps/web/` crea un archivo `.env` (no lo subas a GitHub):

```env
VITE_SUPABASE_URL=https://TU_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_APP_URL=http://127.0.0.1:5180
```

```powershell
cd apps/web
npm install
npm run dev
```

Abre http://127.0.0.1:5180 → confirma edad → **Continuar con Google** → crea perfil → publica un parche de prueba.

Checklist:
- [ ] Entras con Google
- [ ] El parche aparece (recarga la página y sigue ahí)

---

## Paso 7 — Publicar en Vercel (la web en internet)

1. Entra a [vercel.com](https://vercel.com) con la misma cuenta de GitHub
2. **Add New → Project** → elige el repo `parchexbogota`
3. Configuración:
   - **Root Directory:** `apps/web` (Importante: pulsa *Edit*)
   - Framework: Vite (sale solo)
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Environment Variables** (Production y Preview):

| Nombre | Valor |
|--------|--------|
| `VITE_SUPABASE_URL` | tu Project URL de Supabase |
| `VITE_SUPABASE_ANON_KEY` | tu anon key |
| `VITE_APP_URL` | `https://parchatebogota.app` (o la URL `.vercel.app` mientras no tengas dominio) |

5. **Deploy**
6. Cuando termine, abre la URL `https://algo.vercel.app`

Si ves “La app no puede arrancar…”, las variables no se guardaron o no redesplegaste. En Vercel: Settings → Environment Variables → Redeploy.

### Conectar el dominio `parchatebogota.app`
1. En Vercel: Project → **Domains** → añade `parchatebogota.app` y `www.parchatebogota.app`
2. En tu registrador de dominio, pon los DNS que Vercel te indique (A / CNAME)
3. Cuando HTTPS esté verde, vuelve a Supabase **URL Configuration** y deja Site URL = `https://parchatebogota.app`
4. En Google OAuth no cambies el callback: sigue siendo `https://TU_REF.supabase.co/auth/v1/callback`

Checklist:
- [ ] Deploy en verde
- [ ] La web abre en el celular
- [ ] Login Google funciona **en la URL pública**
- [ ] Dominio con candado HTTPS (o al menos `.vercel.app` para una beta)

---

## Paso 8 — Primer administrador

Después de crear tu usuario en la app, en Supabase SQL Editor:

```sql
update public.profiles set is_admin = true where handle = 'tu.handle.bog';
```

Checklist:
- [ ] Entras a Perfil y ves herramientas de admin / reportes

---

## Paso 9 — Correo (recomendado)

En tu dominio (por ejemplo Google Workspace o el correo del registrador) crea:
- `hola@parchexbogota.app`
- `privacidad@parchexbogota.app`

Las páginas públicas ya están:
- https://parchatebogota.app/privacidad.html
- https://parchatebogota.app/terminos.html

Checklist:
- [ ] Los dos correos existen o al menos reenvían a tu Gmail

---

## Qué no hace falta para lanzar la web

Déjalo para después. La página puede estar en internet sin esto:

| Tema | Cuándo |
|------|--------|
| Microsoft / Apple login | Cuando quieras más botones |
| Play Store / App Store | Cuando quieras app nativa (cuentas de pago) |
| Notificaciones push (Firebase) | Cuando quieras avisos con la app cerrada |
| KYC / cédula (Truora, etc.) | La selfie **no** es KYC; no lo actives hasta tener proveedor |
| Plausible / Mixpanel | Analytics opcional |

Guías extra (no bloquean el lanzamiento): `AUTH_SETUP.md`, `KYC_Y_PUBLICACION.md`, `PRODUCTION.md`.

---

## Si algo falla

| Qué ves | Qué revisar |
|---------|-------------|
| Pantalla “no puede arrancar” | Variables `VITE_*` en Vercel + Redeploy |
| Google “redirect_uri_mismatch” | El callback en Google Cloud debe ser exactamente `https://TU_REF.supabase.co/auth/v1/callback` |
| Login vuelve y te saca | Site URL y Redirect URLs en Supabase deben incluir la URL real (Vercel o dominio) |
| Publicas y nadie más lo ve | Migraciones, bucket `photos`, Realtime, y que ambos usen la misma URL de producción |
| Fotos no suben | Bucket `photos` público y políticas del SQL |
| Invitaciones no llegan al otro usuario | Migración 6 ejecutada y tabla `invite_requests` en Realtime |

---

## Orden sugerido este fin de semana

1. GitHub (paso 1)
2. Supabase + SQL + fotos + Google (pasos 2–5)
3. Vercel + dominio (paso 7)
4. Probar en el celular: registro, mapa, un parche, un spot, un mensaje
5. Admin (paso 8) y correos (paso 9)
