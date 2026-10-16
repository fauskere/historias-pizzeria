// Robot autónomo en la nube de GitHub Actions
// Se ejecuta cada 15 minutos en los servidores de GitHub sin depender de ninguna PC o celular.

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const PROJECT_ID = 'programador-de-contenido';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Función para transformar documentos de Firestore REST API a objetos limpios
function parseFirestoreDoc(doc) {
  if (!doc || !doc.fields) return null;
  const id = doc.name.split('/').pop();
  const obj = { id, _docName: doc.name };

  for (const [key, val] of Object.entries(doc.fields)) {
    if ('stringValue' in val) obj[key] = val.stringValue;
    else if ('booleanValue' in val) obj[key] = val.booleanValue;
    else if ('integerValue' in val) obj[key] = parseInt(val.integerValue, 10);
    else if ('doubleValue' in val) obj[key] = parseFloat(val.doubleValue);
    else if ('arrayValue' in val) {
      obj[key] = (val.arrayValue.values || []).map(v => v.stringValue || v.booleanValue || v);
    } else if ('mapValue' in val) {
      const map = {};
      for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
        map[k] = v.booleanValue !== undefined ? v.booleanValue : (v.stringValue || v);
      }
      obj[key] = map;
    }
  }
  return obj;
}

// Publicar en Instagram Stories
async function publishInstagramStory({ instagramAccountId, pageAccessToken, mediaUrl, mediaType = 'image' }) {
  console.log(`[Instagram] Creando contenedor de historia en cuenta ${instagramAccountId}...`);
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
  if (createData.error) {
    throw new Error(`Instagram Container Error: ${createData.error.message}`);
  }

  const creationId = createData.id;

  // Esperar a que Meta termine de procesar y descargar el archivo
  let finished = false;
  let attempts = 0;
  const maxAttempts = mediaType === 'video' ? 20 : 10;

  while (!finished && attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, 3000));
    attempts++;
    try {
      const statusRes = await fetch(`${GRAPH_BASE_URL}/${creationId}?fields=status_code&access_token=${encodeURIComponent(pageAccessToken)}`);
      const statusData = await statusRes.json();
      console.log(`[Instagram] Estado del contenedor (${attempts}/${maxAttempts}): ${statusData.status_code || 'esperando'}`);
      if (statusData.status_code === 'FINISHED') {
        finished = true;
      } else if (statusData.status_code === 'ERROR') {
        throw new Error('Meta no pudo procesar el archivo en sus servidores.');
      }
    } catch (e) {
      if (e.message.includes('Meta no pudo')) throw e;
    }
  }

  // Publicar contenedor
  console.log(`[Instagram] Publicando historia en vivo...`);
  const pubParams = new URLSearchParams({
    creation_id: creationId,
    access_token: pageAccessToken
  });

  const pubRes = await fetch(`${GRAPH_BASE_URL}/${instagramAccountId}/media_publish`, {
    method: 'POST',
    body: pubParams
  });
  const pubData = await pubRes.json();
  if (pubData.error) {
    throw new Error(`Instagram Publish Error: ${pubData.error.message}`);
  }

  console.log(`[Instagram] ¡Historia publicada con éxito! ID: ${pubData.id}`);
  return { success: true, storyId: pubData.id, platform: 'instagram' };
}

// Publicar en Facebook Page Stories
async function publishFacebookStory({ facebookPageId, pageAccessToken, mediaUrl, mediaType = 'image' }) {
  console.log(`[Facebook] Subiendo foto a la página ${facebookPageId}...`);
  if (mediaType === 'image') {
    const photoParams = new URLSearchParams({
      url: mediaUrl,
      published: 'false',
      temporary: 'true',
      access_token: pageAccessToken
    });

    const photoRes = await fetch(`${GRAPH_BASE_URL}/${facebookPageId}/photos`, {
      method: 'POST',
      body: photoParams
    });
    const photoData = await photoRes.json();
    if (photoData.error) {
      throw new Error(`Facebook Foto: ${photoData.error.message}`);
    }

    const photoId = photoData.id;
    console.log(`[Facebook] Creando historia de página con foto temporal ID: ${photoId}...`);

    const storyParams = new URLSearchParams({
      photo_id: photoId,
      access_token: pageAccessToken
    });

    const storyRes = await fetch(`${GRAPH_BASE_URL}/${facebookPageId}/photo_stories`, {
      method: 'POST',
      body: storyParams
    });
    const storyData = await storyRes.json();
    if (storyData.error) {
      throw new Error(`Facebook Story: ${storyData.error.message}`);
    }

    console.log(`[Facebook] ¡Historia de página publicada con éxito!`);
    return { success: true, storyId: storyData.post_id || photoId, platform: 'facebook' };
  } else {
    throw new Error('Publicación de video en Facebook Stories no soportada directamente por API.');
  }
}

// Actualizar en Firestore la fecha de última publicación para no duplicar
async function markStoryPublished(storyDocName, todayStr) {
  try {
    const updateUrl = `https://firestore.googleapis.com/v1/${storyDocName}?updateMask.fieldPaths=lastAutoPublishDate`;
    await fetch(updateUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          lastAutoPublishDate: { stringValue: todayStr }
        }
      })
    });
    console.log(`[Firestore] Historia actualizada con marca de fecha: ${todayStr}`);
  } catch (err) {
    console.warn('[Firestore] Error marcando fecha de publicación:', err);
  }
}

