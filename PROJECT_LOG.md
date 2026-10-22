# 📋 PROJECT LOG - Programador de Contenido

## 📌 Identificación del Proyecto
* **Nombre:** Programador de Contenido (PizzaStory Studio)
* **Repositorio:** `git@github.com:fauskere/historias-pizzeria.git`
* **Versión:** `v1.3.0`
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
1. **Calendario Semanal Interactivo (`WeeklyCalendar.jsx`):** Programación semanal por días y horarios, con selector rápido de historias y filtros dinámicos por categorías creadas por el usuario.
2. **Gestión de Carpetas & Packs de Contenido (`FolderManager.jsx`, `FolderLaunchModal.jsx`):** Secuencias de imágenes/videos o packs con selector de modo dual: **Publicar al Instante** o **Programar para un Horario Hoy**.
3. **Editor y Creador de Historias (`StoryCreator.jsx`, `EditStoryModal.jsx`):** Selección de formato 9:16, carga de archivos con preview y previsualización de video con snapshots.
4. **Registro de Publicaciones (`PublicationLogs.jsx`):** Auditoría en vivo de historias publicadas con estados de éxito/error y detalles de la respuesta de Meta.
5. **Configuración y Verificación (`SettingsPanel.jsx`):** Conexión con Firestore y validación de tokens de Meta Graph API. Versión `v1.3.0` visible al pie.
6. **Backend Cloud Functions (`functions/index.js`):** Cron automatizado tolerante a ventanas de ejecución para publicar exactamente en horario.

---

## 📝 Registro de Sesiones y Cambios
* **2026-10-22 (v1.3.0):**
  * **Programación a Horario para Carpetas/Promos a Demanda:**
    * Incorporado selector de modo en `FolderLaunchModal.jsx`: opción de publicar en vivo o agendar para hoy a una hora determinada (`HH:mm`) con botones de acceso rápido y repetición opcional.
    * Conectado `onScheduleStory` con `handleStoryCreated`, guardando la historia en Firestore y reflejándola inmediatamente en el calendario semanal en la columna de hoy.
    * Soporte para secuencias completas de packs en la automatización programada.
  * **Filtros de Categorías Dinámicos en Calendario Semanal:**
    * `WeeklyCalendar.jsx` ahora recibe `categories` en tiempo real y genera los filtros automáticamente con las categorías personalizadas creadas por el usuario (`especiales`, `pizzas`, `burgers`, etc.), permitiendo filtrar tanto historias como carpetas.
  * Desplegado en Firebase Hosting (`https://programador-de-contenido.web.app`).
* **2026-10-21 (v1.2.0):**
  * **Code Splitting & Optimización de Rendimiento:** 
    * Modularización con `React.lazy` y `<Suspense>` en `App.jsx` para los módulos diferidos. Reducción de bundle de 872 kB a 146 kB.
  * **Corrección de Bug de Hooks React:**
    * Eliminado el retorno anticipado `if (!story) return null;` en `EditStoryModal.jsx`.
  * **Limpieza de Linter y Warnings:**
    * 0 errores de linter.
* **2026-10-21 (v1.1.0):**
  * Sincronización e importación exitosa del repositorio en nueva PC vía SSH.
  * Instalación completa de dependencias de frontend y cloud functions.
  * Renombrado de paquete a `programador-de-contenido` e indicador de versión en `SettingsPanel`.
