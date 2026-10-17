import React, { useState } from 'react';
import { X, Pizza, Clock, Power, Film, Send, CheckCircle2, AlertCircle, Pencil } from 'lucide-react';
import { Instagram, Facebook } from './SocialIcons';
import { fetchMetaSettings, addPublicationLog } from '../services/firebase';
import { publishInstagramStory, publishFacebookStory } from '../services/metaApi';

export default function StoryPreviewModal({ 
  story, 
  onClose, 
  onToggleActive, 
  onEditStory,
  restaurantName = 'Pizzería María Belén' 
}) {
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null);

  if (!story) return null;

  const handlePublishNow = async () => {
    const meta = await fetchMetaSettings();
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
        message = '¡Publicada con éxito en vivo en Meta!';
      } else if (igResult?.success && !fbResult?.success) {
        message = `✅ Instagram OK • ⚠️ Facebook: ${fbResult?.message || 'Error'}`;
      } else if (fbResult?.success && !igResult?.success) {
        message = `✅ Facebook OK • ⚠️ Instagram: ${igResult?.message || 'Error'}`;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-[340px] flex flex-col items-center">
        {/* Close Button top right */}
        <button
          onClick={onClose}
          className="absolute -top-11 right-0 text-white/80 hover:text-white p-2 rounded-full bg-[#1E1E1E] hover:bg-[#2C2C2C] border border-[rgba(255,255,255,0.1)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Smartphone 9:16 Mockup */}
        <div className="relative aspect-[9/16] w-full rounded-[42px] border-[7px] border-[#2C2C2C] bg-black overflow-hidden shadow-2xl ring-2 ring-[rgba(255,255,255,0.1)]">
          {/* Top Notch */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-[#1E1E1E] rounded-full z-30" />

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
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80 pointer-events-none flex flex-col justify-between p-4 z-20">
            {/* Top Bar */}
            <div className="pt-3 space-y-2">
              <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                <div className="w-full h-full bg-[#FFD700] rounded-full" />
              </div>

              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFD700] to-[#E6C200] flex items-center justify-center p-1 border border-white/80 shadow-md">
                    <Pizza className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold leading-tight drop-shadow">{restaurantName}</p>
                    <p className="text-[10px] text-white/80">{story.time} hs • Programador</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Caption Pill & Actions */}
            <div className="pb-3 space-y-2 pointer-events-auto">
              <div className="bg-black/75 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/10 text-white space-y-1 shadow-lg">
                <p className="text-xs font-bold">{story.title}</p>
                <div className="flex items-center justify-between text-[11px] text-white/70">
                  <span className="capitalize">{story.categoryLabel || 'Historia'}</span>
                  <div className="flex items-center gap-1.5 text-[#FFD700]">
                    {story.platforms?.instagram && <Instagram className="w-3.5 h-3.5" />}
                    {story.platforms?.facebook && <Facebook className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>

              {/* Status Switch bar */}
              <div className="flex items-center justify-between bg-[#1E1E1E]/95 backdrop-blur-md p-2 rounded-xl border border-[rgba(255,255,255,0.1)]">
                <span className="text-xs text-white/90 font-medium">
                  Estado: <strong className={story.active ? 'text-[#00E096]' : 'text-[#AAAAAA]'}>{story.active ? 'Activa' : 'Pausada'}</strong>
                </span>
                <button
                  onClick={() => onToggleActive(story.id, !story.active)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    story.active
                      ? 'bg-[#2C2C2C] text-[#AAAAAA] hover:text-white'
                      : 'bg-[#00E096]/20 text-[#00E096] hover:bg-[#00E096]/30'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  <span>{story.active ? 'Pausar' : 'Activar'}</span>
                </button>
              </div>

              {/* Action Buttons: Editar & Publicar Ahora */}
              <div className="flex items-center gap-2">
                {onEditStory && (
                  <button
                    onClick={() => {
                      onClose();
                      onEditStory(story);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#2C2C2C] hover:bg-[#383838] text-[#FFD700] font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                )}

                <button
                  onClick={handlePublishNow}
                  disabled={publishing}
                  className="flex-[2] py-2.5 px-3 rounded-xl bg-[#FFD700] hover:bg-[#E6C200] disabled:opacity-50 text-black font-extrabold text-xs shadow-lg shadow-[rgba(255,215,0,0.25)] flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  {publishing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
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

              {publishResult && (
                <div className={`p-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 font-bold shadow-lg ${
                  publishResult.success
                    ? 'bg-[#00E096] text-black'
                    : publishResult.partial
                    ? 'bg-[#FFD700] text-black'
                    : 'bg-[#FF3B30] text-white'
                }`}>
                  {publishResult.success ? (
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
