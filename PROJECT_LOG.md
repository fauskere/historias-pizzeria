# 📋 PROJECT LOG - Programador de Contenido

## 📌 Identificación del Proyecto
* **Nombre:** Programador de Contenido (PizzaStory Studio)
* **Repositorio:** `git@github.com:fauskere/historias-pizzeria.git`
* **Versión:** `v1.5.1`
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
1. **Navbar de Precisión (`Navbar.jsx`):** Marca sobria y limpia solo con el isotipo de Pizza y título "Programador de Contenido", indicador de estado Cloud/Local en tiempo real.
2. **Calendario Semanal Interactivo (`WeeklyCalendar.jsx`):** Programación semanal por días y horarios, acento visual superior en el día activo, badges monospace de alta legibilidad, filtros dinámicos.
3. **Gestión de Carpetas & Packs de Contenido (`FolderManager.jsx`, `FolderDetailView.jsx`, `FolderLaunchModal.jsx`):** Modos duales de publicación (inmediato vs programado), orden secuencial garantizado.
4. **Editor y Creador de Historias (`StoryCreator.jsx`, `StoryPhoneMockup.jsx`, `EditStoryModal.jsx`):** Modularizado con simulación 9:16 en vivo.
5. **Utilidades Compartidas (`src/utils/folderMedia.js`):** Extracción lógica reutilizable para carpetas y packs.
6. **Registro de Publicaciones (`PublicationLogs.jsx`).**
7. **Configuración y Verificación (`SettingsPanel.jsx`):** Versión `v1.5.1` visible al pie (Regla 4).

---

## 📝 Registro de Sesiones y Cambios
* **2026-10-22 (v1.5.1 - Simplificación de Navbar & Eliminación de Badge Redundante):**
  * **Solicitud de Usuario:** Eliminar badge decorativo *"Pizzería María Belén"* que figuraba al lado de *"Programador de Contenido"* en la Navbar.
  * **Ajuste:** Se removió el elemento para una apariencia minimalista y limpia estilo SaaS moderno.
* **2026-10-22 (v1.5.0 - Rediseño UI Big Tech & Modularización Estricta < 800 líneas):**
  * Quitar subtítulo en Navbar y alinear elementos.
  * Acentos visuales en día activo, tipografía monospace para horas y microinteracciones de red social.
  * Extracción de `folderMedia.js`, `StoryPhoneMockup.jsx` y `FolderDetailView.jsx` (todos los archivos < 710 líneas).
* **2026-10-22 (v1.4.0 - Soporte Oficial de Videos en Facebook Page Stories):**
  * Implementado el protocolo oficial `video_stories` de Meta en 3 fases (start -> upload binario a `rupload.facebook.com` -> finish).
* **2026-10-22 (v1.3.1 - Solución Definitiva de Duplicación y Normalización):**
  * Eliminación del reloj local duplicado en `App.jsx`.
* **2026-10-22 (v1.3.0):**
  * Programación horaria en carpetas a demanda y filtros dinámicos de categorías.
* **2026-10-21 (v1.2.0):**
  * Code Splitting con `React.lazy` y reducción de bundle en 83%.
* **2026-10-21 (v1.1.0):**
  * Sincronización remota inicial.
