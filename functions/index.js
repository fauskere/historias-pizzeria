/**
 * Cloud Functions para PizzaStory
 * Publicador programado de Historias en Instagram y Facebook
 */
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Función programada que corre cada 5 minutos
 * Revisa historias activas programadas para el día y hora actual
 */
exports.publishScheduledStories = onSchedule('every 5 minutes', async (_event) => {
  console.log('Iniciando revisión de historias programadas...');

  // 1. Obtener la configuración de Meta guardada en Firestore
  const settingsDoc = await db.collection('settings').doc('meta').get();
  if (!settingsDoc.exists) {
    console.log('No se encontraron credenciales de Meta configuradas en Firestore.');
    return;
  }
  const metaSettings = settingsDoc.data();
  const { pageAccessToken, facebookPageId, instagramAccountId, timezone = 'America/Argentina/Buenos_Aires' } = metaSettings;

  if (!pageAccessToken) {
    console.log('Falta el Page Access Token.');
    return;
  }

  // 2. Determinar fecha y hora actual en la zona horaria de la pizzería
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('es-AR', {
    timeZone: timezone,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(now);
  const weekdayPart = parts.find(p => p.type === 'weekday')?.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const currentHour = parseInt(parts.find(p => p.type === 'hour')?.value, 10);
  const currentMinute = parseInt(parts.find(p => p.type === 'minute')?.value, 10);
  const currentTimeTotalMinutes = currentHour * 60 + currentMinute;
  const todayDateString = now.toISOString().split('T')[0];

  console.log(`Día actual: ${weekdayPart}, Hora actual: ${currentHour}:${currentMinute} (${currentTimeTotalMinutes} mins)`);

  // 3. Consultar historias activas
  const storiesSnapshot = await db.collection('stories').where('active', '==', true).get();
  if (storiesSnapshot.empty) {
    console.log('No hay historias activas.');
    return;
  }

  for (const docSnap of storiesSnapshot.docs) {
    const story = docSnap.data();
    const storyId = docSnap.id;

    // Verificar si está asignada para hoy
    if (!story.days || !story.days.includes(weekdayPart)) {
      continue;
    }

    // Verificar si ya fue publicada hoy
    if (story.lastPublishedDate === todayDateString) {
      continue;
    }

    // Verificar ventana de horario (+/- 6 minutos)
    const [storyH, storyM] = (story.time || '00:00').split(':').map(Number);
    const storyTimeTotalMinutes = storyH * 60 + storyM;
    const diffMinutes = Math.abs(currentTimeTotalMinutes - storyTimeTotalMinutes);

    if (diffMinutes <= 6) {
      console.log(`¡Es hora de publicar historia "${story.title}" (ID: ${storyId})!`);
      const results = [];
      let successOverall = true;

      // Publicar en Instagram Stories
      if (story.platforms?.instagram && instagramAccountId) {
        try {
          const igRes = await publishInstagramStory({
            instagramAccountId,
            pageAccessToken,
            mediaUrl: story.mediaUrl,
            mediaType: story.mediaType
          });
          results.push({ platform: 'instagram', success: true, storyId: igRes.id });
        } catch (err) {
          console.error('Error publicando en Instagram:', err);
          results.push({ platform: 'instagram', success: false, error: err.message });
          successOverall = false;
        }
      }

      // Publicar en Facebook Page Stories
      if (story.platforms?.facebook && facebookPageId && story.mediaType === 'image') {
        try {
          const fbRes = await publishFacebookStory({
            facebookPageId,
            pageAccessToken,
            mediaUrl: story.mediaUrl
          });
          results.push({ platform: 'facebook', success: true, storyId: fbRes.post_id || fbRes.photo_id });
        } catch (err) {
          console.error('Error publicando en Facebook:', err);
          results.push({ platform: 'facebook', success: false, error: err.message });
          successOverall = false;
        }
      }

      // Actualizar registro en Firestore
      await db.collection('stories').doc(storyId).update({
        lastPublishedDate: todayDateString,
        lastPublishedAt: new Date().toISOString()
      });

      // Guardar log
      await db.collection('publication_logs').add({
        storyId,
        storyTitle: story.title,
        timestamp: new Date().toISOString(),
        success: successOverall,
        details: results
      });
    }
  }
});

// Helper publicación Instagram
async function publishInstagramStory({ instagramAccountId, pageAccessToken, mediaUrl, mediaType }) {
  const containerParams = new URLSearchParams({
    media_type: 'STORIES',
    access_token: pageAccessToken
  });
  if (mediaType === 'video') {
    containerParams.append('video_url', mediaUrl);
  } else {
    containerParams.append('image_url', mediaUrl);
  }

  const createRes = await fetch(`${GRAPH_BASE_URL}/${instagramAccountId}/media`, {
    method: 'POST',
    body: containerParams
  });
  const createData = await createRes.json();
  if (createData.error) throw new Error(createData.error.message);

  const creationId = createData.id;

  if (mediaType === 'video') {
    // Esperar procesamiento
    let finished = false;
    let attempts = 0;
    while (!finished && attempts < 10) {
      await new Promise(r => setTimeout(r, 4000));
      const statusRes = await fetch(`${GRAPH_BASE_URL}/${creationId}?fields=status_code&access_token=${encodeURIComponent(pageAccessToken)}`);
      const statusData = await statusRes.json();
      if (statusData.status_code === 'FINISHED') finished = true;
      attempts++;
    }
  }

  const pubRes = await fetch(`${GRAPH_BASE_URL}/${instagramAccountId}/media_publish`, {
    method: 'POST',
    body: new URLSearchParams({ creation_id: creationId, access_token: pageAccessToken })
  });
  const pubData = await pubRes.json();
  if (pubData.error) throw new Error(pubData.error.message);

  return pubData;
}

// Helper publicación Facebook
async function publishFacebookStory({ facebookPageId, pageAccessToken, mediaUrl }) {
  const photoParams = new URLSearchParams({
    url: mediaUrl,
    published: 'false',
    access_token: pageAccessToken
  });
  const photoRes = await fetch(`${GRAPH_BASE_URL}/${facebookPageId}/photos`, {
    method: 'POST',
    body: photoParams
  });
  const photoData = await photoRes.json();
  if (photoData.error) throw new Error(photoData.error.message);

  const storyRes = await fetch(`${GRAPH_BASE_URL}/${facebookPageId}/photo_stories`, {
    method: 'POST',
    body: new URLSearchParams({ photo_id: photoData.id, access_token: pageAccessToken })
  });
  const storyData = await storyRes.json();
  if (storyData.error) throw new Error(storyData.error.message);

  return { ...storyData, photo_id: photoData.id };
}
