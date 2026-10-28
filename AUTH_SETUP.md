# Auth social — qué activar tú en Supabase

La app pide login con **Google**, **Microsoft (Azure)** o **Apple**, luego username + foto.

## En Supabase Dashboard

Authentication → Providers:

### Google
1. Google Cloud Console → OAuth client (Web)
2. Authorized redirect: `https://TU_PROYECTO.supabase.co/auth/v1/callback`
3. Pega Client ID + Secret en Supabase → Google → Enable

### Microsoft
1. Azure Portal → App registration
2. Redirect URI: `https://TU_PROYECTO.supabase.co/auth/v1/callback`
3. En Supabase → Azure → Enable con Application (client) ID + Secret
4. Scopes: `email openid profile`

### Apple
1. Apple Developer → Services ID + key
2. Redirect: `https://TU_PROYECTO.supabase.co/auth/v1/callback`
3. Supabase → Apple → Enable

### URL Configuration
Site URL: `https://tu-dominio.com` (y `http://localhost:5180` en local)

Redirect URLs:
```
http://localhost:5180
https://tu-dominio.com
https://TU_PROYECTO.supabase.co/auth/v1/callback
```

## Flujo en la app

1. Login social  
2. Onboarding: nombre + @username.bog + bio  
3. Foto de cara  
4. Entrar al mapa  
