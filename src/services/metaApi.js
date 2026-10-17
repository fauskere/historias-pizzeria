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
      const isExpired = meData.error.message?.toLowerCase().includes('expired') || meData.error.code === 190;
      return {
        success: false,
        errorType: isExpired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
        message: isExpired
          ? 'El Token de Meta ha EXPIRADO. Necesitás generar un nuevo Token Permanente (con vencimiento "Nunca").'
          : `Error de Meta: ${meData.error.message}`,
        details: meData.error
      };
    }

    // 1.1 Intentar diagnosticar vigencia del token vía /debug_token
    let tokenDebug = null;
    try {
      const debugRes = await fetch(
        `${GRAPH_BASE_URL}/debug_token?input_token=${encodeURIComponent(pageAccessToken)}&access_token=${encodeURIComponent(pageAccessToken)}`
      );
      const debugData = await debugRes.json();
      if (debugData.data) {
        const d = debugData.data;
        const isPermanent = d.expires_at === 0;
        let expiresAtText = 'Nunca (Permanente)';
        let hoursRemaining = null;
        if (!isPermanent && d.expires_at > 0) {
          const expDate = new Date(d.expires_at * 1000);
          expiresAtText = expDate.toLocaleString('es-AR');
          hoursRemaining = Math.max(0, Math.round((d.expires_at * 1000 - Date.now()) / (1000 * 60 * 60)));
        }
        tokenDebug = {
          isValid: d.is_valid,
          isPermanent,
          type: d.type,
          expiresAtText,
          hoursRemaining,
          scopes: d.scopes || []
        };
      }
    } catch {
      // Ignorar si el endpoint debug_token no responde con este token
    }

    // 2. Intentar descubrir páginas administradas mediante /me/accounts
    let pageInfo = { id: meData.id, name: meData.name };
    let discoveredPageId = facebookPageId || null;
    let discoveredIgId = instagramAccountId || null;
    let igInfo = null;

    try {
      const accountsRes = await fetch(
        `${GRAPH_BASE_URL}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name}&access_token=${encodeURIComponent(pageAccessToken)}`
      );
      const accountsData = await accountsRes.json();
      if (accountsData.data && accountsData.data.length > 0) {
        // Tomar la primera página o la que coincida con el facebookPageId
        const targetPage = facebookPageId 
          ? accountsData.data.find(p => p.id === facebookPageId) || accountsData.data[0]
          : accountsData.data[0];

        pageInfo = targetPage;
        discoveredPageId = targetPage.id;
        if (targetPage.instagram_business_account) {
          discoveredIgId = targetPage.instagram_business_account.id;
          igInfo = targetPage.instagram_business_account;
        }
      }
    } catch {
      // Ignorar si no es token de usuario con permisos de accounts
    }

    // 3. Si se proporcionó o descubrió un Facebook Page ID, verificar directamente
    if (discoveredPageId && (!pageInfo.instagram_business_account || !discoveredIgId)) {
      try {
        const pageRes = await fetch(
          `${GRAPH_BASE_URL}/${discoveredPageId}?fields=id,name,link,instagram_business_account{id,username,name}&access_token=${encodeURIComponent(pageAccessToken)}`
        );
        const pageData = await pageRes.json();
        if (!pageData.error) {
          pageInfo = pageData;
          if (pageData.instagram_business_account) {
            discoveredIgId = pageData.instagram_business_account.id;
            igInfo = pageData.instagram_business_account;
          }
        }
      } catch {
        // Continuar
      }
    }

    // 4. Si tenemos un ID de Instagram pero aún no tenemos sus datos detallados
    if (discoveredIgId && !igInfo?.username) {
      try {
        const igRes = await fetch(
          `${GRAPH_BASE_URL}/${discoveredIgId}?fields=id,username,name,profile_picture_url&access_token=${encodeURIComponent(pageAccessToken)}`
        );
        const igData = await igRes.json();
        if (!igData.error) {
          igInfo = igData;
        }
      } catch {
        // Continuar
      }
    }

    return {
      success: true,
      message: 'Conexión exitosa con Meta Graph API',
      page: pageInfo,
      instagram: igInfo,
      detectedFacebookPageId: discoveredPageId,
      detectedInstagramId: discoveredIgId,
      tokenDebug
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

  // Meta procesa tanto imágenes como videos de forma asíncrona descargando el archivo desde Cloudinary.
  // Es obligatorio esperar a que el contenedor esté en estado 'FINISHED' antes de llamar a media_publish.
  let finished = false;
  let attempts = 0;
  const maxAttempts = mediaType === 'video' ? 20 : 10;
  const delayMs = 2500;

  while (!finished && attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, delayMs));
    attempts++;
    try {
      const statusRes = await fetch(`${GRAPH_BASE_URL}/${creationId}?fields=status_code&access_token=${encodeURIComponent(pageAccessToken)}`);
      const statusData = await statusRes.json();
      console.log(`Estado del contenedor Instagram (${attempts}/${maxAttempts}):`, statusData);

      if (statusData.status_code === 'FINISHED') {
        finished = true;
      } else if (statusData.status_code === 'ERROR') {
        throw new Error('Meta no pudo procesar la historia en sus servidores.');
      } else if (statusData.status_code === 'EXPIRED') {
        throw new Error('El contenedor de la historia expiró.');
      }
    } catch (err) {
      if (err.message.includes('Meta no pudo') || err.message.includes('expiró')) throw err;
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
    // Paso 1: Subir foto temporal sin publicar en feed
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
      console.error('Facebook Photo Upload Error:', photoData.error);
      throw new Error(photoData.error.message);
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
      console.error('Facebook Story Publish Error:', storyData.error);
      throw new Error(storyData.error.message);
    }

    return { success: true, storyId: storyData.post_id || photoId, platform: 'facebook' };
  } else {
    // Video en Facebook Page Stories
    throw new Error('La publicación directa de video en Facebook Stories requiere sesión de subida resumible en backend.');
  }
}
