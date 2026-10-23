# 📋 Registro de Sesión: Desactivación Lunes/Martes y Balance de Minutos para Fin de Mes (v1.5.7)

* **Fecha:** 2026-10-22
* **Versión:** `v1.5.7`
* **Proyecto:** Programador de Contenido (PizzaStory Studio)
* **URL en Producción:** `https://programador-de-contenido.web.app`

---

## 🎯 Consulta del Usuario
1. Habiendo gastado 1.800 de los 2.000 minutos mensuales de GitHub Actions (quedan 200 minutos), y con la renovación el 01/11: ¿alcanzan los minutos para terminar octubre?
2. Desactivar completamente el robot los días **Lunes y Martes** (días que la pizzería no abre).

---

## 📊 Balance Matemático de Octubre
* **Saldo actual disponible:** 200 minutos.
* **Días restantes hasta el 01/11 (del 23 al 31 de octubre):** 9 días calendario.
* **Días activos (Miércoles a Domingo):**
  * Viernes 23, Sábado 24, Domingo 25
  * Miércoles 28, Jueves 29, Viernes 30, Sábado 31
  * Total días activos: **7 días**.
  * Lunes 26 y Martes 27: **0 minutos (apagado total)**.
* **Consumo total proyectado:** 7 días × 21 minutos = **147 minutos**.
* **Resultado:** 147 min < 200 min disponibles. **Te sobran 53 minutos de colchón**. No se cortará el servicio.

---

## 📈 Proyección a Futuro (a partir de Noviembre)
* 5 días activos semanales × 21 minutos = 105 minutos semanales.
* Mes promedio (4.3 semanas) = **~450 minutos mensuales**.
* De los 2.000 minutos gratis, vas a usar **apenas el 22,5%**, sobrando más de 1.550 minutos todos los meses.

---

## 🚀 Implementación Técnica
* Archivo `.github/workflows/auto-publisher.yml` actualizado con triggers `WED-SUN` en franjas diurnas y `THU-MON` para las horas nocturnas (00:00 y 01:00 UTC) para que coincida exactamente con las noches de Miércoles a Domingo en Argentina.
* Compilación y despliegue completados (v1.5.7).
