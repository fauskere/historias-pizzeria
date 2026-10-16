import React, { useState } from 'react';
import { 
  Clock, 
  Eye, 
  Trash2, 
  Power, 
  Plus, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  PauseCircle, 
  Tag, 
  Film,
  Zap
} from 'lucide-react';
import { Instagram, Facebook } from './SocialIcons';


const DAYS_OF_WEEK = [
  { key: 'lunes', label: 'Lunes', short: 'Lun' },
  { key: 'martes', label: 'Martes', short: 'Mar' },
  { key: 'miercoles', label: 'Miércoles', short: 'Mié' },
  { key: 'jueves', label: 'Jueves', short: 'Jue' },
  { key: 'viernes', label: 'Viernes', short: 'Vie' },
  { key: 'sabado', label: 'Sábado', short: 'Sáb' },
  { key: 'domingo', label: 'Domingo', short: 'Dom' }
];

export default function WeeklyCalendar({ 
  stories, 
  onToggleActive, 
  onDeleteStory, 
  onPreviewStory, 
  onAddNewForDay 
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Determinar qué día es hoy en la semana
  const todayIndex = new Date().getDay(); // 0 es Domingo, 1 Lunes...
  const todayKey = todayIndex === 0 ? 'domingo' : DAYS_OF_WEEK[todayIndex - 1]?.key;

  // Filtrar historias por categoría
  const filteredStories = stories.filter(story => {
    if (selectedCategory === 'all') return true;
    return story.category === selectedCategory;
  });

  // Historias a demanda (sin días fijos asignados)
  const onDemandStories = filteredStories.filter(s => !s.days || s.days.length === 0);

  // Agrupar historias por día de la semana
  const storiesByDay = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day.key] = filteredStories
      .filter(s => s.days && s.days.includes(day.key))
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    return acc;
  }, {});

  const categoryBadges = [
    { key: 'all', label: 'Todas las historias' },
    { key: 'promo', label: 'Promociones (2x1, combos)' },
    { key: 'menu', label: 'Carta / Menú' },
    { key: 'hours', label: 'Horarios de atención' },
    { key: 'news', label: 'Novedades' }
  ];

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-orange-500" />
            Calendario Semanal Recurrente
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Las historias activas se publican automáticamente cada semana en sus días y horarios asignados.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categoryBadges.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat.key
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de 7 días */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        {DAYS_OF_WEEK.map(day => {
          const dayStories = storiesByDay[day.key] || [];
          const isToday = day.key === todayKey;

          return (
            <div
              key={day.key}
              className={`flex flex-col rounded-2xl border transition-all ${
                isToday
                  ? 'bg-slate-800/80 border-orange-500/50 shadow-lg shadow-orange-500/10 ring-1 ring-orange-500/30'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Day Header */}
              <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm ${isToday ? 'text-orange-400 font-bold' : 'text-slate-200'}`}>
                    {day.label}
                  </span>
                  {isToday && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-orange-500 text-white">
                      Hoy
                    </span>
                  )}
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                  {dayStories.length}
                </span>
              </div>

              {/* Day Stories Container */}
              <div className="p-2.5 flex-1 space-y-2.5 min-h-[160px]">
                {dayStories.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-800 rounded-xl">
                    <p className="text-xs text-slate-500 mb-2">Sin historias</p>
                    <button
                      onClick={() => onAddNewForDay(day.key)}
                      className="text-xs text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Programar
                    </button>
                  </div>
                ) : (
                  dayStories.map(story => (
                    <div
                      key={`${day.key}-${story.id}`}
                      className={`group relative rounded-xl border p-2.5 transition-all ${
                        story.active
                          ? 'bg-slate-850/90 border-slate-750 hover:border-orange-500/40 shadow-sm'
                          : 'bg-slate-900/40 border-slate-800/60 opacity-60 hover:opacity-100'
                      }`}
                    >
                      {/* Thumbnail & Badges */}
                      <div className="flex gap-2.5 items-start">
                        {/* 9:16 Mini Preview */}
                        <div 
                          className="relative w-12 h-20 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 cursor-pointer border border-slate-700/60"
                          onClick={() => onPreviewStory(story)}
                          title="Clic para ver vista previa"
                        >
                          {story.mediaType === 'video' ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-orange-400">
                              <Film className="w-5 h-5" />
                              <span className="text-[9px] mt-1 font-semibold">Video</span>
                            </div>
                          ) : (
                            <img
                              src={story.mediaUrl}
                              alt={story.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                        </div>

                        {/* Info Column */}
                        <div className="flex-1 min-w-0">
                          {/* Time & Active Pill */}
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                              <Clock className="w-3 h-3" />
                              {story.time} hs
                            </span>

                            {/* Switch Rápido Activar / Pausar */}
                            <button
                              onClick={() => onToggleActive(story.id, !story.active)}
                              className={`p-1 rounded-md transition-colors ${
                                story.active
                                  ? 'text-emerald-400 hover:bg-emerald-500/20'
                                  : 'text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                              }`}
                              title={story.active ? 'Pausar esta historia' : 'Activar esta historia'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Title */}
                          <h4 className="text-xs font-semibold text-slate-200 truncate leading-snug" title={story.title}>
                            {story.title}
                          </h4>

                          {/* Category */}
                          <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
                            <span 
                              className="w-1.5 h-1.5 rounded-full" 
                              style={{ backgroundColor: story.color || '#f97316' }} 
                            />
                            <span className="truncate">{story.categoryLabel || 'Historia'}</span>
                          </div>

                          {/* Platforms Icons */}
                          <div className="flex items-center gap-1.5 mt-2 text-slate-400">
                            {story.platforms?.instagram && (
                              <Instagram className="w-3 h-3 text-pink-400" title="Instagram Stories" />
                            )}
                            {story.platforms?.facebook && (
                              <Facebook className="w-3 h-3 text-blue-400" title="Facebook Page Stories" />
                            )}
                            {story.repeatWeekly && (
                              <span className="text-[10px] text-slate-500 ml-auto" title="Se repite cada semana">
                                ↻ Semanal
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <button
                          onClick={() => onPreviewStory(story)}
                          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 hover:underline"
                        >
                          <Eye className="w-3 h-3" />
                          Ver
                        </button>

                        <button
                          onClick={() => onDeleteStory(story.id)}
                          className="text-[11px] text-red-400/70 hover:text-red-400 flex items-center gap-1 hover:underline"
                          title="Eliminar programación"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Quick Add Button */}
              <div className="p-2 border-t border-slate-800/60 bg-slate-900/40">
                <button
                  onClick={() => onAddNewForDay(day.key)}
                  className="w-full py-1.5 px-2 rounded-lg text-xs font-medium text-slate-400 hover:text-orange-400 hover:bg-slate-800 flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar a {day.short}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sección de Historias A Demanda (Sin días asignados) */}
      {onDemandStories.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Historias A Demanda (Sin días fijos)
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-xs font-extrabold border border-amber-500/20">
                    {onDemandStories.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Guardadas listas para publicar con 1 clic en cualquier momento</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {onDemandStories.map(story => (
              <div
                key={story.id}
                className="bg-slate-850 border border-slate-750 hover:border-slate-700 rounded-2xl p-3 flex items-center justify-between gap-3 transition-colors"
              >
                <div
                  className="w-12 h-20 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 cursor-pointer border border-slate-700/80 group relative"
                  onClick={() => onPreviewStory(story)}
                  title="Ver y publicar"
                >
                  {story.mediaType === 'video' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-orange-400 bg-slate-900 text-[10px]">
                      <Film className="w-4 h-4" />
                      <span>Video</span>
                    </div>
                  ) : (
                    <img src={story.mediaUrl} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="text-xs font-bold text-slate-100 truncate" title={story.title}>
                    {story.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: story.color || '#f97316' }} />
                    <span className="truncate">{story.categoryLabel || 'Historia'}</span>
                  </div>
                  <div className="pt-1">
                    <button
                      onClick={() => onPreviewStory(story)}
                      className="px-2.5 py-1 rounded-lg bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 border border-orange-500/30 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      Ver / Publicar
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteStory(story.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                  title="Eliminar historia"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
