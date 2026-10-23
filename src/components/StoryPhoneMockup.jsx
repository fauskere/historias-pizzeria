import React from 'react';
import { Image as ImageIcon, Pizza } from 'lucide-react';

export default function StoryPhoneMockup({
  mediaPreview,
  mediaType,
  restaurantName,
  time,
  title
}) {
  return (
    <div className="lg:col-span-5 flex flex-col items-center">
      <div className="w-full max-w-[320px]">
        <div className="text-center mb-3">
          <span className="text-[11px] font-bold text-[#AAAAAA] uppercase tracking-wider">
            Vista previa en tiempo real
          </span>
        </div>

        {/* Smartphone Frame (9:16 Aspect Ratio) */}
        <div className="relative aspect-[9/16] w-full rounded-[42px] border-[7px] border-[#2C2C2C] bg-black overflow-hidden shadow-2xl ring-1 ring-white/10">
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
  );
}
