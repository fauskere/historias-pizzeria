import React, { useState } from 'react';
import { 
  Film, 
  Clock, 
  Repeat, 
  Trash2, 
  Power, 
  Eye, 
  CheckCircle2, 
  PauseCircle, 
  Filter,
  Search,
  Plus,
  Send,
  Zap,
  Check,
  Pencil
} from 'lucide-react';
import { Instagram, Facebook } from './SocialIcons';
import { fetchMetaSettings, addPublicationLog } from '../services/firebase';
import { publishInstagramStory, publishFacebookStory } from '../services/metaApi';

const DAYS_MAP = {
  lunes: 'Lun',
  martes: 'Mar',
  miercoles: 'Mié',
  jueves: 'Jue',
  viernes: 'Vie',
  sabado: 'Sáb',
  domingo: 'Dom'
};

export default function StoryLibrary({ 
  stories, 
  onToggleActive, 
  onDeleteStory, 
  onPreviewStory,
  onEditStory,
  onGoToCreator 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, paused
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [publishingId, setPublishingId] = useState(null);
  const [publishFeedback, setPublishFeedback] = useState({});

  const handlePublishNow = async (story) => {
    const meta = await fetchMetaSettings();
    if (!meta.pageAccessToken) {
      alert('Debes configurar tu Page Access Token en la pestaña "Configuración" antes de publicar.');
      return;
    }

    setPublishingId(story.id);
    setPublishFeedback(prev => ({ ...prev, [story.id]: null }));

    const results = [];
    let overallSuccess = true;

    try {
      if (story.platforms?.instagram) {
        if (!meta.instagramAccountId) {
          results.push({ platform: 'instagram', success: false, message: 'Falta Instagram ID' });
          overallSuccess = false;
        } else {
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
      }

      if (story.platforms?.facebook) {
        if (!meta.facebookPageId) {
          results.push({ platform: 'facebook', success: false, message: 'Falta Facebook Page ID' });
          overallSuccess = false;
        } else {
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
      }

      addPublicationLog({
        storyTitle: story.title,
        success: overallSuccess,
        details: results.map(r => ({
          platform: r.platform,
          message: r.success ? `Publicada en vivo (ID: ${r.storyId})` : `Error: ${r.message}`
        }))
      });

      setPublishFeedback(prev => ({
        ...prev,
        [story.id]: {
          success: overallSuccess,
          message: overallSuccess
            ? '¡Publicada en vivo con éxito en Meta!'
            : 'Ocurrió un inconveniente al publicar'
        }
      }));

      setTimeout(() => {
        setPublishFeedback(prev => ({ ...prev, [story.id]: null }));
      }, 5000);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setPublishingId(null);
    }
  };

  const filtered = stories.filter(story => {
    const matchesSearch = story.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? story.active :
      !story.active;
    const matchesCategory = categoryFilter === 'all' ? true : story.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalActive = stories.filter(s => s.active).length;
  const totalPaused = stories.filter(s => !s.active).length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#1E1E1E] border border-[rgba(255,255,255,0.08)] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[rgba(255,215,0,0.15)] text-[#FFD700]">
              <Film className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Biblioteca de Historias
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#AAAAAA] mt-1.5">
            Gestioná todas las piezas cargadas, modificalas o publicalas en vivo con 1 clic.
          </p>
        </div>

        <button
          onClick={onGoToCreator}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#FFD700] hover:bg-[#E6C200] text-black font-extrabold text-xs sm:text-sm shadow-lg shadow-[rgba(255,215,0,0.25)] transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Historia</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1E1E1E] border border-[rgba(255,255,255,0.08)] rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs font-bold text-[#AAAAAA] uppercase tracking-wider">Total de Historias</p>
            <p className="text-2xl font-black text-white mt-1">{stories.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#2C2C2C] flex items-center justify-center text-[#FFD700] font-bold">
            <Film className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#1E1E1E] border border-[rgba(255,255,255,0.08)] rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs font-bold text-[#AAAAAA] uppercase tracking-wider">Activas (En rotación)</p>
            <p className="text-2xl font-black text-[#00E096] mt-1">{totalActive}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#00E096]/10 border border-[#00E096]/20 flex items-center justify-center text-[#00E096]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#1E1E1E] border border-[rgba(255,255,255,0.08)] rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs font-bold text-[#AAAAAA] uppercase tracking-wider">Pausadas</p>
            <p className="text-2xl font-black text-[#AAAAAA] mt-1">{totalPaused}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#2C2C2C] flex items-center justify-center text-[#AAAAAA]">
            <PauseCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#1E1E1E] border border-[rgba(255,255,255,0.08)] rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-md">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre de historia..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#121212] border border-[rgba(255,255,255,0.08)] text-sm text-white placeholder-[#666666] focus:outline-none focus:border-[#FFD700] transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#121212] border border-[rgba(255,255,255,0.08)] text-xs font-bold text-[#CCCCCC] focus:outline-none focus:border-[#FFD700]"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Solo Activas</option>
            <option value="paused">Solo Pausadas</option>
          </select>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#121212] border border-[rgba(255,255,255,0.08)] text-xs font-bold text-[#CCCCCC] focus:outline-none focus:border-[#FFD700]"
          >
            <option value="all">Todas las categorías</option>
            <option value="promo">Promociones</option>
            <option value="menu">Carta / Menú</option>
            <option value="hours">Horarios</option>
            <option value="news">Novedades</option>
          </select>
        </div>
      </div>

      {/* Stories Grid */}
      {filtered.length === 0 ? (
        <div className="bg-[#1E1E1E] border border-[rgba(255,255,255,0.08)] rounded-3xl p-12 text-center space-y-3">
          <p className="text-[#AAAAAA] text-sm">No se encontraron historias con los filtros aplicados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(story => (
            <div
              key={story.id}
              className={`bg-[#1E1E1E] border rounded-3xl p-5 transition-all flex flex-col justify-between shadow-lg ${
                story.active
                  ? 'border-[rgba(255,255,255,0.08)] hover:border-[#FFD700]/40'
                  : 'border-[rgba(255,255,255,0.04)] bg-[#141414] opacity-60 hover:opacity-100'
              }`}
            >
              <div>
                {/* Header row: Status badge + Switch */}
                <div className="flex items-center justify-between mb-3.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                      story.active
                        ? 'bg-[#00E096]/10 text-[#00E096] border-[#00E096]/30'
                        : 'bg-[#2C2C2C] text-[#AAAAAA] border-[rgba(255,255,255,0.08)]'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${story.active ? 'bg-[#00E096]' : 'bg-[#666666]'}`} />
                    {story.active ? 'Activa' : 'Pausada'}
                  </span>

                  <button
                    onClick={() => onToggleActive(story.id, !story.active)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
                      story.active
                        ? 'bg-[#2C2C2C] text-[#AAAAAA] hover:text-white'
                        : 'bg-[#00E096]/15 text-[#00E096] hover:bg-[#00E096]/25'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    <span>{story.active ? 'Pausar' : 'Activar'}</span>
                  </button>
                </div>

                {/* Main Content: Thumbnail & Title */}
                <div className="flex gap-3.5">
                  <div
                    onClick={() => onPreviewStory(story)}
                    className="w-16 h-28 rounded-xl overflow-hidden bg-black flex-shrink-0 cursor-pointer border border-[rgba(255,255,255,0.12)] group relative shadow-md"
                  >
                    <img
                      src={story.mediaUrl ? story.mediaUrl.replace(/\.(mp4|mov|webm|mkv)$/i, '.jpg') : ''}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {story.mediaType === 'video' && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Film className="w-5 h-5 text-[#FFD700] drop-shadow" />
                      </div>
                    )}
                    {story.sourceType === 'folder' && (
                      <div className="absolute top-1 left-1 z-10 w-4 h-4 rounded-md bg-black/80 border border-[#FFD700]/40 flex items-center justify-center text-[9px]" title="Rotación desde carpeta">
                        📁
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                      <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-white text-sm leading-snug line-clamp-2 mb-1.5" title={story.title}>
                      {story.title}
                    </h3>

                    {/* Category or folder pill */}
                    <div className="flex items-center gap-1.5 text-xs text-[#AAAAAA] mb-2">
                      {story.sourceType === 'folder' || story.folderName ? (
                        <span className="inline-flex items-center gap-1 font-bold text-[#FFD700] bg-[rgba(255,215,0,0.12)] px-2 py-0.5 rounded-lg border border-[rgba(255,215,0,0.2)] text-[11px]">
                          📁 {story.folderName || 'Carpeta'} (Rotativo)
                        </span>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: story.color || '#FFD700' }} />
                          <span className="font-semibold">{story.categoryLabel || 'Historia'}</span>
                        </>
                      )}
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-1 text-xs font-extrabold text-[#FFD700] mb-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{story.time} hs</span>
                    </div>

                    {/* Days badges */}
                    <div className="flex flex-wrap gap-1">
                      {story.days && story.days.length > 0 ? (
                        story.days.map(d => (
                          <span key={d} className="px-1.5 py-0.5 rounded-md bg-[#121212] text-[#AAAAAA] text-[10px] font-bold border border-[rgba(255,255,255,0.06)]">
                            {DAYS_MAP[d] || d}
                          </span>
                        ))
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-[rgba(255,215,0,0.1)] text-[#FFD700] text-[10px] font-bold border border-[rgba(255,215,0,0.2)]">
                          A Demanda
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback Message */}
              {publishFeedback[story.id] && (
                <div
                  className={`mt-3 p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                    publishFeedback[story.id].success
                      ? 'bg-[#00E096]/10 border-[#00E096]/30 text-[#00E096]'
                      : 'bg-[#FF3B30]/10 border-[#FF3B30]/30 text-[#FF6B6B]'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{publishFeedback[story.id].message}</span>
                </div>
              )}

              {/* Footer action buttons */}
              <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPreviewStory(story)}
                    className="p-2 rounded-xl bg-[#121212] hover:bg-[#2C2C2C] text-[#AAAAAA] hover:text-white transition-colors"
                    title="Ver vista previa en celular"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {onEditStory && (
                    <button
                      onClick={() => onEditStory(story)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2C2C2C] hover:bg-[#383838] text-[#FFD700] font-bold text-xs transition-colors"
                      title="Editar foto, días u horario (aplica a todos los días)"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                  )}

                  <button
                    onClick={() => onDeleteStory(story.id)}
                    className="p-2 rounded-xl bg-[#121212] hover:bg-[#FF3B30]/10 text-[#666666] hover:text-[#FF3B30] transition-colors"
                    title="Eliminar historia"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Botón Publicar Ahora */}
                <button
                  onClick={() => handlePublishNow(story)}
                  disabled={publishingId === story.id}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FFD700] hover:bg-[#E6C200] text-black font-extrabold text-xs shadow-md shadow-[rgba(255,215,0,0.2)] transition-all active:scale-95 disabled:opacity-50"
                >
                  {publishingId === story.id ? (
                    <>
                      <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Publicando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Publicar Ahora</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
