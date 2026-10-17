import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Film, 
  Image as ImageIcon, 
  Clock, 
  Check, 
  AlertCircle, 
  Pencil,
  Repeat,
  RefreshCw,
  Folder
} from 'lucide-react';
import { Instagram, Facebook } from './SocialIcons';
import { uploadStoryMedia } from '../services/firebase';
import { getFolderMediaInfo } from './StoryCreator';

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
  { key: 'promo', label: 'Promoción', color: '#FFD700', desc: 'Descuentos, 2x1, combos' },
  { key: 'menu', label: 'Carta / Menú', color: '#38bdf8', desc: 'Precios, variedades, pizzas' },
  { key: 'hours', label: 'Horarios', color: '#00E096', desc: 'Apertura, cierre, feriados' },
  { key: 'news', label: 'Novedades', color: '#c084fc', desc: 'Lanzamientos, eventos' }
];

export default function EditStoryModal({ story, onClose, onSave, folders = [], categories = [] }) {
  if (!story) return null;

  const activeCategories = categories.length > 0
    ? categories.map(c => ({ key: c.id, label: c.name, color: '#FFD700', desc: c.name }))
    : CATEGORIES;

  const [sourceType, setSourceType] = useState(
    story.sourceType || (story.folderId ? 'folder' : 'single')
  );
  const [selectedFolderId, setSelectedFolderId] = useState(
    story.folderId || (folders[0]?.id || '')
  );
  const [title, setTitle] = useState(story.title || '');
  const [category, setCategory] = useState(story.category || activeCategories[0]?.key || 'promo');
  const [selectedDays, setSelectedDays] = useState(story.days || []);
  const [time, setTime] = useState(story.time || '19:30');
  const [repeatWeekly, setRepeatWeekly] = useState(story.repeatWeekly !== false);
  const [platforms, setPlatforms] = useState(story.platforms || { instagram: true, facebook: true });

  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(story.mediaUrl);
  const [mediaType, setMediaType] = useState(story.mediaType || 'image');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|m4v|avi|webm|mkv)$/i.test(file.name);
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|heic)$/i.test(file.name);

    if (!isVideo && !isImage) {
      setError('Por favor selecciona una imagen (JPG, PNG) o video (MP4, MOV).');
      return;
    }

    setError(null);
    setMediaFile(file);
    setMediaType(isVideo ? 'video' : 'image');

    const reader = new FileReader();
    reader.onload = () => setMediaPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const toggleDay = (key) => {
    if (selectedDays.includes(key)) {
      setSelectedDays(selectedDays.filter(d => d !== key));
    } else {
      setSelectedDays([...selectedDays, key]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor ingresa un título o descripción.');
      return;
    }

    const currentFolder = folders.find(f => f.id === selectedFolderId) || folders[0];

    if (sourceType === 'folder') {
      if (!currentFolder) {
        setError('Debes seleccionar una carpeta de productos.');
        return;
      }
      const folderMedia = getFolderMediaInfo(currentFolder);
      if (!folderMedia.hasMedia) {
        setError(`La carpeta "${currentFolder.name}" aún no tiene fotos ni packs. Subí contenido en la pestaña "Carpetas" primero.`);
        return;
      }
    } else if (!mediaPreview && !mediaFile) {
      setError('La historia debe contener una imagen o video.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      let mediaUrl = story.mediaUrl;
      let finalMediaType = mediaType;
      let folderId = null;
      let folderName = null;

      if (sourceType === 'folder' && currentFolder) {
        const folderMedia = getFolderMediaInfo(currentFolder);
        mediaUrl = folderMedia.previewUrl || story.mediaUrl;
        finalMediaType = folderMedia.mediaType || 'image';
        folderId = currentFolder.id;
        folderName = currentFolder.name;
      } else if (mediaFile) {
        const uploadResult = await uploadStoryMedia(mediaFile, progress => {
          setUploadProgress(progress);
        });
        mediaUrl = uploadResult.url;
      }

      const selectedCatObj = activeCategories.find(c => c.key === category) || activeCategories[0];

      const updatedStory = {
        ...story,
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

      await onSave(updatedStory);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      setError('Error al actualizar: ' + err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl bg-[#1E1E1E] border border-[rgba(255,255,255,0.08)] rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[rgba(255,255,255,0.06)] mb-6">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[rgba(255,215,0,0.15)] text-[#FFD700]">
              <Pencil className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-white">Editar Historia</h2>
              <p className="text-xs text-[#AAAAAA]">
                Cualquier cambio (incluyendo la foto) se actualizará en todos los días programados.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#121212] hover:bg-[#2C2C2C] text-[#AAAAAA] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/30 text-[#FF6B6B] flex items-center gap-2 text-xs font-bold mb-5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-[#00E096]/10 border border-[#00E096]/30 text-[#00E096] flex items-center gap-2 text-xs font-bold mb-5">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>¡Historia actualizada con éxito en todos sus días!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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
              <label className="block text-xs font-bold text-white mb-2">Carpeta de Productos</label>
              {folders.length === 0 ? (
                <p className="text-xs text-[#888888] p-3 rounded-xl bg-[#121212]">
                  No hay carpetas creadas. Creá una en la pestaña Carpetas.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {folders.map(f => {
                    const isSel = (selectedFolderId || folders[0]?.id) === f.id;
                    const fInfo = getFolderMediaInfo(f);
                    return (
                      <div
                        key={f.id}
                        onClick={() => setSelectedFolderId(f.id)}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                          isSel
                            ? 'bg-[rgba(255,215,0,0.12)] border-[#FFD700] text-white shadow-md'
                            : 'bg-[#121212] border-[rgba(255,255,255,0.08)] text-[#AAAAAA] hover:text-white'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-black/40 overflow-hidden flex items-center justify-center shrink-0">
                          {fInfo.previewUrl ? (
                            <img src={fInfo.previewUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Folder className="w-4 h-4 text-[#FFD700]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate text-white">{f.name}</p>
                          <p className="text-[10px] text-[#888888]">
                            {fInfo.isSingle 
                              ? `${fInfo.count} fotos individuales` 
                              : `${fInfo.packsCount} ${fInfo.packsCount === 1 ? 'pack' : 'packs'} (${fInfo.count} fotos)`}
                          </p>
                        </div>
                        {isSel && <Check className="w-3.5 h-3.5 text-[#FFD700]" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Imagen / Video */
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-white">Archivo Multimedia (9:16 vertical)</label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-[#FFD700] hover:underline font-bold flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Cambiar Imagen / Video
                </button>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#FFD700]/30 hover:border-[#FFD700] rounded-2xl p-4 bg-[#121212] cursor-pointer flex items-center gap-4 transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/mp4,video/quicktime"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-16 h-28 rounded-xl overflow-hidden bg-black border border-[rgba(255,255,255,0.1)] flex-shrink-0 shadow-md">
                  {mediaType === 'video' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#FFD700] bg-[#181818] text-[9px] font-bold">
                      <Film className="w-6 h-6 mb-1" />
                      <span>Video</span>
                    </div>
                  ) : (
                    <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {mediaFile ? mediaFile.name : 'Imagen actual de la historia'}
                  </p>
                  <p className="text-xs text-[#00E096] font-semibold mt-1">
                    {mediaFile ? '✅ Archivo nuevo seleccionado (se subirá al guardar)' : 'Lista en el sistema'}
                  </p>
                  <p className="text-[11px] text-[#888888] mt-1.5">
                    Hacé clic para cambiar la foto si querés corregir algo
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Nombre / Título */}
          <div>
            <label className="block text-xs font-bold text-white mb-1.5">Nombre de la historia</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#121212] border border-[rgba(255,255,255,0.08)] text-white text-sm font-semibold focus:outline-none focus:border-[#FFD700]"
            />
          </div>

          {/* Días de la semana */}
          <div>
            <label className="block text-xs font-bold text-white mb-2">Días que se publicará</label>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {DAYS.map(d => {
                const isSelected = selectedDays.includes(d.key);
                return (
                  <button
                    type="button"
                    key={d.key}
                    onClick={() => toggleDay(d.key)}
                    className={`py-2 rounded-xl text-xs font-black transition-all ${
                      isSelected
                        ? 'bg-[#FFD700] text-black shadow-md shadow-[rgba(255,215,0,0.2)]'
                        : 'bg-[#121212] text-[#888888] border border-[rgba(255,255,255,0.06)] hover:text-white'
                    }`}
                  >
                    {d.short}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Horario & Repetición */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white mb-1.5">Horario</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#121212] border border-[rgba(255,255,255,0.08)] text-white text-sm font-bold focus:outline-none focus:border-[#FFD700]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white mb-1.5">Repetición</label>
              <div
                onClick={() => setRepeatWeekly(!repeatWeekly)}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#121212] border border-[rgba(255,255,255,0.08)] cursor-pointer h-[42px]"
              >
                <span className="text-xs font-bold text-white">Todas las semanas</span>
                <div className={`w-9 h-5 rounded-full relative flex items-center px-0.5 ${repeatWeekly ? 'bg-[#FFD700]' : 'bg-[#2C2C2C]'}`}>
                  <div className={`w-4 h-4 rounded-full transition-transform ${repeatWeekly ? 'bg-black translate-x-4' : 'bg-white translate-x-0'}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[rgba(255,255,255,0.06)]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-[#121212] hover:bg-[#2C2C2C] text-[#AAAAAA] hover:text-white text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-2.5 rounded-xl bg-[#FFD700] hover:bg-[#E6C200] text-black font-extrabold text-xs sm:text-sm shadow-md shadow-[rgba(255,215,0,0.25)] flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Guardando ({Math.round(uploadProgress)}%)...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
