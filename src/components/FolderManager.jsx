import React, { useState } from 'react';
import { 
  Folder, FolderPlus, ArrowLeft, Upload, Trash2, RotateCcw, 
  Sparkles, CheckCircle2, Clock, Image as ImageIcon, AlertCircle
} from 'lucide-react';
import { uploadToCloudinary } from '../services/cloudinary';

const CATEGORIES = [
  { id: 'pizzas', label: 'Pizzas 🍕' },
  { id: 'hamburguesas', label: 'Hamburguesas 🍔' },
  { id: 'empanadas', label: 'Empanadas 🥟' },
  { id: 'lomitos', label: 'Lomitos 🥪' },
  { id: 'promos', label: 'Promos / Combos 🏷️' },
  { id: 'postres', label: 'Bebidas / Postres 🥤' },
  { id: 'otro', label: 'General / Otro 📦' }
];

export default function FolderManager({ folders = [], onSave, onDelete, onResetCycle }) {
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderCategory, setNewFolderCategory] = useState('pizzas');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const newFolder = {
      name: newFolderName.trim(),
      category: newFolderCategory,
      description: newFolderDesc.trim(),
      items: [],
      usedItemIds: [],
      createdAt: new Date().toISOString()
    };

    await onSave(newFolder);
    setNewFolderName('');
    setNewFolderDesc('');
    setIsCreating(false);
  };

  const handleUploadPhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !selectedFolder) return;

    setUploading(true);
    setUploadProgress(0);
    const newItems = [...(selectedFolder.items || [])];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const uploadResult = await uploadToCloudinary(file);
        newItems.push({
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          url: uploadResult.secure_url || uploadResult.url,
          name: file.name.replace(/\.[^/.]+$/, ''),
          mediaType: file.type.startsWith('video/') ? 'video' : 'image',
          addedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error subiendo archivo a Cloudinary:', err);
      }
      setUploadProgress(Math.round(((i + 1) / files.length) * 100));
    }

    await onSave({ ...selectedFolder, items: newItems });
    setUploading(false);
    setUploadProgress(0);
    e.target.value = '';
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('¿Eliminar esta foto de la carpeta?')) return;
    const filteredItems = (selectedFolder.items || []).filter(it => it.id !== itemId);
    const filteredUsed = (selectedFolder.usedItemIds || []).filter(id => id !== itemId);
    await onSave({ ...selectedFolder, items: filteredItems, usedItemIds: filteredUsed });
  };

  // VISTA DETALLE DE CARPETA
  if (selectedFolder) {
    const items = selectedFolder.items || [];
    const usedIds = selectedFolder.usedItemIds || [];
    const availableCount = items.length - usedIds.length;

    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="bg-[#1E1E1E] p-6 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedFolderId(null)}
              className="p-2.5 rounded-2xl bg-[#121212] hover:bg-[#2C2C2C] text-[#AAAAAA] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">📁</span>
                <h1 className="text-xl font-black text-white">{selectedFolder.name}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[rgba(255,215,0,0.15)] text-[#FFD700] font-bold">
                  {CATEGORIES.find(c => c.id === selectedFolder.category)?.label || selectedFolder.category}
                </span>
              </div>
              <p className="text-xs text-[#AAAAAA] mt-1">
                {selectedFolder.description || 'Carpeta rotativa de contenido inteligente'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onResetCycle(selectedFolder.id)}
              title="Reiniciar ciclo para que todas las fotos vuelvan a estar disponibles"
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#121212] hover:bg-[#2C2C2C] text-xs font-bold text-[#CCCCCC] border border-[rgba(255,255,255,0.08)] transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-[#FFD700]" />
              <span>Reiniciar Ciclo</span>
            </button>

            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFD700] hover:bg-[#E6C200] text-black font-extrabold text-xs cursor-pointer shadow-md shadow-[rgba(255,215,0,0.2)] transition-all">
              <Upload className="w-4 h-4" />
              <span>{uploading ? `Subiendo (${uploadProgress}%)` : 'Subir Fotos'}</span>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleUploadPhotos}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Barra de estado del ciclo */}
        <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-[rgba(255,255,255,0.08)] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#CCCCCC]">
            <Sparkles className="w-4 h-4 text-[#FFD700]" />
            <span>
              <strong>{items.length}</strong> fotos en total • <strong>{usedIds.length}</strong> ya emitidas en este ciclo • <strong>{availableCount}</strong> pendientes
            </span>
          </div>
          <span className="text-[11px] text-[#888888]">
            Al emitir las {items.length} fotos, el ciclo se reinicia automáticamente sin repetir.
          </span>
        </div>

        {/* Grilla de fotos */}
        {items.length === 0 ? (
          <div className="bg-[#1E1E1E] rounded-3xl p-12 text-center border border-[rgba(255,255,255,0.08)] space-y-3">
            <ImageIcon className="w-12 h-12 text-[#444444] mx-auto" />
            <h3 className="text-base font-bold text-white">Esta carpeta está vacía</h3>
            <p className="text-xs text-[#888888] max-w-sm mx-auto">
              Subí varias fotos de este producto para que el sistema empiece a rotarlas de forma automática cada día.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((item) => {
              const isUsed = usedIds.includes(item.id);
              return (
                <div 
                  key={item.id}
                  className="group relative bg-[#1E1E1E] rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.08)] hover:border-[#FFD700]/50 transition-all shadow-md aspect-[9/16] flex flex-col"
                >
                  <img 
                    src={item.url} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

                  {/* Estado emitida / pendiente */}
                  <div className="absolute top-2 left-2 z-10">
                    {isUsed ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00E096]/20 border border-[#00E096]/40 text-[#00E096] backdrop-blur-md">
                        <CheckCircle2 className="w-3 h-3" /> Emitida
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(255,215,0,0.2)] border border-[#FFD700]/40 text-[#FFD700] backdrop-blur-md">
                        <Clock className="w-3 h-3" /> Pendiente
                      </span>
                    )}
                  </div>

                  {/* Botón eliminar */}
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-xl bg-black/60 hover:bg-[#FF3B30] text-white transition-colors opacity-0 group-hover:opacity-100 z-10"
                    title="Eliminar foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="absolute bottom-2 left-2 right-2 z-10">
                    <p className="text-[11px] font-bold text-white truncate drop-shadow">{item.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // VISTA LISTADO DE CARPETAS
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-[#1E1E1E] p-6 sm:p-8 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[rgba(255,215,0,0.15)] text-[#FFD700]">
              <Folder className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Carpetas de Contenido Inteligente
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#AAAAAA] mt-1.5">
            Agrupá fotos por producto (Pizzas, Hamburguesas, etc.). Cada día el robot elegirá una foto aleatoria sin repetir.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFD700] hover:bg-[#E6C200] text-black font-extrabold text-xs shadow-md shadow-[rgba(255,215,0,0.2)] transition-all self-start sm:self-auto"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Nueva Carpeta</span>
        </button>
      </div>

      {/* Modal crear carpeta */}
      {isCreating && (
        <div className="bg-[#1E1E1E] p-6 rounded-3xl border border-[#FFD700]/30 shadow-2xl space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-[#FFD700]" />
            <span>Crear Nueva Carpeta de Productos</span>
          </h3>

          <form onSubmit={handleCreateFolder} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
                  Nombre de la Carpeta
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Hamburguesas Especiales"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#121212] border border-[rgba(255,255,255,0.08)] text-sm text-white focus:outline-none focus:border-[#FFD700] font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
                  Categoría
                </label>
                <select
                  value={newFolderCategory}
                  onChange={e => setNewFolderCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#121212] border border-[rgba(255,255,255,0.08)] text-sm text-white focus:outline-none focus:border-[#FFD700] font-semibold"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
                Descripción (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Banco de 15 fotos de hamburguesas para rotar los mediodías"
                value={newFolderDesc}
                onChange={e => setNewFolderDesc(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#121212] border border-[rgba(255,255,255,0.08)] text-sm text-white focus:outline-none focus:border-[#FFD700]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl bg-[#121212] text-xs font-bold text-[#AAAAAA] hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#FFD700] hover:bg-[#E6C200] text-black font-extrabold text-xs shadow-md transition-all"
              >
                Crear Carpeta
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grilla de carpetas */}
      {folders.length === 0 ? (
        <div className="bg-[#1E1E1E] rounded-3xl p-12 text-center border border-[rgba(255,255,255,0.08)] space-y-4">
          <Folder className="w-12 h-12 text-[#444444] mx-auto" />
          <h3 className="text-base font-bold text-white">No tenés carpetas de contenido creadas</h3>
          <p className="text-xs text-[#888888] max-w-sm mx-auto">
            Creá tu primera carpeta (ej: Pizzas) y subí varias fotos para que el robot las publique de forma rotativa y automática.
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="px-5 py-2.5 rounded-xl bg-[#FFD700] text-black font-extrabold text-xs inline-flex items-center gap-2"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Crear mi primera carpeta</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {folders.map(folder => {
            const count = folder.items?.length || 0;
            const usedCount = folder.usedItemIds?.length || 0;
            const percent = count > 0 ? Math.round((usedCount / count) * 100) : 0;
            const firstPhoto = folder.items?.[0]?.url;

            return (
              <div
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                className="group bg-[#1E1E1E] rounded-3xl p-5 border border-[rgba(255,255,255,0.08)] hover:border-[#FFD700]/50 transition-all cursor-pointer shadow-lg hover:shadow-2xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#121212] border border-[rgba(255,255,255,0.08)] flex items-center justify-center overflow-hidden shrink-0">
                      {firstPhoto ? (
                        <img src={firstPhoto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Folder className="w-6 h-6 text-[#FFD700]" />
                      )}
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[rgba(255,215,0,0.1)] text-[#FFD700] border border-[#FFD700]/20">
                      {CATEGORIES.find(c => c.id === folder.category)?.label || folder.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-white group-hover:text-[#FFD700] transition-colors">
                      {folder.name}
                    </h3>
                    <p className="text-xs text-[#888888] line-clamp-1 mt-0.5">
                      {folder.description || `${count} fotos para rotación`}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[rgba(255,255,255,0.06)] space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-white">{count} {count === 1 ? 'foto' : 'fotos'}</span>
                    <span className="text-[#00E096]">{usedCount} emitidas ({percent}%)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#121212] overflow-hidden">
                    <div 
                      className="h-full bg-[#FFD700] transition-all duration-300" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
