// Configuración y servicios de Firebase con soporte offline / fallback local
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, getDoc, doc, setDoc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { uploadToCloudinary } from './cloudinary';


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

// Configuración oficial del proyecto Firebase "Programador de Contenido"
export const DEFAULT_FIREBASE_CONFIG = {
  projectId: "programador-de-contenido",
  appId: "1:1039821666755:web:a2ae4a06a71f9be3936576",
  storageBucket: "programador-de-contenido.firebasestorage.app",
  apiKey: "AIzaSyChzp3xjt4R0H3xgo2wnqpJ2J5fq8FBZ_4",
  authDomain: "programador-de-contenido.firebaseapp.com",
  messagingSenderId: "1039821666755",
  measurementId: "G-MMVQ38ML1D"
};

// Obtener configuración de Firebase
export function getSavedFirebaseConfig() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_CONFIG);
    return raw ? JSON.parse(raw) : DEFAULT_FIREBASE_CONFIG;
  } catch {
    return DEFAULT_FIREBASE_CONFIG;
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

function getLocalStories() {
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

function saveLocalStories(list) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_STORIES, JSON.stringify(list));
  } catch (err) {
    console.error('Error guardando en localStorage:', err);
  }
}

// Obtener todas las historias (con persistencia local prioritaria y sincronización Firestore)
export async function getStories() {
  const localList = getLocalStories();
  const { initialized } = initFirebase();

  if (initialized && db) {
    try {
      const q = query(collection(db, 'stories'));
      const snapshot = await Promise.race([
        getDocs(q),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 3000))
      ]);
      const firestoreList = [];
      snapshot.forEach(docSnap => firestoreList.push({ id: docSnap.id, ...docSnap.data() }));

      if (firestoreList.length > 0) {
        // Fusionar preservando tanto historias locales como remotas
        const map = new Map();
        localList.forEach(s => map.set(s.id, s));
        firestoreList.forEach(s => map.set(s.id, { ...(map.get(s.id) || {}), ...s }));
        const merged = Array.from(map.values());
        saveLocalStories(merged);
        return merged;
      }
    } catch (err) {
      console.warn('Lectura Firestore diferida o en timeout, usando almacenamiento local:', err);
    }
  }

  return localList;
}

// Guardar o actualizar una historia
export async function saveStory(story) {
  const id = story.id || 'story_' + Date.now();
  const storyData = {
    ...story,
    id,
    updatedAt: new Date().toISOString()
  };

  // 1. Guardar de forma INMEDIATA en local para que nunca se pierda
  const currentStories = getLocalStories();
  const existingIdx = currentStories.findIndex(s => s.id === id);
  let updatedList;
  if (existingIdx >= 0) {
    updatedList = [...currentStories];
    updatedList[existingIdx] = storyData;
  } else {
    updatedList = [storyData, ...currentStories];
  }
  saveLocalStories(updatedList);

  // 2. Sincronizar en Firestore en paralelo
  const { initialized } = initFirebase();
  if (initialized && db) {
    try {
      await Promise.race([
        setDoc(doc(db, 'stories', id), storyData),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 3000))
      ]);
    } catch (err) {
      console.warn('Aviso al guardar en Firestore (permanece seguro en local):', err);
    }
  }

  return storyData;
}

// Alternar estado activo / pausado
export async function toggleStoryActive(id, newStatus) {
  const currentStories = getLocalStories();
  const updated = currentStories.map(s => (s.id === id ? { ...s, active: newStatus } : s));
  saveLocalStories(updated);

  const { initialized } = initFirebase();
  if (initialized && db) {
    try {
      await updateDoc(doc(db, 'stories', id), { active: newStatus });
    } catch (err) {
      console.warn('Error actualizando estado en Firestore:', err);
    }
  }

  return updated;
}

// Eliminar historia
export async function deleteStory(id) {
  const currentStories = getLocalStories();
  const filtered = currentStories.filter(s => s.id !== id);
  saveLocalStories(filtered);

  const { initialized } = initFirebase();
  if (initialized && db) {
    try {
      await deleteDoc(doc(db, 'stories', id));
    } catch (err) {
      console.warn('Error eliminando de Firestore:', err);
    }
  }

  return filtered;
}

// Subir archivo multimedia (imagen o video)
export async function uploadStoryMedia(file, onProgress) {
  // Usar Cloudinary (100% gratuito, sin tarjeta de crédito)
  return await uploadToCloudinary(file, onProgress);
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

export async function saveMetaSettings(settings) {
  localStorage.setItem(LOCAL_STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  const { initialized } = initFirebase();
  if (initialized && db) {
    try {
      await setDoc(doc(db, 'settings', 'meta'), settings);
      console.log('Credenciales sincronizadas en Firestore para el robot de GitHub');
    } catch (err) {
      console.warn('Error sincronizando settings en Firestore:', err);
    }
  }
}

export async function fetchMetaSettings() {
  const local = getMetaSettings();
  if (local.pageAccessToken) {
    saveMetaSettings(local); // Sincroniza en background
    return local;
  }

  const { initialized } = initFirebase();
  if (initialized && db) {
    try {
      const snap = await getDoc(doc(db, 'settings', 'meta'));
      if (snap.exists()) {
        const data = snap.data();
        localStorage.setItem(LOCAL_STORAGE_KEY_SETTINGS, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('Error fetching meta settings from firestore:', err);
    }
  }
  return local;
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
