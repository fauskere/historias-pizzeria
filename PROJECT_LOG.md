# 📋 PROJECT LOG - Programador de Contenido

## 📌 Identificación del Proyecto
* **Nombre:** Programador de Contenido (PizzaStory Studio)
* **Repositorio:** `git@github.com:fauskere/historias-pizzeria.git`
* **Versión:** `v1.3.1`
* **Rama Activa:** `main`

---

## 🛠️ Stack Tecnológico y Arquitectura
* **Frontend:** React 19, Vite 8, Tailwind CSS 4, Lucide Icons.
* **Base de Datos & Serverless:** Firebase Firestore & Firebase Cloud Functions v2.
* **Almacenamiento Multimedia:** Cloudinary / Firebase Storage.
* **Integración Redes Sociales:** Meta Graph API v21.0.

---

## 🚀 Módulos y Funcionalidades
1. **Calendario Semanal Interactivo (`WeeklyCalendar.jsx`):** Programación semanal por días y horarios, filtros dinámicos.
2. **Gestión de Carpetas & Packs de Contenido (`FolderManager.jsx`, `FolderLaunchModal.jsx`):** Modos duales de publicación (inmediato vs programado).
3. **Editor y Creador de Historias (`StoryCreator.jsx`, `EditStoryModal.jsx`).**
4. **Registro de Publicaciones (`PublicationLogs.jsx`).**
5. **Configuración y Verificación (`SettingsPanel.jsx`):** Versión `v1.3.1` visible al pie.

---

## 📝 Registro de Sesiones y Cambios
* **2026-10-22 (v1.3.1 - Solución Definitiva de Duplicación y Normalización):**
  * **Causa Raíz Eliminada:** Se eliminó por completo el reloj local de `App.jsx` que disparaba duplicados al tener el navegador abierto.
  * **Sistema Normalizado:** Se reactivaron todas las historias del calendario semanal en Firestore.
  * **Estado Operativo:** El sistema corre con total normalidad, gobernado únicamente por el servidor de la nube (cero riesgo de duplicación con pestañas abiertas).
* **2026-10-22 (v1.3.0):**
  * Programación horaria en carpetas a demanda y filtros dinámicos de categorías.
* **2026-10-21 (v1.2.0):**
  * Code Splitting con `React.lazy` y reducción de bundle en 83%.
* **2026-10-21 (v1.1.0):**
  * Sincronización remota inicial.
