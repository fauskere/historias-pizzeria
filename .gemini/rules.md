# Reglas Globales y Estándares de Desarrollo — Programador de Contenido
# Pizzería María Belén

Este documento constituye la **fuente de verdad y directivas obligatorias e innegociables** para cualquier agente o desarrollador que trabaje en este proyecto.

---

## 1. 🏛️ LÍMITES FÍSICOS Y ARQUITECTURA DE CÓDIGO
* **Límite de Archivos**: Recomendado estrictamente **< 500 líneas**.
  * **Hard Cap innegociable de 800 líneas**. Superado o aproximándose al límite, se debe modularizar y extraer a componentes o utilidades independientes de inmediato.
* **Límite de Funciones**: Menos de **50 líneas** por función. Principio de Responsabilidad Única (SRP).
* **Modularidad y Atomic Design**:
  * Si un flujo crece (ejemplo: edición de historias, modales complejos), se crea un componente independiente dedicado (ej: `EditStoryModal.jsx`) en lugar de sobrecargar componentes existentes.
* **Código Limpio y Mantenible**:
  * Nombres descriptivos en español para variables de negocio y dominio.
  * Preservar docstrings y comentarios existentes que no estén relacionados con refactorizaciones directas.

---

## 2. 🎨 SISTEMA DE DISEÑO OFICIAL (PIZZERÍA MARÍA BELÉN)
El diseño debe ser coherente en un 100% con la suite de software del negocio (`C:\Pizzeria Manager\pizzeria-manager`):
* **Fondo Principal**: `#121212` (Negro carbón mate profundo, sin tonos azulados ni slates lavados).
* **Paneles y Tarjetas**: `#1E1E1E` con bordes sutiles `rgba(255, 255, 255, 0.08)` o `#2C2C2C`.
* **Hover de Paneles**: `#2C2C2C`.
* **Color Primario de Marca**: **Amarillo Oro / Dorado (`#FFD700` a `#FFC107`)**.
* **Botones Primarios**: Fondo `#FFD700` con texto **negro azabache (`#000000`) en negrita** (`.btn-gold`), con resplandor dorado en hover (`rgba(255, 215, 0, 0.25)`).
* **Tipografía**:
  * Títulos: Blanco puro `#FFFFFF`.
  * Textos secundarios / descripciones: `#AAAAAA`.
* **Estados**:
  * Éxito / Publicado / Conectado: `#00E096` (Verde esmeralda).
  * Peligro / Alerta / Error: `#FF3B30` (Rojo).
* **Scrollbars**: Ancho fino (6px) con thumb translúcido dorado (`rgba(255, 215, 0, 0.2)`).

---

## 3. 🏷️ IDENTIDAD Y BRANDING
* **Nombre Oficial**: **Programador de Contenido • Pizzería María Belén**.
* **Prohibición de Nombres Provisorios**: Queda terminantemente prohibido mostrar en la UI, títulos del navegador (`<title>`) o cabeceras nombres autogenerados o de plantillas como *"keen-hertz"*, *"PizzaStory"* o *"PizzaStory Studio"*.

---

## 4. ☁️ AUTOMATIZACIÓN Y PERSISTENCIA (100% GRATUITO)
* **Zero Cost**: El sistema debe operar 100% gratis de por vida, sin requerir suscripciones pagas ni tarjetas de crédito.
* **Disparador Autónomo**: La automatización se ejecuta en la nube (cron-job.org cada 5 minutos + GitHub Actions `cloud-scheduler.js`).
* **Sin Dependencia de Dispositivos**: La publicación automática no depende de dejar ninguna PC encendida ni la web abierta.
* **Token Permanente**: El token de Meta en Firestore debe mantenerse como Page Access Token permanente (`expires_at: 0`).
* **Sincronización Total de Historias**:
  * Cada historia modificada (ej: cambio de foto, horario o texto) actualiza su documento único en Firestore, reflejándose automáticamente en todos los días programados.
