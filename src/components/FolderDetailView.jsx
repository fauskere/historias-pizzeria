import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  Trash2, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  Film,
  Folder
} from 'lucide-react';
import { uploadToCloudinary } from '../services/cloudinary';

export default function FolderDetailView({
  folder,
  categories = [],
  onBack,
  onSave,
  onResetCycle
}) {
  const [isCreatingPack, setIsCreatingPack] = useState(false);
  const [newPackName, setNewPackName] = useState('');
  const [uploadingPackId, setUploadingPackId] = useState(null);
  const [isUploadingSingle, setIsUploadingSingle] = useState(false);

  const isSingleMode = folder.mode === 'single' || (
    (!folder.packs || folder.packs.length === 0) && folder.mode !== 'packs'
  );

  const currentPacks = folder.packs || [];
  const usedPacks = folder.usedPackIds || [];
  const currentItems = folder.items || [];
  const usedItems = folder.usedItemIds || [];

  const totalCount = isSingleMode ? currentItems.length : currentPacks.length;
  const usedCount = isSingleMode ? usedItems.length : usedPacks.length;
  const pendingCount = Math.max(0, totalCount - usedCount);

  // Alternar modo de carpeta
  const handleToggleMode = async (mode) => {
    await onSave({ ...folder, mode });
  };

  // Crear Pack dentro de la Carpeta
  const handleCreatePack = async (e) => {
    e.preventDefault();
    if (!newPackName.trim()) return;

    const newPack = {
      id: `pack_${Date.now()}`,
      name: newPackName.trim(),
      images: [],
      createdAt: new Date().toISOString()
    };

    const updatedPacks = [...currentPacks, newPack];
    await onSave({ ...folder, packs: updatedPacks });
    setNewPackName('');
    setIsCreatingPack(false);
  };

  // Eliminar Pack
  const handleDeletePack = async (packId) => {
    if (!window.confirm('¿Seguro que querés eliminar este pack y sus fotos?')) return;
    const filteredPacks = currentPacks.filter(p => p.id !== packId);
    const filteredUsed = usedPacks.filter(id => id !== packId);
    await onSave({ ...folder, packs: filteredPacks, usedPackIds: filteredUsed });
  };

  // Subir fotos a un Pack (en orden)
  const handleUploadToPack = async (packId, e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingPackId(packId);

    const packIndex = currentPacks.findIndex(p => p.id === packId);
    if (packIndex === -1) return;

    const targetPack = { ...currentPacks[packIndex] };
    const newImages = [...(targetPack.images || [])];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const uploadResult = await uploadToCloudinary(file);
        newImages.push({
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          url: uploadResult.secure_url || uploadResult.url,
          name: file.name.replace(/\.[^/.]+$/, ''),
          order: newImages.length,
          mediaType: file.type.startsWith('video/') ? 'video' : 'image',
          addedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error subiendo imagen al pack:', err);
      }
    }

    targetPack.images = newImages;
    const updatedPacks = [...currentPacks];
    updatedPacks[packIndex] = targetPack;

    await onSave({ ...folder, packs: updatedPacks });
    setUploadingPackId(null);
    e.target.value = '';
  };

  // Eliminar imagen de un pack
  const handleDeleteImageFromPack = async (packId, imgId) => {
    const packIndex = currentPacks.findIndex(p => p.id === packId);
    if (packIndex === -1) return;

    const targetPack = { ...currentPacks[packIndex] };
    targetPack.images = (targetPack.images || []).filter(img => img.id !== imgId);

    const updatedPacks = [...currentPacks];
    updatedPacks[packIndex] = targetPack;

    await onSave({ ...folder, packs: updatedPacks });
  };

  // Mover imagen arriba o abajo para ordenar la secuencia
  const handleMoveImage = async (packId, imgIndex, direction) => {
    const packIndex = currentPacks.findIndex(p => p.id === packId);
    if (packIndex === -1) return;

    const targetPack = { ...currentPacks[packIndex] };
    const images = [...(targetPack.images || [])];
    const targetIndex = direction === 'up' ? imgIndex - 1 : imgIndex + 1;

    if (targetIndex < 0 || targetIndex >= images.length) return;

    const temp = images[imgIndex];
    images[imgIndex] = images[targetIndex];
    images[targetIndex] = temp;

    targetPack.images = images;
    const updatedPacks = [...currentPacks];
    updatedPacks[packIndex] = targetPack;

    await onSave({ ...folder, packs: updatedPacks });
  };

  // Subir fotos individuales
  const handleUploadSingleImages = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

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

    await onSave({ ...folder, items: newItems });
    setIsUploadingSingle(false);
    e.target.value = '';
  };

  // Eliminar foto individual
  const handleDeleteSingleImage = async (imgId) => {
    if (!window.confirm('¿Eliminar esta foto de la carpeta?')) return;
    const filtered = currentItems.filter(it => it.id !== imgId);
    const filteredUsed = usedItems.filter(id => id !== imgId);
    await onSave({ ...folder, items: filtered, usedItemIds: filteredUsed });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-[#1E1E1E] p-6 rounded-3xl border border-white/[0.08] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-[#121212] hover:bg-[#2C2C2C] text-[#AAAAAA] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📁</span>
              <h1 className="text-xl font-black text-white">{folder.name}</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[rgba(255,215,0,0.15)] text-[#FFD700] font-bold">
                {categories.find(c => c.id === folder.category)?.name || folder.category}
              </span>
            </div>
            <p className="text-xs text-[#AAAAAA] mt-1">
              {folder.description || (isSingleMode ? 'Fotos individuales para rotar 1 por día' : 'Packs y secuencias de historias')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Toggle Modo */}
          <div className="flex bg-[#121212] p-1 rounded-xl border border-white/[0.08]">
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
            onClick={() => onResetCycle(folder.id)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#121212] hover:bg-[#2C2C2C] text-xs font-bold text-[#CCCCCC] border border-white/[0.08] transition-colors"
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
      <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs">
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
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#121212] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#FFD700]"
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
          <div className="bg-[#1E1E1E] rounded-3xl p-12 text-center border border-white/[0.08] space-y-3">
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
                  className="relative group bg-[#121212] rounded-2xl overflow-hidden border border-white/[0.08] aspect-[9/16] flex flex-col justify-between p-2.5 shadow-md hover:border-[#FFD700]/40 transition-all"
                >
                  <img 
                    src={item.url ? item.url.replace(/\.(mp4|mov|webm|mkv)$/i, '.jpg') : ''} 
                    alt="" 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                  {item.mediaType === 'video' && (
                    <div className="absolute top-2.5 right-10 z-10 p-1 rounded-md bg-black/70 text-[#FFD700] backdrop-blur-sm" title="Video">
                      <Film className="w-3.5 h-3.5" />
                    </div>
                  )}
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
          <div className="bg-[#1E1E1E] rounded-3xl p-12 text-center border border-white/[0.08] space-y-3">
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
                  className="bg-[#1E1E1E] rounded-3xl p-5 border border-white/[0.08] space-y-4 shadow-lg"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
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
                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121212] hover:bg-[#2C2C2C] text-xs font-bold text-[#FFD700] border border-white/[0.08] cursor-pointer">
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
                          className="group relative bg-[#121212] rounded-2xl overflow-hidden border border-white/[0.08] aspect-[9/16] flex flex-col justify-between p-2 shadow-md"
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
                              <Trash2 className="w-3.5 h-3.5" />
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
