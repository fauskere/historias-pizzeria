import React, { useState } from 'react';
import { 
  Settings, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  HelpCircle, 
  Sparkles,
  Cloud,
  Check,
  Save
} from 'lucide-react';
import { Instagram, Facebook } from './SocialIcons';

import { testMetaConnection } from '../services/metaApi';
import { getMetaSettings, saveMetaSettings, getSavedFirebaseConfig, saveFirebaseConfig } from '../services/firebase';

export default function SettingsPanel({ onFirebaseUpdated, isFirebaseConnected }) {
  // Meta Settings
  const [metaSettings, setMetaState] = useState(getMetaSettings());
  const [showToken, setShowToken] = useState(false);
  const [metaTesting, setMetaTesting] = useState(false);
  const [metaTestResult, setMetaTestResult] = useState(null);
  const [metaSaved, setMetaSaved] = useState(false);

  // Firebase Config
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

  // Guardar configuración de Meta
  const handleSaveMeta = (e) => {
    e?.preventDefault();
    saveMetaSettings(metaSettings);
    setMetaSaved(true);
    setTimeout(() => setMetaSaved(false), 2500);
  };

  // Probar conexión en vivo con Meta Graph API
  const handleTestMeta = async () => {
    setMetaTesting(true);
    setMetaTestResult(null);

    const result = await testMetaConnection(metaSettings);
    setMetaTestResult(result);
    setMetaTesting(false);

    // Si detectó automáticamente los IDs y no estaban puestos, sugerirlos y guardarlos
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

  // Guardar configuración de Firebase
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
      <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-orange-500" />
          Configuración y Conexiones
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Gestioná tus credenciales de la API oficial de Meta y tu proyecto de Firebase en la nube.
        </p>
      </div>

      {/* 1. SECCIÓN META GRAPH API */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center text-white">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Conexión Oficial Meta (Facebook & Instagram)
              </h2>
              <p className="text-xs text-slate-400">Tokens y credenciales de la Graph API de Meta</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-medium"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{showGuide ? 'Ocultar guía de ayuda' : '¿Cómo obtener estos datos?'}</span>
          </button>
        </div>

        {/* Guía desplegable de Meta */}
        {showGuide && (
          <div className="p-4 rounded-2xl bg-slate-850 border border-slate-750 text-xs text-slate-300 space-y-2.5">
            <p className="font-bold text-white text-sm">Pasos rápidos para obtener tus credenciales:</p>
            <ol className="list-decimal pl-4 space-y-1.5 text-slate-300">
              <li>
                Entrá a <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="text-orange-400 underline font-semibold">Graph API Explorer</a>.
              </li>
              <li>En <strong>App de Meta</strong>, seleccioná tu app creada.</li>
              <li>
                En <strong>Permisos</strong>, agregá: <code className="text-pink-300">instagram_basic</code>, <code className="text-pink-300">instagram_content_publish</code>, <code className="text-blue-300">pages_show_list</code>, <code className="text-blue-300">pages_manage_posts</code>.
              </li>
              <li>Hacé clic en <strong>Generate Access Token</strong> y aceptá vincular tu página e Instagram.</li>
              <li>Copiá el token resultante y pegalo en el campo <strong>Page Access Token</strong> abajo.</li>
            </ol>
          </div>
        )}

        {/* Formulario de Meta */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Nombre de tu Pizzería (para vista previa)
            </label>
            <input
              type="text"
              value={metaSettings.restaurantName || ''}
              onChange={e => setMetaState({ ...metaSettings, restaurantName: e.target.value })}
              placeholder="Ej: Pizzería Don Antonio"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Page Access Token (Token de Acceso de Página)
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={metaSettings.pageAccessToken || ''}
                onChange={e => setMetaState({ ...metaSettings, pageAccessToken: e.target.value })}
                placeholder="EAA..."
                className="w-full pr-12 pl-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-orange-500 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Este token autoriza la publicación de historias.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Facebook Page ID (Opcional si usás Page Token)
              </label>
              <input
                type="text"
                value={metaSettings.facebookPageId || ''}
                onChange={e => setMetaState({ ...metaSettings, facebookPageId: e.target.value })}
                placeholder="Ej: 104829104928"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Instagram Business Account ID
              </label>
              <input
                type="text"
                value={metaSettings.instagramAccountId || ''}
                onChange={e => setMetaState({ ...metaSettings, instagramAccountId: e.target.value })}
                placeholder="Ej: 178414000000000"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Resultado del Test de Conexión */}
        {metaTestResult && (
          <div
            className={`p-4 rounded-2xl border text-sm space-y-2 ${
              metaTestResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {metaTestResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
              <span>{metaTestResult.message}</span>
            </div>

            {metaTestResult.page && (
              <p className="text-xs text-slate-300">
                Página de Facebook conectada: <strong>{metaTestResult.page.name}</strong> (ID: {metaTestResult.page.id})
              </p>
            )}

            {metaTestResult.instagram && (
              <p className="text-xs text-slate-300">
                Cuenta de Instagram conectada: <strong>@{metaTestResult.instagram.username}</strong>
              </p>
            )}
          </div>
        )}

        {/* Acciones de Meta */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleTestMeta}
            disabled={metaTesting || !metaSettings.pageAccessToken}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-xs disabled:opacity-40 transition-colors"
          >
            {metaTesting ? (
              <>
                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <span>Verificando con Meta...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span>Probar Conexión con Meta</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSaveMeta}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs shadow-md shadow-orange-500/20 transition-all"
          >
            {metaSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{metaSaved ? '¡Guardado!' : 'Guardar Credenciales'}</span>
          </button>
        </div>
      </div>

      {/* 2. SECCIÓN FIREBASE CLOUD */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Configuración de Firebase</h2>
              <p className="text-xs text-slate-400">Para sincronización en tiempo real y almacenamiento de imágenes en la nube</p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              isFirebaseConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            {isFirebaseConnected ? 'Firebase Conectado' : 'Modo Local / Sin Conectar'}
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Pegá aquí los datos de tu proyecto de Firebase (los encontrás en <em>Firebase Console &gt; Configuración del proyecto &gt; Tus apps</em>).
        </p>

        <form onSubmit={handleSaveFirebase} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                API Key
              </label>
              <input
                type="text"
                value={fbConfig.apiKey || ''}
                onChange={e => setFbConfig({ ...fbConfig, apiKey: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Project ID
              </label>
              <input
                type="text"
                value={fbConfig.projectId || ''}
                onChange={e => setFbConfig({ ...fbConfig, projectId: e.target.value })}
                placeholder="mi-pizzeria-app"
                className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Auth Domain
              </label>
              <input
                type="text"
                value={fbConfig.authDomain || ''}
                onChange={e => setFbConfig({ ...fbConfig, authDomain: e.target.value })}
                placeholder="mi-pizzeria-app.firebaseapp.com"
                className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Storage Bucket
              </label>
              <input
                type="text"
                value={fbConfig.storageBucket || ''}
                onChange={e => setFbConfig({ ...fbConfig, storageBucket: e.target.value })}
                placeholder="mi-pizzeria-app.appspot.com"
                className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
            >
              {fbSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{fbSaved ? '¡Conectado!' : 'Guardar y Conectar Firebase'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
