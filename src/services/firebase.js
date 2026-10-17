// Configuración y servicios de Firebase con soporte offline / fallback local
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, getDoc, doc, setDoc, deleteDoc, updateDoc, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { uploadToCloudinary } from './cloudinary';


const LOCAL_STORAGE_KEY_CONFIG = 'pizzeria_firebase_config';
const LOCAL_STORAGE_KEY_STORIES = 'pizzeria_stories_local';
const LOCAL_STORAGE_KEY_SETTINGS = 'pizzeria_settings_local';
const LOCAL_STORAGE_KEY_LOGS = 'pizzeria_logs_local';

// Historias iniciales vacías (sin ejemplos ficticios)
const DEFAULT_SAMPLE_STORIES = [];

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
    return [];
  }
  try {
    const list = JSON.parse(localData);
    return Array.isArray(list) ? list.filter(s => !s.id?.startsWith('sample-')) : [];
  } catch {
    return [];
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

// Logs de publicación sincronizados con Firestore
export function getPublicationLogs() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function fetchPublicationLogs() {
  const local = getPublicationLogs();
  const { initialized } = initFirebase();
  if (initialized && db) {
    try {
      const q = query(collection(db, 'history'), orderBy('timestamp', 'desc'), limit(50));
      const snap = await getDocs(q);
      const remoteLogs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (remoteLogs.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_KEY_LOGS, JSON.stringify(remoteLogs));
        return remoteLogs;
      }
    } catch (err) {
      console.warn('Error al cargar historial desde Firestore:', err);
    }
  }
  return local;
}

export async function addPublicationLog(logEntry) {
  const current = getPublicationLogs();
  const newEntry = { id: 'log_' + Date.now(), timestamp: new Date().toISOString(), ...logEntry };
  const updated = [newEntry, ...current];
  localStorage.setItem(LOCAL_STORAGE_KEY_LOGS, JSON.stringify(updated.slice(0, 50)));

  const { initialized } = initFirebase();
  if (initialized && db) {
    try {
      await addDoc(collection(db, 'history'), newEntry);
    } catch (err) {
      console.warn('Error guardando log en Firestore:', err);
    }
  }

  return updated;
}

// ----------------------------------------------------------------------------
// GESTIÓN DE CARPETAS DE CONTENIDO (POOLS INTELIGENTES)
// ----------------------------------------------------------------------------
const LOCAL_STORAGE_KEY_FOLDERS = 'pizzeria_folders_local';

export function getLocalFolders() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_FOLDERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalFolders(list) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_FOLDERS, JSON.stringify(list));
  } catch (err) {
    console.error('Error guardando carpetas localmente:', err);
  }
}

export async function getFolders() {
  const localList = getLocalFolders();
  const { initialized } = initFirebase();

  if (initialized && db) {
    try {
      const q = query(collection(db, 'folders'));
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));

      if (list.length > 0) {
        saveLocalFolders(list);
        return list;
      }
    } catch (err) {
      console.warn('Error obteniendo carpetas de Firestore:', err);
    }
  }
  return localList;
}

export async function saveFolder(folderData) {
  const folders = getLocalFolders();
  const id = folderData.id || `folder_${Date.now()}`;
  const record = {
    ...folderData,
    id,
    packs: folderData.packs || [],
    items: folderData.items || [],
    usedPackIds: folderData.usedPackIds || [],
    usedItemIds: folderData.usedItemIds || [],
    updatedAt: new Date().toISOString()
  };

  const idx = folders.findIndex(f => f.id === id);
  const updated = idx >= 0 ? folders.map(f => f.id === id ? record : f) : [...folders, record];
  saveLocalFolders(updated);

  const { initialized } = initFirebase();
  if (initialized && db) {
    try {
      await setDoc(doc(db, 'folders', id), record, { merge: true });
    } catch (err) {
      console.warn('Error guardando carpeta en Firestore:', err);
    }
  }
  return record;
}

export async function deleteFolder(folderId) {
  const folders = getLocalFolders().filter(f => f.id !== folderId);
  saveLocalFolders(folders);

  const { initialized } = initFirebase();
  if (initialized && db) {
    try {
      await deleteDoc(doc(db, 'folders', folderId));
    } catch (err) {
      console.warn('Error eliminando carpeta de Firestore:', err);
    }
  }
  return folders;
}

export async function resetFolderCycle(folderId) {
  const folders = getLocalFolders();
  const target = folders.find(f => f.id === folderId);
  if (!target) return null;

  target.usedItemIds = [];
  target.usedPackIds = [];
  target.updatedAt = new Date().toISOString();
  saveLocalFolders(folders);

  const { initialized } = initFirebase();
  if (initialized && db) {
    try {
      await updateDoc(doc(db, 'folders', folderId), { usedItemIds: [], usedPackIds: [] });
    } catch (err) {
      console.warn('Error reseteando ciclo de carpeta en Firestore:', err);
    }
  }
  return target;
}

// ----------------------------------------------------------------------------
// CATEGORÍAS PERSONALIZADAS POR EL NEGOCIO
// ----------------------------------------------------------------------------
const LOCAL_STORAGE_KEY_CATEGORIES = 'pizzeria_categories_local';

const DEFAULT_CATEGORIES = [
  { id: 'pizzas', name: 'Pizzas' },
  { id: 'hamburguesas', name: 'Hamburguesas' },
  { id: 'empanadas', name: 'Empanadas' },
  { id: 'lomitos', name: 'Lomitos' },
  { id: 'promos', name: 'Promos / Combos' },
  { id: 'bebidas', name: 'Bebidas / Postres' }
];

export function getLocalCategories() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_CATEGORIES);
    return raw ? JSON.parse(raw) : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function saveLocalCategories(list) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIES, JSON.stringify(list));
  } catch (err) {
    console.error('Error guardando categorías localmente:', err);
  }
}

export async function getCategories() {
  const local = getLocalCategories();
  const { initialized } = initFirebase();
  if (initialized && db) {
    try {
      const snap = await getDocs(collection(db, 'categories'));
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      if (list.length > 0) {
        saveLocalCategories(list);
        return list;
      }
    } catch (err) {
      console.warn('Error cargando categorías de Firestore:', err);
    }
  }
  return local;
}

export async function saveCategory(categoryData) {
  const list = getLocalCategories();
  const id = categoryData.id || `cat_${Date.now()}`;
  const record = { ...categoryData, id };
  const idx = list.findIndex(c => c.id === id);
  const updated = idx >= 0 ? list.map(c => c.id === id ? record : c) : [...list, record];
  saveLocalCategories(updated);

  const { initialized } = initFirebase();
  if (initialized && db) {
    try {
      await setDoc(doc(db, 'categories', id), record, { merge: true });
    } catch (err) {
      console.warn('Error guardando categoría en Firestore:', err);
    }
  }
  return record;
}

export async function deleteCategory(id) {
  const list = getLocalCategories().filter(c => c.id !== id);
  saveLocalCategories(list);
  const { initialized } = initFirebase();
  if (initialized && db) {
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (err) {
      console.warn('Error eliminando categoría en Firestore:', err);
    }
  }
  return list;
}
