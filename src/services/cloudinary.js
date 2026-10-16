// Servicio para subir imágenes y videos a Cloudinary (100% gratuito, sin tarjeta)

const LOCAL_STORAGE_KEY_CLOUDINARY = 'pizzeria_cloudinary_config';

export const DEFAULT_CLOUDINARY_CONFIG = {
  cloudName: 'i36jii1k',
  uploadPreset: 'idkidk'
};

export function getCloudinaryConfig() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_CLOUDINARY);
    if (!raw) return DEFAULT_CLOUDINARY_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      cloudName: parsed.cloudName || DEFAULT_CLOUDINARY_CONFIG.cloudName,
      uploadPreset: (parsed.uploadPreset && parsed.uploadPreset !== 'ml_default') ? parsed.uploadPreset : DEFAULT_CLOUDINARY_CONFIG.uploadPreset
    };
  } catch {
    return DEFAULT_CLOUDINARY_CONFIG;
  }
}

export function saveCloudinaryConfig(config) {
  localStorage.setItem(LOCAL_STORAGE_KEY_CLOUDINARY, JSON.stringify(config));
}

/**
 * Optimiza automáticamente imágenes que superen los 4MB redimensionándolas a formato historia vertical
 * (1080x1920 máx) en el navegador sin pérdida visible de calidad para cumplir con Cloudinary y Meta.
 */
export async function optimizeImageIfNeeded(file) {
  if (file.size <= 4 * 1024 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const maxW = 1080;
      const maxH = 1920;
      let width = img.width;
      let height = img.height;

      if (width > maxW || height > maxH) {
        const ratio = Math.min(maxW / width, maxH / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (blob) {
          const newName = file.name.replace(/\.[^/.]+$/, '.jpg');
          const optimizedFile = new File([blob], newName, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          console.log(`Imagen optimizada de ${(file.size / (1024*1024)).toFixed(1)}MB a ${(optimizedFile.size / (1024*1024)).toFixed(1)}MB`);
          resolve(optimizedFile);
        } else {
          resolve(file);
        }
      }, 'image/jpeg', 0.88);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

/**
 * Sube una imagen o video a Cloudinary mediante un Upload Preset Unsigned.
 * Retorna la URL pública HTTPS segura lista para la API oficial de Meta.
 */
export async function uploadToCloudinary(file, onProgress) {
  const config = getCloudinaryConfig();
  const cloudName = config.cloudName || 'i36jii1k';
  const uploadPreset = config.uploadPreset || 'idkidk';

  const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|m4v|avi|webm|mkv|3gp)$/i.test(file.name);
  const resourceType = isVideo ? 'video' : 'image';
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  // Si es imagen pesada, optimizar antes de enviar
  let fileToUpload = file;
  if (!isVideo && file.size > 4 * 1024 * 1024) {
    try {
      fileToUpload = await optimizeImageIfNeeded(file);
    } catch (e) {
      console.warn('No se pudo optimizar la imagen previa:', e);
    }
  }

  console.log(`Iniciando subida a Cloudinary (${cloudName}, preset: ${uploadPreset}, tipo: ${resourceType}, tamaño: ${(fileToUpload.size / (1024*1024)).toFixed(1)}MB)...`);

  const formData = new FormData();
  formData.append('file', fileToUpload);
  formData.append('upload_preset', uploadPreset);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint);
    xhr.timeout = 60000; // 60 segundos de timeout

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = (e.loaded / e.total) * 100;
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          console.log('Subida a Cloudinary exitosa:', response.secure_url);
          resolve({
            url: response.secure_url,
            type: isVideo ? 'video' : 'image',
            name: file.name
          });
        } catch {
          reject(new Error('Respuesta inválida de Cloudinary.'));
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          const msg = errData.error?.message || `Error ${xhr.status} de Cloudinary`;
          console.error('Error de Cloudinary:', msg);
          reject(new Error(msg));
        } catch {
          reject(new Error(`Error ${xhr.status} al subir a Cloudinary.`));
        }
      }
    };

    xhr.onerror = () => {
      console.error('Error de red en Cloudinary');
      reject(new Error('Error de red al conectar con Cloudinary. Verifica tu conexión.'));
    };

    xhr.ontimeout = () => {
      console.error('Timeout en Cloudinary');
      reject(new Error('La subida tardó demasiado. Comprueba tu conexión a internet o el tamaño del archivo.'));
    };

    xhr.send(formData);
  });
}
