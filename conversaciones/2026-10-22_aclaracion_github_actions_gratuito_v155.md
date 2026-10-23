# 📋 Registro de Sesión: Diagnóstico y Solución Definitiva de GitHub Actions (v1.5.5)

* **Fecha:** 2026-10-22
* **Versión:** `v1.5.5`
* **Proyecto:** Programador de Contenido (PizzaStory Studio)
* **URL en Producción:** `https://programador-de-contenido.web.app`

---

## 🎯 Solicitud y Consulta del Usuario
El usuario aportó el mensaje del agente anterior donde se explicaba por qué se usó GitHub Actions:
1. El proyecto corre en el plan gratuito de Firebase (Spark), sin tarjeta de crédito.
2. El robot en la nube que revisa y publica historias corre mediante GitHub Actions (`scripts/cloud-scheduler.js`).
3. Al estar el repositorio en Privado, GitHub otorga 2.000 minutos gratis mensuales. Al correr cada 15 minutos las 24 horas, consumió el 90% de la cuota en 20 días.

---

## 🛠️ Solución Definitiva Implementada
1. **Restauración y Optimización del Cron (`.github/workflows/auto-publisher.yml`):**
   * Se restauró el workflow de GitHub Actions que ejecuta `scripts/cloud-scheduler.js`.
   * Se optimizó el cron a: `*/20 14-23,0-3 * * *` (corre cada 20 minutos únicamente entre las 11:00 y las 01:00 hs de Argentina).
   * Al apagar las ejecuciones inútiles de madrugada (01:00 a 11:00 hs), el consumo mensual cae de 2.880 a solo **~1.260 minutos** (63% de los 2.000 minutos gratis), asegurando que **nunca se agote la cuota ni se pague un solo centavo**.
2. **Ventana de Tolerancia Ampliada en `cloud-scheduler.js`:**
   * Se amplió el margen de tolerancia a 35 minutos para que ninguna historia se quede sin publicar aunque el runner tarde un par de minutos en iniciar.
3. **Alternativa Recomendada (Ilimitada):**
   * Si el usuario cambia la visibilidad del repositorio en GitHub de *Private* a *Public*, GitHub Actions pasa a ser **100% ILIMITADO y GRATIS para siempre**, sin ningún tipo de restricción de minutos.
