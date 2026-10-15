# 🍕 PizzaStory Studio

Aplicación web moderna y local/cloud para automatizar la publicación recurrente de **Historias en Instagram y Facebook** para tu pizzería, utilizando la **API oficial de Meta (Graph API)** y **Firebase**.

---

## ✨ Características Principales

* **📅 Calendario Semanal Interactivo:** Visualizá de un vistazo todas las historias programadas de lunes a domingo, con horarios y días destacados.
* **🔁 Repetición Semanal Automática:** Programá tus promociones (ej. 2x1 los martes a las 19:30 hs) una sola vez y se publican automáticamente cada semana sin volver a configurarlas.
* **📱 Vista Previa en Tiempo Real (9:16):** Simulador de smartphone interactivo que muestra exactamente cómo verá la historia tu cliente en Instagram y Facebook antes de publicarla.
* **⚡ Control Instantáneo (Activar / Pausar):** Un interruptor de un solo clic para pausar cualquier promoción si te quedaste sin stock o querés cancelarla momentáneamente.
* **🏷️ Gestión Multicontenido:** Organización por categorías (Promociones, Carta/Menú, Horarios de atención, Novedades).
* **🔒 100% Oficial de Meta:** Utiliza los endpoints oficiales (`media_type=STORIES` y `photo_stories`), evitando cualquier riesgo de bloqueo o baneo.
* **🧪 Validador y Disparador en Vivo:** Un botón de prueba directa que verifica tus credenciales y te permite publicar una historia de prueba al instante para comprobar que todo funciona.

---

## 🚀 Cómo Ejecutar la Aplicación en tu Computadora (Local)

Para abrir y probar la aplicación en tu navegador:

1. Abrí una terminal en la carpeta del proyecto:
   ```bash
   npm run dev
   ```
2. Abrí en tu navegador la dirección que te indique (por ejemplo `http://localhost:5173`).

---

## 🐙 Cómo Subir el Proyecto a tu GitHub

Para tener el código respaldado y poder clonarlo/trabajarlo desde otra PC:

1. Creá un nuevo repositorio en [github.com/new](https://github.com/new) (ej: `pizzeria-historias`).
2. En la terminal de esta carpeta, ejecutá:
   ```bash
   git add .
   git commit -m "feat: PizzaStory Studio con calendario semanal y publicador de Meta"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git push -u origin main
   ```
3. ¡Listo! Para abrirlo desde otra computadora, solo hacés:
   ```bash
   git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   npm install
   npm run dev
   ```

---

## ☁️ Cómo Subirlo a Firebase para Tener tu Enlace Web 24/7

Como ya tenés cuenta en Firebase:

1. Instalá la herramienta de Firebase (si aún no la tenés instalada):
   ```bash
   npm install -g firebase-tools
   ```
2. Iniciá sesión con tu cuenta de Google/Firebase:
   ```bash
   firebase login
   ```
3. Asociá este proyecto a tu proyecto existente de Firebase:
   ```bash
   firebase use --add
   ```
4. Compilá y publicá:
   ```bash
   npm run build
   firebase deploy
   ```
5. Firebase te dará un link web público (ej: `https://mi-pizzeria.web.app`) al que podrás entrar desde tu celular o cualquier computadora.

---

## 🔑 Configuración de Meta Graph API

En la pestaña **Configuración** de la aplicación:
1. Pegá tu **Page Access Token** generado en [developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer/).
2. Asegurate de incluir los permisos:
   * `instagram_basic`
   * `instagram_content_publish`
   * `pages_show_list`
   * `pages_manage_posts`
3. Hacé clic en **"Probar Conexión con Meta"**: la aplicación validará que tu página de Facebook y cuenta de Instagram respondan correctamente y te confirmará la conexión con una tilde verde.