async function runScheduler() {
  console.log('--- INICIANDO ROBOT AUTOMÁTICO DE HISTORIAS ---');

  // 1. Obtener la hora y fecha exacta en Argentina (GMT-3)
  const timeZone = 'America/Argentina/Buenos_Aires';
  const now = new Date();

  // Día de la semana en español sin acentos
  const rawDay = new Intl.DateTimeFormat('es-AR', { timeZone, weekday: 'long' }).format(now).toLowerCase();
  const DAY_MAP = {
    'lunes': 'lunes',
    'martes': 'martes',
    'miércoles': 'miercoles',
    'miercoles': 'miercoles',
    'jueves': 'jueves',
    'viernes': 'viernes',
    'sábado': 'sabado',
    'sabado': 'sabado',
    'domingo': 'domingo'
  };
  const currentDay = DAY_MAP[rawDay] || rawDay;

  // Hora actual en Argentina en formato HH:MM
  const timeParts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  }).format(now).split(':');

  const currentHour = parseInt(timeParts[0], 10);
  const currentMinute = parseInt(timeParts[1], 10);
  const currentMinutesTotal = currentHour * 60 + currentMinute;
  const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

  // Fecha YYYY-MM-DD en Argentina
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone }).format(now);

  console.log(`Hora actual en Argentina: ${currentTimeStr} hs (${currentDay}, fecha: ${todayStr})`);

  // 2. Obtener credenciales de Meta desde Firestore o variables de entorno
  let pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN || '';
  let instagramAccountId = process.env.META_INSTAGRAM_ACCOUNT_ID || '';
  let facebookPageId = process.env.META_FACEBOOK_PAGE_ID || '';

  try {
    const metaRes = await fetch(`${FIRESTORE_BASE}/settings/meta`);
    if (metaRes.ok) {
      const metaDoc = await metaRes.json();
      const metaData = parseFirestoreDoc(metaDoc);
      if (metaData) {
        if (!pageAccessToken && metaData.pageAccessToken) pageAccessToken = metaData.pageAccessToken;
        if (!instagramAccountId && metaData.instagramAccountId) instagramAccountId = metaData.instagramAccountId;
        if (!facebookPageId && metaData.facebookPageId) facebookPageId = metaData.facebookPageId;
      }
    }
  } catch (err) {
    console.warn('No se pudo leer settings/meta de Firestore:', err.message);
  }

  if (!pageAccessToken) {
    console.error('ERROR: No se encontró ningún Page Access Token configurado.');
    return;
  }

  // 3. Obtener historias activas de Firestore
  console.log('Consultando historias en Firestore...');
  const storiesRes = await fetch(`${FIRESTORE_BASE}/stories`);
  if (!storiesRes.ok) {
    console.error('ERROR: No se pudieron leer las historias de Firestore.');
    return;
  }

  const storiesData = await storiesRes.json();
  const rawDocs = storiesData.documents || [];
  const stories = rawDocs.map(parseFirestoreDoc).filter(Boolean);
  console.log(`Se encontraron ${stories.length} historias en la base de datos.`);

  let publishedCount = 0;

  for (const story of stories) {
    if (!story.active) continue;
    if (!story.days || !Array.isArray(story.days) || !story.days.includes(currentDay)) continue;
    if (!story.time) continue;

    // Comparar hora programada con ventana de tolerancia de 30 minutos
    const [sHour, sMin] = story.time.split(':').map(n => parseInt(n, 10));
    const storyMinutesTotal = sHour * 60 + sMin;
    const diff = currentMinutesTotal - storyMinutesTotal;

    // Se dispara si la hora ya llegó o pasó en los últimos 30 minutos
    if (diff < 0 || diff > 30) continue;

    // Si ya se publicó hoy, saltar
    if (story.lastAutoPublishDate === todayStr) {
      console.log(`La historia "${story.title}" ya fue publicada hoy (${todayStr}).`);
      continue;
    }

    console.log(`>>> EJECUTANDO PUBLICACIÓN: "${story.title}" (Programada: ${story.time} hs, Actual: ${currentTimeStr} hs)`);

    try {
      if (story.platforms?.instagram && instagramAccountId) {
        await publishInstagramStory({
          instagramAccountId,
          pageAccessToken,
          mediaUrl: story.mediaUrl,
          mediaType: story.mediaType || 'image'
        });
      }

      if (story.platforms?.facebook && facebookPageId) {
        try {
          await publishFacebookStory({
            facebookPageId,
            pageAccessToken,
            mediaUrl: story.mediaUrl,
            mediaType: story.mediaType || 'image'
          });
        } catch (fbErr) {
          console.warn('[Facebook Aviso]:', fbErr.message);
        }
      }

      // Marcar historia como publicada hoy
      await markStoryPublished(story._docName, todayStr);
      publishedCount++;
    } catch (pubErr) {
      console.error(`Error publicando historia "${story.title}":`, pubErr.message);
    }
  }

  console.log(`--- PROCESO FINALIZADO: ${publishedCount} historia(s) publicada(s) ---`);
}

runScheduler().catch(err => {
  console.error('Error fatal en el scheduler:', err);
  process.exit(1);
});
