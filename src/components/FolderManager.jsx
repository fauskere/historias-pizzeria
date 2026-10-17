import React, { useState } from 'react';
import { 
  Folder, FolderPlus, ArrowLeft, Upload, Trash2, RotateCcw, 
  Sparkles, CheckCircle2, Clock, Layers, Plus, ArrowUp, ArrowDown, Tag, X
} from 'lucide-react';
import { uploadToCloudinary } from '../services/cloudinary';

export default function FolderManager({ 
  folders = [], 
  categories = [],
  onSave, 
  onDelete, 
  onResetCycle,
  onSaveCategory,
  onDeleteCategory
}) {
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderCategory, setNewFolderCategory] = useState(categories[0]?.id || 'pizzas');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [newFolderMode, setNewFolderMode] = useState('single'); // 'single' o 'packs'

  // Gestión de categorías personalizadas
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Gestión de packs o fotos dentro de una carpeta
  const [isCreatingPack, setIsCreatingPack] = useState(false);
  const [newPackName, setNewPackName] = useState('');
  const [uploadingPackId, setUploadingPackId] = useState(null);
  const [isUploadingSingle, setIsUploadingSingle] = useState(false);

  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  // Modo de la carpeta: 'single' (fotos individuales) o 'packs' (secuencias)
  const isSingleMode = selectedFolder?.mode === 'single' || (
    selectedFolder && (!selectedFolder.packs || selectedFolder.packs.length === 0) && selectedFolder.mode !== 'packs'
  );

  const currentPacks = selectedFolder?.packs || [];
  const usedPacks = selectedFolder?.usedPackIds || [];
  const currentItems = selectedFolder?.items || [];
  const usedItems = selectedFolder?.usedItemIds || [];

  // Crear Carpeta
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const newFolder = {
      name: newFolderName.trim(),
      category: newFolderCategory,
      description: newFolderDesc.trim(),
      mode: newFolderMode,
      packs: [],
      items: [],
      usedPackIds: [],
      usedItemIds: [],
      createdAt: new Date().toISOString()
    };

    await onSave(newFolder);
    setNewFolderName('');
    setNewFolderDesc('');
    setNewFolderMode('single');
    setIsCreatingFolder(false);
  };

  // Crear Categoría Personalizada
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const cat = {
      id: `cat_${Date.now()}`,
      name: newCatName.trim()
    };
    if (onSaveCategory) await onSaveCategory(cat);
    setNewFolderCategory(cat.id);
    setNewCatName('');
  };

  // Crear Pack dentro de la Carpeta
  const handleCreatePack = async (e) => {
    e.preventDefault();
    if (!newPackName.trim() || !selectedFolder) return;

    const newPack = {
      id: `pack_${Date.now()}`,
      name: newPackName.trim(),
      images: [],
      createdAt: new Date().toISOString()
    };

    const updatedPacks = [...currentPacks, newPack];
    await onSave({ ...selectedFolder, packs: updatedPacks });
    setNewPackName('');
    setIsCreatingPack(false);
  };

  // Eliminar Pack
  const handleDeletePack = async (packId) => {
    if (!window.confirm('¿Eliminar este pack completo y sus historias?')) return;
    const filtered = currentPacks.filter(p => p.id !== packId);
    const filteredUsed = usedPacks.filter(id => id !== packId);
    await onSave({ ...selectedFolder, packs: filtered, usedPackIds: filteredUsed });
  };

  // Subir fotos a un Pack (en orden)
  const handleUploadToPack = async (packId, e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !selectedFolder) return;

    setUploadingPackId(packId);
    const targetPack = currentPacks.find(p => p.id === packId);
    if (!targetPack) return;

    const newImages = [...(targetPack.images || [])];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const uploadResult = await uploadToCloudinary(file);
        newImages.push({
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          url: uploadResult.secure_url || uploadResult.url,
          name: file.name.replace(/\.[^/.]+$/, ''),
          order: newImages.length + 1,
          mediaType: file.type.startsWith('video/') ? 'video' : 'image',
          addedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error subiendo foto al pack:', err);
      }
    }

    const updatedPacks = currentPacks.map(p => p.id === packId ? { ...p, images: newImages } : p);
    await onSave({ ...selectedFolder, packs: updatedPacks });
    setUploadingPackId(null);
    e.target.value = '';
  };

  // Mover orden de foto en el pack
  const handleMoveImage = async (packId, imgIndex, direction) => {
    const targetPack = currentPacks.find(p => p.id === packId);
    if (!targetPack) return;

    const images = [...targetPack.images];
    const targetIndex = direction === 'up' ? imgIndex - 1 : imgIndex + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const temp = images[imgIndex];
    images[imgIndex] = images[targetIndex];
    images[targetIndex] = temp;

    const reordered = images.map((img, idx) => ({ ...img, order: idx + 1 }));
    const updatedPacks = currentPacks.map(p => p.id === packId ? { ...p, images: reordered } : p);
    await onSave({ ...selectedFolder, packs: updatedPacks });
  };

  // Eliminar foto del pack
  const handleDeleteImageFromPack = async (packId, imgId) => {
    const targetPack = currentPacks.find(p => p.id === packId);
    if (!targetPack) return;

    const filtered = (targetPack.images || [])
      .filter(img => img.id !== imgId)
      .map((img, idx) => ({ ...img, order: idx + 1 }));

    const updatedPacks = currentPacks.map(p => p.id === packId ? { ...p, images: filtered } : p);
    await onSave({ ...selectedFolder, packs: updatedPacks });
  };

  // Subir fotos individuales directamente a la carpeta
  const handleUploadSingleImages = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !selectedFolder) return;

    setIsUploadingSingle(true);
    const newItems = [...currentItems];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const uploadResult = await uploadToCloudinary(file);
        newItems.push({
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          url: uploadResult.secure_url || uploadResult.url,
          name: file.name.replace(/\.[^/.]+$/, ''),
          mediaType: file.type.startsWith('video/') ? 'video' : 'image',
          addedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error subiendo foto:', err);
      }
    }

    await onSave({ ...selectedFolder, items: newItems });
    setIsUploadingSingle(false);
    e.target.value = '';
  };

  // Eliminar foto individual
  const handleDeleteSingleImage = async (imgId) => {
    if (!window.confirm('¿Eliminar esta foto de la carpeta?')) return;
    const filtered = currentItems.filter(it => it.id !== imgId);
    const filteredUsed = usedItems.filter(id => id !== imgId);
    await onSave({ ...selectedFolder, items: filtered, usedItemIds: filteredUsed });
  };

  // Alternar modo de carpeta
  const handleToggleMode = async (mode) => {
    await onSave({ ...selectedFolder, mode });
  };

  // VISTA DETALLE DE CARPETA
  if (selectedFolder) {
    const totalCount = isSingleMode ? currentItems.length : currentPacks.length;
    const usedCount = isSingleMode ? usedItems.length : usedPacks.length;
    const pendingCount = Math.max(0, totalCount - usedCount);

    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
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
                  {categories.find(c => c.id === selectedFolder.category)?.name || selectedFolder.category}
                </span>
              </div>
              <p className="text-xs text-[#AAAAAA] mt-1">
                {selectedFolder.description || (isSingleMode ? 'Fotos individuales para rotar 1 por día' : 'Packs y secuencias de historias')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Toggle Modo */}
            <div className="flex bg-[#121212] p-1 rounded-xl border border-[rgba(255,255,255,0.08)]">
              <button
                type="button"
                onClick={() => handleToggleMode('single')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isSingleMode ? 'bg-[#FFD700] text-black shadow' : 'text-[#AAAAAA] hover:text-white'
                }`}
              >
                🍕 Fotos Sueltas
              </button>
              <button
                type="button"
                onClick={() => handleToggleMode('packs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  !isSingleMode ? 'bg-[#FFD700] text-black shadow' : 'text-[#AAAAAA] hover:text-white'
                }`}
              >
                📦 Packs / Grupos
              </button>
            </div>

            <button
              onClick={() => onResetCycle(selectedFolder.id)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#121212] hover:bg-[#2C2C2C] text-xs font-bold text-[#CCCCCC] border border-[rgba(255,255,255,0.08)] transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-[#FFD700]" />
              <span>Reiniciar</span>
            </button>

            {isSingleMode ? (
              <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFD700] hover:bg-[#E6C200] text-black font-extrabold text-xs shadow-md shadow-[rgba(255,215,0,0.2)] transition-all cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>{isUploadingSingle ? 'Subiendo...' : 'Subir Fotos'}</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/mp4"
                  disabled={isUploadingSingle}
                  onChange={handleUploadSingleImages}
                  className="hidden"
                />
              </label>
            ) : (
              <button
                onClick={() => setIsCreatingPack(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFD700] hover:bg-[#E6C200] text-black font-extrabold text-xs shadow-md shadow-[rgba(255,215,0,0.2)] transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Pack</span>
              </button>
            )}
          </div>
        </div>

        {/* Estado del ciclo */}
        <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-[rgba(255,255,255,0.08)] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#CCCCCC]">
            <Sparkles className="w-4 h-4 text-[#FFD700]" />
            <span>
              <strong>{totalCount}</strong> {isSingleMode ? 'fotos' : 'packs'} en total • <strong>{usedCount}</strong> ya emitidos • <strong>{pendingCount}</strong> pendientes
            </span>
          </div>
          <span className="text-[11px] text-[#888888]">
            {isSingleMode 
              ? 'El robot publicará 1 sola foto al azar por día programado sin repetir.'
              : 'Al elegirse un pack, el robot publicará todas sus historias en orden con 2.5s de diferencia.'}
          </span>
        </div>

        {/* Formulario nuevo pack */}
        {isCreatingPack && (
          <div className="bg-[#1E1E1E] p-5 rounded-2xl border border-[#FFD700]/30 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Nombre de la Secuencia / Pack (ej: Cheeseburger Doble, Promo Napolitana)
            </h3>
            <form onSubmit={handleCreatePack} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Ej: Cheeseburger Doble (Foto producto + Ingredientes)"
                value={newPackName}
                onChange={e => setNewPackName(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#121212] border border-[rgba(255,255,255,0.08)] text-sm text-white focus:outline-none focus:border-[#FFD700]"
              />
              <button
                type="button"
                onClick={() => setIsCreatingPack(false)}
                className="px-3 py-2 rounded-xl bg-[#121212] text-xs font-bold text-[#AAAAAA]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#FFD700] text-black font-extrabold text-xs"
              >
                Crear Pack
              </button>
            </form>
          </div>
        )}

        {/* Contenido según modo: Fotos Individuales vs Packs */}
        {isSingleMode ? (
          currentItems.length === 0 ? (
            <div className="bg-[#1E1E1E] rounded-3xl p-12 text-center border border-[rgba(255,255,255,0.08)] space-y-3">
              <Folder className="w-12 h-12 text-[#444444] mx-auto" />
              <h3 className="text-base font-bold text-white">No hay fotos en esta carpeta</h3>
              <p className="text-xs text-[#888888] max-w-sm mx-auto">
                Subí fotos de pizzas, empanadas o productos individuales. El robot publicará una al azar cada día programado sin repetir hasta agotar el ciclo.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {currentItems.map(item => {
                const isUsed = usedItems.includes(item.id);
                return (
                  <div 
                    key={item.id} 
                    className="relative group bg-[#121212] rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.08)] aspect-[9/16] flex flex-col justify-between p-2.5 shadow-md hover:border-[#FFD700]/40 transition-all"
                  >
                    <img 
                      src={item.url} 
                      alt="" 
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="relative z-10 flex items-center justify-between">
                      {isUsed ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#00E096] text-black">Emitida</span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/70 text-[#FFD700] border border-[#FFD700]/30 backdrop-blur-sm">Pendiente</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteSingleImage(item.id)}
                        className="p-1.5 rounded-lg bg-black/70 text-[#FF6B6B] hover:bg-[#FF3B30] hover:text-white transition-colors backdrop-blur-sm"
                        title="Eliminar foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="relative z-10 bg-black/80 backdrop-blur-sm p-1.5 rounded-xl border border-white/5">
                      <p className="text-[11px] font-bold text-white truncate">{item.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Listado de Packs */
          currentPacks.length === 0 ? (
            <div className="bg-[#1E1E1E] rounded-3xl p-12 text-center border border-[rgba(255,255,255,0.08)] space-y-3">
              <Layers className="w-12 h-12 text-[#444444] mx-auto" />
            <h3 className="text-base font-bold text-white">No tenés packs en esta carpeta</h3>
            <p className="text-xs text-[#888888] max-w-sm mx-auto">
              Creá un pack (ej: Cheeseburger) y agregale las fotos en el orden que querés que se suban (1- Presentación, 2- Ingredientes).
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentPacks.map(pack => {
              const isUsed = usedPacks.includes(pack.id);
              const images = pack.images || [];

              return (
                <div 
                  key={pack.id}
                  className="bg-[#1E1E1E] rounded-3xl p-5 border border-[rgba(255,255,255,0.08)] space-y-4 shadow-lg"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.06)] pb-3">
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-5 h-5 text-[#FFD700]" />
                      <h3 className="text-sm sm:text-base font-extrabold text-white">{pack.name}</h3>
                      {isUsed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00E096]/20 text-[#00E096] border border-[#00E096]/40">
                          <CheckCircle2 className="w-3 h-3" /> Emitido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(255,215,0,0.15)] text-[#FFD700] border border-[#FFD700]/30">
                          <Clock className="w-3 h-3" /> Pendiente
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121212] hover:bg-[#2C2C2C] text-xs font-bold text-[#FFD700] border border-[rgba(255,255,255,0.08)] cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingPackId === pack.id ? 'Subiendo...' : 'Agregar Fotos al Pack'}</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          onChange={e => handleUploadToPack(pack.id, e)}
                          disabled={uploadingPackId === pack.id}
                          className="hidden"
                        />
                      </label>

                      <button
                        onClick={() => handleDeletePack(pack.id)}
                        className="p-2 rounded-xl bg-[#121212] hover:bg-[#FF3B30] text-[#AAAAAA] hover:text-white transition-colors"
                        title="Eliminar pack"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Fotos del pack en secuencia */}
                  {images.length === 0 ? (
                    <p className="text-xs text-[#888888] italic py-3 text-center">
                      Este pack no tiene fotos todavía. Usá "Agregar Fotos al Pack" para cargar la secuencia.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {images.map((img, idx) => (
                        <div 
                          key={img.id}
                          className="group relative bg-[#121212] rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.08)] aspect-[9/16] flex flex-col justify-between p-2 shadow-md"
                        >
                          <img src={img.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none" />

                          {/* Orden */}
                          <div className="relative z-10 flex items-center justify-between">
                            <span className="w-6 h-6 rounded-full bg-[#FFD700] text-black font-black text-xs flex items-center justify-center shadow-md">
                              {idx + 1}
                            </span>

                            <button
                              onClick={() => handleDeleteImageFromPack(pack.id, img.id)}
                              className="p-1 rounded-lg bg-black/60 hover:bg-[#FF3B30] text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Eliminar foto"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Controles de orden */}
                          <div className="relative z-10 flex items-center justify-between bg-black/60 backdrop-blur-md rounded-xl p-1">
                            <button
                              disabled={idx === 0}
                              onClick={() => handleMoveImage(pack.id, idx, 'up')}
                              className="p-1 rounded text-white hover:text-[#FFD700] disabled:opacity-20"
                              title="Mover antes"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] text-white font-bold truncate max-w-[60px]">
                              Paso {idx + 1}
                            </span>
                            <button
                              disabled={idx === images.length - 1}
                              onClick={() => handleMoveImage(pack.id, idx, 'down')}
                              className="p-1 rounded text-white hover:text-[#FFD700] disabled:opacity-20"
                              title="Mover después"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
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
              Carpetas & Secuencias de Historias
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#AAAAAA] mt-1.5">
            Armá grupos de historias (ej: Foto 1 llamativa + Foto 2 ingredientes) para rotar cada día sin repetir.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setShowCatModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#121212] hover:bg-[#2C2C2C] text-xs font-bold text-white border border-[rgba(255,255,255,0.08)] transition-colors"
          >
            <Tag className="w-4 h-4 text-[#FFD700]" />
            <span>Categorías</span>
          </button>

          <button
            onClick={() => setIsCreatingFolder(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFD700] hover:bg-[#E6C200] text-black font-extrabold text-xs shadow-md shadow-[rgba(255,215,0,0.2)] transition-all"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Nueva Carpeta</span>
          </button>
        </div>
      </div>

      {/* Modal Categorías Personalizadas */}
      {showCatModal && (
        <div className="bg-[#1E1E1E] p-6 rounded-3xl border border-[#FFD700]/30 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#FFD700]" />
              <span>Categorías Personalizadas de tu Negocio</span>
            </h3>
            <button onClick={() => setShowCatModal(false)} className="text-[#AAAAAA] hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              required
              placeholder="Nueva categoría (ej: Lomitos, Picadas, Calzones...)"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#121212] border border-[rgba(255,255,255,0.08)] text-sm text-white focus:outline-none focus:border-[#FFD700]"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[#FFD700] text-black font-extrabold text-xs"
            >
              Agregar
            </button>
          </form>

          <div className="flex flex-wrap gap-2 pt-2">
            {categories.map(cat => (
              <span 
                key={cat.id} 
                className="px-3 py-1.5 rounded-xl bg-[#121212] border border-[rgba(255,255,255,0.08)] text-xs text-white font-bold flex items-center gap-2"
              >
                <span>{cat.name}</span>
                {onDeleteCategory && categories.length > 1 && (
                  <button 
                    onClick={() => onDeleteCategory(cat.id)}
                    className="text-[#666666] hover:text-[#FF3B30]"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Modal Crear Carpeta */}
      {isCreatingFolder && (
        <div className="bg-[#1E1E1E] p-6 rounded-3xl border border-[#FFD700]/30 shadow-2xl space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-[#FFD700]" />
            <span>Crear Carpeta de Productos</span>
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
                  placeholder="Ej: Hamburguesas"
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
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">
                ¿Cómo querés organizar las historias en esta carpeta?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewFolderMode('single')}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    newFolderMode === 'single'
                      ? 'bg-[rgba(255,215,0,0.12)] border-[#FFD700] text-white shadow-md'
                      : 'bg-[#121212] border-[rgba(255,255,255,0.08)] text-[#AAAAAA] hover:border-[#FFD700]/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-white">🍕 Fotos Individuales</span>
                    {newFolderMode === 'single' && <CheckCircle2 className="w-4 h-4 text-[#FFD700]" />}
                  </div>
                  <p className="text-[11px] text-[#AAAAAA] leading-snug">
                    1 historia por día sin secuencia. Ideal para fotos sueltas de Pizzas, Empanadas, etc.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setNewFolderMode('packs')}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    newFolderMode === 'packs'
                      ? 'bg-[rgba(255,215,0,0.12)] border-[#FFD700] text-white shadow-md'
                      : 'bg-[#121212] border-[rgba(255,255,255,0.08)] text-[#AAAAAA] hover:border-[#FFD700]/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-white">📦 Packs / Secuencias</span>
                    {newFolderMode === 'packs' && <CheckCircle2 className="w-4 h-4 text-[#FFD700]" />}
                  </div>
                  <p className="text-[11px] text-[#AAAAAA] leading-snug">
                    2 o más historias en orden (ej: Foto 1 producto + Foto 2 ingredientes de Burgers).
                  </p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
                Descripción (opcional)
              </label>
              <input
                type="text"
                placeholder={newFolderMode === 'single' ? "Ej: Pizzas al molde individuales para rotar" : "Ej: Secuencias de hamburguesas (1 foto principal + 1 ingredientes)"}
                value={newFolderDesc}
                onChange={e => setNewFolderDesc(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#121212] border border-[rgba(255,255,255,0.08)] text-sm text-white focus:outline-none focus:border-[#FFD700]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingFolder(false)}
                className="px-4 py-2 rounded-xl bg-[#121212] text-xs font-bold text-[#AAAAAA]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#FFD700] text-black font-extrabold text-xs shadow-md"
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
          <h3 className="text-base font-bold text-white">No tenés carpetas creadas</h3>
          <p className="text-xs text-[#888888] max-w-sm mx-auto">
            Creá tu primera carpeta para empezar a organizar tus packs de historias en secuencia.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {folders.map(folder => {
            const isSingle = folder.mode === 'single' || (folder.packs?.length === 0 && (folder.items?.length > 0 || folder.mode !== 'packs'));
            const total = isSingle ? (folder.items?.length || 0) : (folder.packs?.length || 0);
            const used = isSingle ? (folder.usedItemIds?.length || 0) : (folder.usedPackIds?.length || 0);
            const percent = total > 0 ? Math.round((used / total) * 100) : 0;
            const firstImg = isSingle 
              ? folder.items?.[0]?.url 
              : folder.packs?.[0]?.images?.[0]?.url;

            return (
              <div
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                className="group bg-[#1E1E1E] rounded-3xl p-5 border border-[rgba(255,255,255,0.08)] hover:border-[#FFD700]/50 transition-all cursor-pointer shadow-lg hover:shadow-2xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#121212] border border-[rgba(255,255,255,0.08)] flex items-center justify-center overflow-hidden shrink-0">
                      {firstImg ? (
                        <img src={firstImg} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Folder className="w-6 h-6 text-[#FFD700]" />
                      )}
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[rgba(255,215,0,0.1)] text-[#FFD700] border border-[#FFD700]/20">
                      {categories.find(c => c.id === folder.category)?.name || folder.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-white group-hover:text-[#FFD700] transition-colors">
                      {folder.name}
                    </h3>
                    <p className="text-xs text-[#888888] line-clamp-1 mt-0.5">
                      {folder.description || (isSingle ? `${total} fotos individuales` : `${total} packs de historias`)}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[rgba(255,255,255,0.06)] space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-white">
                      {isSingle ? `${total} fotos sueltas` : `${total} ${total === 1 ? 'pack' : 'packs'}`}
                    </span>
                    <span className="text-[#00E096]">{used} emitidos ({percent}%)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#121212] overflow-hidden">
                    <div className="h-full bg-[#FFD700] transition-all duration-300" style={{ width: `${percent}%` }} />
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
