import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Power, 
  Eye, 
  Trash2, 
  Plus, 
  Film, 
  Sparkles,
  Zap,
  Pencil
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
  onEditStory,
  onAddNewForDay 
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Identificar el día actual en Argentina
  const daysMap = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const todayKey = daysMap[new Date().getDay()];

  // Filtrar historias por categoría
  const filteredStories = stories.filter(story => {
    if (selectedCategory === 'all') return true;
    return story.category === selectedCategory;
  });

  // Historias "A Demanda" (sin días fijos)
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
    { key: 'promo', label: 'Promociones' },
    { key: 'menu', label: 'Carta / Menú' },
    { key: 'hours', label: 'Horarios' },
    { key: 'news', label: 'Novedades' }
  ];

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1E1E1E] p-5 sm:p-6 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[rgba(255,215,0,0.15)] text-[#FFD700]">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Calendario Semanal
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#AAAAAA] mt-1.5">
            Las historias activas se publican solas en Instagram y Facebook cada semana sin que tengas la web abierta.
          </p>
        </div>

        {/* Filter Pills estilo Pizzeria Manager */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#121212] p-1.5 rounded-2xl border border-[rgba(255,255,255,0.06)]">
          {categoryBadges.map(cat => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#FFD700] text-black shadow-md shadow-[rgba(255,215,0,0.2)]'
                    : 'text-[#AAAAAA] hover:text-white hover:bg-[#2C2C2C]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid de 7 días */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3 sm:gap-4">
        {DAYS_OF_WEEK.map(day => {
          const dayStories = storiesByDay[day.key] || [];
          const isToday = day.key === todayKey;

          return (
            <div
              key={day.key}
              className={`flex flex-col rounded-3xl border transition-all ${
                isToday
                  ? 'bg-[#181818] border-[#FFD700] shadow-xl shadow-[rgba(255,215,0,0.1)] ring-1 ring-[#FFD700]/30'
                  : 'bg-[#1E1E1E] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.18)]'
              }`}
            >
              {/* Day Header */}
              <div className="p-3.5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`font-extrabold text-sm ${isToday ? 'text-[#FFD700]' : 'text-white'}`}>
                    {day.label}
                  </span>
                  {isToday && (
                    <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-[#FFD700] text-black shadow-sm">
                      Hoy
                    </span>
                  )}
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#121212] text-[#AAAAAA] font-bold border border-[rgba(255,255,255,0.06)]">
                  {dayStories.length}
                </span>
              </div>

              {/* Day Stories Container */}
              <div className="p-2.5 flex-1 space-y-2.5 min-h-[170px]">
                {dayStories.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-[rgba(255,255,255,0.06)] rounded-2xl">
                    <p className="text-xs text-[#666666] mb-2 font-medium">Sin historias</p>
                    <button
                      onClick={() => onAddNewForDay(day.key)}
                      className="text-xs text-[#FFD700] hover:text-[#E6C200] font-bold flex items-center gap-1 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Programar
                    </button>
                  </div>
                ) : (
                  dayStories.map(story => (
                    <div
                      key={`${day.key}-${story.id}`}
                      className={`group relative rounded-2xl border p-2.5 transition-all ${
                        story.active
                          ? 'bg-[#141414] border-[rgba(255,255,255,0.08)] hover:border-[#FFD700]/50 shadow-sm'
                          : 'bg-[#121212] border-[rgba(255,255,255,0.04)] opacity-50 hover:opacity-100'
                      }`}
                    >
                      {/* Thumbnail & Badges */}
                      <div className="flex gap-2.5 items-start">
                        {/* 9:16 Mini Preview */}
                        <div 
                          className="relative w-12 h-20 rounded-xl overflow-hidden bg-black flex-shrink-0 cursor-pointer border border-[rgba(255,255,255,0.1)] group/thumb"
                          onClick={() => onPreviewStory(story)}
                          title="Clic para ver vista previa completa"
                        >
                          <img
                            src={story.mediaUrl ? story.mediaUrl.replace(/\.(mp4|mov|webm|mkv)$/i, '.jpg') : ''}
                            alt={story.title}
                            className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300"
                          />
                          {story.mediaType === 'video' && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <Film className="w-4 h-4 text-[#FFD700] drop-shadow" />
                            </div>
                          )}
                          {story.sourceType === 'folder' && (
                            <div className="absolute top-1 left-1 z-10 w-4 h-4 rounded-md bg-black/80 border border-[#FFD700]/40 flex items-center justify-center text-[9px]" title="Rotación desde carpeta">
                              📁
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/20 group-hover/thumb:bg-black/0 transition-colors" />
                        </div>

                        {/* Info Column */}
                        <div className="flex-1 min-w-0">
                          {/* Time & Active Pill */}
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#FFD700] bg-[rgba(255,215,0,0.12)] px-1.5 py-0.5 rounded-lg border border-[rgba(255,215,0,0.2)]">
                              <Clock className="w-3 h-3" />
                              {story.time} hs
                            </span>

                            {/* Switch Rápido Activar / Pausar */}
                            <button
                              onClick={() => onToggleActive(story.id, !story.active)}
                              className={`p-1 rounded-lg transition-colors ${
                                story.active
                                  ? 'text-[#00E096] hover:bg-[#00E096]/20'
                                  : 'text-[#666666] hover:bg-[#2C2C2C] hover:text-[#AAAAAA]'
                              }`}
                              title={story.active ? 'Pausar esta historia' : 'Activar esta historia'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Title */}
                          <h4 className="text-xs font-bold text-white truncate leading-snug" title={story.title}>
                            {story.title}
                          </h4>

                          {/* Category or Folder */}
                          <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                            {story.sourceType === 'folder' || story.folderName ? (
                              <span className="inline-flex items-center gap-1 font-bold text-[#FFD700] bg-[rgba(255,215,0,0.1)] px-1.5 py-0.5 rounded border border-[rgba(255,215,0,0.2)] truncate">
                                📁 {story.folderName || 'Carpeta'} (Rotativo)
                              </span>
                            ) : (
                              <div className="flex items-center gap-1 text-[#AAAAAA]">
                                <span 
                                  className="w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: story.color || '#FFD700' }} 
                                />
                                <span className="truncate">{story.categoryLabel || 'Historia'}</span>
                              </div>
                            )}
                          </div>

                          {/* Platforms Icons */}
                          <div className="flex items-center gap-1.5 mt-2 text-[#888888]">
                            {story.platforms?.instagram && (
                              <Instagram className="w-3 h-3 text-[#FFD700]" title="Instagram Stories" />
                            )}
                            {story.platforms?.facebook && (
                              <Facebook className="w-3 h-3 text-[#FFD700]" title="Facebook Page Stories" />
                            )}
                            {story.repeatWeekly && (
                              <span className="text-[9px] text-[#888888] ml-auto font-bold" title="Se repite cada semana">
                                ↻ Semanal
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="mt-2.5 pt-2 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-[11px]">
                        <button
                          onClick={() => onPreviewStory(story)}
                          className="text-[#AAAAAA] hover:text-white flex items-center gap-1 font-semibold transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          Ver
                        </button>

                        {onEditStory && (
                          <button
                            onClick={() => onEditStory(story)}
                            className="text-[#FFD700] hover:text-[#E6C200] flex items-center gap-1 font-bold transition-colors"
                            title="Editar imagen, días u horario de esta historia"
                          >
                            <Pencil className="w-3 h-3" />
                            Editar
                          </button>
                        )}

                        <button
                          onClick={() => onDeleteStory(story.id)}
                          className="text-[#FF6B6B]/80 hover:text-[#FF3B30] flex items-center gap-1 transition-colors"
                          title="Eliminar historia"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Quick Add Button */}
              <div className="p-2 border-t border-[rgba(255,255,255,0.06)] bg-[#121212]/50 rounded-b-3xl">
                <button
                  onClick={() => onAddNewForDay(day.key)}
                  className="w-full py-1.5 px-2 rounded-xl text-xs font-bold text-[#AAAAAA] hover:text-[#FFD700] hover:bg-[#2C2C2C] flex items-center justify-center gap-1 transition-colors"
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
        <div className="bg-[#1E1E1E] border border-[rgba(255,255,255,0.08)] rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[rgba(255,255,255,0.06)] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[rgba(255,215,0,0.15)] text-[#FFD700] flex items-center justify-center font-bold">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  Historias A Demanda (Sin días fijos)
                  <span className="px-2 py-0.5 rounded-full bg-[#FFD700]/15 text-[#FFD700] text-xs font-black border border-[#FFD700]/30">
                    {onDemandStories.length}
                  </span>
                </h3>
                <p className="text-xs text-[#AAAAAA]">Guardadas listas para publicar con 1 clic en cualquier momento o programarlas</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {onDemandStories.map(story => (
              <div
                key={story.id}
                className="bg-[#141414] border border-[rgba(255,255,255,0.08)] hover:border-[#FFD700]/40 rounded-2xl p-3 flex items-center justify-between gap-3 transition-colors"
              >
                <div
                  className="w-12 h-20 rounded-xl overflow-hidden bg-black flex-shrink-0 cursor-pointer border border-[rgba(255,255,255,0.1)] group relative"
                  onClick={() => onPreviewStory(story)}
                  title="Ver y publicar"
                >
                  <img
                    src={story.mediaUrl ? story.mediaUrl.replace(/\.(mp4|mov|webm|mkv)$/i, '.jpg') : ''}
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {story.mediaType === 'video' && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Film className="w-4 h-4 text-[#FFD700] drop-shadow" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="text-xs font-bold text-white truncate" title={story.title}>
                    {story.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#AAAAAA]">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: story.color || '#FFD700' }} />
                    <span className="truncate">{story.categoryLabel || 'Historia'}</span>
                  </div>
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      onClick={() => onPreviewStory(story)}
                      className="px-2.5 py-1 rounded-xl bg-[#FFD700] text-black text-xs font-extrabold flex items-center gap-1 hover:bg-[#E6C200] transition-colors shadow-sm"
                    >
                      <Eye className="w-3 h-3" />
                      Publicar
                    </button>

                    {onEditStory && (
                      <button
                        onClick={() => onEditStory(story)}
                        className="px-2 py-1 rounded-xl bg-[#2C2C2C] hover:bg-[#383838] text-[#AAAAAA] hover:text-white text-xs font-bold flex items-center gap-1 transition-colors"
                        title="Editar historia"
                      >
                        <Pencil className="w-3 h-3" />
                        Editar
                      </button>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onDeleteStory(story.id)}
                  className="p-1.5 rounded-xl hover:bg-[#FF3B30]/10 text-[#666666] hover:text-[#FF3B30] transition-colors"
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
