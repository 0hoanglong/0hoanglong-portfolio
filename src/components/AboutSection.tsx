import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Mail, 
  Github, 
  Facebook, 
  Instagram, 
  GraduationCap,
  Compass,
  MapPin
} from 'lucide-react';
import { 
  PERSONAL_INFO, 
  TYPING_TEXTS_EN, 
  TYPING_TEXTS_VI, 
  UI_TRANSLATIONS 
} from '../data/portfolioData';
import { Language } from '../types';
import { LofiPlayer } from './LofiPlayer';
import { WarpText } from './WarpText';
import { MagicCard } from './MagicCard';

interface AboutSectionProps {
  onNavigate: (sectionId: string) => void;
  language: Language;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ onNavigate, language }) => {
  const [typedText, setTypedText] = useState<string>('');
  const [textIndex, setTextIndex] = useState<number>(0);
  const [charIndex, setCharIndex] = useState<number>(0);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const t = UI_TRANSLATIONS[language].about;
  const typingTexts = language === 'en' ? TYPING_TEXTS_EN : TYPING_TEXTS_VI;
  const stats = language === 'en' ? PERSONAL_INFO.statsEn : PERSONAL_INFO.statsVi;
  const focusAreas = language === 'en' ? PERSONAL_INFO.focusAreasEn : PERSONAL_INFO.focusAreasVi;

  // Reset typewriter when language changes
  useEffect(() => {
    setTextIndex(0);
    setCharIndex(0);
    setIsDeleting(false);
    setTypedText('');
  }, [language]);

  // Typewriter effect
  useEffect(() => {
    const currentFullText = typingTexts[textIndex] || typingTexts[0];
    let timer: NodeJS.Timeout;

    if (!isDeleting && charIndex <= currentFullText.length) {
      setTypedText(currentFullText.substring(0, charIndex));
      timer = setTimeout(() => {
        setCharIndex((prev) => prev + 1);
      }, 65);
    } else if (!isDeleting && charIndex > currentFullText.length) {
      // Pause at end of text
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, 2200);
    } else if (isDeleting && charIndex > 0) {
      setTypedText(currentFullText.substring(0, charIndex));
      timer = setTimeout(() => {
        setCharIndex((prev) => prev - 1);
      }, 35);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setTextIndex((prev) => (prev + 1) % typingTexts.length);
    }

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, textIndex, typingTexts]);

  return (
    <section id="about" className="min-h-full flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Profile, Bio, Actions, Stats */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Header Card: Avatar + Name + Badges */}
          <MagicCard 
            enableTilt={true} 
            enableBorderGlow={true} 
            enableStars={true} 
            particleCount={10}
            className="p-6 sm:p-7 rounded-3xl bg-slate-900/70 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group"
          >
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
              {/* Profile Image with Glow Ring */}
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-accent shadow-accent-sm relative">
                  <img
                    src={PERSONAL_INFO.avatarUrl}
                    alt={PERSONAL_INFO.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    draggable={false}
                  />
                </div>
                {/* Live Status indicator */}
                <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-slate-950/90 border border-emerald-500/50 flex items-center gap-1.5 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">{t.online}</span>
                </div>
              </div>

              {/* Identity & School */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-accent-soft text-accent border border-accent-border uppercase tracking-wider">
                    {language === 'en' ? PERSONAL_INFO.titleEn : PERSONAL_INFO.titleVi}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/5 text-slate-300 border border-white/10 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                    {language === 'en' ? PERSONAL_INFO.schoolEn : PERSONAL_INFO.schoolVi}
                  </span>
                </div>

                {/* Name rendered with interactive WebGL WarpText (Left aligned, stronger glass refraction & wave) */}
                <div className="w-full max-w-[360px] h-11 sm:h-12 relative flex items-center">
                  <WarpText
                    text={PERSONAL_INFO.name}
                    color="#ffffff"
                    warpStrength={0.16}
                    warpScale={2.1}
                    speed={0.75}
                    pointerInfluence={0.52}
                    pointerStrength={0.55}
                    refraction={0.032}
                    ripple
                    align="left"
                    fontSize="clamp(1.6rem, 3.8vw, 2.35rem)"
                    fontWeight={800}
                    fontFamily="Inter, system-ui, -apple-system, sans-serif"
                    letterSpacing="-0.02em"
                    className="w-full h-full"
                    style={{ minHeight: '44px', height: '100%' }}
                  />
                </div>

                {/* Social Quick Links */}
                <div className="flex items-center gap-3 pt-0.5">
                  <a
                    href={PERSONAL_INFO.socials.github}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                    aria-label="GitHub"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                  <a
                    href={PERSONAL_INFO.socials.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-blue-400 transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                  <a
                    href={PERSONAL_INFO.socials.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-pink-400 transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                  <span className="text-xs text-slate-400 border-l border-white/10 pl-3 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-accent" />
                    {t.location}
                  </span>
                </div>
              </div>
            </div>

            {/* Typewriter Banner */}
            <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <div className="font-mono text-sm font-semibold text-accent min-h-[1.5em] flex items-center">
                <span>{typedText}</span>
                <span className="inline-block w-2 h-4 ml-1 bg-accent animate-pulse" />
              </div>
            </div>

            {/* About Narrative */}
            <div className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed space-y-3">
              <p dangerouslySetInnerHTML={{ __html: t.bio1 }} />
              <p dangerouslySetInnerHTML={{ __html: t.bio2 }} />
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate('projects')}
                className="px-5 py-2.5 rounded-xl bg-accent-gradient text-white font-bold text-sm flex items-center gap-2 shadow-accent hover:opacity-90 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <span>{t.btnProjects}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('contact')}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-sm flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <Mail className="w-4 h-4 text-accent" />
                <span>{t.btnContact}</span>
              </button>
            </div>
          </MagicCard>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((stat, idx) => (
              <MagicCard
                key={idx}
                enableTilt={true}
                enableBorderGlow={true}
                enableStars={true}
                particleCount={4}
                className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md text-center group"
              >
                <div className="text-xl sm:text-2xl font-black text-white font-display group-hover:text-accent transition-colors">
                  {stat.value}
                </div>
                <div className="text-xs font-bold text-slate-300 mt-0.5">{stat.label}</div>
                <div className="text-[10px] text-slate-400 truncate">{stat.sub}</div>
              </MagicCard>
            ))}
          </div>
        </div>

        {/* Right Column: Focus Areas & Lofi Radio Station */}
        <div className="lg:col-span-5 flex flex-col items-center gap-6">
          
          {/* Focus Areas Card */}
          <MagicCard 
            enableTilt={true}
            enableBorderGlow={true}
            enableStars={true}
            particleCount={6}
            className="w-full max-w-sm p-4 sm:p-5 rounded-3xl bg-slate-900/70 border border-white/10 backdrop-blur-xl shadow-xl"
          >
            <div className="flex items-center gap-2 mb-3">
              <Compass className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                {t.focusTitle}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {focusAreas.map((area, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 hover:bg-accent-soft hover:text-accent border border-white/10 transition-colors text-slate-200"
                >
                  {area}
                </span>
              ))}
            </div>
          </MagicCard>

          {/* Lofi Radio Player with YouTube IFrame API */}
          <LofiPlayer language={language} />
        </div>

      </div>
    </section>
  );
};
