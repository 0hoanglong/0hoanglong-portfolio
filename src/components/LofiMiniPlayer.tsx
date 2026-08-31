import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Radio, 
  X,
  GripVertical,
  Maximize2
} from 'lucide-react';
import { motion, useMotionValue, useSpring, animate } from 'motion/react';
import { useLofi } from '../context/LofiContext';
import { Language } from '../types';
import { UI_TRANSLATIONS, PERSONAL_INFO } from '../data/portfolioData';

interface LofiMiniPlayerProps {
  language: Language;
  onNavigate: (sectionId: string) => void;
  activeSection: string;
}

export const LofiMiniPlayer: React.FC<LofiMiniPlayerProps> = ({
  language,
  onNavigate,
  activeSection,
}) => {
  const { isPlaying, isPlayerReady, isMuted, volume, togglePlay, toggleMute } = useLofi();
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isDockedLeft, setIsDockedLeft] = useState<boolean>(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const t = UI_TRANSLATIONS[language].lofi;

  // Motion values for smooth position & snapping
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 350, damping: 28 });
  const springY = useSpring(y, { stiffness: 350, damping: 28 });

  // Initialize position to bottom-right above navigation
  useEffect(() => {
    const initPos = () => {
      const isMobile = window.innerWidth < 768;
      const widgetWidth = 230;
      const initialX = window.innerWidth - widgetWidth - (isMobile ? 12 : 24);
      const initialY = window.innerHeight - (isMobile ? 140 : 90);
      x.set(initialX);
      y.set(initialY);
      setIsDockedLeft(false);
    };

    initPos();

    const handleResize = () => {
      // Re-clamp position inside viewport on screen resize
      const widgetWidth = containerRef.current?.offsetWidth || 230;
      const widgetHeight = containerRef.current?.offsetHeight || 52;
      const currentX = x.get();
      const currentY = y.get();

      const snapX = currentX + widgetWidth / 2 < window.innerWidth / 2
        ? 12
        : Math.max(12, window.innerWidth - widgetWidth - 12);
      
      const clampedY = Math.min(
        Math.max(64, currentY),
        window.innerHeight - widgetHeight - 75
      );

      x.set(snapX);
      y.set(clampedY);
      setIsDockedLeft(snapX < window.innerWidth / 2);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // When user visits the 'about' section, automatically reset dismiss state
  // So when they navigate to any other section, the mini-player returns cleanly!
  useEffect(() => {
    if (activeSection === 'about') {
      setIsDismissed(false);
    }
  }, [activeSection]);

  // If in 'about' section (which has the big radio player) or user dismissed it, hide mini player
  if (activeSection === 'about' || isDismissed) {
    return null;
  }

  // Handle Drag End with automatic left/right border magnetic snapping (Android Chat Head style)
  const handleDragEnd = (_: any, info: { point: { x: number; y: number }; offset: { x: number; y: number } }) => {
    setIsDragging(false);
    const widgetWidth = containerRef.current?.offsetWidth || 230;
    const widgetHeight = containerRef.current?.offsetHeight || 52;

    const currentX = x.get();
    const currentY = y.get();

    // Determine horizontal snap target (Left or Right edge)
    const isCloserToLeft = currentX + widgetWidth / 2 < window.innerWidth / 2;
    const snapMargin = window.innerWidth < 768 ? 10 : 20;
    const targetX = isCloserToLeft ? snapMargin : window.innerWidth - widgetWidth - snapMargin;

    // Constrain vertical bounds (Safe from top header & bottom nav)
    const minTop = window.innerWidth < 768 ? 64 : 24;
    const maxBottom = window.innerHeight - widgetHeight - (window.innerWidth < 768 ? 76 : 30);
    const targetY = Math.min(Math.max(minTop, currentY), maxBottom);

    setIsDockedLeft(isCloserToLeft);

    // Smoothly spring to the magnetic border position
    animate(x, targetX, { type: 'spring', stiffness: 400, damping: 30 });
    animate(y, targetY, { type: 'spring', stiffness: 400, damping: 30 });
  };

  return (
    <motion.div
      ref={containerRef}
      drag
      dragMomentum={false}
      dragElastic={0.15}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      style={{
        x: springX,
        y: springY,
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 45,
        touchAction: 'none',
      }}
      className="cursor-grab active:cursor-grabbing select-none"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
    >
      <div 
        className={`flex items-center gap-1.5 p-1.5 pr-2 sm:gap-2 sm:p-2 sm:pr-2.5 rounded-2xl bg-slate-950/95 sm:bg-slate-900/95 border backdrop-blur-2xl transition-shadow ${
          isDragging 
            ? 'border-accent shadow-[0_15px_35px_rgba(0,0,0,0.8),0_0_20px_var(--color-accent-soft)] scale-105' 
            : 'border-white/20 shadow-2xl hover:border-white/30'
        }`}
        style={{
          boxShadow: isDragging 
            ? '0 20px 40px rgba(0,0,0,0.9), 0 0 15px rgba(255,255,255,0.1)' 
            : '0 10px 30px rgba(0,0,0,0.6)',
        }}
      >
        {/* Drag Handle Indicator */}
        <div 
          className="text-slate-500 hover:text-slate-300 pl-0.5 pr-0.5 cursor-grab active:cursor-grabbing flex items-center justify-center"
          title="Kéo thả để di chuyển (tự động dính vào 2 bên mép)"
        >
          <GripVertical className="w-3.5 h-3.5 opacity-60" />
        </div>

        {/* Animated Artwork / Navigate to About */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!isDragging) {
              onNavigate('about');
            }
          }}
          className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden border border-white/15 flex-shrink-0 cursor-pointer group"
          title="Mở Lofi Radio đầy đủ trong phần About"
          aria-label="Mở Lofi Radio"
        >
          <img
            src={PERSONAL_INFO.lofiBgUrl}
            alt="Lofi artwork"
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isPlaying ? 'scale-110' : 'brightness-75'
            }`}
          />
          <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
            {isPlaying ? (
              <div className="flex items-end gap-0.5 h-2.5 pointer-events-none">
                <span className="w-0.5 bg-accent rounded-full animate-pulse h-2" />
                <span className="w-0.5 bg-pink-400 rounded-full animate-bounce h-3" />
                <span className="w-0.5 bg-accent rounded-full animate-pulse h-1.5" />
              </div>
            ) : (
              <Radio className="w-3 h-3 text-slate-300" />
            )}
          </div>
        </button>

        {/* Track Title / Live Status */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (!isDragging) {
              onNavigate('about');
            }
          }}
          className="min-w-0 max-w-[95px] sm:max-w-[125px] cursor-pointer"
          title="Nhấp để xem trình phát đầy đủ trong About"
        >
          <p className="text-[10px] sm:text-[11px] font-bold text-white truncate leading-tight">
            {t.title}
          </p>
          <p className="text-[9px] text-accent truncate font-medium flex items-center gap-1 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            {isPlaying ? t.playing : t.paused}
          </p>
        </div>

        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          disabled={!isPlayerReady}
          className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-xl bg-accent-soft hover:bg-accent text-accent hover:text-slate-950 flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-90 flex-shrink-0"
          title={t.togglePlay}
          aria-label={t.togglePlay}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>

        {/* Quick Mute Toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer hidden sm:block flex-shrink-0"
          title={isMuted ? t.unmute : t.mute}
          aria-label="Toggle mute"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Close/Dismiss Button (Only hides widget, does NOT stop music) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsDismissed(true);
          }}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer flex-shrink-0"
          title="Ẩn widget (Nhạc vẫn tiếp tục phát. Vào mục About rồi quay lại để hiện lại)"
          aria-label="Ẩn widget"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};
