import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  HelpCircle, 
  Sparkles, 
  Cloud, 
  Check, 
  Save 
} from 'lucide-react';
import { testMetaConnection } from '../services/metaApi';
import { getMetaSettings, fetchMetaSettings, saveMetaSettings, getSavedFirebaseConfig, saveFirebaseConfig } from '../services/firebase';

export default function SettingsPanel({ onFirebaseUpdated, isFirebaseConnected }) {
  const [metaSettings, setMetaState] = useState(getMetaSettings());
  const [showToken, setShowToken] = useState(false);
  const [metaTesting, setMetaTesting] = useState(false);
  const [metaTestResult, setMetaTestResult] = useState(null);
  const [metaSaved, setMetaSaved] = useState(false);

  useEffect(() => {
    fetchMetaSettings().then(settings => {
      if (settings && settings.pageAccessToken) {
        setMetaState(settings);
      }
    });
  }, []);

  const savedFb = getSavedFirebaseConfig() || {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  };
  const [fbConfig, setFbConfig] = useState(savedFb);
  const [fbSaved, setFbSaved] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const handleSaveMeta = (e) => {
    e?.preventDefault();
    saveMetaSettings(metaSettings);
    setMetaSaved(true);
    setTimeout(() => setMetaSaved(false), 2500);
  };

  const handleTestMeta = async () => {
    setMetaTesting(true);
    setMetaTestResult(null);

    const result = await testMetaConnection(metaSettings);
    setMetaTestResult(result);
    setMetaTesting(false);

    if (result.success) {
      let changed = false;
      const updated = { ...metaSettings };
      if (result.detectedInstagramId && !metaSettings.instagramAccountId) {
        updated.instagramAccountId = result.detectedInstagramId;
        changed = true;
      }
      if (result.detectedFacebookPageId && !metaSettings.facebookPageId) {
        updated.facebookPageId = result.detectedFacebookPageId;
        changed = true;
      }
      if (result.page?.name && (!metaSettings.restaurantName || metaSettings.restaurantName === 'Mi Pizzería')) {
        updated.restaurantName = result.page.name;
        changed = true;
      }
      if (changed) {
        setMetaState(updated);
        saveMetaSettings(updated);
      }
    }
  };

  const handleSaveFirebase = (e) => {
    e.preventDefault();
    saveFirebaseConfig(fbConfig);
    setFbSaved(true);
    onFirebaseUpdated();
    setTimeout(() => setFbSaved(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-[#1E1E1E] p-6 sm:p-8 rounded-3xl border border-white/[0.08] shadow-xl">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-[rgba(255,215,0,0.15)] text-[#FFD700]">
            <Settings className="w-5 h-5" />
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Configuración y Conexiones
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[#AAAAAA] mt-1.5">
          Gestioná tus credenciales de la API oficial de Meta y sincronización con Firebase en la nube.
        </p>
      </div>

      {/* 1. SECCIÓN META GRAPH API */}
      <div className="bg-[#1E1E1E] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(255,215,0,0.15)] flex items-center justify-center text-[#FFD700]">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                Conexión Oficial Meta (Facebook & Instagram)
              </h2>
              <p className="text-xs text-[#AAAAAA]">Tokens permanentes de la Graph API de Meta</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-1.5 text-xs text-[#FFD700] hover:underline font-bold"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{showGuide ? 'Ocultar guía' : '¿Cómo obtener estos datos?'}</span>
          </button>
        </div>

        {showGuide && (
          <div className="p-5 rounded-2xl bg-[#121212] border border-white/[0.08] text-xs text-[#CCCCCC] space-y-4">
            <div>
              <p className="font-bold text-[#FFD700] text-sm mb-1">
                ⭐ Método Recomendado: Token Permanente (NUNCA VENCE)
              </p>
              <p className="text-[#AAAAAA] mb-2 leading-relaxed">
                Los tokens comunes de Graph API Explorer duran solo 1 o 2 horas. Para que el bot publique solo todos los días sin interrumpirse, creá un token con vencimiento <strong>"Nunca"</strong> desde Meta Business Suite:
              </p>
              <ol className="list-decimal pl-4 space-y-1.5 text-[#CCCCCC]">
                <li>Entrá a <a href="https://business.facebook.com/settings" target="_blank" rel="noreferrer" className="text-[#FFD700] underline font-bold">Configuración del Negocio (business.facebook.com/settings)</a>.</li>
                <li>En el menú lateral izquierdo, andá a <strong>Usuarios</strong> &gt; <strong>Usuarios del sistema</strong>.</li>
                <li>Hacé clic en <strong>Agregar</strong> (Nombre: <em>Bot Pizzería</em>, Rol: <em>Administrador</em>).</li>
                <li>Hacé clic en <strong>Asignar activos</strong>:
                  <ul className="list-disc pl-4 mt-1 text-[#AAAAAA] space-y-0.5">
                    <li>En <em>Páginas</em>: seleccioná la página de tu pizzería y activá <strong>Control total</strong> (Administrar página).</li>
                    <li>En <em>Cuentas de Instagram</em>: vinculá la cuenta de Instagram de la pizzería.</li>
                  </ul>
                </li>
                <li>Hacé clic en <strong>Generar nuevo token</strong>:
                  <ul className="list-disc pl-4 mt-1 text-[#AAAAAA] space-y-0.5">
                    <li>Seleccioná tu App de Meta.</li>
                    <li><strong>Vencimiento del token:</strong> Seleccioná <strong className="text-white">"Nunca" (Never)</strong>.</li>
                    <li>Marcá estos permisos: <code className="text-[#FFD700]">pages_show_list</code>, <code className="text-[#FFD700]">pages_manage_posts</code>, <code className="text-[#FFD700]">pages_read_engagement</code>, <code className="text-[#FFD700]">instagram_basic</code>, <code className="text-[#FFD700]">instagram_content_publish</code>.</li>
                  </ul>
                </li>
                <li>Copiá el token generado, pegalo abajo y hacé clic en <strong>"Guardar Credenciales"</strong>.</li>
              </ol>
            </div>

            <div className="pt-2 border-t border-white/[0.06]">
              <p className="font-bold text-white mb-1">
                Alternativa rápida vía Graph API Explorer:
              </p>
              <p className="text-[#AAAAAA] leading-relaxed">
                Si generás el token en <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="text-[#FFD700] underline">Graph API Explorer</a>, recordá extenderlo a token de página permanente consultando <code className="text-[#FFD700]">/me/accounts</code> para evitar que expire a las pocas horas.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
              Nombre de tu Pizzería (para vista previa)
            </label>
            <input
              type="text"
              value={metaSettings.restaurantName || ''}
              onChange={e => setMetaState({ ...metaSettings, restaurantName: e.target.value })}
              placeholder="Ej: Pizzería María Belén"
              className="w-full px-4 py-2.5 rounded-xl bg-[#121212] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#FFD700] font-semibold transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
              Page Access Token (Permanente)
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={metaSettings.pageAccessToken || ''}
                onChange={e => setMetaState({ ...metaSettings, pageAccessToken: e.target.value })}
                placeholder="EAA..."
                className="w-full pr-12 pl-4 py-2.5 rounded-xl bg-[#121212] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#FFD700] font-mono text-xs transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AAAAAA] hover:text-white"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-[#00E096] mt-1 font-semibold">
              ✔ Token permanente vinculado a tu página comercial (no vence).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
                Facebook Page ID
              </label>
              <input
                type="text"
                value={metaSettings.facebookPageId || ''}
                onChange={e => setMetaState({ ...metaSettings, facebookPageId: e.target.value })}
                placeholder="Ej: 142155929161231"
                className="w-full px-4 py-2.5 rounded-xl bg-[#121212] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#FFD700] font-mono transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
                Instagram Business Account ID
              </label>
              <input
                type="text"
                value={metaSettings.instagramAccountId || ''}
                onChange={e => setMetaState({ ...metaSettings, instagramAccountId: e.target.value })}
                placeholder="Ej: 17841479715583130"
                className="w-full px-4 py-2.5 rounded-xl bg-[#121212] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#FFD700] font-mono transition-colors"
              />
            </div>
          </div>
        </div>

        {metaTestResult && (
          <div
            className={`p-4 rounded-2xl border text-xs sm:text-sm space-y-2.5 font-medium ${
              metaTestResult.success
                ? 'bg-[#00E096]/10 border-[#00E096]/30 text-[#00E096]'
                : 'bg-[#FF3B30]/10 border-[#FF3B30]/30 text-[#FF6B6B]'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {metaTestResult.success ? <CheckCircle2 className="w-5 h-5 text-[#00E096]" /> : <AlertCircle className="w-5 h-5 text-[#FF3B30]" />}
              <span>{metaTestResult.message}</span>
            </div>

            {metaTestResult.tokenDebug && (
              metaTestResult.tokenDebug.isPermanent ? (
                <div className="flex items-center gap-2 text-xs text-[#00E096] bg-[#00E096]/15 px-3 py-2 rounded-xl border border-[#00E096]/30">
                  <CheckCircle2 className="w-4 h-4 text-[#00E096] shrink-0" />
                  <span><strong>Token Permanente verificado</strong>: Este token no vence jamás. Tus publicaciones diarias se ejecutarán de forma ininterrumpida.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-1 text-xs text-[#FFD700] bg-[rgba(255,215,0,0.12)] px-3.5 py-2.5 rounded-xl border border-[rgba(255,215,0,0.3)]">
                  <span className="font-bold flex items-center gap-1.5 text-white">
                    <AlertCircle className="w-4 h-4 text-[#FFD700] shrink-0" />
                    Atención: Este token es TEMPORAL (Vence: {metaTestResult.tokenDebug.expiresAtText})
                  </span>
                  <span className="text-[#CCCCCC]">
                    Los tokens temporales caducan y detienen las publicaciones automáticas. Generá uno permanente con vencimiento "Nunca" siguiendo la guía de arriba.
                  </span>
                </div>
              )
            )}

            {metaTestResult.page && (
              <p className="text-xs text-white">
                Página de Facebook: <strong>{metaTestResult.page.name}</strong> (ID: {metaTestResult.page.id})
              </p>
            )}
            {metaTestResult.instagram && (
              <p className="text-xs text-white">
                Instagram Business: <strong>@{metaTestResult.instagram.username}</strong>
              </p>
            )}
          </div>
        )}

        {/* Acciones */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleTestMeta}
            disabled={metaTesting || !metaSettings.pageAccessToken}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#121212] hover:bg-[#2C2C2C] text-white border border-white/[0.08] font-bold text-xs disabled:opacity-40 transition-colors"
          >
            {metaTesting ? (
              <>
                <div className="w-4 h-4 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
                <span>Verificando con Meta...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#FFD700]" />
                <span>Probar Conexión con Meta</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSaveMeta}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FFD700] hover:bg-[#E6C200] text-black font-extrabold text-xs shadow-md shadow-[rgba(255,215,0,0.2)] transition-all"
          >
            {metaSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{metaSaved ? '¡Guardado!' : 'Guardar Credenciales'}</span>
          </button>
        </div>
      </div>

      {/* 2. SECCIÓN FIREBASE CLOUD */}
      <div className="bg-[#1E1E1E] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(255,215,0,0.15)] flex items-center justify-center text-[#FFD700]">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">Base de Datos en la Nube (Firebase)</h2>
              <p className="text-xs text-[#AAAAAA]">Sincronización multi-dispositivo y almacenamiento 100% gratuito</p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-black border ${
              isFirebaseConnected
                ? 'bg-[#00E096]/10 text-[#00E096] border-[#00E096]/30'
                : 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30'
            }`}
          >
            {isFirebaseConnected ? 'Firebase Conectado' : 'Modo Local'}
          </span>
        </div>

        <form onSubmit={handleSaveFirebase} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">API Key</label>
              <input
                type="text"
                value={fbConfig.apiKey || ''}
                onChange={e => setFbConfig({ ...fbConfig, apiKey: e.target.value })}
                className="w-full px-4 py-2 rounded-xl bg-[#121212] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#FFD700] font-mono transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Project ID</label>
              <input
                type="text"
                value={fbConfig.projectId || ''}
                onChange={e => setFbConfig({ ...fbConfig, projectId: e.target.value })}
                className="w-full px-4 py-2 rounded-xl bg-[#121212] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#FFD700] font-mono transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#121212] hover:bg-[#2C2C2C] text-white border border-white/[0.08] font-bold text-xs transition-all"
            >
              {fbSaved ? <Check className="w-4 h-4 text-[#00E096]" /> : <Save className="w-4 h-4 text-[#FFD700]" />}
              <span>{fbSaved ? '¡Sincronizado!' : 'Guardar Configuración Firebase'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* VERSION DEL PROGRAMA - REGLA 4 */}
      <div className="text-center pt-2 pb-4 text-[11px] text-[#777777] font-mono select-none">
        Programador de Contenido <span className="text-[#AAAAAA] font-bold">v1.5.8</span>
      </div>
    </div>
  );
}
