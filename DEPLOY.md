# Publicar ParchexBogotá

## Build de producción

```bash
cd apps/web
npm install
npm run build
```

La carpeta `dist/` contiene la app lista para subir.

## Vercel (recomendado)

1. Sube el repo a GitHub
2. Importa en [vercel.com](https://vercel.com)
3. **Root Directory:** `apps/web`
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. Deploy

## Netlify

1. Importa el repo en [netlify.com](https://netlify.com) (GitHub → PARCHATEBOGOTA)
2. El archivo `netlify.toml` en la raíz ya define:
   - Base: `apps/web`
   - Build: `npm run build`
   - Publish: `dist`
3. Variables (Site settings → Environment variables):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_URL` (la URL de Netlify o `https://parchatebogota.app`)
4. Deploy. Si las variables se añadieron después del primer build, **Trigger deploy**.

## Preview local

```bash
npm run preview
```

Abre http://localhost:5180

## Checklist antes de publicar

- [ ] Probar onboarding + verificación facial en móvil
- [ ] Probar publicar parche y spot
- [ ] Probar swipe en Spots
- [ ] Confirmar que PWA se puede instalar (Add to Home Screen)
- [ ] Revisar que HTTPS esté activo (requerido para cámara/GPS)

## Notas

- Verificación facial es **demo client-side** (sin backend). Para producción real conectar API de verificación (FaceTec, Onfido, etc.).
- Datos en `localStorage` — para escalar conectar Supabase/Firebase.
