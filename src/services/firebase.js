// Configuración y servicios de Firebase con soporte offline / fallback local
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const LOCAL_STORAGE_KEY_CONFIG = 'pizzeria_firebase_config';
const LOCAL_STORAGE_KEY_STORIES = 'pizzeria_stories_local';
const LOCAL_STORAGE_KEY_SETTINGS = 'pizzeria_settings_local';
const LOCAL_STORAGE_KEY_LOGS = 'pizzeria_logs_local';

// Historias de ejemplo iniciales para que la pizzería vea el sistema funcionando de inmediato
const DEFAULT_SAMPLE_STORIES = [
  {
    id: 'sample-1',
    title: 'Promo 2x1 Muzza Martes',
    category: 'promo',
    categoryLabel: 'Promoción',
    color: '#f97316',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    days: ['martes'],
    time: '19:30',
    repeatWeekly: true,
    active: true,
    platforms: { instagram: true, facebook: true },
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-2',
    title: 'Carta Completa y Precios',
    category: 'menu',
    categoryLabel: 'Carta / Menú',
    color: '#3b82f6',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80',
    days: ['viernes', 'sabado', 'domingo'],
    time: '12:00',
    repeatWeekly: true,
    active: true,
    platforms: { instagram: true, facebook: true },
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-3',
    title: 'Horarios de Atención del Finde',
    category: 'hours',
    categoryLabel: 'Horarios',
    color: '#10b981',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800&auto=format&fit=crop&q=80',
    days: ['viernes', 'sabado'],
    time: '18:00',
    repeatWeekly: true,
    active: true,
    platforms: { instagram: true, facebook: true },
    createdAt: new Date().toISOString()
  }
];

// Obtener configuración guardada de Firebase
export function getSavedFirebaseConfig() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_CONFIG);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Guardar configuración de Firebase
export function saveFirebaseConfig(config) {
  localStorage.setItem(LOCAL_STORAGE_KEY_CONFIG, JSON.stringify(config));
}

// Inicializar cliente Firebase (si hay configuración válida)
let app = null;
let db = null;
let storage = null;

export function initFirebase() {
  const config = getSavedFirebaseConfig();
  if (config && config.apiKey && config.projectId) {
    try {
      app = getApps().length === 0 ? initializeApp(config) : getApp();
      db = getFirestore(app);
      storage = getStorage(app);
      return { initialized: true, db, storage };
    } catch (err) {
      console.warn('Error inicializando Firebase:', err);
      return { initialized: false, error: err.message };
    }
  }
  return { initialized: false };
}

// Obtener todas las historias
export async function getStories() {
  const { initialized } = initFirebase();
  if (initialized && db) {
    try {
      const q = query(collection(db, 'stories'));
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
      return list;
    } catch (err) {
      console.warn('Error leyendo Firestore, usando almacenamiento local:', err);
    }
  }

  // Fallback LocalStorage
  const localData = localStorage.getItem(LOCAL_STORAGE_KEY_STORIES);
  if (!localData) {
    localStorage.setItem(LOCAL_STORAGE_KEY_STORIES, JSON.stringify(DEFAULT_SAMPLE_STORIES));
    return DEFAULT_SAMPLE_STORIES;
  }
  try {
    return JSON.parse(localData);
  } catch {
    return DEFAULT_SAMPLE_STORIES;
  }
}

// Guardar o actualizar una historia
export async function saveStory(story) {
  const id = story.id || 'story_' + Date.now();
  const storyData = {
    ...story,
    id,
    updatedAt: new Date().toISOString()
  };

  const { initialized } = initFirebase();
  if (initialized && db) {
    try {
      await setDoc(doc(db, 'stories', id), storyData);
    } catch (err) {
      console.warn('Error guardando en Firestore:', err);
    }
  }

  // Guardar siempre también en local para sincronización y persistencia offline
  const currentStories = await getStories();
  const existingIdx = currentStories.findIndex(s => s.id === id);
  let updatedList;
  if (existingIdx >= 0) {
    updatedList = [...currentStories];
    updatedList[existingIdx] = storyData;
  } else {
    updatedList = [storyData, ...currentStories];
  }
  localStorage.setItem(LOCAL_STORAGE_KEY_STORIES, JSON.stringify(updatedList));
  return storyData;
}

// Alternar estado activo / pausado
export async function toggleStoryActive(id, newStatus) {
  const { initialized } = initFirebase();
  if (initialized && db) {
    try {
      await updateDoc(doc(db, 'stories', id), { active: newStatus });
    } catch (err) {
      console.warn('Error actualizando estado en Firestore:', err);
    }
  }

  const stories = await getStories();
  const updated = stories.map(s => (s.id === id ? { ...s, active: newStatus } : s));
  localStorage.setItem(LOCAL_STORAGE_KEY_STORIES, JSON.stringify(updated));
  return updated;
}

// Eliminar historia
export async function deleteStory(id) {
  const { initialized } = initFirebase();
  if (initialized && db) {
    try {
      await deleteDoc(doc(db, 'stories', id));
    } catch (err) {
      console.warn('Error eliminando de Firestore:', err);
    }
  }

  const stories = await getStories();
  const filtered = stories.filter(s => s.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY_STORIES, JSON.stringify(filtered));
  return filtered;
}

// Subir archivo multimedia (imagen o video)
export async function uploadStoryMedia(file, onProgress) {
  const { initialized } = initFirebase();

  // Si Firebase Storage está activo, subir directamente a la nube
  if (initialized && storage) {
    const filename = `stories/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const storageRef = ref(storage, filename);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        snapshot => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        error => reject(error),
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url: downloadUrl,
            type: file.type.startsWith('video/') ? 'video' : 'image',
            name: file.name
          });
        }
      );
    });
  }

  // Fallback local: URL de objeto o Base64
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (onProgress) onProgress(100);
      resolve({
        url: reader.result,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        name: file.name,
        isLocalPreview: true
      });
    };
    reader.readAsDataURL(file);
  });
}

// Ajustes de Meta (Tokens e IDs)
export function getMetaSettings() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_SETTINGS);
    return raw ? JSON.parse(raw) : {
      pageAccessToken: '',
      facebookPageId: '',
      instagramAccountId: '',
      restaurantName: 'Mi Pizzería',
      timezone: 'America/Argentina/Buenos_Aires'
    };
  } catch {
    return {
      pageAccessToken: '',
      facebookPageId: '',
      instagramAccountId: '',
      restaurantName: 'Mi Pizzería',
      timezone: 'America/Argentina/Buenos_Aires'
    };
  }
}

export function saveMetaSettings(settings) {
  localStorage.setItem(LOCAL_STORAGE_KEY_SETTINGS, JSON.stringify(settings));
}

// Logs de publicación
export function getPublicationLogs() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addPublicationLog(logEntry) {
  const current = getPublicationLogs();
  const updated = [{ id: 'log_' + Date.now(), timestamp: new Date().toISOString(), ...logEntry }, ...current];
  localStorage.setItem(LOCAL_STORAGE_KEY_LOGS, JSON.stringify(updated.slice(0, 50)));
  return updated;
}
