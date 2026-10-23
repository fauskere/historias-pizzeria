# 📋 Registro de Sesión: Plegado de Historias por Día & Desactivación de GitHub Actions (v1.5.3)

* **Fecha:** 2026-10-22
* **Versión:** `v1.5.3`
* **Proyecto:** Programador de Contenido (PizzaStory Studio)
* **URL Hosting:** `https://programador-de-contenido.web.app`

---

## 🎯 Solicitudes del Usuario
1. **Límite de Historias por Día en Calendario:** Cuando un día tiene muchas historias, la columna se estira verticalmente demasiado. Establecer por defecto un máximo visible de 2 historias por día, con un indicador que diga cuántas más hay y una flecha para desplegar o colapsar todas las historias en detalle de ese día.
2. **Alerta de GitHub Actions (90% de minutos consumidos):** Consulta sobre qué significa la notificación de GitHub sobre el uso del 90% de minutos y si estamos en problemas.

---

## 🛠️ Diagnóstico y Solución de GitHub Actions
* **Diagnóstico:** Se encontró en `.github/workflows/auto-publisher.yml` un cron rezagado (`*/15 * * * *`) de las primeras pruebas del proyecto previas a la migración a Firebase Cloud Functions. Ese script levantaba una máquina virtual Ubuntu cada 15 minutos en GitHub consumiendo la cuota mensual gratuita de 2.000 minutos de GitHub Actions.
* **¿Estamos en problemas?:** No. El bot de publicaciones de la pizzería ya no depende de GitHub Actions, sino de Firebase Cloud Functions v2 (Google Cloud Serverless). GitHub tampoco cobra nada porque el límite de gasto por defecto es $0.
* **Acción realizada:** Se eliminó `.github/workflows/auto-publisher.yml`. Esto frenó de raíz el consumo de minutos de GitHub.

---

## 🎨 Mejoras de Interfaz Implementadas (`WeeklyCalendar.jsx`)
* **Límite visual de 2 historias:** Cada columna de día ahora muestra únicamente las primeras 2 historias por defecto, manteniendo el grid equilibrado y compacto.
* **Botón desplegable con flecha:** Si un día tiene 3 o más historias, aparece el botón:
  * Estado cerrado: `+N historias más` con icono `ChevronDown`.
  * Estado expandido: Muestra todas las historias en detalle y el botón cambia a `Ver menos` con icono `ChevronUp`.
* **Control independiente por día:** Cada día se puede desplegar o colapsar de forma individual.

---

## 🚀 Despliegue y Versión
* Versión incrementada a **`v1.5.3`** en `package.json` y `SettingsPanel.jsx` (Regla 4).
* Compilación exitosa en 349ms y despliegue a Firebase Hosting: `https://programador-de-contenido.web.app`.
