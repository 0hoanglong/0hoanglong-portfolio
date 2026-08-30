import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { PERSONAL_INFO } from '../data/portfolioData';

const LOFI_TIME_KEY = 'portfolio-lofi-time';
const LOFI_VOLUME_KEY = 'portfolio-lofi-volume';
const LOFI_MUTED_KEY = 'portfolio-lofi-muted';

interface LofiContextType {
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  isPlayerReady: boolean;
  hasError: boolean;
  currentTime: number;
  duration: number;
  showVideoFeed: boolean;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setShowVideoFeed: (show: boolean) => void;
  seekTo: (seconds: number) => void;
}

const LofiContext = createContext<LofiContextType | null>(null);

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const LofiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(() => {
    const saved = localStorage.getItem(LOFI_VOLUME_KEY);
    return saved !== null ? parseInt(saved, 10) : 70;
  });
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem(LOFI_MUTED_KEY) === 'true';
  });
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [showVideoFeed, setShowVideoFeed] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const playerRef = useRef<any>(null);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerId = 'youtube-lofi-player-persistent-element';

  // 1. Initialize YouTube IFrame API and Persistent Player
  useEffect(() => {
    let isMounted = true;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      const containerEl = document.getElementById(containerId);
      if (!containerEl) return;

      try {
        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch {
            // ignore
          }
        }

        playerRef.current = new window.YT.Player(containerId, {
          videoId: PERSONAL_INFO.youtubeVideoId, // 'JCKBaJDRMw4'
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            showinfo: 0,
          },
          events: {
            onReady: (event: any) => {
              if (!isMounted) return;
              setIsPlayerReady(true);
              setHasError(false);

              // Set initial volume & mute
              event.target.setVolume(volume);
              if (isMuted) {
                event.target.mute();
              } else {
                event.target.unMute();
              }

              // Restore saved progress timestamp
              try {
                const savedTimeStr = localStorage.getItem(LOFI_TIME_KEY);
                if (savedTimeStr) {
                  const savedTime = parseFloat(savedTimeStr);
                  if (!isNaN(savedTime) && savedTime > 0) {
                    event.target.seekTo(savedTime, true);
                    setCurrentTime(savedTime);
                  }
                }
              } catch (e) {
                console.warn('Failed to restore lofi playback time:', e);
              }
            },
            onStateChange: (event: any) => {
              if (!isMounted) return;
              // 1 = playing, 2 = paused, 3 = buffering, 0 = ended
              if (event.data === 1) {
                setIsPlaying(true);
              } else if (event.data === 2 || event.data === 0) {
                setIsPlaying(false);
                // Save time on pause
                try {
                  if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                    const time = playerRef.current.getCurrentTime();
                    if (time > 0) {
                      localStorage.setItem(LOFI_TIME_KEY, String(time));
                      setCurrentTime(time);
                    }
                  }
                } catch {
                  // ignore
                }
              }
            },
            onError: (err: any) => {
              console.warn('YouTube Player Error:', err);
              if (!isMounted) return;
              setHasError(true);
            },
          },
        });
      } catch (err) {
        console.error('Failed to initialize YouTube Player:', err);
      }
    };

    if (!window.YT || !window.YT.Player) {
      const existingScript = document.getElementById('youtube-iframe-api-script');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }

      window.onYouTubeIframeAPIReady = () => {
        if (isMounted) initPlayer();
      };
    } else {
      initPlayer();
    }

    // Save playback position on page unload/close
    const handleBeforeUnload = () => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const time = playerRef.current.getCurrentTime();
          if (time > 0) {
            localStorage.setItem(LOFI_TIME_KEY, String(time));
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      isMounted = false;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // 2. Periodic time tracking when playing to persist timestamp regularly
  useEffect(() => {
    if (isPlaying) {
      timeIntervalRef.current = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          try {
            const time = playerRef.current.getCurrentTime();
            const dur = playerRef.current.getDuration?.() || 0;
            if (time > 0) {
              setCurrentTime(time);
              localStorage.setItem(LOFI_TIME_KEY, String(time));
            }
            if (dur > 0) {
              setDuration(dur);
            }
          } catch {
            // ignore
          }
        }
      }, 1500);
    } else {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = null;
      }
    }

    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = null;
      }
    };
  }, [isPlaying]);

  // 3. Play / Pause Toggle
  const togglePlay = () => {
    if (!playerRef.current || !isPlayerReady) return;

    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        if (isMuted) {
          playerRef.current.unMute();
          setIsMuted(false);
          localStorage.setItem(LOFI_MUTED_KEY, 'false');
        }
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } catch (e) {
      console.warn('Playback toggle error:', e);
    }
  };

  // 4. Volume Adjustment
  const setVolume = (newVol: number) => {
    setVolumeState(newVol);
    localStorage.setItem(LOFI_VOLUME_KEY, String(newVol));
    if (playerRef.current && isPlayerReady) {
      try {
        playerRef.current.setVolume(newVol);
        if (isMuted && newVol > 0) {
          playerRef.current.unMute();
          setIsMuted(false);
          localStorage.setItem(LOFI_MUTED_KEY, 'false');
        }
      } catch {
        // ignore
      }
    }
  };

  // 5. Mute / Unmute Toggle
  const toggleMute = () => {
    if (!playerRef.current || !isPlayerReady) return;

    try {
      if (isMuted) {
        playerRef.current.unMute();
        playerRef.current.setVolume(volume || 50);
        setIsMuted(false);
        localStorage.setItem(LOFI_MUTED_KEY, 'false');
      } else {
        playerRef.current.mute();
        setIsMuted(true);
        localStorage.setItem(LOFI_MUTED_KEY, 'true');
      }
    } catch {
      // ignore
    }
  };

  // 6. Seek to Timestamp
  const seekTo = (seconds: number) => {
    if (!playerRef.current || !isPlayerReady) return;
    try {
      playerRef.current.seekTo(seconds, true);
      setCurrentTime(seconds);
      localStorage.setItem(LOFI_TIME_KEY, String(seconds));
    } catch {
      // ignore
    }
  };

  return (
    <LofiContext.Provider
      value={{
        isPlaying,
        volume,
        isMuted,
        isPlayerReady,
        hasError,
        currentTime,
        duration,
        showVideoFeed,
        togglePlay,
        setVolume,
        toggleMute,
        setShowVideoFeed,
        seekTo,
      }}
    >
      {children}

      {/* Persistent YouTube IFrame Container - Stays alive continuously across SPA navigation */}
      <div
        className={`fixed transition-all duration-300 pointer-events-auto ${
          showVideoFeed
            ? 'bottom-20 right-4 sm:right-6 w-80 h-48 sm:w-96 sm:h-56 z-50 rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-slate-950 backdrop-blur-xl'
            : 'w-1 h-1 opacity-0 pointer-events-none -left-[9999px] -top-[9999px]'
        }`}
      >
        <div id={containerId} className="w-full h-full" />
        {showVideoFeed && (
          <div className="absolute top-2 right-2 z-30 flex items-center gap-1.5">
            <button
              onClick={() => setShowVideoFeed(false)}
              className="px-2 py-1 rounded-lg bg-slate-950/80 hover:bg-slate-900 border border-white/20 text-white text-[11px] font-bold backdrop-blur-md cursor-pointer transition-colors"
            >
              ✕ Ẩn video
            </button>
          </div>
        )}
      </div>
    </LofiContext.Provider>
  );
};

export const useLofi = () => {
  const context = useContext(LofiContext);
  if (!context) {
    throw new Error('useLofi must be used within a LofiProvider');
  }
  return context;
};
