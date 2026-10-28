# KYC real (cédula) + viabilidad de publicación

## Veredicto corto

**Escanear la cédula “en la app” con OCR propio ≠ verificación de identidad real.**  
Para stores y Ley 1581 (Colombia) hace falta un **proveedor KYC certificado** (Truora, MetaMap, Sumsub, Veriff, Onfido) + webhook server-side. El código deja el andamiaje; **tú contratas el proveedor y pegas las keys**.

Hoy la selfie sigue siendo **foto de perfil / confianza comunitaria**, no KYC.

---

## Qué falta para publicar (prioridad)

### Bloqueantes (sin esto no hay app multi-usuario real)
1. **Proyecto Supabase** + ejecutar migraciones SQL + bucket `photos` + Realtime
2. **OAuth** Google (mínimo) + Apple si iOS
3. **`.env` / Vercel** con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
4. **Dominio** + deploy web
5. **Cuentas de desarrollador**: Google Play (~$25) y Apple Developer ($99/año) + Mac para iOS
6. **Assets store**: icono 1024, screenshots, descripción, política de privacidad URL pública
7. **Revisión legal** textos in-app (privacidad, T&C, biometría/documentos)

### Fuertemente recomendados
8. **Firebase** FCM + APNs (push cuando la app está cerrada; DM y parches cerca)
9. **KYC proveedor** si quieres “identidad real con cédula” (ver abajo)
10. Sentry / analytics (Plausible o Mixpanel)
11. Deep links (`assetlinks.json` / AASA)

### Opcional / después del lanzamiento
12. Clustering mapa, e2e, i18n

---

## KYC con cédula — camino viable

| Enfoque | ¿Viable para publicar? |
|---------|------------------------|
| OCR local + marcar `verified` | **No** — claim falso, riesgo App Review / SIC |
| Selfie de perfil (actual) | Sí como confianza comunitaria, copy honesto |
| Truora / MetaMap / Sumsub + webhook | **Sí** — estándar LatAm / global |

### Flujo correcto
1. Usuario elige “Verificar identidad”
2. App pide sesión al **Edge Function** (service role)
3. SDK/WebView del proveedor: **anverso cédula** + **selfie liveness**
4. Proveedor valida documento y face-match
5. **Webhook** firmado actualiza `identity_status = verified` (nunca el cliente)

Variables (servidor):
```
KYC_PROVIDER=truora|sumsub|veriff|metamap
KYC_API_KEY=...
KYC_WEBHOOK_SECRET=...
```

Cliente (opcional, solo para UI):
```
VITE_KYC_ENABLED=true
```

---

## Costes típicos (orden de magnitud)
- Truora / Sumsub: por verificación exitosa (centavos–dólares)
- Hosting Supabase + Vercel: free → paid al crecer
- Stores: Play $25 una vez; Apple $99/año
