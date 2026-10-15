// Servicio para interactuar con la Graph API de Meta (Instagram y Facebook)

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Prueba la validez del token y obtiene los datos de la Página de Facebook
 * y la Cuenta de Instagram vinculada.
 */
export async function testMetaConnection({ pageAccessToken, facebookPageId, instagramAccountId }) {
  if (!pageAccessToken) {
    return {
      success: false,
      message: 'Debes ingresar un Token de Acceso de Página (Page Access Token).'
    };
  }

  try {
    // 1. Probar el token contra /me
    const meRes = await fetch(`${GRAPH_BASE_URL}/me?fields=id,name&access_token=${encodeURIComponent(pageAccessToken)}`);
    const meData = await meRes.json();

    if (meData.error) {
      return {
        success: false,
        errorType: 'TOKEN_INVALID',
        message: `Error de Meta: ${meData.error.message}`,
        details: meData.error
      };
    }

    // 2. Si se proporcionó un Facebook Page ID, verificar la página
    let pageInfo = { id: meData.id, name: meData.name };
    if (facebookPageId) {
      const pageRes = await fetch(
        `${GRAPH_BASE_URL}/${facebookPageId}?fields=id,name,link,instagram_business_account{id,username}&access_token=${encodeURIComponent(pageAccessToken)}`
      );
      const pageData = await pageRes.json();
      if (!pageData.error) {
        pageInfo = pageData;
      }
    }

    // 3. Verificar cuenta de Instagram
    let igInfo = null;
    const targetIgId = instagramAccountId || pageInfo.instagram_business_account?.id;

    if (targetIgId) {
      const igRes = await fetch(
        `${GRAPH_BASE_URL}/${targetIgId}?fields=id,username,name,profile_picture_url&access_token=${encodeURIComponent(pageAccessToken)}`
      );
      const igData = await igRes.json();
      if (!igData.error) {
        igInfo = igData;
      }
    }

    return {
      success: true,
      message: 'Conexión exitosa con Meta Graph API',
      page: pageInfo,
      instagram: igInfo,
      detectedInstagramId: pageInfo.instagram_business_account?.id || null
    };
  } catch (err) {
    return {
      success: false,
      message: `Error de conexión de red: ${err.message}`
    };
  }
}

/**
 * Publicar una Historia en Instagram
 * Flujo oficial en 2 pasos:
 * 1. POST /{ig-user-id}/media (media_type=STORIES)
 * 2. POST /{ig-user-id}/media_publish (creation_id)
 */
export async function publishInstagramStory({ instagramAccountId, pageAccessToken, mediaUrl, mediaType = 'image' }) {
  if (!instagramAccountId || !pageAccessToken || !mediaUrl) {
    throw new Error('Faltan parámetros obligatorios para publicar en Instagram.');
  }

  // Paso 1: Crear el contenedor
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

  // Si es video, Meta requiere esperar a que procese
  if (mediaType === 'video') {
    let finished = false;
    let attempts = 0;
    while (!finished && attempts < 15) {
      await new Promise(r => setTimeout(r, 4000));
      const statusRes = await fetch(`${GRAPH_BASE_URL}/${creationId}?fields=status_code&access_token=${encodeURIComponent(pageAccessToken)}`);
      const statusData = await statusRes.json();
      if (statusData.status_code === 'FINISHED') {
        finished = true;
      } else if (statusData.status_code === 'ERROR') {
        throw new Error('El video no pudo ser procesado por los servidores de Meta.');
      }
      attempts++;
    }
  }

  // Paso 2: Publicar el contenedor
  const publishParams = new URLSearchParams({
    creation_id: creationId,
    access_token: pageAccessToken
  });

  const pubRes = await fetch(`${GRAPH_BASE_URL}/${instagramAccountId}/media_publish`, {
    method: 'POST',
    body: publishParams
  });
  const pubData = await pubRes.json();

  if (pubData.error) {
    throw new Error(`Instagram Publish Error: ${pubData.error.message}`);
  }

  return { success: true, storyId: pubData.id, platform: 'instagram' };
}

/**
 * Publicar una Historia en la Página de Facebook
 * Flujo oficial:
 * Foto:
 * 1. POST /{page-id}/photos?url=...&published=false
 * 2. POST /{page-id}/photo_stories?photo_id=...
 */
export async function publishFacebookStory({ facebookPageId, pageAccessToken, mediaUrl, mediaType = 'image' }) {
  if (!facebookPageId || !pageAccessToken || !mediaUrl) {
    throw new Error('Faltan parámetros obligatorios para publicar en Facebook.');
  }

  if (mediaType === 'image') {
    // Paso 1: Subir foto sin publicar en feed
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

    if (photoData.error) {
      throw new Error(`Facebook Photo Upload Error: ${photoData.error.message}`);
    }

    const photoId = photoData.id;

    // Paso 2: Crear la historia de foto
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
      throw new Error(`Facebook Story Publish Error: ${storyData.error.message}`);
    }

    return { success: true, storyId: storyData.post_id || photoId, platform: 'facebook' };
  } else {
    // Video en Facebook Page Stories
    throw new Error('La publicación directa de video en Facebook Stories requiere sesión de subida resumible en backend.');
  }
}
