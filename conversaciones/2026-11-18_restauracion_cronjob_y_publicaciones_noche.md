# Sesión: 2026-11-18 - Restauración de Cron-job.org y Rescate de Publicaciones

## 1. Contexto y Problema Inicial
- Durante el día 2026-11-18 se detectó que las historias programadas (14:00 hs, 19:30 hs, 19:45 hs y 20:00 hs) no se dispararon de forma automática.
- Se identificó que el servicio disparador externo (`cron-job.org`) se encontraba deshabilitado desde el 15 de noviembre debido a reiterados errores `401 Unauthorized`.
- Al estar caído el disparador externo, el sistema quedó dependiendo exclusivamente de la cola de cron nativa de GitHub Actions (`schedule`), la cual sufre retrasos severos u omisiones en horas pico de alta congestión global de GitHub.

## 2. Publicaciones de Rescate Realizadas
Se publicaron manualmente en vivo todas las historias del día mediante llamadas directas a Meta Graph API v21.0:
1. **14:00 hs - Miércoles (Horarios):**
   - Instagram Story ID: `17903185587673521`
   - Facebook Story ID: `1485738340362558`
2. **19:30 hs - Pedidos:**
   - Instagram Story ID: `18450158530198572`
   - Facebook Story ID: `1453861900239140`
3. **19:45 hs - Pizzas (Video Panceta Cheddar):**
   - Instagram Story ID: `18033370367924301`
4. **20:00 hs - Burgers (Pack Crispy):**
   - Story 1 (Crispy Bacon): Instagram ID `17940301683125650`, Facebook ID `1453867116905285`
   - Story 2 (Ingredientes): Instagram ID `18093460409240813`, Facebook ID `1453867323571931`

Todas las publicaciones quedaron registradas en la colección `history` y actualizadas en Firestore (`lastAutoPublishDate: 2026-11-18`).

## 3. Causa Raíz y Solución Definitiva en la Automatización
- **Causa Raíz:** El token de GitHub (`ghp_...`) configurado en el encabezado `Authorization` de `cron-job.org` había expirado el 15 de noviembre, provocando `401 Unauthorized` y la posterior pausa automática por parte de cron-job.org.
- **Acciones Implementadas:**
  1. Generación de un nuevo Personal Access Token (PAT) en GitHub con permisos `repo` / `workflow` y sin expiración ("No expiration").
  2. Actualización del header `Authorization: Bearer <nuevo_token>` en `cron-job.org`.
  3. Prueba de disparo en vivo exitosa: GitHub Actions recibió el evento `workflow_dispatch` (Run ID: `44429927532`) completándose en estado `success` en 11 segundos.
  4. Optimización preventiva en `.github/workflows/auto-publisher.yml` a minutos asíncronos (`2,17,32,47`) y ventana de tolerancia de 45 minutos en `scripts/cloud-scheduler.js`.
