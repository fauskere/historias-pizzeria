# 📋 PROJECT LOG - Programador de Contenido

## 📌 Identificación del Proyecto
* **Nombre:** Programador de Contenido (PizzaStory Studio)
* **Repositorio:** `git@github.com:fauskere/historias-pizzeria.git`
* **Versión:** `v1.1.0`
* **Rama Activa:** `main`

---

## 🛠️ Stack Tecnológico y Arquitectura
* **Frontend:** React 19, Vite 8, Tailwind CSS 4, Lucide Icons.
* **Base de Datos & Serverless:** Firebase Firestore & Firebase Cloud Functions v2 (`publishScheduledStories` ejecutado cada 5 minutos).
* **Almacenamiento Multimedia:** Cloudinary (upload directo de videos e imágenes de alta resolución) / Firebase Storage.
* **Integración Redes Sociales:** Meta Graph API v21.0 con soporte oficial para:
  * Publicación de Stories en Instagram (`instagram_content_publish`).
  * Publicación de Historias en Páginas de Facebook (`photo_stories`).

---

## 🚀 Módulos y Funcionalidades
1. **Calendario Semanal Interactivo (`WeeklyCalendar.jsx`):** Programación semanal por días y horarios, con selector rápido de historias.
2. **Gestión de Carpetas & Packs de Contenido (`FolderManager.jsx`, `FolderLaunchModal.jsx`):** Secuencias de imágenes/videos o packs listos para lanzamiento directo o programado.
3. **Editor y Creador de Historias (`StoryCreator.jsx`, `EditStoryModal.jsx`):** Selección de formato 9:16, carga de archivos con preview y previsualización de video con snapshots.
4. **Registro de Publicaciones (`PublicationLogs.jsx`):** Auditoría en vivo de historias publicadas con estados de éxito/error y detalles de la respuesta de Meta.
5. **Configuración y Verificación (`SettingsPanel.jsx`):** Conexión con Firestore y validación de tokens de Meta Graph API.
6. **Backend Cloud Functions (`functions/index.js`):** Cron automatizado tolerante a ventanas de ejecución para publicar exactamente en horario.

---

## 📝 Registro de Sesiones y Cambios
* **2026-10-21:**
  * Sincronización e importación exitosa del repositorio en nueva PC vía SSH.
  * Instalación completa de dependencias de frontend y cloud functions.
  * Verificación de compilación Vite (0 errores, 336ms).
  * Renombrado de paquete a `programador-de-contenido` y asignación de versión `v1.1.0`.
  * Integración de etiqueta visible de versión en `SettingsPanel` (cumplimiento de Regla 4).
