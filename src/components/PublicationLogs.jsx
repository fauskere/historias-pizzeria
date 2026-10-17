import React, { useState, useEffect } from 'react';
import { 
  History, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Sparkles,
  ExternalLink,
  Film
} from 'lucide-react';
import { Instagram, Facebook } from './SocialIcons';

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

  // Ejecutar prueba de publicación inmediata
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
      // 1. Instagram Story
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

      // 2. Facebook Page Story
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

      // Registrar en log
      const logEntry = {
        storyTitle: story.title,
        storyId: story.id,
        mediaType: story.mediaType,
        success: overallSuccess,
        details: results
      };

      const updatedLogs = addPublicationLog(logEntry);
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
      <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <History className="w-6 h-6 text-orange-500" />
          Historial y Pruebas de Publicación
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Verificá las ejecuciones pasadas y probá publicar una historia en vivo a Meta para confirmar que todo funciona.
        </p>
      </div>

      {/* Zona de Prueba Inmediata */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Disparador de Publicación Inmediata (Prueba en Vivo)</h2>
            <p className="text-xs text-slate-400">
              Permite validar la API oficial de Meta sin esperar al día y horario programado.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex-1">
            <select
              value={selectedStoryId}
              onChange={e => setSelectedStoryId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-orange-500"
            >
              {stories.map(s => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.time} hs - {s.categoryLabel})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleTestPublish}
            disabled={publishing || stories.length === 0}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50"
          >
            {publishing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

        {/* Feedback de la publicación de prueba */}
        {publishResult && (
          <div
            className={`p-4 rounded-2xl border text-sm space-y-2 ${
              publishResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {publishResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
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
                  <li key={i} className={r.success ? 'text-emerald-200' : 'text-red-200'}>
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
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400" />
          Registro de Publicaciones (Logs)
        </h3>

        {logs.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
            Aún no se registraron publicaciones automáticas o de prueba.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Historia</th>
                  <th className="py-3 px-4">Resultado</th>
                  <th className="py-3 px-4">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-850/50">
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      {log.storyTitle}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold ${
                          log.success
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {log.success ? 'Exitoso' : 'Error'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {log.details?.map((d, idx) => (
                        <div key={idx} className="truncate max-w-xs">
                          <span className="font-semibold capitalize text-slate-300">{d.platform}:</span> {d.message}
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
