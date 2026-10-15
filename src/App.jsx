import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import WeeklyCalendar from './components/WeeklyCalendar';
import StoryCreator from './components/StoryCreator';
import StoryLibrary from './components/StoryLibrary';
import SettingsPanel from './components/SettingsPanel';
import PublicationLogs from './components/PublicationLogs';
import StoryPreviewModal from './components/StoryPreviewModal';
import { 
  getStories, 
  saveStory, 
  toggleStoryActive, 
  deleteStory, 
  initFirebase, 
  getMetaSettings 
} from './services/firebase';

export default function App() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewStory, setPreviewStory] = useState(null);
  const [creatorInitialDay, setCreatorInitialDay] = useState(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [restaurantName, setRestaurantName] = useState('Mi Pizzería');

  // Cargar historias y verificar estado de Firebase al iniciar
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const fbStatus = initFirebase();
      setIsFirebaseConnected(fbStatus.initialized);

      const meta = getMetaSettings();
      if (meta.restaurantName) {
        setRestaurantName(meta.restaurantName);
      }

      const list = await getStories();
      setStories(list);
    } catch (err) {
      console.error('Error cargando historias iniciales:', err);
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
    if (window.confirm('¿Estás seguro de que querés eliminar esta programación?')) {
      const updated = await deleteStory(id);
      setStories(updated);
      if (previewStory && previewStory.id === id) {
        setPreviewStory(null);
      }
    }
  };

  // Guardar nueva historia
  const handleStoryCreated = async (newStory) => {
    const saved = await saveStory(newStory);
    const updatedList = await getStories();
    setStories(updatedList);
  };

  // Atajo desde el calendario: agregar historia con día pre-elegido
  const handleAddNewForDay = (dayKey) => {
    setCreatorInitialDay(dayKey);
    setActiveTab('creator');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
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
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Cargando historias de la pizzería...</p>
          </div>
        ) : (
          <>
            {activeTab === 'calendar' && (
              <WeeklyCalendar
                stories={stories}
                onToggleActive={handleToggleActive}
                onDeleteStory={handleDeleteStory}
                onPreviewStory={setPreviewStory}
                onAddNewForDay={handleAddNewForDay}
              />
            )}

            {activeTab === 'creator' && (
              <StoryCreator
                onStoryCreated={handleStoryCreated}
                initialDay={creatorInitialDay}
                restaurantName={restaurantName}
              />
            )}

            {activeTab === 'library' && (
              <StoryLibrary
                stories={stories}
                onToggleActive={handleToggleActive}
                onDeleteStory={handleDeleteStory}
                onPreviewStory={setPreviewStory}
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

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <p>PizzaStory Studio • Sistema de automatización de historias de Instagram & Facebook mediante Meta Graph API oficial</p>
      </footer>

      {/* Modal de Vista Previa */}
      {previewStory && (
        <StoryPreviewModal
          story={previewStory}
          onClose={() => setPreviewStory(null)}
          onToggleActive={handleToggleActive}
          restaurantName={restaurantName}
        />
      )}
    </div>
  );
}
