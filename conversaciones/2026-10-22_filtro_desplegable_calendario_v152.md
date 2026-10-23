# 📋 Registro de Sesión: Filtro Desplegable en Calendario (v1.5.2)

* **Fecha:** 2026-10-22
* **Versión:** `v1.5.2`
* **Proyecto:** Programador de Contenido (PizzaStory Studio)
* **URL Hosting:** `https://programador-de-contenido.web.app`

---

## 🎯 Solicitud del Usuario
* En el Calendario Semanal, transformar el filtro horizontal de categorías (Todas, Promociones, Pizzas, etc.) en un menú desplegable para ahorrar espacio en pantalla y mantener la cabecera limpia.

---

## 🛠️ Acciones Realizadas
1. **Reemplazo por Select Desplegable (`WeeklyCalendar.jsx`):**
   * Se eliminó la hilera de botones/píldoras horizontales.
   * Se integró un selector desplegable estilizado con icono de embudo `Filter` en dorado y flecha `ChevronDown`.
   * El desplegable se adapta fluidamente a pantallas grandes y móviles (`min-w-[200px]`), filtrando al instante el grid de los 7 días y las secciones a demanda.
2. **Control de Versión:** Actualizado a `v1.5.2` en `package.json` y `SettingsPanel.jsx` (Regla 4).
3. **Build & Despliegue:** Compilación en 321ms y despliegue a Firebase Hosting.
