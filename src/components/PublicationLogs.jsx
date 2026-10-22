import React, { useState, useEffect } from 'react';
import { 
  History, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
} from 'lucide-react';
import { getPublicationLogs, fetchPublicationLogs, addPublicationLog, getMetaSettings } from '../services/firebase';
import { publishInstagramStory, publishFacebookStory } from '../services/metaApi';

export default function PublicationLogs({ stories }) {
  const [logs, setLogs] = useState(getPublicationLogs());
  const [selectedStoryId, setSelectedStoryId] = useState(stories[0]?.id || '');
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null);

  useEffect(() => {
    fetchPublicationLogs().then(remoteLogs => {
      if (remoteLogs && remoteLogs.length > 0) {
        setLogs(remoteLogs);
      }
    });
  }, []);

  const handleTestPublish = async () => {
    const story = stories.find(s => s.id === selectedStoryId);
    if (!story) return;

    const meta = getMetaSettings();
    if (!meta.pageAccessToken) {
      setPublishResult({
        success: false,
        message: 'Debes configurar tu Page Access Token en la pestaña "Configuración" antes de probar la publicación.'
      });
      return;
    }

    setPublishing(true);
    setPublishResult(null);

    const results = [];
    let overallSuccess = true;

    try {
      if (story.platforms?.instagram) {
        if (!meta.instagramAccountId) {
          results.push({
            platform: 'instagram',
            success: false,
            message: 'Falta el Instagram Business Account ID en la configuración.'
          });
          overallSuccess = false;
        } else {
          try {
            const igRes = await publishInstagramStory({
              instagramAccountId: meta.instagramAccountId,
              pageAccessToken: meta.pageAccessToken,
              mediaUrl: story.mediaUrl,
              mediaType: story.mediaType
            });
            results.push({
              platform: 'instagram',
              success: true,
              storyId: igRes.storyId,
              message: 'Publicado con éxito en Instagram Stories'
            });
          } catch (err) {
            results.push({
              platform: 'instagram',
              success: false,
              message: err.message
            });
            overallSuccess = false;
          }
        }
      }

      if (story.platforms?.facebook) {
        if (!meta.facebookPageId) {
          results.push({
            platform: 'facebook',
            success: false,
            message: 'Falta el Facebook Page ID en la configuración.'
          });
          overallSuccess = false;
        } else {
          try {
            const fbRes = await publishFacebookStory({
              facebookPageId: meta.facebookPageId,
              pageAccessToken: meta.pageAccessToken,
              mediaUrl: story.mediaUrl,
              mediaType: story.mediaType
            });
            results.push({
              platform: 'facebook',
              success: true,
              storyId: fbRes.storyId,
              message: 'Publicado con éxito en Facebook Page Stories'
            });
          } catch (err) {
            results.push({
              platform: 'facebook',
              success: false,
              message: err.message
            });
            overallSuccess = false;
          }
        }
      }

      const updatedLogs = await addPublicationLog({
        storyTitle: story.title,
        storyId: story.id,
        mediaType: story.mediaType,
        success: overallSuccess,
        details: results
      });

      setLogs(updatedLogs);
      setPublishResult({
        success: overallSuccess,
        results
      });
    } catch (err) {
      setPublishResult({
        success: false,
        message: 'Error inesperado: ' + err.message
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-[#1E1E1E] p-6 sm:p-8 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-xl">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-[rgba(255,215,0,0.15)] text-[#FFD700]">
            <History className="w-5 h-5" />
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Historial de Publicaciones
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[#AAAAAA] mt-1.5">
          Registro en tiempo real de cada historia publicada por el robot de la nube y pruebas manuales.
        </p>
      </div>

      {/* Disparador de Prueba */}
      <div className="bg-[#1E1E1E] border border-[rgba(255,255,255,0.08)] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
        <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)] pb-4">
          <div className="w-10 h-10 rounded-xl bg-[rgba(255,215,0,0.15)] flex items-center justify-center text-[#FFD700]">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white">Disparador Manual Inmediato</h2>
            <p className="text-xs text-[#AAAAAA]">
              Permite validar la conexión con Meta en vivo sin esperar al horario programado.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex-1">
            <select
              value={selectedStoryId}
              onChange={e => setSelectedStoryId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#121212] border border-[rgba(255,255,255,0.08)] text-sm text-white font-bold focus:outline-none focus:border-[#FFD700]"
            >
              {stories.map(s => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.time} hs - {s.categoryLabel || 'Historia'})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleTestPublish}
            disabled={publishing || stories.length === 0}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FFD700] hover:bg-[#E6C200] text-black font-extrabold text-xs sm:text-sm shadow-md shadow-[rgba(255,215,0,0.25)] transition-all disabled:opacity-50"
          >
            {publishing ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Enviando a Meta...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Publicar Ahora en Meta</span>
              </>
            )}
          </button>
        </div>

        {publishResult && (
          <div
            className={`p-4 rounded-2xl border text-xs sm:text-sm space-y-2 font-medium ${
              publishResult.success
                ? 'bg-[#00E096]/10 border-[#00E096]/30 text-[#00E096]'
                : 'bg-[#FF3B30]/10 border-[#FF3B30]/30 text-[#FF6B6B]'
            }`}
          >
            <div className="flex items-center gap-2 font-extrabold">
              {publishResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-[#00E096]" />
              ) : (
                <AlertCircle className="w-5 h-5 text-[#FF3B30]" />
              )}
              <span>
                {publishResult.success
                  ? '¡Publicación realizada y verificada con éxito en Meta!'
                  : 'Hubo un error durante la publicación'}
              </span>
            </div>

            {publishResult.results && (
              <ul className="text-xs space-y-1 pl-6 list-disc">
                {publishResult.results.map((r, i) => (
                  <li key={i}>
                    <strong className="capitalize">{r.platform}:</strong> {r.message}{' '}
                    {r.storyId && <code>(ID: {r.storyId})</code>}
                  </li>
                ))}
              </ul>
            )}
            {publishResult.message && <p className="text-xs">{publishResult.message}</p>}
          </div>
        )}
      </div>

      {/* Tabla de Historial */}
      <div className="bg-[#1E1E1E] border border-[rgba(255,255,255,0.08)] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#FFD700]" />
          Registro Histórico de Publicaciones
        </h3>

        {logs.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-[rgba(255,255,255,0.06)] rounded-2xl text-[#666666] text-xs sm:text-sm font-medium">
            Aún no se registraron publicaciones en el historial.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#CCCCCC]">
              <thead className="bg-[#141414] text-[#AAAAAA] uppercase font-bold text-[11px] border-b border-[rgba(255,255,255,0.06)]">
                <tr>
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Historia</th>
                  <th className="py-3 px-4">Resultado</th>
                  <th className="py-3 px-4">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-[#252525]/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[#AAAAAA]">
                      {new Date(log.timestamp).toLocaleString('es-AR')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {log.storyTitle}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black text-[10px] ${
                          log.success
                            ? 'bg-[#00E096]/10 text-[#00E096] border border-[#00E096]/30'
                            : 'bg-[#FF3B30]/10 text-[#FF6B6B] border border-[#FF3B30]/30'
                        }`}
                      >
                        {log.success ? 'EXITOSO' : 'ERROR'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#888888]">
                      {log.details?.map((d, idx) => (
                        <div key={idx} className="truncate max-w-xs">
                          <span className="font-bold capitalize text-white">{d.platform}:</span> {d.message}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
