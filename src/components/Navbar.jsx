import React from 'react';
import { Calendar, PlusCircle, Film, History, Settings, Pizza, Cloud, Database } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, isFirebaseConnected }) {
  const tabs = [
    { id: 'calendar', label: 'Calendario Semanal', icon: Calendar },
    { id: 'creator', label: 'Nueva Historia', icon: PlusCircle },
    { id: 'library', label: 'Biblioteca', icon: Film },
    { id: 'logs', label: 'Historial', icon: History },
    { id: 'settings', label: 'Configuración', icon: Settings }
  ];

  return (
    <header className="bg-[#181818] border-b border-[rgba(255,255,255,0.08)] sticky top-0 z-40 backdrop-blur-md bg-opacity-95 shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('calendar')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFD700] via-[#FFC107] to-[#E6C200] flex items-center justify-center shadow-lg shadow-[rgba(255,215,0,0.25)] transition-transform group-hover:scale-105">
              <Pizza className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-white tracking-tight">Programador de Contenido</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[rgba(255,215,0,0.15)] text-[#FFD700] border border-[rgba(255,215,0,0.3)]">
                  Pizzería María Belén
                </span>
              </div>
              <p className="text-[11px] text-[#AAAAAA]">Historias Automáticas en Instagram & Facebook</p>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#121212] p-1 rounded-xl border border-[rgba(255,255,255,0.06)]">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#FFD700] text-black shadow-md shadow-[rgba(255,215,0,0.2)]'
                      : 'text-[#AAAAAA] hover:text-white hover:bg-[#2C2C2C]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Connection Indicator & Action */}
          <div className="flex items-center gap-3">
            <div
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                isFirebaseConnected
                  ? 'bg-[#00E096]/10 text-[#00E096] border-[#00E096]/30'
                  : 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30'
              }`}
              title={isFirebaseConnected ? 'Firebase Cloud Conectado' : 'Modo Local / Demo activo'}
            >
              {isFirebaseConnected ? (
                <>
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Cloud Activo</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5" />
                  <span>Modo Local</span>
                </>
              )}
            </div>

            <button
              onClick={() => setActiveTab('creator')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFD700] hover:bg-[#E6C200] text-black font-extrabold text-xs shadow-md shadow-[rgba(255,215,0,0.25)] transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva Historia</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1.5 border-t border-[rgba(255,255,255,0.06)] scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#FFD700] text-black shadow-sm'
                    : 'text-[#AAAAAA] hover:text-white bg-[#1E1E1E]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
