# 📋 PROJECT LOG - Programador de Contenido

## 📌 Identificación del Proyecto
* **Nombre:** Programador de Contenido (PizzaStory Studio)
* **Repositorio:** `git@github.com:fauskere/historias-pizzeria.git`
* **Versión:** `v1.5.4`
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
1. **Navbar de Precisión (`Navbar.jsx`):** Altura unificada de tabs (`h-9` desktop / `h-8` mobile) con alineación pixel-perfect del recuadro amarillo activo en todas las secciones.
2. **Calendario Semanal Interactivo (`WeeklyCalendar.jsx`):** Tarjetas con cabecera superior para horario y botón `Power` a ancho completo (cero desbordamiento), carpetas truncadas elegantemente (`📁 {nombre}`), badge compacto `↻` de repetición semanal y límite de 2 historias con botón colapsable/expandible.
3. **Gestión de Carpetas & Packs de Contenido (`FolderManager.jsx`, `FolderDetailView.jsx`, `FolderLaunchModal.jsx`):** Modos duales de publicación (inmediato vs programado), orden secuencial garantizado.
4. **Editor y Creador de Historias (`StoryCreator.jsx`, `StoryPhoneMockup.jsx`, `EditStoryModal.jsx`):** Modularizado con simulación 9:16 en vivo.
5. **Utilidades Compartidas (`src/utils/folderMedia.js`):** Extracción lógica reutilizable para carpetas y packs.
6. **Registro de Publicaciones (`PublicationLogs.jsx`).**
7. **Configuración y Verificación (`SettingsPanel.jsx`):** Versión `v1.5.4` visible al pie (Regla 4).

---

## 📝 Registro de Sesiones y Cambios
* **2026-10-22 (v1.5.4 - Fix de Desbordamiento en Tarjetas & Consistencia Navbar):**
  * **Consistencia de Navbar:** Se unificó la altura de todos los botones de navegación (`h-9` en desktop y `h-8` en mobile) con flexbox centrado y `leading-none`. El recuadro amarillo activo ahora tiene exactamente el mismo tamaño en "Calendario Semanal", "Carpetas", "Nueva Historia", etc.
  * **Solución de Desbordamiento en Tarjetas Semanales:**
    * El botón de encendido/pausa (`Power`) y la hora (`Clock`) se reubicaron en una fila superior de ancho completo dentro de la tarjeta, evitando que queden expulsados fuera de la UI en las columnas angostas de los días.
    * La etiqueta de carpetas rotativas fue acortada y provista de elipsis (`max-w-full truncate`) mostrando `📁 {nombre}` sin desbordar.
    * El indicador semanal con flechita se sintetizó en un badge compacto `↻` situado en la fila de redes sociales con tooltip descriptivo.
    * Se aplicó `overflow-hidden` a la tarjeta para blindar la UI contra cualquier recorte indeseado.
* **2026-10-22 (v1.5.3 - Plegado Inteligente de Días & Desactivación de GitHub Actions):**
  * **Consulta sobre Minutos de GitHub Actions:** Se identificó que existía un archivo residual `.github/workflows/auto-publisher.yml` con un cron cada 15 minutos de una versión preliminar previa a la migración a Cloud Functions. Se eliminó por completo para frenar el consumo de minutos de GitHub. La app corre 100% en Firebase sin depender de GitHub Actions.
  * **Plegado de Historias por Día:** En `WeeklyCalendar.jsx`, se limitó la visualización inicial a 2 historias por día. Si hay más historias, se añade un botón colapsable interactivo (`+N historias más` / `Ver menos`) con flecha `ChevronDown`/`ChevronUp` individual por día, evitando que las columnas se estiren verticalmente.
* **2026-10-22 (v1.5.2 - Selector Desplegable de Categorías en Calendario):**
  * Se sustituyó la fila de pills por un select desplegable compacto con icono `Filter` y `ChevronDown`.
* **2026-10-22 (v1.5.1 - Simplificación de Navbar & Eliminación de Badge Redundante):**
  * Eliminar badge decorativo *"Pizzería María Belén"* que figuraba al lado de *"Programador de Contenido"*.
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
