# Mejoras Apple HIG aplicadas — ParchexBogotá

Fuente: https://developer.apple.com/design/human-interface-guidelines

## Hecho (alineación HIG)
- **Sheets**: `role="dialog"`, `aria-modal`, Escape para cerrar, títulos etiquetados
- **Tab bar**: `aria-current`, label visible en Publicar, haptics al cambiar
- **Touch**: cerrar sheet / inbox ≥44pt; filtros del mapa reciben toques
- **Safe area**: padding inferior en sheets
- **Accesibilidad**: `prefers-reduced-motion`, zoom permitido, toasts `aria-live`, filtros `aria-pressed`, labels en selects
- **Feedback**: loading en login, estados de sesión con `role="status"`
- **Contraste**: texto muted y acentos semánticos (éxito/error) más legibles
- **Jerarquía**: títulos de create sheet ~17pt (toolbar), no 28pt

## Pendiente / tu entorno
- Probar VoiceOver en iPhone real (Capacitor build)
- Dynamic Type completo (escala de sistema) si publicas nativo iOS
- Revisar App Store Review Guidelines al subir build
