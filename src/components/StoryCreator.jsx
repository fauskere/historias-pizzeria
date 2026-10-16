import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Film, 
  Image as ImageIcon, 
  Clock, 
  Calendar, 
  Check, 
  Sparkles, 
  AlertCircle,
  Pizza,
  Repeat
} from 'lucide-react';
import { Instagram, Facebook } from './SocialIcons';

import { uploadStoryMedia } from '../services/firebase';

const DAYS = [
  { key: 'lunes', label: 'Lunes', short: 'L' },
  { key: 'martes', label: 'Martes', short: 'M' },
  { key: 'miercoles', label: 'Miércoles', short: 'M' },
  { key: 'jueves', label: 'Jueves', short: 'J' },
  { key: 'viernes', label: 'Viernes', short: 'V' },
  { key: 'sabado', label: 'Sábado', short: 'S' },
  { key: 'domingo', label: 'Domingo', short: 'D' }
];

const CATEGORIES = [
  { key: 'promo', label: 'Promoción', color: '#f97316', desc: 'Descuentos, 2x1, combos especiales' },
  { key: 'menu', label: 'Carta / Menú', color: '#3b82f6', desc: 'Precios, variedades, pizzas del día' },
  { key: 'hours', label: 'Horarios', color: '#10b981', desc: 'Apertura, cierre, días festivos' },
  { key: 'news', label: 'Novedades', color: '#a855f7', desc: 'Lanzamientos, eventos, música en vivo' }
];

