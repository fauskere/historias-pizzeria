import React, { useState } from 'react';
import { X, Pizza, Clock, Power, Film, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Instagram, Facebook } from './SocialIcons';
import { getMetaSettings, addPublicationLog } from '../services/firebase';
import { publishInstagramStory, publishFacebookStory } from '../services/metaApi';

export default function StoryPreviewModal({ story, onClose, onToggleActive, restaurantName = 'Mi Pizzería' }) {
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null);

  if (!story) return null;

  const handlePublishNow = async () => {
    const meta = getMetaSettings();
    if (!meta.pageAccessToken) {
      alert('Debes configurar tu Page Access Token en Configuración antes de publicar.');
      return;
    }

    setPublishing(true);
    setPublishResult(null);
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
        storyId: story.id,
        mediaType: story.mediaType,
        success: overallSuccess,
        details: results
      });

      const igResult = results.find(r => r.platform === 'instagram');
      const fbResult = results.find(r => r.platform === 'facebook');

      let message = '';
      if (overallSuccess) {
        message = '¡Publicada con éxito en Instagram y Facebook!';
      } else if (igResult?.success && !fbResult?.success) {
        message = `✅ Instagram publicado • ⚠️ Facebook: ${fbResult?.message || 'Error'}`;
      } else if (fbResult?.success && !igResult?.success) {
        message = `✅ Facebook publicado • ⚠️ Instagram: ${igResult?.message || 'Error'}`;
      } else {
        message = results.map(r => `${r.platform}: ${r.message}`).join(' | ');
      }

      setPublishResult({
        success: overallSuccess,
        partial: !overallSuccess && (igResult?.success || fbResult?.success),
        message
      });
    } catch (err) {
      setPublishResult({ success: false, message: err.message });
    } finally {
      setPublishing(false);
      setTimeout(() => setPublishResult(null), 8000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-[340px] flex flex-col items-center">
        {/* Close Button top right */}
        <button
          onClick={onClose}
          className="absolute -top-11 right-0 text-white/80 hover:text-white p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Smartphone 9:16 Mockup */}
        <div className="relative aspect-[9/16] w-full rounded-[36px] border-[5px] border-slate-700 bg-black overflow-hidden shadow-2xl ring-2 ring-slate-800">
          {/* Media Content */}
          {story.mediaType === 'video' ? (
            <video
              src={story.mediaUrl}
              autoPlay
              loop
              controls
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img src={story.mediaUrl} alt={story.title} className="w-full h-full object-cover" />
          )}

          {/* Overlay UI */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70 pointer-events-none flex flex-col justify-between p-4">
            {/* Top Bar */}
            <div className="pt-3 space-y-2">
              <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                <div className="w-full h-full bg-white rounded-full" />
              </div>

              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center p-1 border-2 border-white/80">
                    <Pizza className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight drop-shadow">{restaurantName}</p>
                    <p className="text-[10px] text-white/80">{story.time} hs • Programada</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Caption Pill */}
            <div className="pb-3 space-y-2 pointer-events-auto">
              <div className="bg-black/60 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/10 text-white space-y-1">
                <p className="text-xs font-bold">{story.title}</p>
                <div className="flex items-center justify-between text-[11px] text-white/70">
                  <span className="capitalize">{story.categoryLabel}</span>
                  <div className="flex items-center gap-1.5">
                    {story.platforms?.instagram && <Instagram className="w-3 h-3 text-pink-400" />}
                    {story.platforms?.facebook && <Facebook className="w-3 h-3 text-blue-400" />}
                  </div>
                </div>
              </div>

              {/* Status Switch bar */}
              <div className="flex items-center justify-between bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-white/10">
                <span className="text-xs text-white/80">
                  Estado: <strong className={story.active ? 'text-emerald-400' : 'text-amber-400'}>{story.active ? 'Activa' : 'Pausada'}</strong>
                </span>
                <button
                  onClick={() => onToggleActive(story.id, !story.active)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                    story.active
                      ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  <span>{story.active ? 'Pausar' : 'Activar'}</span>
                </button>
              </div>

              {/* Botón de Publicación Inmediata */}
              <button
                onClick={handlePublishNow}
                disabled={publishing}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                {publishing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Publicando en Meta...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Publicar Ahora en Meta</span>
                  </>
                )}
              </button>

              {publishResult && (
                <div className={`p-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 font-bold ${
                  publishResult.success
                    ? 'bg-emerald-600 text-white'
                    : publishResult.partial
                    ? 'bg-amber-600 text-white'
                    : 'bg-red-600 text-white'
                }`}>
                  {publishResult.success ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : publishResult.partial ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span className="text-center">{publishResult.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
