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

- Build command: `npm run build`
- Publish directory: `dist`
- Agrega `_redirects` con: `/* /index.html 200`

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
