import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LetterGlitch } from './LetterGlitch';
import { ThemeColor, Language } from '../types';
import { PERSONAL_INFO } from '../data/portfolioData';
import { Sparkles, Terminal, CheckCircle2 } from 'lucide-react';

interface LoadingScreenProps {
  currentTheme: ThemeColor;
  language: Language;
  onComplete: () => void;
}

const THEME_GLITCH_PALETTES: Record<ThemeColor, string[]> = {
  blue: ['#002b3d', '#00d2ff', '#3b82f6', '#818cf8'],
  red: ['#3b0a0a', '#ef4444', '#dc2626', '#f87171'],
  yellow: ['#3b2800', '#f59e0b', '#fbbf24', '#fde047'],
  green: ['#022c22', '#10b981', '#34d399', '#6ee7b7'],
  purple: ['#2e1065', '#c084fc', '#a855f7', '#d8b4fe'],
  pink: ['#3b0728', '#ff2a9d', '#f472b6', '#fbcfe8'],
};

const THEME_ACCENTS: Record<ThemeColor, { text: string; bg: string; border: string; glow: string }> = {
  blue: { text: 'text-cyan-400', bg: 'bg-cyan-500', border: 'border-cyan-500/40', glow: 'shadow-[0_0_20px_rgba(0,210,255,0.4)]' },
  red: { text: 'text-red-400', bg: 'bg-red-500', border: 'border-red-500/40', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]' },
  yellow: { text: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500/40', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.4)]' },
  green: { text: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500/40', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]' },
  purple: { text: 'text-purple-400', bg: 'bg-purple-500', border: 'border-purple-500/40', glow: 'shadow-[0_0_20px_rgba(192,132,252,0.4)]' },
  pink: { text: 'text-pink-400', bg: 'bg-pink-500', border: 'border-pink-500/40', glow: 'shadow-[0_0_20px_rgba(255,42,157,0.4)]' },
};

const LOADING_STEPS = {
  en: [
    'Initializing quantum core...',
    'Loading portfolio modules & interactive components...',
    'Calibrating responsive animations & themes...',
    'Portfolio ready. Launching...',
  ],
  vi: [
    'Khởi tạo lõi hệ thống quantum...',
    'Đang nạp các mô-đun & giao diện tương tác...',
    'Đồng bộ hóa hiệu ứng và bảng màu chủ đề...',
    'Hệ thống đã sẵn sàng. Đang mở giao diện...',
  ],
};

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  currentTheme,
  language,
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const colors = THEME_GLITCH_PALETTES[currentTheme] || THEME_GLITCH_PALETTES.blue;
  const accent = THEME_ACCENTS[currentTheme] || THEME_ACCENTS.blue;
  const steps = LOADING_STEPS[language] || LOADING_STEPS.en;

  useEffect(() => {
    const startTime = Date.now();
    const duration = 2800; // ~2.8s total load duration for comfortable viewing

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawPct = Math.min(100, Math.round((elapsed / duration) * 100));

      setProgress(rawPct);

      if (rawPct >= 88) {
        setCurrentStepIndex(3);
      } else if (rawPct >= 58) {
        setCurrentStepIndex(2);
      } else if (rawPct >= 28) {
        setCurrentStepIndex(1);
      } else {
        setCurrentStepIndex(0);
      }

      if (elapsed >= duration + 300) {
        clearInterval(interval);
        onComplete();
      }
    }, 24);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)', transition: { duration: 0.5, ease: 'easeInOut' } }}
      className="fixed inset-0 z-[99999] bg-[#05060f] flex items-center justify-center overflow-hidden select-none"
    >
      {/* Optimized Matrix Letter Glitch Background Canvas */}
      <div className="absolute inset-0 z-0">
        <LetterGlitch
          glitchColors={colors}
          glitchSpeed={75}
          smooth={true}
          outerVignette={true}
          centerVignette={false}
          className="w-full h-full"
        />
      </div>

      {/* Cyber Grid Scanlines Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] opacity-40" 
      />

      {/* Central Glassmorphic Loader HUD */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative z-20 w-[90%] max-w-md bg-[#090b14]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 flex flex-col items-center"
      >
        {/* Glowing Top Pill / Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono mb-6">
          <Terminal className={`w-3.5 h-3.5 ${accent.text}`} />
          <span className="text-slate-300 tracking-wider font-semibold">
            {language === 'en' ? 'SYSTEM BOOT' : 'KHỞI ĐỘNG HỆ THỐNG'}
          </span>
          <span className={`w-2 h-2 rounded-full ${accent.bg} animate-pulse`} />
        </div>

        {/* Brand / Name Header */}
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide text-center flex items-center gap-2 mb-2 uppercase">
          <span>{PERSONAL_INFO.name}</span>
          <Sparkles className={`w-4 h-4 ${accent.text}`} />
        </h2>
        <p className="text-xs text-slate-400 font-mono tracking-wider mb-6 text-center uppercase">
          {language === 'vi' ? PERSONAL_INFO.roleVi : 'FRONTEND DEVELOPER & CREATIVE CODER'}
        </p>

        {/* Progress Bar Container */}
        <div className="w-full mb-3">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-1.5">
            <span className="flex items-center gap-1.5">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${accent.bg}`} />
              <span className="truncate max-w-[200px] text-slate-300">
                {steps[currentStepIndex]}
              </span>
            </span>
            <span className={`font-bold ${accent.text}`}>{progress}%</span>
          </div>

          {/* Track */}
          <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-white/10">
            <motion.div
              className={`h-full rounded-full ${accent.bg} ${accent.glow} transition-all duration-75`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Micro System Diagnostics */}
        <div className="w-full flex justify-between items-center text-[10px] font-mono text-slate-500 pt-3 border-t border-white/5">
          <span className="flex items-center gap-1">
            <CheckCircle2 className={`w-3 h-3 ${accent.text}`} />
            <span>{language === 'en' ? 'OPTIMIZED ENGINE' : 'HIỆU NĂNG TỐI ƯU'}</span>
          </span>
          <button
            onClick={onComplete}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer underline underline-offset-2"
          >
            {language === 'en' ? 'Skip ➔' : 'Bỏ qua ➔'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LoadingScreen;