export default function StoryCreator({ onStoryCreated, initialDay, restaurantName = 'Mi Pizzería' }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('promo');
  const [selectedDays, setSelectedDays] = useState(initialDay ? [initialDay] : ['martes', 'jueves']);
  const [time, setTime] = useState('19:30');
  const [repeatWeekly, setRepeatWeekly] = useState(true);
  const [platforms, setPlatforms] = useState({ instagram: true, facebook: true });

  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef(null);

  // Manejar selección de archivo
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|m4v|avi|webm|mkv|3gp)$/i.test(file.name);
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|heic|heif)$/i.test(file.name);

    if (!isVideo && !isImage) {
      setError('Por favor selecciona una imagen (JPG, PNG) o un video (MP4, MOV).');
      return;
    }

    setError(null);
    setMediaFile(file);
    const type = isVideo ? 'video' : 'image';
    setMediaType(type);

    const reader = new FileReader();
    reader.onload = () => {
      setMediaPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Toggle de días
  const toggleDay = (key) => {
    if (selectedDays.includes(key)) {
      setSelectedDays(selectedDays.filter(d => d !== key));
    } else {
      setSelectedDays([...selectedDays, key]);
    }
  };

  // Atajos para selección de días
  const selectAllDays = () => setSelectedDays(DAYS.map(d => d.key));
  const selectWeekends = () => setSelectedDays(['viernes', 'sabado', 'domingo']);
  const selectWeekdays = () => setSelectedDays(['lunes', 'martes', 'miercoles', 'jueves']);
  const clearDays = () => setSelectedDays([]);

  // Guardar y programar historia
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor ingresa un título o descripción para la historia.');
      return;
    }
    if (!mediaPreview) {
      setError('Debes cargar una imagen o video para la historia.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      let mediaUrl = mediaPreview;
      // Si tenemos archivo real y no es solo preview
      if (mediaFile) {
        const uploadResult = await uploadStoryMedia(mediaFile, progress => {
          setUploadProgress(progress);
        });
        mediaUrl = uploadResult.url;
      }

      const selectedCatObj = CATEGORIES.find(c => c.key === category);

      const newStory = {
        title: title.trim(),
        category,
        categoryLabel: selectedCatObj?.label || 'Historia',
        color: selectedCatObj?.color || '#f97316',
        mediaType,
        mediaUrl,
        days: selectedDays,
        time,
        repeatWeekly,
        active: true,
        platforms,
        createdAt: new Date().toISOString()
      };

      await onStoryCreated(newStory);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        // Reset form
        setTitle('');
        setMediaFile(null);
        setMediaPreview(null);
      }, 1500);
    } catch (err) {
      setError('Error al guardar la historia: ' + err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Columna Izquierda: Formulario de configuración (7 cols) */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-orange-500" />
            Programar Nueva Historia
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Asigná tu foto o video a los días y horarios que prefieras. Se publicará automáticamente todas las semanas.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3 text-sm">
            <Check className="w-5 h-5 flex-shrink-0" />
            <span>¡Historia guardada y programada en el calendario con éxito!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Cargar Archivo */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              1. Imagen o Video de la Historia (formato vertical 9:16 recomendado)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                mediaPreview
                  ? 'border-orange-500/50 bg-orange-500/5'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-850/50 hover:bg-slate-850'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4,video/quicktime"
                onChange={handleFileChange}
                className="hidden"
              />

              {mediaPreview ? (
                <div className="flex items-center justify-center gap-4">
                  <div className="w-14 h-24 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 flex-shrink-0">
                    {mediaType === 'video' ? (
                      <div className="w-full h-full flex items-center justify-center text-orange-400 bg-slate-900">
                        <Film className="w-6 h-6" />
                      </div>
                    ) : (
                      <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-200">
                      {mediaFile ? mediaFile.name : 'Archivo cargado'}
                    </p>
                    <p className="text-xs text-orange-400 mt-1">Hacé clic aquí si querés cambiarlo</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-orange-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-300">
                    Hacé clic para seleccionar o arrastrá tu imagen o video aquí
                  </p>
                  <p className="text-xs text-slate-500">Soporta JPG, PNG, MP4 (hasta 60 segundos)</p>
                </div>
              )}
            </div>
          </div>

          {/* 2. Título / Descripción */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              2. Nombre o referencia interna
            </label>
            <input
              type="text"
              placeholder="Ej: Promo 2x1 Muzza Martes, Carta Actualizada, Horarios Finde"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm"
            />
          </div>

          {/* 3. Categoría */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              3. Tipo de contenido
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {CATEGORIES.map(cat => (
                <button
                  type="button"
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    category === cat.key
                      ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/30'
                      : 'border-slate-800 bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-xs font-bold text-slate-200">{cat.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">{cat.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Días de la Semana */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-200">
                4. Días que se publicará
              </label>
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <button type="button" onClick={selectAllDays} className="text-orange-400 hover:underline">
                  Todos
                </button>
                <span className="text-slate-600">•</span>
                <button type="button" onClick={selectWeekends} className="text-orange-400 hover:underline">
                  Finde
                </button>
                <span className="text-slate-600">•</span>
                <button type="button" onClick={selectWeekdays} className="text-orange-400 hover:underline">
                  Lun-Jue
                </button>
                <span className="text-slate-600">•</span>
                <button type="button" onClick={clearDays} className="text-amber-400 hover:underline font-semibold">
                  Sin días (A demanda)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {DAYS.map(day => {
                const isSelected = selectedDays.includes(day.key);
                return (
                  <button
                    type="button"
                    key={day.key}
                    onClick={() => toggleDay(day.key)}
                    className={`py-2.5 rounded-xl text-center text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-750 hover:text-white'
                    }`}
                  >
                    <div>{day.short}</div>
                    <div className="text-[10px] font-normal opacity-80 hidden sm:block">{day.label.slice(0, 3)}</div>
                  </button>
                );
              })}
            </div>

            {selectedDays.length === 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs mt-2.5 flex items-center gap-2">
                <span>⚡</span>
                <span>
                  <strong>Modo A Demanda activado:</strong> La historia no tendrá días fijos asignados. Quedará lista en tu <strong>Biblioteca</strong> con un botón para publicarla al instante cuando vos quieras.
                </span>
              </div>
            )}
          </div>

          {/* 5. Horario y Repetición */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                5. Horario de publicación
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-orange-500 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                6. Repetición automática
              </label>
              <div
                onClick={() => setRepeatWeekly(!repeatWeekly)}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800 border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-medium text-slate-200">Todas las semanas</span>
                </div>
                <div
                  className={`w-10 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                    repeatWeekly ? 'bg-orange-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      repeatWeekly ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 7. Destinos */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              7. Redes de destino
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  platforms.instagram
                    ? 'bg-pink-500/10 border-pink-500/40 text-pink-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={platforms.instagram}
                  onChange={e => setPlatforms({ ...platforms, instagram: e.target.checked })}
                  className="rounded text-pink-500 focus:ring-0"
                />
                <Instagram className="w-4 h-4" />
                <span className="text-xs font-semibold">Instagram Stories</span>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  platforms.facebook
                    ? 'bg-blue-500/10 border-blue-500/40 text-blue-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={platforms.facebook}
                  onChange={e => setPlatforms({ ...platforms, facebook: e.target.checked })}
                  className="rounded text-blue-500 focus:ring-0"
                />
                <Facebook className="w-4 h-4" />
                <span className="text-xs font-semibold">Facebook Stories</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isUploading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-base shadow-xl shadow-orange-500/25 transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Guardando y subiendo archivo ({Math.round(uploadProgress)}%)...</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>
                  {selectedDays.length === 0
                    ? 'Guardar Historia (A Demanda / Sin Días Fijos)'
                    : 'Guardar y Programar Historia'}
                </span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Columna Derecha: Simulador de Historia en Smartphone (5 cols) */}
      <div className="lg:col-span-5 flex flex-col items-center">
        <div className="w-full max-w-[320px]">
          <div className="text-center mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Vista previa en tiempo real
            </span>
          </div>

          {/* Smartphone Frame (9:16 Aspect Ratio) */}
          <div className="relative aspect-[9/16] w-full rounded-[40px] border-[6px] border-slate-700 bg-black overflow-hidden shadow-2xl ring-1 ring-slate-800">
            {/* Top Speaker Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-full z-30" />

            {/* Media Content */}
            {mediaPreview ? (
              mediaType === 'video' ? (
                <video
                  src={mediaPreview}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img src={mediaPreview} alt="Story" className="w-full h-full object-cover" />
              )
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900 text-slate-500">
                <ImageIcon className="w-12 h-12 mb-3 text-slate-600" />
                <p className="text-xs font-medium">Cargá una foto o video para ver cómo lucirá en la historia</p>
              </div>
            )}

            {/* Story UI Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70 pointer-events-none flex flex-col justify-between p-4 z-20">
              {/* Top Progress bar & Header */}
              <div className="pt-4 space-y-2.5">
                {/* Progress bar */}
                <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                  <div className="w-1/2 h-full bg-white rounded-full animate-pulse" />
                </div>

                {/* Profile header */}
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center p-1 border-2 border-white/80">
                      <Pizza className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight drop-shadow">{restaurantName}</p>
                      <p className="text-[10px] text-white/80">{time} hs • Automático</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Caption Pill */}
              <div className="pb-4 space-y-2">
                {title && (
                  <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 text-white">
                    <p className="text-xs font-medium drop-shadow">{title}</p>
                  </div>
                )}
                {/* Mock reply bar */}
                <div className="h-9 rounded-full border border-white/40 bg-white/10 backdrop-blur-md px-4 flex items-center justify-between text-white/60 text-xs">
                  <span>Enviar mensaje...</span>
                  <span>❤️</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-slate-500">
              Así es como tus clientes verán la historia en Instagram y Facebook.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
