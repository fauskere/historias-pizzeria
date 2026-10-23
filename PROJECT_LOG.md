# 📋 PROJECT LOG - Programador de Contenido

## 📌 Identificación del Proyecto
* **Nombre:** Programador de Contenido (PizzaStory Studio)
* **Repositorio:** `git@github.com:fauskere/historias-pizzeria.git`
* **Versión:** `v1.4.0`
* **Rama Activa:** `main`

---

## 🛠️ Stack Tecnológico y Arquitectura
* **Frontend:** React 19, Vite 8, Tailwind CSS 4, Lucide Icons.
* **Base de Datos & Serverless:** Firebase Firestore & Firebase Cloud Functions v2.
* **Almacenamiento Multimedia:** Cloudinary / Firebase Storage.
* **Integración Redes Sociales:** Meta Graph API v21.0 con soporte nativo completo para fotos y videos en Instagram y Facebook Page Stories.

---

## 🚀 Módulos y Funcionalidades
1. **Calendario Semanal Interactivo (`WeeklyCalendar.jsx`):** Programación semanal por días y horarios, filtros dinámicos.
2. **Gestión de Carpetas & Packs de Contenido (`FolderManager.jsx`, `FolderLaunchModal.jsx`):** Modos duales de publicación (inmediato vs programado).
3. **Editor y Creador de Historias (`StoryCreator.jsx`, `EditStoryModal.jsx`).**
4. **Registro de Publicaciones (`PublicationLogs.jsx`).**
5. **Configuración y Verificación (`SettingsPanel.jsx`):** Versión `v1.4.0` visible al pie.

---

## 📝 Registro de Sesiones y Cambios
* **2026-10-22 (v1.4.0 - Soporte Oficial de Videos en Facebook Page Stories):**
  * **Problema Identificado:** En Facebook Stories, el endpoint previo (`photo_stories`) solo admitía fotos fijas, por lo que los videos de la carpeta Pizzas se publicaban solo en Instagram y fallaban en Facebook.
  * **Solución Implementada:** Implementado el protocolo oficial `video_stories` de Meta en 3 fases (start -> upload binario a `rupload.facebook.com` -> finish).
  * **Prueba Exitosa:** Publicado exitosamente el video de Pizza Especial en Facebook Page Stories (ID: `1427224285618148`).
* **2026-10-22 (v1.3.1 - Solución Definitiva de Duplicación y Normalización):**
  * Eliminación del reloj local duplicado en `App.jsx`.
* **2026-10-22 (v1.3.0):**
  * Programación horaria en carpetas a demanda y filtros dinámicos de categorías.
* **2026-10-21 (v1.2.0):**
  * Code Splitting con `React.lazy` y reducción de bundle en 83%.
* **2026-10-21 (v1.1.0):**
  * Sincronización remota inicial.
