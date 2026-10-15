// Servicio para subir imágenes y videos a Cloudinary (100% gratuito, sin tarjeta)

const LOCAL_STORAGE_KEY_CLOUDINARY = 'pizzeria_cloudinary_config';

export const DEFAULT_CLOUDINARY_CONFIG = {
  cloudName: 'i36jii1k',
  uploadPreset: 'idkidk'
};


export function getCloudinaryConfig() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_CLOUDINARY);
    return raw ? JSON.parse(raw) : DEFAULT_CLOUDINARY_CONFIG;
  } catch {
    return DEFAULT_CLOUDINARY_CONFIG;
  }
}

export function saveCloudinaryConfig(config) {
  localStorage.setItem(LOCAL_STORAGE_KEY_CLOUDINARY, JSON.stringify(config));
}

/**
 * Sube una imagen o video a Cloudinary mediante un Upload Preset Unsigned.
 * Retorna la URL pública HTTPS segura lista para la API oficial de Meta.
 */
export async function uploadToCloudinary(file, onProgress) {
  const config = getCloudinaryConfig();
  const cloudName = config.cloudName || 'i36jii1k';
  const uploadPreset = config.uploadPreset || 'ml_default';

  const isVideo = file.type.startsWith('video/');
  const resourceType = isVideo ? 'video' : 'image';
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint);

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
          resolve({
            url: response.secure_url,
            type: isVideo ? 'video' : 'image',
            name: file.name
          });
        } catch {
          reject(new Error('Respuesta inválida de Cloudinary'));
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          const msg = errData.error?.message || 'Error al subir a Cloudinary';
          reject(new Error(msg));
        } catch {
          reject(new Error(`Error ${xhr.status} al subir a Cloudinary`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Error de red al conectar con Cloudinary.'));
    };

    xhr.send(formData);
  });
}
