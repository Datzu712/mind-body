# Spec: Autenticación Mobile (HU-AUT-001 a HU-AUT-006)

## HU-AUT-001: Inicio de sesión ✅

**Vista:** `app/(auth)/login.tsx`

**Qué implementa:**

- Branding: logo "MAB", titulo "MIND&BODY", quote motivacional rabdom
- Boton para iniciar flujo estandar OAuth2.0 con PKCE dentro de un browser externo (`WebBrowser` + `expo-auth-session`):
- Boton "Olvidé mi contraseña" -> webview hacia el idp en forgot password.
- Loading spinner: `ActivityIndicator` a pantalla completa mientras `!request || isStartingAuth`
- Errores de autenticacion se muestran en `callback.tsx`

**Flujo:**

```
login.tsx → promptAsync() → Keycloak (browser) → callback.tsx → onSignedIn() → /(tabs)
```

`callback.tsx` procesa el redirect: extrae `code`, valida `state`, intercambia por tokens via POST al `tokenEndpoint`. En exito llama `onSignedIn(session)`. En error muestra icono + mensaje en `FitColors.red` y redirige a login en 2.5 s.

---

## HU-AUT-002: Recuperación de contraseña ✅

**Pantalla:** `app/(auth)/login.tsx` (link) + Keycloak (flujo externo)

**Qué implementa:**

- Boton "Olvidé mi contraseña" en la pantalla de login
- Abre `keycloakAccountUrls.resetPassword` via `WebBrowser.openBrowserAsync`
- Keycloak maneja todo el flujo (email, reset). Al cerrar el browser el usuario vuelve a login
- No hay UI nativa adicional

---

## HU-AUT-004: Cierre de sesión seguro ✅

**Ubicaciones:** `context/auth-context.tsx`, `app/(tabs)/profile.tsx`, `app/(settings)/index.tsx`

**Qué implementa:**

`signOut()` ejecuta en orden:

1. Cancela el refresh timer
2. `revokeKeycloakSession(refreshToken)` -> POST back-channel a `/protocol/openid-connect/logout` con `client_id` + `refresh_token` (invalida la sesion en Keycloak; best-effort, no bloquea si falla)
3. `clearSession()` del SecureStore
4. Navega a `/(auth)/login`

El boton de cerrar sesion esta en `profile.tsx` (boton directo) y en `(settings)/index.tsx` (via `SettingsRow`).

---

## HU-AUT-005: Autenticación en dos pasos (2FA) ✅

**Pantalla:** `app/(settings)/index.tsx`

**Qué implementa:**

- Fila "Autenticación en dos pasos" en la seccion CUENTA
- Abre `keycloakAccountUrls.accountSecurity` via `WebBrowser.openBrowserAsync`
- No hay UI nativa: Keycloak Account Console gestiona la configuracion de 2FA
- El token sigue valido hasta su expiracion natural; el refresh timer se encarga

---

## HU-AUT-006: Cambio de contraseña desde perfil ✅

**Pantalla:** `app/(settings)/index.tsx`

**Qué implementa:**

- Fila "Cambiar contraseña" en la seccion CUENTA
- Abre `keycloakAccountUrls.accountSecurity` via `WebBrowser.openBrowserAsync`
- No hay UI nativa: Keycloak Account Console gestiona el cambio
- El token sigue valido hasta su expiracion natural

---

## Extra: Información Personal (HU-AUT-006 adyacente) ❌

**Pantalla:** `app/(settings)/personal-info.tsx`

**Qué implementa:**

- La parte de la UI ya esta resuelta, lo que falta son los endpoints del backend.

---
