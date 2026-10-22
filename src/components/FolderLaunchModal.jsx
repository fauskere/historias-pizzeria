import React, { useState } from 'react';
import { X, Zap, CheckCircle2, AlertCircle, Film, Send, Layers, Clock } from 'lucide-react';
import { Instagram, Facebook } from './SocialIcons';
import { fetchMetaSettings, addPublicationLog } from '../services/firebase';
import { publishInstagramStory, publishFacebookStory } from '../services/metaApi';

export default function FolderLaunchModal({ 
  folder, 
  onClose, 
  onScheduleStory,
  _restaurantName = 'Pizzería María Belén' 
}) {
  const [platforms, setPlatforms] = useState({ instagram: true, facebook: true });
  const [publishing, setPublishing] = useState(false);
  const [publishingStep, setPublishingStep] = useState('');
  const [publishResult, setPublishResult] = useState(null);

  // Modo: 'instant' (Lanzar ahora en vivo) o 'schedule' (Programar para un horario hoy)
  const [launchMode, setLaunchMode] = useState('schedule');

  // Hora por defecto: siguiente media hora
  const getDefaultTime = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(Math.floor(d.getMinutes() / 15) * 15).padStart(2, '0');
    return `${h}:${m}`;
  };

  const [scheduledTime, setScheduledTime] = useState(getDefaultTime());
  const [repeatWeekly, setRepeatWeekly] = useState(false);

  if (!folder) return null;

  const daysMap = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const todayKey = daysMap[new Date().getDay()];
  const todayLabel = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][new Date().getDay()];

  const isSingle = folder.mode === 'single' || (folder.packs?.length === 0 && (folder.items?.length > 0 || folder.mode !== 'packs'));
  const packs = Array.isArray(folder.packs) ? folder.packs : [];
  const items = Array.isArray(folder.items) ? folder.items : [];

  // Programar un pack completo para hoy
  const handleSchedulePack = async (pack) => {
    if (!onScheduleStory) {
      alert('La función de programación no está conectada.');
      return;
    }
    const images = pack.images || [];
    if (images.length === 0) {
      alert('Este pack no tiene imágenes.');
      return;
    }

    setPublishing(true);
    setPublishResult(null);
    try {
      const sortedImages = [...images].sort((a, b) => (a.order || 0) - (b.order || 0));
      const newStory = {
        title: `${folder.name} [Pack: ${pack.name}]`,
        category: folder.category || 'promo',
        categoryLabel: folder.name,
        color: '#FFD700',
        sourceType: 'pack',
        folderId: folder.id,
        folderName: folder.name,
        packId: pack.id,
        packName: pack.name,
        packImages: sortedImages,
        mediaType: sortedImages[0]?.mediaType || 'image',
        mediaUrl: sortedImages[0]?.url || '',
        days: [todayKey],
        time: scheduledTime,
        repeatWeekly,
        active: true,
        platforms,
        createdAt: new Date().toISOString()
      };

      await onScheduleStory(newStory);
      setPublishResult({
        success: true,
        message: `¡Pack "${pack.name}" agendado para HOY (${todayLabel}) a las ${scheduledTime} hs!`
      });
      setTimeout(() => {
        onClose();
      }, 1600);
    } catch (err) {
      setPublishResult({ success: false, message: 'Error al agendar: ' + err.message });
    } finally {
      setPublishing(false);
    }
  };

  // Programar un item individual para hoy
  const handleScheduleItem = async (item) => {
    if (!onScheduleStory) {
      alert('La función de programación no está conectada.');
      return;
    }

    setPublishing(true);
    setPublishResult(null);
    try {
      const newStory = {
        title: `${folder.name} - ${item.name}`,
        category: folder.category || 'promo',
        categoryLabel: folder.name,
        color: '#FFD700',
        sourceType: 'single',
        folderId: folder.id,
        folderName: folder.name,
        mediaType: item.mediaType || 'image',
        mediaUrl: item.url,
        days: [todayKey],
        time: scheduledTime,
        repeatWeekly,
        active: true,
        platforms,
        createdAt: new Date().toISOString()
      };

      await onScheduleStory(newStory);
      setPublishResult({
        success: true,
        message: `¡"${item.name}" agendada para HOY (${todayLabel}) a las ${scheduledTime} hs!`
      });
      setTimeout(() => {
        onClose();
      }, 1600);
    } catch (err) {
      setPublishResult({ success: false, message: 'Error al agendar: ' + err.message });
    } finally {
      setPublishing(false);
    }
  };

  // Publicar un pack completo en vivo (al instante)
  const handlePublishPack = async (pack) => {
    const images = pack.images || [];
    if (images.length === 0) {
      alert('Este pack no tiene imágenes para publicar.');
      return;
    }

    const meta = await fetchMetaSettings();
    if (!meta.pageAccessToken) {
      alert('Debes configurar tu Page Access Token en Configuración antes de publicar.');
      return;
    }

    setPublishing(true);
    setPublishResult(null);
    const sortedImages = [...images].sort((a, b) => (a.order || 0) - (b.order || 0));
    const allDetails = [];
    let overallSuccess = true;

    try {
      for (let i = 0; i < sortedImages.length; i++) {
        const item = sortedImages[i];
        setPublishingStep(`Publicando foto ${i + 1} de ${sortedImages.length}: "${item.name || ''}"...`);

        // Instagram
        if (platforms.instagram) {
          if (!meta.instagramAccountId) {
            allDetails.push({ platform: 'instagram', message: `Foto ${i + 1} Error: Falta ID de Instagram` });
            overallSuccess = false;
          } else {
            try {
              const igRes = await publishInstagramStory({
                instagramAccountId: meta.instagramAccountId,
                pageAccessToken: meta.pageAccessToken,
                mediaUrl: item.url,
                mediaType: item.mediaType || 'image'
              });
              allDetails.push({ platform: 'instagram', message: `Foto ${i + 1} OK (ID: ${igRes.storyId})` });
            } catch (err) {
              allDetails.push({ platform: 'instagram', message: `Foto ${i + 1} Error: ${err.message}` });
              overallSuccess = false;
            }
          }
        }

        // Facebook
        if (platforms.facebook) {
          if (!meta.facebookPageId) {
            allDetails.push({ platform: 'facebook', message: `Foto ${i + 1} Error: Falta ID de Facebook` });
            overallSuccess = false;
          } else {
            try {
              const fbRes = await publishFacebookStory({
                facebookPageId: meta.facebookPageId,
                pageAccessToken: meta.pageAccessToken,
                mediaUrl: item.url,
                mediaType: item.mediaType || 'image'
              });
              allDetails.push({ platform: 'facebook', message: `Foto ${i + 1} OK (ID: ${fbRes.storyId})` });
            } catch (err) {
              allDetails.push({ platform: 'facebook', message: `Foto ${i + 1} Error: ${err.message}` });
            }
          }
        }

        if (i < sortedImages.length - 1) {
          setPublishingStep(`Foto ${i + 1} lista. Esperando 2.5s antes de la siguiente...`);
          await new Promise(r => setTimeout(r, 2500));
        }
      }

      await addPublicationLog({
        storyTitle: `${folder.name} [Pack: "${pack.name}"] (A Demanda)`,
        success: overallSuccess,
        details: allDetails
      });

      setPublishResult({
        success: overallSuccess,
        message: overallSuccess 
          ? `¡Pack "${pack.name}" publicado con éxito (${sortedImages.length} historias en orden)!`
          : 'Publicación completada con algunas advertencias.'
      });
    } catch (err) {
      setPublishResult({ success: false, message: 'Error: ' + err.message });
    } finally {
      setPublishing(false);
      setPublishingStep('');
    }
  };

  // Publicar un item individual en vivo (al instante)
  const handlePublishItem = async (item) => {
    const meta = await fetchMetaSettings();
    if (!meta.pageAccessToken) {
      alert('Debes configurar tu Page Access Token en Configuración antes de publicar.');
      return;
    }

    setPublishing(true);
    setPublishResult(null);
    setPublishingStep(`Publicando "${item.name}"...`);
    const details = [];
    let overallSuccess = true;

    try {
      if (platforms.instagram) {
        if (!meta.instagramAccountId) {
          details.push({ platform: 'instagram', message: 'Falta ID de Instagram' });
          overallSuccess = false;
        } else {
          try {
            const igRes = await publishInstagramStory({
              instagramAccountId: meta.instagramAccountId,
              pageAccessToken: meta.pageAccessToken,
              mediaUrl: item.url,
              mediaType: item.mediaType || 'image'
            });
            details.push({ platform: 'instagram', message: `OK (ID: ${igRes.storyId})` });
          } catch (err) {
            details.push({ platform: 'instagram', message: `Error: ${err.message}` });
            overallSuccess = false;
          }
        }
      }

      if (platforms.facebook) {
        if (!meta.facebookPageId) {
          details.push({ platform: 'facebook', message: 'Falta ID de Facebook' });
          overallSuccess = false;
        } else {
          try {
            const fbRes = await publishFacebookStory({
              facebookPageId: meta.facebookPageId,
              pageAccessToken: meta.pageAccessToken,
              mediaUrl: item.url,
              mediaType: item.mediaType || 'image'
            });
            details.push({ platform: 'facebook', message: `OK (ID: ${fbRes.storyId})` });
          } catch (err) {
            details.push({ platform: 'facebook', message: `Error: ${err.message}` });
          }
        }
      }

      await addPublicationLog({
        storyTitle: `${folder.name} [Foto: "${item.name}"] (A Demanda)`,
        success: overallSuccess,
        details
      });

      setPublishResult({
        success: overallSuccess,
        message: overallSuccess 
          ? `¡"${item.name}" publicada con éxito en vivo!`
          : 'Publicación completada con observaciones.'
      });
    } catch (err) {
      setPublishResult({ success: false, message: 'Error: ' + err.message });
    } finally {
      setPublishing(false);
      setPublishingStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={publishing ? undefined : onClose} />

      <div className="relative z-10 w-full max-w-2xl bg-[#1E1E1E] border border-[rgba(255,255,255,0.08)] rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[rgba(255,255,255,0.06)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[rgba(255,215,0,0.15)] text-[#FFD700]">
                {launchMode === 'schedule' ? <Clock className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              </span>
              <h2 className="text-xl font-extrabold text-white">
                {folder.name}
              </h2>
            </div>
            <p className="text-xs text-[#AAAAAA] mt-1.5">
              Elegí qué historia querés publicar y si deseas que salga ya mismo o en un horario exacto.
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={publishing}
            className="p-2 rounded-xl bg-[#121212] hover:bg-[#2C2C2C] text-[#AAAAAA] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Modo: Publicar Ahora vs Programar para un Horario */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#121212] rounded-2xl border border-[rgba(255,255,255,0.06)]">
          <button
            type="button"
            onClick={() => setLaunchMode('schedule')}
            className={`py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
              launchMode === 'schedule'
                ? 'bg-[#FFD700] text-black shadow-md'
                : 'text-[#888888] hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Programar para Hoy</span>
          </button>

          <button
            type="button"
            onClick={() => setLaunchMode('instant')}
            className={`py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
              launchMode === 'instant'
                ? 'bg-[#FFD700] text-black shadow-md'
                : 'text-[#888888] hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Publicar al Instante</span>
          </button>
        </div>

        {/* Panel de Configuración Horaria (si está en modo programar) */}
        {launchMode === 'schedule' && (
          <div className="bg-[#121212] p-4 rounded-2xl border border-[#FFD700]/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00E096] animate-ping" />
                <span className="text-xs font-bold text-white">
                  Programar para hoy (<span className="text-[#FFD700]">{todayLabel}</span>) a las:
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#1E1E1E] border border-[rgba(255,255,255,0.15)] text-sm font-mono text-[#FFD700] font-black focus:outline-none focus:border-[#FFD700]"
                />

                <div className="flex items-center gap-1">
                  {['19:30', '20:00', '20:30', '21:00', '21:30'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setScheduledTime(t)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                        scheduledTime === t
                          ? 'bg-[#FFD700]/20 border-[#FFD700] text-[#FFD700]'
                          : 'bg-[#1E1E1E] border-transparent text-[#888888] hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 text-[11px] text-[#AAAAAA] cursor-pointer select-none pt-1 border-t border-[rgba(255,255,255,0.06)]">
              <input
                type="checkbox"
                checked={repeatWeekly}
                onChange={e => setRepeatWeekly(e.target.checked)}
                className="accent-[#FFD700] rounded"
              />
              <span>Repetir automáticamente cada semana los {todayLabel} a esta misma hora</span>
            </label>
          </div>
        )}

        {/* Feedback / Progress */}
        {publishing && (
          <div className="p-4 rounded-2xl bg-[rgba(255,215,0,0.1)] border border-[#FFD700]/30 text-white flex items-center gap-3 text-xs font-bold animate-pulse">
            <div className="w-4 h-4 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin shrink-0" />
            <span>{publishingStep || 'Guardando programación...'}</span>
          </div>
        )}

        {publishResult && (
          <div className={`p-4 rounded-2xl border flex items-center gap-2.5 text-xs font-bold ${
            publishResult.success 
              ? 'bg-[#00E096]/10 border-[#00E096]/30 text-[#00E096]' 
              : 'bg-[#FF3B30]/10 border-[#FF3B30]/30 text-[#FF6B6B]'
          }`}>
            {publishResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{publishResult.message}</span>
          </div>
        )}

        {/* Selector de Plataformas */}
        <div className="flex items-center gap-4 py-1 text-xs font-bold text-white">
          <span className="text-[#888888]">Publicar en:</span>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={platforms.instagram}
              onChange={e => setPlatforms({ ...platforms, instagram: e.target.checked })}
              className="accent-[#FFD700]"
            />
            <Instagram className="w-3.5 h-3.5 text-[#FFD700]" />
            <span>Instagram Stories</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={platforms.facebook}
              onChange={e => setPlatforms({ ...platforms, facebook: e.target.checked })}
              className="accent-[#FFD700]"
            />
            <Facebook className="w-3.5 h-3.5 text-[#FFD700]" />
            <span>Facebook Page Stories</span>
          </label>
        </div>

        {/* Contenido seleccionable */}
        <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1">
          {isSingle ? (
            items.length === 0 ? (
              <p className="text-xs text-[#888888] text-center py-8">Esta carpeta no tiene fotos cargadas.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map(item => {
                  const poster = item.url ? item.url.replace(/\.(mp4|mov|webm|mkv)$/i, '.jpg') : '';
                  return (
                    <div
                      key={item.id}
                      className="bg-[#121212] border border-[rgba(255,255,255,0.08)] hover:border-[#FFD700]/40 rounded-2xl p-3 flex items-center justify-between gap-3 transition-colors shadow-md"
                    >
                      <div className="w-12 h-20 rounded-xl overflow-hidden bg-black shrink-0 relative">
                        <img src={poster} alt="" className="w-full h-full object-cover" />
                        {item.mediaType === 'video' && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <Film className="w-4 h-4 text-[#FFD700]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{item.name}</p>
                        <p className="text-[10px] text-[#888888] capitalize mt-0.5">{item.mediaType || 'imagen'}</p>
                        <button
                          disabled={publishing}
                          onClick={() => launchMode === 'schedule' ? handleScheduleItem(item) : handlePublishItem(item)}
                          className="mt-2 px-3 py-1.5 rounded-xl bg-[#FFD700] hover:bg-[#E6C200] disabled:opacity-50 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          {launchMode === 'schedule' ? <Clock className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                          <span>{launchMode === 'schedule' ? `Agendar a las ${scheduledTime}` : 'Publicar Ahora'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            packs.length === 0 ? (
              <p className="text-xs text-[#888888] text-center py-8">Esta carpeta no tiene packs cargados.</p>
            ) : (
              <div className="space-y-3">
                {packs.map(pack => {
                  const imgs = pack.images || [];
                  return (
                    <div
                      key={pack.id}
                      className="bg-[#121212] border border-[rgba(255,255,255,0.08)] hover:border-[#FFD700]/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-3 overflow-hidden shrink-0">
                          {imgs.slice(0, 3).map((img, idx) => {
                            const poster = img.url ? img.url.replace(/\.(mp4|mov|webm|mkv)$/i, '.jpg') : '';
                            return (
                              <div key={img.id || idx} className="w-12 h-16 rounded-xl overflow-hidden border-2 border-[#1E1E1E] bg-black shadow">
                                <img src={poster} alt="" className="w-full h-full object-cover" />
                              </div>
                            );
                          })}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-[#FFD700]" />
                            <h4 className="text-sm font-extrabold text-white">{pack.name}</h4>
                          </div>
                          <p className="text-xs text-[#888888] mt-0.5">
                            {imgs.length} {imgs.length === 1 ? 'historia' : 'historias en secuencia'}
                          </p>
                        </div>
                      </div>

                      <button
                        disabled={publishing}
                        onClick={() => launchMode === 'schedule' ? handleSchedulePack(pack) : handlePublishPack(pack)}
                        className="px-4 py-2 rounded-xl bg-[#FFD700] hover:bg-[#E6C200] disabled:opacity-50 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[rgba(255,215,0,0.2)] transition-all shrink-0"
                      >
                        {launchMode === 'schedule' ? <Clock className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                        <span>{launchMode === 'schedule' ? `Agendar Pack (${scheduledTime})` : 'Publicar Pack'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
