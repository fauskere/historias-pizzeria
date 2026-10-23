# 📋 Registro de Sesión: Cron Quirúrgico por Franjas Horarias (v1.5.6)

* **Fecha:** 2026-10-22
* **Versión:** `v1.5.6`
* **Proyecto:** Programador de Contenido (PizzaStory Studio)
* **URL en Producción:** `https://programador-de-contenido.web.app`

---

## 🎯 Solicitud del Usuario
Configuración de horarios personalizados para GitHub Actions:
* **De 13:30 a 19:00 hs:** Cada 30 minutos.
* **De 19:00 a 20:30 hs (Hora Pico):** Cada 15 minutos (mayor volumen de historias).
* **De 20:30 a 22:00 hs:** Cada 30 minutos.
* **De 22:00 a 13:30 hs:** Apagado total (cero ejecuciones).
* **Pregunta:** ¿Cuánto durarían los minutos de GitHub con este esquema?

---

## 📊 Matemática de Minutos y Rendimiento
* **Ejecuciones Diarias:**
  * 13:30 a 18:30 hs (cada 30m): 11 ejecuciones.
  * 19:00 a 20:30 hs (cada 15m): 7 ejecuciones.
  * 20:30 a 22:00 hs (cada 30m): 3 ejecuciones.
  * Total al día: **21 ejecuciones diarias**.
* **Consumo Mensual:**
  * 21 ejecuciones × 30 días = **630 minutos al mes**.
  * Cuota mensual gratuita de GitHub: **2.000 minutos**.
  * Porcentaje de uso: **31,5%** (apenas un tercio de la cuota).
  * Saldo libre restante: **1.370 minutos de sobra** cada mes.

---

## 🚀 Implementación
* Archivo `.github/workflows/auto-publisher.yml` actualizado con los 6 triggers de cron correspondientes en UTC (GMT+0).
* Desplegado en Firebase Hosting y subido a GitHub en la rama `main`.
