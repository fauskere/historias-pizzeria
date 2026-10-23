# 📋 Registro de Sesión: Activación Total Lunes a Domingo en Horario Comercial (v1.5.8)

* **Fecha:** 2026-10-22
* **Versión:** `v1.5.8`
* **Proyecto:** Programador de Contenido (PizzaStory Studio)
* **URL en Producción:** `https://programador-de-contenido.web.app`

---

## 🎯 Solicitud del Usuario
Activar los días Lunes y Martes dentro del horario comercial (13:30 a 22:00 hs) para que, en caso de abrir en feriados o días especiales, las historias se publiquen automáticamente sin necesidad de intervención manual ni configuraciones extras.

---

## 📊 Balance Definitivo de Consumo
* **Horario comercial:**
  * 13:30 a 19:00 hs: Cada 30 minutos (11 ejecuciones)
  * 19:00 a 20:30 hs: Cada 15 minutos (7 ejecuciones)
  * 20:30 a 22:00 hs: Cada 30 minutos (3 ejecuciones)
  * Total: **21 ejecuciones por día**.
* **Consumo mensual (Lunes a Domingo):**
  * 21 ejecuciones × 30 días = **630 minutos al mes**.
  * Cuota mensual gratis de GitHub: **2.000 minutos**.
  * Margen libre: **1.370 minutos de sobra** todos los meses (apenas un 31,5% de uso).
* **Cierre de Octubre (23 al 31 de octubre):**
  * 9 días × 21 minutos = **189 minutos**.
  * Saldo disponible: **200 minutos**.
  * Sobran 11 minutos antes del reinicio del 01/11.

---

## 🚀 Implementación
* `.github/workflows/auto-publisher.yml` actualizado con los 6 triggers de cron activos todos los días de la semana.
* Compilación y despliegue completados (v1.5.8).
