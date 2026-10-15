import React, { useState } from 'react';
import { 
  Film, 
  Clock, 
  Repeat, 
  Trash2, 
  Power, 
  Eye, 
  CheckCircle2, 
  PauseCircle, 
  Filter,
  Search,
  Plus
} from 'lucide-react';
import { Instagram, Facebook } from './SocialIcons';


const DAYS_MAP = {
  lunes: 'Lun',
  martes: 'Mar',
  miercoles: 'Mié',
  jueves: 'Jue',
  viernes: 'Vie',
  sabado: 'Sáb',
  domingo: 'Dom'
};

export default function StoryLibrary({ 
  stories, 
  onToggleActive, 
  onDeleteStory, 
  onPreviewStory,
  onGoToCreator 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, paused
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Filtrado
  const filtered = stories.filter(story => {
    const matchesSearch = (story.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? story.active :
      !story.active;
    const matchesCategory = categoryFilter === 'all' ? true : story.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const activeCount = stories.filter(s => s.active).length;
  const pausedCount = stories.filter(s => !s.active).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Film className="w-6 h-6 text-orange-500" />
            Biblioteca de Historias
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Administrá, pausá o reactivá cualquier historia programada en tu pizzería.
          </p>
        </div>

        <button
          onClick={onGoToCreator}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nueva Historia
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Programadas</p>
            <p className="text-2xl font-extrabold text-white mt-1">{stories.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
            <Film className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Activas (En Emisión)</p>
            <p className="text-2xl font-extrabold text-emerald-400 mt-1">{activeCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pausadas</p>
            <p className="text-2xl font-extrabold text-amber-400 mt-1">{pausedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <PauseCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por título o descripción..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 focus:outline-none focus:border-orange-500"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Solo Activas</option>
            <option value="paused">Solo Pausadas</option>
          </select>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 focus:outline-none focus:border-orange-500"
          >
            <option value="all">Todas las categorías</option>
            <option value="promo">Promociones</option>
            <option value="menu">Carta / Menú</option>
            <option value="hours">Horarios</option>
            <option value="news">Novedades</option>
          </select>
        </div>
      </div>

      {/* Stories Grid */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <p className="text-slate-400 text-sm">No se encontraron historias con los filtros aplicados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(story => (
            <div
              key={story.id}
              className={`bg-slate-900 border rounded-2xl p-4 transition-all flex flex-col justify-between ${
                story.active
                  ? 'border-slate-800 hover:border-slate-700'
                  : 'border-slate-850 bg-slate-950/60 opacity-60 hover:opacity-100'
              }`}
            >
              <div>
                {/* Header row: Status badge + Switch */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      story.active
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${story.active ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    {story.active ? 'Activa' : 'Pausada'}
                  </span>

                  <button
                    onClick={() => onToggleActive(story.id, !story.active)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      story.active
                        ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    <span>{story.active ? 'Pausar' : 'Activar'}</span>
                  </button>
                </div>

                {/* Main Content: Thumbnail & Title */}
                <div className="flex gap-3">
                  <div
                    onClick={() => onPreviewStory(story)}
                    className="w-16 h-28 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 cursor-pointer border border-slate-700/80 group relative"
                  >
                    {story.mediaType === 'video' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-orange-400 bg-slate-850">
                        <Film className="w-6 h-6" />
                        <span className="text-[10px] mt-1 font-semibold">Video</span>
                      </div>
                    ) : (
                      <img src={story.mediaUrl} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    )}
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                      <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-100 text-sm leading-snug line-clamp-2 mb-1" title={story.title}>
                      {story.title}
                    </h3>

                    {/* Category pill */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: story.color || '#f97316' }} />
                      <span>{story.categoryLabel || 'Historia'}</span>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-1 text-xs font-semibold text-amber-400 mb-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{story.time} hs</span>
                    </div>

                    {/* Days badges */}
                    <div className="flex flex-wrap gap-1">
                      {story.days?.map(d => (
                        <span key={d} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-semibold text-slate-300">
                          {DAYS_MAP[d] || d}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Row */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  {story.platforms?.instagram && <Instagram className="w-3.5 h-3.5 text-pink-400" title="Instagram" />}
                  {story.platforms?.facebook && <Facebook className="w-3.5 h-3.5 text-blue-400" title="Facebook" />}
                  {story.repeatWeekly && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Repeat className="w-3 h-3" /> Semanal
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPreviewStory(story)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                    title="Ver vista previa"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteStory(story.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                    title="Eliminar historia"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
