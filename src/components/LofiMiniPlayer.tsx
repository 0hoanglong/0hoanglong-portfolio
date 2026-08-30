import React from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Radio, 
  RadioTower,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
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
  const t = UI_TRANSLATIONS[language].lofi;

  // Only show mini player when not on the 'about' page (which has the full card)
  if (activeSection === 'about') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center gap-2.5 p-2 pr-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-900 border border-white/15 backdrop-blur-xl shadow-2xl transition-all group">
        {/* Animated Sound Wave or Icon */}
        <button
          onClick={() => onNavigate('about')}
          className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 cursor-pointer"
          title="Open Lofi Radio Station in About section"
        >
          <img
            src={PERSONAL_INFO.lofiBgUrl}
            alt="Lofi artwork"
            className={`w-full h-full object-cover ${isPlaying ? 'scale-110' : 'brightness-50'}`}
          />
          <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
            {isPlaying ? (
              <div className="flex items-end gap-0.5 h-3.5 pointer-events-none">
                <span className="w-0.5 bg-accent rounded-full animate-pulse h-3" />
                <span className="w-0.5 bg-pink-400 rounded-full animate-bounce h-3.5" />
                <span className="w-0.5 bg-accent rounded-full animate-pulse h-2" />
              </div>
            ) : (
              <Radio className="w-4 h-4 text-slate-300" />
            )}
          </div>
        </button>

        {/* Track / Radio Info */}
        <div
          onClick={() => onNavigate('about')}
          className="min-w-0 max-w-[120px] sm:max-w-[160px] cursor-pointer"
          title="Click to view full player in About"
        >
          <p className="text-[11px] font-bold text-white truncate flex items-center gap-1">
            <span>{t.title}</span>
          </p>
          <p className="text-[10px] text-accent truncate font-medium">
            {isPlaying ? t.playing : t.paused}
          </p>
        </div>

        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          disabled={!isPlayerReady}
          className="w-8 h-8 rounded-xl bg-accent-soft hover:bg-accent text-accent hover:text-slate-950 flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 ml-1"
          title={t.togglePlay}
          aria-label={t.togglePlay}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Quick Mute Toggle */}
        <button
          onClick={toggleMute}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer hidden sm:block"
          title={isMuted ? t.unmute : t.mute}
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
};
