# Parcháte Bogotá

Mapa de parches y spots en Bogotá. Publica tu plan, descubre lugares y encuentra con quién ir.

## Inicio rápido

```bash
cd apps/web
npm install
npm run dev
```

Abre http://localhost:5180 o ejecuta `open-parche.bat` desde la raíz.

## Qué hace

- **Mapa interactivo** de Bogotá con parches activos en vivo (Leaflet + Carto dark)
- **Spots estilo Tinder** — desliza lugares con foto: izquierda descarta, derecha guarda
- **Nube de spots** — usuarios suben lugares para que todos los descubran
- **Publicar parche en vivo**: foto, descripción, vibra y ubicación GPS (8 h)
- **Ver detalle**: foto, distancia, tiempo restante, navegación (Google Maps / Waze)
- **Perfil** con spots guardados e historial de publicaciones

Los parches expiran a las 8 horas. En local puedes probar sin backend (`localStorage`). En producción hace falta Supabase (auth, datos y fotos).

## Perfiles verificados

- Creación de perfil con nombre, usuario y bio
- **Verificación facial** con selfie (cámara frontal)
- Sello verificado en perfil, parches y spots
- Obligatorio verificar para publicar parches o spots

## Publicar la web

Sigue **un solo documento**, en orden, con casillas:

**[PASO_A_PASO_PUBLICAR.md](PASO_A_PASO_PUBLICAR.md)**

Ahí está GitHub, las 6 migraciones de Supabase, Google, Vercel y el dominio `parchatebogota.app`. El código ya está listo; lo que falta son tus cuentas y claves.

## Stack

React 19 · Vite 6 · TypeScript · Leaflet · CSS tokens (Outfit)

## Estructura

```
apps/web/src/
├── context/ParcheContext.tsx   # Estado global + persistencia
├── components/                 # Mapa, sheets, iconos
├── screens/                    # Mapa, lista, perfil, onboarding
├── lib/                        # Tipos, geo, constantes
└── data/mock.ts                # Parches de ejemplo en Bogotá
```
