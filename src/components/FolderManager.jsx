import React, { useState } from 'react';
import { 
  Folder, 
  FolderPlus, 
  Tag, 
  X, 
  CheckCircle2 
} from 'lucide-react';
import FolderDetailView from './FolderDetailView';

export default function FolderManager({ 
  folders = [], 
  categories = [], 
  onSave, 
  _onDelete, 
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

  const selectedFolder = folders.find(f => f.id === selectedFolderId);

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

  // VISTA DETALLE DE CARPETA SELECCIONADA
  if (selectedFolder) {
    return (
      <FolderDetailView
        folder={selectedFolder}
        categories={categories}
        onBack={() => setSelectedFolderId(null)}
        onSave={onSave}
        onResetCycle={onResetCycle}
      />
    );
  }

  // VISTA LISTADO DE CARPETAS
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-[#1E1E1E] p-6 sm:p-8 rounded-3xl border border-white/[0.08] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#121212] hover:bg-[#2C2C2C] text-xs font-bold text-white border border-white/[0.08] transition-colors"
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
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#121212] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#FFD700]"
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
                className="px-3 py-1.5 rounded-xl bg-[#121212] border border-white/[0.08] text-xs text-white font-bold flex items-center gap-2"
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
                  className="w-full px-4 py-2.5 rounded-xl bg-[#121212] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#FFD700] font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
                  Categoría
                </label>
                <select
                  value={newFolderCategory}
                  onChange={e => setNewFolderCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#121212] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#FFD700] font-semibold"
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
                      : 'bg-[#121212] border-white/[0.08] text-[#AAAAAA] hover:border-[#FFD700]/30'
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
                      : 'bg-[#121212] border-white/[0.08] text-[#AAAAAA] hover:border-[#FFD700]/30'
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
                className="w-full px-4 py-2.5 rounded-xl bg-[#121212] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#FFD700]"
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
        <div className="bg-[#1E1E1E] rounded-3xl p-12 text-center border border-white/[0.08] space-y-4">
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
            const posterUrl = firstImg ? firstImg.replace(/\.(mp4|mov|webm|mkv)$/i, '.jpg') : '';

            return (
              <div
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                className="group bg-[#1E1E1E] rounded-3xl p-5 border border-white/[0.08] hover:border-[#FFD700]/50 transition-all cursor-pointer shadow-lg hover:shadow-2xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#121212] border border-white/[0.08] flex items-center justify-center overflow-hidden shrink-0">
                      {posterUrl ? (
                        <img src={posterUrl} alt="" className="w-full h-full object-cover" />
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

                <div className="pt-4 mt-4 border-t border-white/[0.06] space-y-2">
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
