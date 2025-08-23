---
# Despliegue del Backend en Render
---

## Requisitos
- Node 20.
- Repositorio GitHub conectado a Render.
- Variables de entorno (se configuran en Render):
  - NODE_ENV=production
  - ALLOWED_ORIGIN=https://tu-frontend (o http://localhost:5173 en dev)
  - MAILGUN_API_KEY
  - MAILGUN_DOMAIN (p.ej. mywed360.com)
  - MAILGUN_SENDING_DOMAIN (p.ej. mg.mywed360.com)
  - MAILGUN_EU_REGION=true | false (true si usas región EU)
  - OPENAI_API_KEY (opcional; si no existe, endpoints AI devolverán 500/simulado)

## Pasos
1. Verifica que backend/index.js usa `process.env.PORT` y expone `/health`.
2. Render YAML: se incluye `render.yaml` en la raíz.
3. En Render:
   - New + > Blueprint > selecciona el repo mywed360 y la rama `windows`.
   - Render detectará `render.yaml`.
   - Configura las variables no sincronizadas (API keys/domains) en Settings > Environment.
4. Deploy: Render construirá con `npm ci` y lanzará `node backend/index.js`.
5. Comprueba `/health` y la raíz `/`.

## Configuración Mailgun
- Webhooks (Events): apunta a `https://<tu-backend>/api/mailgun/events` (POST).
- Inbound (Receiving): si gestionas correos entrantes, usa `https://<tu-backend>/api/inbound/mailgun`.
- Debug: `https://<tu-backend>/api/mailgun-debug/*` (si procede).

## CORS
- Ajusta `ALLOWED_ORIGIN` en Render al dominio de tu frontend para permitir cookies/headers.

## Checklist post-despliegue
- /health responde 200 con `{ status: 'ok' }`.
- Logs en Render sin errores de puerto (la app escucha en `process.env.PORT`).
- CORS correcto: el frontend puede llamar a la API sin bloqueos.
- Variables Mailgun presentes: `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_SENDING_DOMAIN`, `MAILGUN_EU_REGION`.

## Pruebas rápidas
- Eventos Mailgun: `GET https://<backend>/api/mailgun/events?recipient=tu@correo.com&event=delivered&limit=10`.
- Envío de prueba: `POST https://<backend>/api/mail/test-personal-email` con JSON:
  {
    "from": "usuario@mywed360.com",
    "to": "destino@dominio.com",
    "subject": "Prueba",
    "message": "Hola"
  }

## Seguridad y buenas prácticas
- No hay API keys hardcodeadas en el código. Las rutas de Mailgun usan variables de entorno.
- Mantén `.env.local` fuera del repositorio (listado en `.gitignore`).

## Troubleshooting
- Logs en Render: Events/Logs.
- Si hay error de puerto: asegúrate de no fijar un puerto; usar `process.env.PORT`.
- Si fallan endpoints AI: define `OPENAI_API_KEY` o desactiva rutas según entorno.
