# 📋 PROJECT LOG - Programador de Contenido

## 📌 Identificación del Proyecto
* **Nombre:** Programador de Contenido (PizzaStory Studio)
* **Repositorio:** `git@github.com:fauskere/historias-pizzeria.git`
* **Versión:** `v1.5.0`
* **Rama Activa:** `main`
* **Hosting en Producción:** `https://programador-de-contenido.web.app`

---

## 🛠️ Stack Tecnológico y Arquitectura
* **Frontend:** React 19, Vite 8, Tailwind CSS 4, Lucide Icons.
* **Base de Datos & Serverless:** Firebase Firestore & Firebase Cloud Functions v2.
* **Almacenamiento Multimedia:** Cloudinary / Firebase Storage.
* **Integración Redes Sociales:** Meta Graph API v21.0 con soporte nativo completo para fotos y videos en Instagram y Facebook Page Stories.
* **Modularización por Dominio:** 100% de los archivos con menos de 800 líneas de código (Regla 2).

---

## 🚀 Módulos y Funcionalidades
1. **Navbar de Precisión (`Navbar.jsx`):** Centrado del título del sistema, badge con pulso "Pizzería María Belén", indicador de estado Cloud/Local en tiempo real.
2. **Calendario Semanal Interactivo (`WeeklyCalendar.jsx`):** Programación semanal por días y horarios, acento visual superior en el día activo, badges monospace de alta legibilidad, filtros dinámicos.
3. **Gestión de Carpetas & Packs de Contenido (`FolderManager.jsx`, `FolderDetailView.jsx`, `FolderLaunchModal.jsx`):** Modos duales de publicación (inmediato vs programado), orden secuencial garantizado.
4. **Editor y Creador de Historias (`StoryCreator.jsx`, `StoryPhoneMockup.jsx`, `EditStoryModal.jsx`):** Modularizado con simulación 9:16 en vivo.
5. **Utilidades Compartidas (`src/utils/folderMedia.js`):** Extracción lógica reutilizable para carpetas y packs.
6. **Registro de Publicaciones (`PublicationLogs.jsx`).**
7. **Configuración y Verificación (`SettingsPanel.jsx`):** Versión `v1.5.0` visible al pie (Regla 4).

---

## 📝 Registro de Sesiones y Cambios
* **2026-10-22 (v1.5.0 - Rediseño UI Big Tech & Modularización Estricta < 800 líneas):**
  * **Solicitud de Usuario:** Quitar subtítulo *"Historias Automáticas en Instagram y Facebook"* en Navbar para centrar *"Programador de Contenido"*, pulir detalles visuales a nivel profesional (Big Tech) y auditar arquitectura.
  * **Mejoras Visuales Realizadas:**
    * Navbar con isotipo y título alineados limpiamente, dot con glow pulsante en badge de pizzería y ping animado en estado Cloud.
    * Calendario Semanal con top border glow en el día "HOY", tipografía mono en horarios (`font-mono text-[11px]`) y microinteracciones en iconos de IG y FB.
    * Limpieza de modales con `backdrop-blur-md` y ring dorado en foco.
  * **Auditoría & Modularización (< 800 líneas):**
    * Se detectó que `StoryCreator.jsx` (809 líneas) y `FolderManager.jsx` (801 líneas) superaban levemente el límite.
    * Se extrajo `src/utils/folderMedia.js` (helper puro), `src/components/StoryPhoneMockup.jsx` (componente visual de smartphone) y `src/components/FolderDetailView.jsx` (vista de detalle de carpetas).
    * Resultado: Todos los archivos quedaron con < 710 líneas, 0 errores de linter en oxlint y build ultra-rápido (324ms).
  * **Despliegue:** Nueva versión `v1.5.0` compilada y desplegada en Firebase Hosting.
* **2026-10-22 (v1.4.0 - Soporte Oficial de Videos en Facebook Page Stories):**
  * Implementado el protocolo oficial `video_stories` de Meta en 3 fases (start -> upload binario a `rupload.facebook.com` -> finish).
  * Publicado exitosamente el video de Pizza Especial en Facebook Page Stories (ID: `1427224285618148`).
* **2026-10-22 (v1.3.1 - Solución Definitiva de Duplicación y Normalización):**
  * Eliminación del reloj local duplicado en `App.jsx`.
* **2026-10-22 (v1.3.0):**
  * Programación horaria en carpetas a demanda y filtros dinámicos de categorías.
* **2026-10-21 (v1.2.0):**
  * Code Splitting con `React.lazy` y reducción de bundle en 83%.
* **2026-10-21 (v1.1.0):**
  * Sincronización remota inicial.
