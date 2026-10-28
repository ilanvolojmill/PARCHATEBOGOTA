# Lista publish-ready — ParchexBogotá

## UI (hecho)
- Paleta sobria Braun/Rams (neutros + acento terracota)
- Tipografía IBM Plex Sans, controles grandes (~52px)
- Sin glow / neon / emojis decorativos
- Mapa OSM (sin API key de Carto)
- Marcadores con letras, no emojis
- Icono, theme-color y PWA alineados

## Listo en código
- Auth social Google / Microsoft / Apple
- Onboarding: usuario + foto de cara (sin fingir KYC)
- Hardening SQL en `supabase/migrations/`
- Age gate, legal, export ARCO, delete account
- Tests + build OK

## Tú debes completar para publicar
1. Ejecutar migraciones SQL en Supabase
2. Activar providers OAuth (Google mínimo)
3. Variables `VITE_*` + deploy Vercel + dominio
4. Play Console / App Store (cuentas + builds Capacitor)
5. Firebase si quieres push en background
