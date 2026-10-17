import React, { useState, useRef, useEffect } from 'react';
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
  Repeat,
  Pencil,
  X,
  RefreshCw,
  Folder
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
  { key: 'promo', label: 'Promoción', color: '#FFD700', desc: 'Descuentos, 2x1, combos especiales' },
  { key: 'menu', label: 'Carta / Menú', color: '#38bdf8', desc: 'Precios, variedades, pizzas del día' },
  { key: 'hours', label: 'Horarios', color: '#00E096', desc: 'Apertura, cierre, días festivos' },
  { key: 'news', label: 'Novedades', color: '#c084fc', desc: 'Lanzamientos, eventos especiales' }
];

export default function StoryCreator({ 
  onStoryCreated, 
  onStoryUpdated, 
  storyToEdit, 
  onCancelEdit,
  initialDay, 
  folders = [],
  categories = [],
  restaurantName = 'Pizzería María Belén' 
}) {
  const isEditing = Boolean(storyToEdit);

  const activeCategories = categories.length > 0
    ? categories.map(c => ({ key: c.id, label: c.name, color: '#FFD700', desc: `Categoría ${c.name}` }))
    : CATEGORIES;

  const [sourceType, setSourceType] = useState(
    storyToEdit?.sourceType || (storyToEdit?.folderId ? 'folder' : 'single')
  );
  const [selectedFolderId, setSelectedFolderId] = useState(
    storyToEdit?.folderId || (folders[0]?.id || '')
  );
  const [title, setTitle] = useState(storyToEdit?.title || '');
  const [category, setCategory] = useState(storyToEdit?.category || activeCategories[0]?.key || 'promo');
  const [selectedDays, setSelectedDays] = useState(
    storyToEdit ? (storyToEdit.days || []) : (initialDay ? [initialDay] : ['martes', 'jueves'])
  );
  const [time, setTime] = useState(storyToEdit?.time || '19:30');
  const [repeatWeekly, setRepeatWeekly] = useState(
    storyToEdit ? storyToEdit.repeatWeekly !== false : true
  );
  const [platforms, setPlatforms] = useState(
    storyToEdit?.platforms || { instagram: true, facebook: true }
  );

  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(storyToEdit?.mediaUrl || null);
  const [mediaType, setMediaType] = useState(storyToEdit?.mediaType || 'image');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef(null);

  // Sincronizar si cambia el storyToEdit
  useEffect(() => {
    if (storyToEdit) {
      setTitle(storyToEdit.title || '');
      setCategory(storyToEdit.category || 'promo');
      setSelectedDays(storyToEdit.days || []);
      setTime(storyToEdit.time || '19:30');
      setRepeatWeekly(storyToEdit.repeatWeekly !== false);
      setPlatforms(storyToEdit.platforms || { instagram: true, facebook: true });
      setMediaPreview(storyToEdit.mediaUrl || null);
      setMediaType(storyToEdit.mediaType || 'image');
      setSourceType(storyToEdit.sourceType || (storyToEdit.folderId ? 'folder' : 'single'));
      setSelectedFolderId(storyToEdit.folderId || (folders[0]?.id || ''));
      setMediaFile(null);
    }
  }, [storyToEdit, folders]);

  // Manejar selección de nuevo archivo
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

  const selectAllDays = () => setSelectedDays(DAYS.map(d => d.key));
  const selectWeekends = () => setSelectedDays(['viernes', 'sabado', 'domingo']);
  const selectWeekdays = () => setSelectedDays(['lunes', 'martes', 'miercoles', 'jueves']);
  const clearDays = () => setSelectedDays([]);

  // Guardar (Crear o Actualizar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor ingresa un título o descripción para la historia.');
      return;
    }

    const currentFolder = folders.find(f => f.id === selectedFolderId) || folders[0];

    if (sourceType === 'folder') {
      if (!currentFolder) {
        setError('Debes seleccionar una carpeta de productos.');
        return;
      }
      if (!currentFolder.items || currentFolder.items.length === 0) {
        setError(`La carpeta "${currentFolder.name}" aún no tiene fotos. Subí fotos en la pestaña "Carpetas" primero.`);
        return;
      }
    } else if (!mediaPreview && !mediaFile) {
      setError('Debes cargar una imagen o video para la historia.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      let mediaUrl = mediaPreview;
      let finalMediaType = mediaType;
      let folderId = null;
      let folderName = null;

      if (sourceType === 'folder' && currentFolder) {
        mediaUrl = currentFolder.items[0]?.url || '';
        finalMediaType = currentFolder.items[0]?.mediaType || 'image';
        folderId = currentFolder.id;
        folderName = currentFolder.name;
      } else if (mediaFile) {
        const uploadResult = await uploadStoryMedia(mediaFile, progress => {
          setUploadProgress(progress);
        });
        mediaUrl = uploadResult.url;
      }

      const selectedCatObj = activeCategories.find(c => c.key === category) || activeCategories[0];

      if (isEditing && onStoryUpdated) {
        const updatedStory = {
          ...storyToEdit,
          title: title.trim(),
          category,
          categoryLabel: selectedCatObj?.label || 'Historia',
          color: selectedCatObj?.color || '#FFD700',
          sourceType,
          folderId,
          folderName,
          mediaType: finalMediaType,
          mediaUrl,
          days: selectedDays,
          time,
          repeatWeekly,
          platforms,
          updatedAt: new Date().toISOString()
        };

        await onStoryUpdated(updatedStory);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          if (onCancelEdit) onCancelEdit();
        }, 1200);
      } else {
        const newStory = {
          title: title.trim(),
          category,
          categoryLabel: selectedCatObj?.label || 'Historia',
          color: selectedCatObj?.color || '#FFD700',
          sourceType,
          folderId,
          folderName,
          mediaType: finalMediaType,
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
          setTitle('');
          setMediaFile(null);
          setMediaPreview(null);
        }, 1500);
      }
    } catch (err) {
      setError('Error al procesar la historia: ' + err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Columna Izquierda: Formulario (7 cols) */}
      <div className="lg:col-span-7 bg-[#1E1E1E] border border-[rgba(255,255,255,0.08)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[rgba(255,215,0,0.15)] text-[#FFD700]">
                {isEditing ? <Pencil className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                {isEditing ? 'Editar Historia' : 'Programar Nueva Historia'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#AAAAAA] mt-1.5">
              {isEditing 
                ? 'Si cambiás la imagen o el horario, se actualizará automáticamente en todos los días donde esté programada.'
                : 'Asigná tu foto o video a los días y horarios que prefieras. El robot de la nube se encarga del resto.'}
            </p>
          </div>

          {isEditing && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2C2C2C] hover:bg-[#383838] text-[#AAAAAA] hover:text-white text-xs font-bold transition-all"
            >
              <X className="w-4 h-4" />
              <span>Cancelar</span>
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/30 text-[#FF6B6B] flex items-center gap-3 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-2xl bg-[#00E096]/10 border border-[#00E096]/30 text-[#00E096] flex items-center gap-3 text-xs sm:text-sm font-bold">
            <Check className="w-5 h-5 flex-shrink-0" />
            <span>
              {isEditing 
                ? '¡Historia actualizada correctamente en todos sus días!' 
                : '¡Historia guardada y programada en el calendario con éxito!'}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selector de Modo: Foto Fija vs Carpeta Rotativa */}
          <div>
            <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">
              Modo de Contenido
            </label>
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#121212] border border-[rgba(255,255,255,0.08)]">
              <button
                type="button"
                onClick={() => setSourceType('single')}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  sourceType === 'single'
                    ? 'bg-[#FFD700] text-black shadow-md'
                    : 'text-[#AAAAAA] hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Foto Fija</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSourceType('folder');
                  if (!selectedFolderId && folders.length > 0) {
                    setSelectedFolderId(folders[0].id);
                    if (!title) setTitle(folders[0].name);
                  }
                }}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  sourceType === 'folder'
                    ? 'bg-[#FFD700] text-black shadow-md'
                    : 'text-[#AAAAAA] hover:text-white'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Carpeta Rotativa</span>
              </button>
            </div>
          </div>

          {sourceType === 'folder' ? (
            <div>
              <label className="block text-xs sm:text-sm font-bold text-white mb-2">
                1. Seleccionar Carpeta de Productos
              </label>
              {folders.length === 0 ? (
                <div className="p-5 rounded-2xl bg-[#121212] border border-[rgba(255,255,255,0.08)] text-center space-y-2">
                  <Folder className="w-8 h-8 text-[#FFD700] mx-auto opacity-70" />
                  <p className="text-xs font-bold text-white">No tenés carpetas creadas todavía</p>
                  <p className="text-[11px] text-[#AAAAAA]">
                    Andá a la pestaña "Carpetas" en el menú para crear una (ej: Pizzas) y cargar fotos.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {folders.map(f => {
                      const isSel = (selectedFolderId || folders[0]?.id) === f.id;
                      const count = f.items?.length || 0;
                      return (
                        <div
                          key={f.id}
                          onClick={() => {
                            setSelectedFolderId(f.id);
                            if (!title || folders.some(fol => fol.name === title)) setTitle(f.name);
                          }}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                            isSel 
                              ? 'bg-[rgba(255,215,0,0.12)] border-[#FFD700] text-white shadow-md'
                              : 'bg-[#121212] border-[rgba(255,255,255,0.08)] text-[#AAAAAA] hover:border-[#FFD700]/30 hover:text-white'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-black/40 overflow-hidden flex items-center justify-center shrink-0">
                            {f.items?.[0]?.url ? (
                              <img src={f.items[0].url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Folder className="w-5 h-5 text-[#FFD700]" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-extrabold text-white truncate">{f.name}</p>
                            <p className="text-[11px] text-[#888888]">{count} fotos cargadas</p>
                          </div>
                          {isSel && <Check className="w-4 h-4 text-[#FFD700] shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-3 rounded-xl bg-[rgba(255,215,0,0.08)] border border-[rgba(255,215,0,0.2)] text-[11px] text-[#CCCCCC] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FFD700] shrink-0" />
                    <span>Cada día programado se publicará una foto aleatoria sin repetir hasta completar el ciclo.</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* 1. Imagen o Video Fijo */
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <span>1. Imagen o Video (formato 9:16 vertical)</span>
                </label>
                {mediaPreview && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-[#FFD700] hover:underline font-bold flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Cambiar archivo
                  </button>
                )}
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  mediaPreview
                    ? 'border-[#FFD700]/50 bg-[#FFD700]/5 hover:bg-[#FFD700]/10'
                    : 'border-[rgba(255,255,255,0.1)] hover:border-[#FFD700]/40 bg-[#121212] hover:bg-[#181818]'
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
                  <div className="flex items-center justify-center gap-5">
                    <div className="w-16 h-28 rounded-xl overflow-hidden bg-black border border-[rgba(255,255,255,0.15)] flex-shrink-0 shadow-lg">
                      {mediaType === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center text-[#FFD700] bg-[#121212]">
                          <Film className="w-7 h-7" />
                        </div>
                      ) : (
                        <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">
                        {mediaFile ? mediaFile.name : (isEditing ? 'Archivo actual de la historia' : 'Archivo cargado')}
                      </p>
                      <p className="text-xs text-[#00E096] font-semibold mt-1 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        {mediaFile ? 'Nuevo archivo seleccionado listo para subir' : 'Listo para publicar'}
                      </p>
                      <p className="text-xs text-[#AAAAAA] mt-2">
                        Tocá aquí si querés seleccionar otra foto o video desde tu dispositivo
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-[#1E1E1E] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#FFD700]">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-white">
                      Hacé clic para seleccionar tu foto o video
                    </p>
                    <p className="text-xs text-[#AAAAAA]">
                      Formatos recomendados: JPG, PNG o MP4 vertical (1080x1920 px)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. Título / Referencia */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-white mb-2">
              2. Nombre o referencia interna
            </label>
            <input
              type="text"
              placeholder="Ej: Promo 2x1 Muzza, Carta de Precios, Horarios Finde"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#121212] border border-[rgba(255,255,255,0.1)] text-white placeholder-[#666666] focus:outline-none focus:border-[#FFD700] text-sm font-medium transition-colors"
            />
          </div>

          {/* 3. Categoría */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-white mb-2">
              3. Tipo de contenido
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {activeCategories.map(cat => {
                const isSelected = category === cat.key;
                return (
                  <button
                    type="button"
                    key={cat.key}
                    onClick={() => setCategory(cat.key)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#FFD700] bg-[rgba(255,215,0,0.1)] shadow-sm'
                        : 'border-[rgba(255,255,255,0.08)] bg-[#121212] hover:border-[rgba(255,255,255,0.2)]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className={`text-xs font-bold ${isSelected ? 'text-[#FFD700]' : 'text-white'}`}>
                        {cat.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#AAAAAA] leading-tight">{cat.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Días de la Semana */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs sm:text-sm font-bold text-white">
                4. Días que se publicará
              </label>
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <button type="button" onClick={selectAllDays} className="text-[#FFD700] hover:underline font-bold">
                  Todos
                </button>
                <span className="text-[#444444]">•</span>
                <button type="button" onClick={selectWeekends} className="text-[#FFD700] hover:underline font-bold">
                  Finde
                </button>
                <span className="text-[#444444]">•</span>
                <button type="button" onClick={selectWeekdays} className="text-[#FFD700] hover:underline font-bold">
                  Lun-Jue
                </button>
                <span className="text-[#444444]">•</span>
                <button type="button" onClick={clearDays} className="text-[#AAAAAA] hover:text-white hover:underline font-semibold">
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
                    className={`py-3 rounded-xl text-center text-xs font-extrabold transition-all ${
                      isSelected
                        ? 'bg-[#FFD700] text-black shadow-md shadow-[rgba(255,215,0,0.2)]'
                        : 'bg-[#121212] text-[#AAAAAA] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)] hover:text-white'
                    }`}
                  >
                    <div>{day.short}</div>
                    <div className="text-[10px] font-normal opacity-80 hidden sm:block">{day.label.slice(0, 3)}</div>
                  </button>
                );
              })}
            </div>

            {selectedDays.length === 0 && (
              <div className="p-3.5 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-xs mt-3 flex items-center gap-2">
                <span>⚡</span>
                <span>
                  <strong>Modo A Demanda:</strong> No tiene días fijos. Quedará en tu <strong>Biblioteca</strong> y en la base del calendario para que puedas publicarla cuando vos quieras con un clic.
                </span>
              </div>
            )}
          </div>

          {/* 5. Horario y Repetición */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-white mb-2">
                5. Horario de publicación
              </label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#121212] border border-[rgba(255,255,255,0.1)] text-white focus:outline-none focus:border-[#FFD700] text-sm font-bold tracking-wider"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-white mb-2">
                6. Repetición automática
              </label>
              <div
                onClick={() => setRepeatWeekly(!repeatWeekly)}
                className="flex items-center justify-between p-3 rounded-xl bg-[#121212] border border-[rgba(255,255,255,0.1)] cursor-pointer hover:border-[rgba(255,255,255,0.2)] transition-colors h-[46px]"
              >
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-[#FFD700]" />
                  <span className="text-xs font-bold text-white">Todas las semanas</span>
                </div>
                <div
                  className={`w-10 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                    repeatWeekly ? 'bg-[#FFD700]' : 'bg-[#2C2C2C]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-transform ${
                      repeatWeekly ? 'bg-black translate-x-5' : 'bg-white translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 7. Destinos */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-white mb-2">
              7. Destinos de publicación
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  platforms.instagram
                    ? 'bg-[#121212] border-[#FFD700] text-white shadow-sm'
                    : 'bg-[#121212] border-[rgba(255,255,255,0.08)] text-[#666666]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={platforms.instagram}
                  onChange={e => setPlatforms({ ...platforms, instagram: e.target.checked })}
                  className="rounded text-[#FFD700] focus:ring-0 accent-[#FFD700]"
                />
                <Instagram className="w-4 h-4 text-[#FFD700]" />
                <span className="text-xs font-bold">Instagram Stories</span>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  platforms.facebook
                    ? 'bg-[#121212] border-[#FFD700] text-white shadow-sm'
                    : 'bg-[#121212] border-[rgba(255,255,255,0.08)] text-[#666666]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={platforms.facebook}
                  onChange={e => setPlatforms({ ...platforms, facebook: e.target.checked })}
                  className="rounded text-[#FFD700] focus:ring-0 accent-[#FFD700]"
                />
                <Facebook className="w-4 h-4 text-[#FFD700]" />
                <span className="text-xs font-bold">Facebook Stories</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isUploading}
              className="flex-1 py-3.5 rounded-2xl bg-[#FFD700] hover:bg-[#E6C200] text-black font-extrabold text-sm sm:text-base shadow-xl shadow-[rgba(255,215,0,0.25)] transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Subiendo y guardando ({Math.round(uploadProgress)}%)...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>
                    {isEditing 
                      ? 'Actualizar Historia (Aplica a todos los días)' 
                      : (selectedDays.length === 0
                          ? 'Guardar Historia (A Demanda / Sin Días Fijos)'
                          : 'Guardar y Programar Historia')}
                  </span>
                </>
              )}
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="px-5 py-3.5 rounded-2xl bg-[#2C2C2C] hover:bg-[#383838] text-white font-bold text-sm transition-all"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Columna Derecha: Smartphone Preview (5 cols) */}
      <div className="lg:col-span-5 flex flex-col items-center">
        <div className="w-full max-w-[320px]">
          <div className="text-center mb-3">
            <span className="text-[11px] font-bold text-[#AAAAAA] uppercase tracking-wider">
              Vista previa en tiempo real
            </span>
          </div>

          {/* Smartphone Frame (9:16 Aspect Ratio) */}
          <div className="relative aspect-[9/16] w-full rounded-[42px] border-[7px] border-[#2C2C2C] bg-black overflow-hidden shadow-2xl ring-1 ring-[rgba(255,255,255,0.1)]">
            {/* Top Speaker Notch */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-[#1E1E1E] rounded-full z-30" />

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
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#181818] via-[#121212] to-[#181818] text-[#666666]">
                <ImageIcon className="w-12 h-12 mb-3 text-[#444444]" />
                <p className="text-xs font-semibold text-[#888888]">
                  Cargá una foto o video para ver cómo se verá en la historia de Instagram y Facebook
                </p>
              </div>
            )}

            {/* Story UI Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80 pointer-events-none flex flex-col justify-between p-4 z-20">
              {/* Top Progress bar & Header */}
              <div className="pt-4 space-y-2.5">
                {/* Progress bar */}
                <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                  <div className="w-1/2 h-full bg-[#FFD700] rounded-full animate-pulse" />
                </div>

                {/* Profile header */}
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFD700] to-[#E6C200] flex items-center justify-center p-1 border border-white/80 shadow-md">
                      <Pizza className="w-4 h-4 text-black" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold leading-tight drop-shadow">{restaurantName}</p>
                      <p className="text-[10px] text-white/80">{time} hs • Programador</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Caption Pill */}
              <div className="pb-4 space-y-2">
                {title && (
                  <div className="bg-black/70 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/10 text-white shadow-lg">
                    <p className="text-xs font-semibold drop-shadow">{title}</p>
                  </div>
                )}
                <div className="h-9 rounded-full border border-white/30 bg-white/10 backdrop-blur-md px-4 flex items-center justify-between text-white/70 text-xs font-medium">
                  <span>Enviar mensaje...</span>
                  <span>❤️</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-[11px] text-[#888888]">
              Simulación de visualización de tus clientes en redes sociales.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
