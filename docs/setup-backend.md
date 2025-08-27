---
description: Guía de configuración Backend en nuevo entorno
---

# Configuración rápida del Backend Lovenda (Express)

> Sigue estos pasos después de clonar el repositorio para levantar el backend en un nuevo ordenador.

## 1. Instalar dependencias

```bash
# instala deps raíz (monorepo Vite + scripts)
npm ci

# instala deps del backend
npm --workspace backend ci
```

## 2. Variables de entorno

1. Copia la plantilla y edítala con tus valores reales:

```bash
cp backend/.env.example backend/.env
```

2. Rellena:

- `VITE_MAILGUN_API_KEY` y dominios (Mailgun)
- `OPENAI_API_KEY` y `OPENAI_PROJECT_ID` (si usas IA)
- Valores de Firebase (`VITE_FIREBASE_*`)
- `GOOGLE_APPLICATION_CREDENTIALS` con la ruta a tu `serviceAccountKey.json` (ver paso 3).

> También puedes poner la credencial en base64 en `FIREBASE_SERVICE_ACCOUNT_JSON`.

## 3. Credencial de Firebase Admin

- Descarga tu archivo **serviceAccountKey.json** desde la consola de Firebase.
- Colócalo en `backend/` o en la ruta que definas en `.env`.

## 4. Levantar el backend

```bash
npm --workspace backend run dev
```

Escuchará en el puerto indicado por `PORT` (por defecto 3001).

## 5. Solución de problemas

| Error | Causa | Solución |
|-------|-------|----------|
| `ENOENT: serviceAccountKey.json not found` | Falta la credencial de Firebase | Coloca el archivo o usa la var `FIREBASE_SERVICE_ACCOUNT_JSON` |
| `auth/invalid-api-key` al arrancar | `VITE_FIREBASE_API_KEY` vacío | Rellena valores correctos en `.env` |
| 503 en `/api/mail` | Mailgun mal configurado o índice Firestore faltante | Ver README sección Email & Firestore |

## 6. Pruebas

```bash
# Tests unitarios Vitest (root + backend)
npm run test:unit --workspaces
```

---

**¡Listo!** Con esto el backend debería funcionar en cualquier ordenador sin exponer credenciales al repositorio.
