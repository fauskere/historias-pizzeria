import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import WeeklyCalendar from './components/WeeklyCalendar';
import FolderManager from './components/FolderManager';
import StoryCreator from './components/StoryCreator';
import StoryLibrary from './components/StoryLibrary';
import SettingsPanel from './components/SettingsPanel';
import PublicationLogs from './components/PublicationLogs';
import StoryPreviewModal from './components/StoryPreviewModal';
import EditStoryModal from './components/EditStoryModal';
import { 
  getStories, 
  saveStory, 
  toggleStoryActive, 
  deleteStory, 
  initFirebase, 
  fetchMetaSettings,
  addPublicationLog,
  getFolders,
  saveFolder,
  deleteFolder,
  resetFolderCycle,
  getCategories,
  saveCategory,
  deleteCategory
} from './services/firebase';

export default function App() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [stories, setStories] = useState([]);
  const [folders, setFolders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewStory, setPreviewStory] = useState(null);
  const [editingStory, setEditingStory] = useState(null);
  const [creatorInitialDay, setCreatorInitialDay] = useState(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [restaurantName, setRestaurantName] = useState('Pizzería María Belén');

  // Cargar historias, carpetas y categorías al iniciar
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const fbStatus = initFirebase();
      setIsFirebaseConnected(fbStatus.initialized);

      const meta = await fetchMetaSettings();
      if (meta.restaurantName) {
        setRestaurantName(meta.restaurantName);
      }

      const [list, fList, catList] = await Promise.all([
        getStories(),
        getFolders(),
        getCategories()
      ]);
      setStories(list);
      setFolders(fList);
      setCategories(catList);
    } catch (err) {
      console.error('Error cargando historias, carpetas y categorías iniciales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Alternar estado activo / pausado
  const handleToggleActive = async (id, newStatus) => {
    const updated = await toggleStoryActive(id, newStatus);
    setStories(updated);
    if (previewStory && previewStory.id === id) {
      setPreviewStory({ ...previewStory, active: newStatus });
    }
  };

  // Eliminar historia
  const handleDeleteStory = async (id) => {
    if (window.confirm('¿Estás seguro de que querés eliminar esta historia de tu programación?')) {
      const updated = await deleteStory(id);
      setStories(updated);
      if (previewStory && previewStory.id === id) {
        setPreviewStory(null);
      }
      if (editingStory && editingStory.id === id) {
        setEditingStory(null);
      }
    }
  };

  // Guardar nueva historia
  const handleStoryCreated = async (newStory) => {
    await saveStory(newStory);
    const updatedList = await getStories();
    setStories(updatedList);
    if (!newStory.days || newStory.days.length === 0) {
      setActiveTab('library');
    } else {
      setActiveTab('calendar');
    }
  };

  // Abrir editor para una historia existente
  const handleEditStory = (story) => {
    setEditingStory(story);
  };

  // Guardar cambios de una historia editada (se propaga a todos los días)
  const handleStoryUpdated = async (updatedStory) => {
    await saveStory(updatedStory);
    const updatedList = await getStories();
    setStories(updatedList);
    setEditingStory(null);
    if (previewStory && previewStory.id === updatedStory.id) {
      setPreviewStory(updatedStory);
    }
  };

  // Atajo desde el calendario: agregar historia con día pre-elegido
  const handleAddNewForDay = (dayKey) => {
    setCreatorInitialDay(dayKey);
    setActiveTab('creator');
  };

  // Handlers para carpetas de contenido inteligente
  const handleSaveFolder = async (folderData) => {
    await saveFolder(folderData);
    const updated = await getFolders();
    setFolders(updated);
  };

  const handleDeleteFolder = async (folderId) => {
    await deleteFolder(folderId);
    const updated = await getFolders();
    setFolders(updated);
  };

  const handleResetFolderCycle = async (folderId) => {
    await resetFolderCycle(folderId);
    const updated = await getFolders();
    setFolders(updated);
  };

  // Handlers para categorías personalizadas
  const handleSaveCategory = async (catData) => {
    await saveCategory(catData);
    const updated = await getCategories();
    setCategories(updated);
  };

  const handleDeleteCategory = async (catId) => {
    await deleteCategory(catId);
    const updated = await getCategories();
    setCategories(updated);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col font-sans selection:bg-[#FFD700] selection:text-black">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab !== 'creator') setCreatorInitialDay(null);
          setActiveTab(tab);
        }}
        isFirebaseConnected={isFirebaseConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
            <div className="w-10 h-10 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs sm:text-sm text-[#AAAAAA] font-bold">Cargando historias de Pizzería María Belén...</p>
          </div>
        ) : (
          <>
            {activeTab === 'calendar' && (
              <WeeklyCalendar
                stories={stories}
                folders={folders}
                categories={categories}
                onStoryCreated={handleStoryCreated}
                onToggleActive={handleToggleActive}
                onDeleteStory={handleDeleteStory}
                onPreviewStory={setPreviewStory}
                onEditStory={handleEditStory}
                onAddNewForDay={handleAddNewForDay}
              />
            )}

            {activeTab === 'folders' && (
              <FolderManager
                folders={folders}
                categories={categories}
                onSave={handleSaveFolder}
                onDelete={handleDeleteFolder}
                onResetCycle={handleResetFolderCycle}
                onSaveCategory={handleSaveCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            )}

            {activeTab === 'creator' && (
              <StoryCreator
                onStoryCreated={handleStoryCreated}
                initialDay={creatorInitialDay}
                restaurantName={restaurantName}
                folders={folders}
                categories={categories}
              />
            )}

            {activeTab === 'library' && (
              <StoryLibrary
                stories={stories}
                onToggleActive={handleToggleActive}
                onDeleteStory={handleDeleteStory}
                onPreviewStory={setPreviewStory}
                onEditStory={handleEditStory}
                onGoToCreator={() => setActiveTab('creator')}
              />
            )}

            {activeTab === 'logs' && (
              <PublicationLogs stories={stories} />
            )}

            {activeTab === 'settings' && (
              <SettingsPanel
                onFirebaseUpdated={loadInitialData}
                isFirebaseConnected={isFirebaseConnected}
              />
            )}
          </>
        )}
      </main>

      {/* Footer Oficial */}
      <footer className="border-t border-[rgba(255,255,255,0.06)] bg-[#121212] py-6 text-center text-xs text-[#888888]">
        <p>Programador de Contenido • Pizzería María Belén • Automatización oficial con Meta Graph API</p>
      </footer>

      {/* Modal de Vista Previa en Celular */}
      {previewStory && (
        <StoryPreviewModal
          story={previewStory}
          onClose={() => setPreviewStory(null)}
          onToggleActive={handleToggleActive}
          onEditStory={handleEditStory}
          restaurantName={restaurantName}
        />
      )}

      {/* Modal Modular de Edición de Historia */}
      {editingStory && (
        <EditStoryModal
          story={editingStory}
          onClose={() => setEditingStory(null)}
          onSave={handleStoryUpdated}
          folders={folders}
          categories={categories}
        />
      )}
    </div>
  );
}
