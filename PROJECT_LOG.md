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
* **2026-10-22 (v1.3.1 - Freno de Emergencia y Solución de Duplicación):**
  * **Pausa Total Preventiva:** Se pausaron de inmediato todas las historias activas en Firestore para garantizar que no se publique nada más.
  * **Causa Raíz Identificada:** Había dos motores de ejecución en paralelo: la Cloud Function en la nube y un `setInterval` local de respaldo en `App.jsx`. Al tener la pestaña web abierta, ambos disparaban al mismo minuto hacia la API de Meta (generando publicaciones duplicadas como la Fugazzetta a las 20:15 y la mezcla de la Cheeseburger con Classic a las 20:00).
  * **Corrección:** Se eliminó por completo el reloj duplicado en el frontend de `App.jsx`. Centralizada la publicación en un único motor para eliminar colisiones.
* **2026-10-22 (v1.3.0):**
  * Programación horaria en carpetas a demanda y filtros dinámicos de categorías.
* **2026-10-21 (v1.2.0):**
  * Code Splitting con `React.lazy` y reducción de bundle en 83%.
* **2026-10-21 (v1.1.0):**
  * Sincronización remota inicial.
