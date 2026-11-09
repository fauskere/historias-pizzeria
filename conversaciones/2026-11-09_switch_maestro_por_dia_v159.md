# 📋 Registro de Sesión: Switch Maestro por Día Completo en Calendario Semanal (v1.5.9)

* **Fecha:** 2026-11-09
* **Versión:** `v1.5.9`
* **Proyecto:** Programador de Contenido (PizzaStory Studio)
* **Visibilidad:** Público en GitHub
* **URL en Producción:** `https://programador-de-contenido.web.app`

---

## 🎯 Solicitud del Usuario
* En días feriados o aperturas especiales (como hoy Lunes), se abren historias para Lunes y Martes.
* **Problema:** Si se pausa una historia individual desde la columna del Martes, se pausa el documento de la historia completo para toda la semana (afectando a Miércoles, Jueves, etc.).
* **Requerimiento:** Disponer de un Switch Maestro para cada día de la semana (Lunes, Martes, Miércoles, etc.) en la cabecera de la columna, permitiendo encender o apagar el día completo. De esta forma, Lunes o Martes pueden dejarse pausados habitualmente y encenderse en 1 solo clic únicamente cuando se abra por feriado, sin desconfigurar las historias de los demás días.

---

## 🛠️ Implementación Técnica Realizada

### 1. Servicios y Persistencia en Firebase (`src/services/firebase.js`)
* Se crearon los métodos `fetchActiveDays`, `saveActiveDays` y `getLocalActiveDays` con persistencia dual en Firestore (`settings/schedule`) y en `localStorage`.
* Configuración por defecto: Lunes activo (para feriados o según necesidad), Martes cerrado, Miércoles a Domingo activos.

### 2. Estado Global en la Aplicación (`src/App.jsx`)
* Estado `activeDays` cargado al inicio junto a historias, carpetas y categorías.
* Función `handleToggleDayActive(dayKey)` que conmuta el estado y lo sincroniza inmediatamente en la nube.

### 3. Interfaz Visual en el Calendario (`src/components/WeeklyCalendar.jsx`)
* Se agregó un **Switch de palanca On/Off** en la cabecera de cada una de las 7 columnas (verde para día activo, gris para día pausado).
* Cuando un día está en OFF:
  * La columna se atenúa visualmente.
  * Muestra un sub-banner sutil: `Día en pausa / Cerrado`.
  * Avisa que las historias de ese día quedan preparadas y listas para cuando se active el interruptor.
* Al hacer clic en el switch, cambia de estado en tiempo real.

### 4. Sincronización con el Robot de Publicación Autónoma (`scripts/cloud-scheduler.js` y `functions/index.js`)
* Antes de consultar o disparar historias, el robot de GitHub Actions lee `settings/schedule`.
* Si el día actual (ej: `martes`) tiene `activeDays[currentDay] === false`, emite un log informativo:
  `[Switch Maestro] El día MARTES está PAUSADO / CERRADO en el Calendario. No se publican historias hoy.` y finaliza en 2 segundos sin publicar nada.
* Cuando el usuario activa el switch (como hoy Lunes feriado), el robot detecta `true` y publica normalmente todo el contenido programado.

---

## 🚀 Despliegue y Verificación
* Compilación exitosa en 500ms sin errores.
* Desplegado en Firebase Hosting: `https://programador-de-contenido.web.app`.
* Versión incrementada a `v1.5.9` en `package.json` y `SettingsPanel.jsx` (Regla 4).
