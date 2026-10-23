# Resumen de Sesión - 2026-10-22

## Objetivo de la Sesión
1. Permitir que al abrir una carpeta de contenido a demanda (ej. "promo burger") desde el Calendario Semanal, el usuario pueda elegir un horario específico para hoy antes de publicar, en lugar de publicarse únicamente en el instante.
2. Incorporar en el Calendario Semanal los filtros dinámicos con las categorías nuevas creadas por el usuario (ej. especiales, pizzas, burgers).
3. Desplegar los cambios actualizados a Firebase Hosting y actualizar versión visible.

## Acciones Realizadas
1. **Modal de Carpetas (`FolderLaunchModal.jsx`):**
   - Se añadió un selector de modo superior con dos opciones claras:
     - ⏰ **Programar para Hoy** (modo por defecto)
     - ⚡ **Publicar al Instante**
   - Al seleccionar "Programar para Hoy", se presenta un campo selector de hora (`HH:mm`) junto con accesos rápidos para horarios comunes de gastronomía (`19:30`, `20:00`, `20:30`, `21:00`, `21:30`) y un checkbox opcional de repetición semanal.
   - El botón de cada producto/pack cambia dinámicamente a "Agendar a las [HH:MM]", guardando la historia en Firestore/local y cerrando con confirmación visual.
2. **Filtros de Categorías Dinámicos (`WeeklyCalendar.jsx` y `App.jsx`):**
   - Se pasaron `categories` y `onStoryCreated` a `WeeklyCalendar`.
   - Se reemplazó el array estático de categorías por una lista dinámica que combina "Todas las historias" con las categorías personalizadas añadidas por el usuario.
   - Al filtrar por una categoría (ej. burgers), se filtran tanto las historias del calendario como las carpetas a demanda asociadas.
3. **Soporte de Publicación de Packs:**
   - Se habilitó la publicación secuencial de packs en el disparador automático local y en cloud functions.
4. **Build y Despliegue:**
   - Versión incrementada a `v1.3.0`.
   - Compilación exitosa en 337ms.
   - Despliegue completado a Firebase Hosting: `https://programador-de-contenido.web.app`.


---

## Freno de Emergencia y Eliminación de Duplicación (v1.3.1)
- **Problema Reportado:** A las 20:15 hs la historia de "Especiales" (Fugazzetta Rellena) se publicó dos veces, sumado a la colisión previa a las 20:00 hs.
- **Diagnóstico:**
  - En la base de datos y logs se constató que existían dos disparadores automáticos activos en paralelo:
    1. Cloud Function `publishScheduledStories` corriendo cada 5 minutos en Firebase Cloud.
    2. Un `setInterval(checkScheduledStories, 25000)` en `App.jsx` que corría en el navegador web si la página estaba abierta.
  - Cuando llegaba el horario exacto, ambos disparadores enviaban la orden a la API de Meta, duplicando publicaciones e intercalando packs.
- **Acciones Tomadas:**
  1. Pausa inmediata en Firestore de todas las historias programadas (`active: false`) para evitar cualquier disparo adicional.
  2. Eliminación definitiva del `setInterval` local de `App.jsx`.
  3. Despliegue de la versión `v1.3.1` en Firebase Hosting.


### Normalización Operativa
- Se reactivaron en Firestore las historias programadas (`Pedidos`, `Pizzas`, `Burgers`, `Especiales`, historias diarias de las 14:00).
- Como todos los horarios programados de hoy ya transcurrieron, no habrá más publicaciones por lo que resta de la noche.
- El sistema queda 100% operativo y listo para continuar publicando normalmente a partir de mañana de forma limpia y sin duplicados.


### Publicación Manual Única Vez (Pizzas - Especial)
- A solicitud del usuario para reponer la historia de pizza del día, se publicó por única vez el video **HISTORIA ESPECIAL VIDEO** de la carpeta Pizzas directamente en Instagram Stories.
- ID de publicación en Instagram: `18155574661518926`.
- Estado: Éxito total y registrado en el historial de Firestore.


### Soporte Nativo de Videos en Facebook Page Stories (v1.4.0)
- **Causa del Faltante en Facebook:** El código original de Facebook Stories solo implementaba `photo_stories` (imágenes fijas). Al ser videos (`.mp4`), el código anterior lanzaba una excepción y omitía Facebook.
- **Implementación Técnica:** Se implementó el protocolo completo de Meta `video_stories` en tres fases (`upload_phase=start`, subida binaria directa del buffer a `rupload.facebook.com` y `upload_phase=finish`).
- **Publicación Inmediata:** Se ejecutó la subida y se publicó exitosamente el video de **Pizza Especial** en la página de Facebook de la pizzería (Post ID: `1427224285618148`).
- **Resultado:** Tanto Instagram como Facebook tienen ahora la historia en vivo.
