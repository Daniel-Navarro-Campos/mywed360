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

## Troubleshooting
- Logs en Render: Events/Logs.
- Si hay error de puerto: asegúrate de no fijar un puerto; usar `process.env.PORT`.
- Si fallan endpoints AI: define `OPENAI_API_KEY` o desactiva rutas según entorno.
