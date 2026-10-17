// Robot autónomo en la nube de GitHub Actions
// Se ejecuta cada 15 minutos en los servidores de GitHub sin depender de ninguna PC o celular.

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const PROJECT_ID = 'programador-de-contenido';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function parseFirestoreVal(val) {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('arrayValue' in val) return (val.arrayValue.values || []).map(parseFirestoreVal);
  if ('mapValue' in val) {
    const map = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      map[k] = parseFirestoreVal(v);
    }
    return map;
  }
  return val;
}

// Función para transformar documentos de Firestore REST API a objetos limpios
function parseFirestoreDoc(doc) {
  if (!doc || !doc.fields) return null;
  const id = doc.name.split('/').pop();
  const obj = { id, _docName: doc.name };

  for (const [key, val] of Object.entries(doc.fields)) {
    obj[key] = parseFirestoreVal(val);
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
async function markStoryPublished(storyDocName, todayStr, recurring) {
  try {
    let updateMask = 'updateMask.fieldPaths=lastAutoPublishDate';
    const fields = {
      lastAutoPublishDate: { stringValue: todayStr }
    };

    if (recurring === false) {
      updateMask += '&updateMask.fieldPaths=active&updateMask.fieldPaths=days';
      fields.active = { booleanValue: false };
      fields.days = { arrayValue: { values: [] } };
    }

    const updateUrl = `https://firestore.googleapis.com/v1/${storyDocName}?${updateMask}`;
    await fetch(updateUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    console.log(`[Firestore] Historia actualizada con fecha: ${todayStr}${recurring === false ? ' (desactivada y pasada a Historias a Demanda)' : ''}`);
  } catch (err) {
    console.warn('[Firestore] Error marcando fecha de publicación:', err);
  }
}

// Guardar registro de publicación en Firestore para la pestaña Historial
async function savePublicationLog({ storyTitle, success, details = [] }) {
  try {
    const logUrl = `${FIRESTORE_BASE}/history`;
    await fetch(logUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          storyTitle: { stringValue: storyTitle },
          success: { booleanValue: success },
          timestamp: { stringValue: new Date().toISOString() },
          type: { stringValue: 'auto' },
          details: {
            arrayValue: {
              values: details.map(d => ({
                mapValue: {
                  fields: {
                    platform: { stringValue: d.platform || 'general' },
                    message: { stringValue: d.message || '' }
                  }
                }
              }))
            }
          }
        }
      })
    });
    console.log('[Firestore] Registro guardado en la colección historial.');
  } catch (err) {
    console.warn('[Firestore] Error guardando historial:', err.message);
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

  // 2. Obtener credenciales de Meta desde Firestore (prioridad absoluta) o variables de entorno
  let pageAccessToken = '';
  let instagramAccountId = '';
  let facebookPageId = '';

  try {
    const metaRes = await fetch(`${FIRESTORE_BASE}/settings/meta`);
    if (metaRes.ok) {
      const metaDoc = await metaRes.json();
      const metaData = parseFirestoreDoc(metaDoc);
      if (metaData) {
        if (metaData.pageAccessToken) pageAccessToken = metaData.pageAccessToken;
        if (metaData.instagramAccountId) instagramAccountId = metaData.instagramAccountId;
        if (metaData.facebookPageId) facebookPageId = metaData.facebookPageId;
      }
    }
  } catch (err) {
    console.warn('No se pudo leer settings/meta de Firestore:', err.message);
  }

  // De respaldo, si no estaban en Firestore, usar variables de entorno
  if (!pageAccessToken) pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN || '';
  if (!instagramAccountId) instagramAccountId = process.env.META_INSTAGRAM_ACCOUNT_ID || '';
  if (!facebookPageId) facebookPageId = process.env.META_FACEBOOK_PAGE_ID || '';

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

  // Ordenar historias de menor a mayor por hora para respetar el orden cronológico
  stories.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  let publishedCount = 0;

  for (const story of stories) {
    if (!story.active) continue;
    if (!story.days || !Array.isArray(story.days) || !story.days.includes(currentDay)) continue;
    if (!story.time) continue;

    // Comparar si la hora programada ya llegó en el día de hoy
    const [sHour, sMin] = story.time.split(':').map(n => parseInt(n, 10));
    const storyMinutesTotal = sHour * 60 + sMin;

    // Si la hora programada todavía no llegó hoy:
    if (currentMinutesTotal < storyMinutesTotal) {
      console.log(`La historia "${story.title}" está programada para más tarde (${story.time} hs).`);
      continue;
    }

    // Si ya se publicó hoy, saltar para no duplicar
    if (story.lastAutoPublishDate === todayStr) {
      console.log(`La historia "${story.title}" ya fue publicada hoy (${todayStr}).`);
      continue;
    }

    console.log(`>>> EJECUTANDO PUBLICACIÓN: "${story.title}" (Programada: ${story.time} hs, Actual: ${currentTimeStr} hs)`);

    try {
      const details = [];
      let mediaItemsToPublish = [{ url: story.mediaUrl, mediaType: story.mediaType || 'image', name: story.title }];
      let publishedTitle = story.title;

      // Si la historia está vinculada a una carpeta rotativa
      if ((story.sourceType === 'folder' || story.folderId) && story.folderId) {
        try {
          const folderRes = await fetch(`${FIRESTORE_BASE}/folders/${story.folderId}`);
          if (folderRes.ok) {
            const folderDoc = await folderRes.json();
            const folderData = parseFirestoreDoc(folderDoc);

            const isSingleMode = folderData?.mode === 'single' || (!folderData?.packs || folderData.packs.length === 0);

            if (isSingleMode && Array.isArray(folderData?.items) && folderData.items.length > 0) {
              const items = folderData.items;
              const usedItemIds = Array.isArray(folderData?.usedItemIds) ? folderData.usedItemIds : [];
              let availableItems = items.filter(it => !usedItemIds.includes(it.id));
              let cycleReset = false;
              if (availableItems.length === 0) {
                console.log(`[Carpeta ${folderData.name || ''}] Ciclo de fotos completado. Reiniciando...`);
                availableItems = [...items];
                cycleReset = true;
              }

              const chosen = availableItems[Math.floor(Math.random() * availableItems.length)];
              mediaItemsToPublish = [{
                url: chosen.url,
                mediaType: chosen.mediaType || 'image',
                name: chosen.name || 'Foto'
              }];
              publishedTitle = `${story.title} [📁 ${folderData.name || 'Carpeta'} - Foto: "${chosen.name || 'Individual'}"]`;

              const nextUsed = cycleReset ? [chosen.id] : [...usedItemIds, chosen.id];
              const updateFolderUrl = `https://firestore.googleapis.com/v1/${folderDoc.name}?updateMask.fieldPaths=usedItemIds`;
              await fetch(updateFolderUrl, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fields: {
                    usedItemIds: {
                      arrayValue: {
                        values: nextUsed.map(id => ({ stringValue: id }))
                      }
                    }
                  }
                })
              });
              console.log(`[Carpeta Individual] Foto seleccionada: "${chosen.name}" (${nextUsed.length}/${items.length} fotos emitidas)`);
            } else {
              // Obtener packs de historias
              const packs = Array.isArray(folderData?.packs) ? folderData.packs : [];
              const usedPackIds = Array.isArray(folderData?.usedPackIds) ? folderData.usedPackIds : [];

              if (packs.length > 0) {
                let availablePacks = packs.filter(p => !usedPackIds.includes(p.id));
                let cycleReset = false;
                if (availablePacks.length === 0) {
                  console.log(`[Carpeta ${folderData.name || ''}] Ciclo de packs completado. Reiniciando...`);
                  availablePacks = [...packs];
                  cycleReset = true;
                }

                const chosenPack = availablePacks[Math.floor(Math.random() * availablePacks.length)];
                const sortedImages = (chosenPack.images || []).sort((a, b) => (a.order || 0) - (b.order || 0));

                if (sortedImages.length > 0) {
                  mediaItemsToPublish = sortedImages;
                  publishedTitle = `${story.title} [📁 ${folderData.name || 'Carpeta'} - Pack: "${chosenPack.name}" (${sortedImages.length} fotos en orden)]`;

                  const nextUsedPacks = cycleReset ? [chosenPack.id] : [...usedPackIds, chosenPack.id];
                  const updateFolderUrl = `https://firestore.googleapis.com/v1/${folderDoc.name}?updateMask.fieldPaths=usedPackIds`;
                  await fetch(updateFolderUrl, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      fields: {
                        usedPackIds: {
                          arrayValue: {
                            values: nextUsedPacks.map(id => ({ stringValue: id }))
                          }
                        }
                      }
                    })
                  });
                  console.log(`[Carpeta] Pack seleccionado: "${chosenPack.name}" con ${sortedImages.length} historias (${nextUsedPacks.length}/${packs.length} packs emitidos)`);
                }
              }
            }
          }
        } catch (fErr) {
          console.warn('[Carpeta] Error seleccionando pack de carpeta:', fErr.message);
        }
      }

      if (!mediaItemsToPublish || mediaItemsToPublish.length === 0 || !mediaItemsToPublish[0].url) {
        throw new Error('No se encontró ninguna imagen para publicar en la historia.');
      }

      // Publicar cada historia en orden respetando la secuencia del pack
      for (let i = 0; i < mediaItemsToPublish.length; i++) {
        const item = mediaItemsToPublish[i];
        console.log(`-> Publicando historia ${i + 1} de ${mediaItemsToPublish.length}: ${item.name || ''}...`);

        if (story.platforms?.instagram && instagramAccountId) {
          try {
            const igRes = await publishInstagramStory({
              instagramAccountId,
              pageAccessToken,
              mediaUrl: item.url,
              mediaType: item.mediaType || 'image'
            });
            details.push({ platform: 'instagram', message: `Foto ${i + 1} OK (ID: ${igRes.storyId})` });
          } catch (igErr) {
            console.error('[Instagram Error]:', igErr.message);
            details.push({ platform: 'instagram', message: `Foto ${i + 1} Error: ${igErr.message}` });
          }
        }

        if (story.platforms?.facebook && facebookPageId) {
          try {
            const fbRes = await publishFacebookStory({
              facebookPageId,
              pageAccessToken,
              mediaUrl: item.url,
              mediaType: item.mediaType || 'image'
            });
            details.push({ platform: 'facebook', message: `Foto ${i + 1} OK (ID: ${fbRes.storyId})` });
          } catch (fbErr) {
            console.warn('[Facebook Aviso]:', fbErr.message);
            details.push({ platform: 'facebook', message: `Foto ${i + 1} Error: ${fbErr.message}` });
          }
        }

        // Si hay más fotos en el pack, esperar 2.5s antes de subir la siguiente
        if (i < mediaItemsToPublish.length - 1) {
          console.log('Esperando 2.5s antes de subir la siguiente historia del pack...');
          await new Promise(resolve => setTimeout(resolve, 2500));
        }
      }

      // Verificar si al menos una publicación tuvo éxito
      const hasAnySuccess = details.some(d => d.message && d.message.includes('OK'));
      if (hasAnySuccess) {
        // Marcar historia como publicada hoy (y desactivarla si no es recurrente)
        const isRecurring = story.repeatWeekly !== false && story.recurring !== false;
        await markStoryPublished(story._docName, todayStr, isRecurring);
        await savePublicationLog({ storyTitle: publishedTitle, success: true, details });
        publishedCount++;
      } else {
        console.error(`Ninguna plataforma pudo publicar la historia "${story.title}". Reintentará en el siguiente intervalo.`);
        await savePublicationLog({ storyTitle: publishedTitle, success: false, details });
      }
    } catch (pubErr) {
      console.error(`Error publicando historia "${story.title}":`, pubErr.message);
      await savePublicationLog({
        storyTitle: story.title,
        success: false,
        details: [{ platform: 'meta', message: pubErr.message }]
      });
    }
  }

  console.log(`--- PROCESO FINALIZADO: ${publishedCount} historia(s) publicada(s) ---`);
}

runScheduler().catch(err => {
  console.error('Error fatal en el scheduler:', err);
  process.exit(1);
});
