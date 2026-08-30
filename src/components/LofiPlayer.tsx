import React from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Radio, 
  Tv, 
  Headphones, 
  RefreshCw,
  ExternalLink,
  Clock
} from 'lucide-react';
import { PERSONAL_INFO, UI_TRANSLATIONS } from '../data/portfolioData';
import { Language } from '../types';
import { useLofi } from '../context/LofiContext';

interface LofiPlayerProps {
  language: Language;
}

export const LofiPlayer: React.FC<LofiPlayerProps> = ({ language }) => {
  const t = UI_TRANSLATIONS[language].lofi;
  const {
    isPlaying,
    volume,
    isMuted,
    isPlayerReady,
    showVideoFeed,
    currentTime,
    togglePlay,
    setVolume,
    toggleMute,
    setShowVideoFeed,
  } = useLofi();

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-sm rounded-3xl p-4 bg-slate-900/80 border border-white/10 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
      {/* Top Header info */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-accent-soft text-accent">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {t.title}
            </span>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
            }`}
          />
          <span className="text-[11px] text-slate-400 font-medium">
            {isPlaying ? t.playing : t.paused}
          </span>
        </div>
      </div>

      {/* Main Artwork Container (GIF with Video Stream Toggle) */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-inner group/player bg-slate-950">
        
        {/* Aesthetic Lofi GIF Backdrop */}
        <div className="absolute inset-0">
          <img
            src={PERSONAL_INFO.lofiBgUrl}
            alt="Lofi Study Atmosphere"
            className={`w-full h-full object-cover transition-all duration-700 ${
              isPlaying ? 'brightness-95 saturate-110 scale-105' : 'brightness-60 saturate-60 scale-100'
            }`}
            draggable={false}
          />
          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent pointer-events-none" />
        </div>

        {/* Floating Video Stream / PiP Trigger button */}
        <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1">
          <button
            onClick={() => setShowVideoFeed(!showVideoFeed)}
            className="px-2.5 py-1 rounded-lg bg-slate-950/85 hover:bg-slate-900 border border-white/20 text-[10px] font-semibold text-slate-200 hover:text-white flex items-center gap-1 transition-all cursor-pointer backdrop-blur-md shadow-md active:scale-95"
            title={showVideoFeed ? t.hideVideo : t.watchLive}
          >
            <Tv className="w-3 h-3 text-rose-400" />
            <span>{showVideoFeed ? t.hideVideo : t.watchLive}</span>
          </button>
        </div>

        {/* Saved playback time badge */}
        {currentTime > 0 && (
          <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950/80 border border-white/15 text-[10px] font-mono text-slate-300 backdrop-blur-md">
            <Clock className="w-3 h-3 text-accent" />
            <span>{formatTime(currentTime)}</span>
          </div>
        )}

        {/* Center Play/Pause Button */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <button
            onClick={togglePlay}
            disabled={!isPlayerReady}
            className={`w-16 h-16 rounded-full bg-slate-950/80 hover:bg-slate-950/95 border-2 border-white/30 hover:border-accent text-white flex items-center justify-center backdrop-blur-md transition-all transform hover:scale-110 active:scale-95 shadow-accent cursor-pointer group/btn ${
              !isPlayerReady ? 'opacity-70 cursor-wait' : ''
            }`}
            title={t.togglePlay}
            aria-label={t.togglePlay}
          >
            {!isPlayerReady ? (
              <RefreshCw className="w-6 h-6 text-accent animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-7 h-7 text-accent fill-accent group-hover/btn:scale-110 transition-transform" />
            ) : (
              <Play className="w-7 h-7 text-white fill-white ml-1 group-hover/btn:scale-110 group-hover/btn:text-accent group-hover/btn:fill-accent transition-transform" />
            )}
          </button>
        </div>

        {/* Sound Wave Visualizer Bars at Bottom */}
        <div className="absolute bottom-3 left-0 right-0 px-6 flex justify-center items-end gap-1.5 h-10 z-20 pointer-events-none">
          {[
            { delay: '0.1s', dur: '0.45s' },
            { delay: '0.3s', dur: '0.35s' },
            { delay: '0.0s', dur: '0.55s' },
            { delay: '0.2s', dur: '0.30s' },
            { delay: '0.4s', dur: '0.50s' },
            { delay: '0.15s', dur: '0.40s' },
            { delay: '0.25s', dur: '0.48s' },
          ].map((bar, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-full bg-gradient-to-t from-pink-500 to-accent transition-all duration-300 ${
                isPlaying ? 'wave-bar-animated' : 'h-1.5 opacity-30'
              }`}
              style={
                isPlaying
                  ? {
                      animationDuration: bar.dur,
                      animationDelay: bar.delay,
                      height: '80%',
                    }
                  : {}
              }
            />
          ))}
        </div>
      </div>

      {/* Track info & Controls */}
      <div className="mt-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <h4 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              {t.trackTitle}
            </h4>
            <p className="text-[11px] text-slate-400 truncate">
              {t.artist} • <span className="text-accent">{t.vibe}</span>
            </p>
          </div>

          <a
            href={`https://www.youtube.com/watch?v=${PERSONAL_INFO.youtubeVideoId}`}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[10px] font-medium border border-white/10 flex items-center gap-1 flex-shrink-0 cursor-pointer transition-colors"
            title="Open stream in YouTube"
          >
            <ExternalLink className="w-3 h-3 text-red-400" />
            <span>YouTube</span>
          </a>
        </div>

        {/* Volume & Mute control */}
        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
          <button
            onClick={toggleMute}
            className="text-slate-400 hover:text-white p-1 cursor-pointer transition-colors"
            title={isMuted ? t.unmute : t.mute}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-slate-300" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-accent"
            aria-label="Volume slider"
          />
          <span className="text-[10px] font-mono text-slate-400 w-7 text-right">
            {isMuted ? '0%' : `${volume}%`}
          </span>
        </div>
      </div>
    </div>
  );
};
