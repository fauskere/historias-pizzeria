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
  getMetaSettings,
  fetchMetaSettings,
  addPublicationLog
} from './services/firebase';
import { publishInstagramStory, publishFacebookStory } from './services/metaApi';

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

      const meta = await fetchMetaSettings();
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

  // Reloj de automatización: evalúa cada 25 segundos si coincide día y hora para publicar solo
  useEffect(() => {
    const DAYS_ORDER = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

    const checkScheduledStories = async () => {
      if (!stories || stories.length === 0) return;

      const now = new Date();
      const currentDay = DAYS_ORDER[now.getDay()];
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;
      const todayDateStr = now.toISOString().slice(0, 10);

      const meta = getMetaSettings();
      if (!meta.pageAccessToken) return;

      for (const story of stories) {
        if (!story.active) continue;
        if (!story.days || !story.days.includes(currentDay)) continue;
        if (story.time !== currentTime) continue;
        if (story.lastAutoPublishDate === todayDateStr) continue;

        console.log(`[AutoScheduler] Disparando historia programada: "${story.title}" a las ${currentTime}`);
        story.lastAutoPublishDate = todayDateStr;
        await saveStory(story);

        const results = [];
        let overallSuccess = true;

        if (story.platforms?.instagram && meta.instagramAccountId) {
          try {
            const igRes = await publishInstagramStory({
              instagramAccountId: meta.instagramAccountId,
              pageAccessToken: meta.pageAccessToken,
              mediaUrl: story.mediaUrl,
              mediaType: story.mediaType
            });
            results.push({ platform: 'instagram', success: true, storyId: igRes.storyId });
          } catch (err) {
            results.push({ platform: 'instagram', success: false, message: err.message });
            overallSuccess = false;
          }
        }

        if (story.platforms?.facebook && meta.facebookPageId) {
          try {
            const fbRes = await publishFacebookStory({
              facebookPageId: meta.facebookPageId,
              pageAccessToken: meta.pageAccessToken,
              mediaUrl: story.mediaUrl,
              mediaType: story.mediaType
            });
            results.push({ platform: 'facebook', success: true, storyId: fbRes.storyId });
          } catch (err) {
            results.push({ platform: 'facebook', success: false, message: err.message });
            overallSuccess = false;
          }
        }

        addPublicationLog({
          storyTitle: `${story.title} (Automático)`,
          storyId: story.id,
          mediaType: story.mediaType,
          success: overallSuccess,
          details: results
        });
      }
    };

    const intervalId = setInterval(checkScheduledStories, 25000);
    return () => clearInterval(intervalId);
  }, [stories]);

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
    await saveStory(newStory);
    const updatedList = await getStories();
    setStories(updatedList);
    // Redirigir automáticamente para que el usuario vea su historia creada
    if (!newStory.days || newStory.days.length === 0) {
      setActiveTab('library');
    } else {
      setActiveTab('calendar');
    }
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
