# 📋 PROJECT LOG - Programador de Contenido

## 📌 Identificación del Proyecto
* **Nombre:** Programador de Contenido (PizzaStory Studio)
* **Repositorio:** `git@github.com:fauskere/historias-pizzeria.git`
* **Versión:** `v1.2.0`
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
5. **Configuración y Verificación (`SettingsPanel.jsx`):** Conexión con Firestore y validación de tokens de Meta Graph API. Versión `v1.2.0` visible al pie.
6. **Backend Cloud Functions (`functions/index.js`):** Cron automatizado tolerante a ventanas de ejecución para publicar exactamente en horario.

---

## 📝 Registro de Sesiones y Cambios
* **2026-10-21 (v1.2.0):**
  * **Code Splitting & Optimización de Rendimiento:** 
    * Modularización con `React.lazy` y `<Suspense>` en `App.jsx` para los módulos diferidos (`FolderManager`, `StoryCreator`, `StoryLibrary`, `SettingsPanel`, `PublicationLogs`, `StoryPreviewModal`, `EditStoryModal`).
    * Configuración de fragmentación por proveedores (`manualChunks`) en `vite.config.js`: el bundle principal se redujo de **872 kB** a apenas **146 kB (31 kB gzip)**.
  * **Corrección de Bug de Hooks React:**
    * Eliminado el retorno anticipado `if (!story) return null;` que violaba la regla fundamental de React Hooks en `EditStoryModal.jsx`.
  * **Limpieza de Linter y Warnings:**
    * Eliminados todos los imports y variables huérfanas en `firebase.js`, `PublicationLogs.jsx`, `StoryCreator.jsx`, `StoryLibrary.jsx`, `WeeklyCalendar.jsx`, `SettingsPanel.jsx`, `FolderLaunchModal.jsx`, `FolderManager.jsx` y `functions/index.js`.
    * Resultado: 0 errores de linter.
* **2026-10-21 (v1.1.0):**
  * Sincronización e importación exitosa del repositorio en nueva PC vía SSH.
  * Instalación completa de dependencias de frontend y cloud functions.
  * Verificación de compilación Vite (0 errores).
  * Renombrado de paquete a `programador-de-contenido` e indicador de versión en `SettingsPanel`.
