import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Code2, 
  Layers, 
  Mail, 
  Palette, 
  ChevronLeft, 
  Menu, 
  Languages, 
  Globe, 
  Sparkles
} from 'lucide-react';
import { ThemeColor, Language } from '../types';
import { UI_TRANSLATIONS } from '../data/portfolioData';

interface HeaderProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  currentTheme: ThemeColor;
  onThemeChange: (theme: ThemeColor) => void;
  language: Language;
  onToggleLanguage: () => void;
}

const THEME_OPTIONS: { id: ThemeColor; name: string; color: string }[] = [
  { id: 'blue', name: 'Cyber Blue', color: '#00d2ff' },
  { id: 'red', name: 'Scarlet Red', color: '#ef4444' },
  { id: 'yellow', name: 'Amber Gold', color: '#f59e0b' },
  { id: 'green', name: 'Neon Emerald', color: '#10b981' },
  { id: 'purple', name: 'Electric Purple', color: '#a855f7' },
  { id: 'pink', name: 'Neon Pink', color: '#ff2a9d' },
];

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  onSectionChange,
  currentTheme,
  onThemeChange,
  language,
  onToggleLanguage,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState<boolean>(false);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const t = UI_TRANSLATIONS[language].nav;

  const NAV_ITEMS = [
    { id: 'about', label: t.about, icon: User },
    { id: 'skills', label: t.skills, icon: Code2 },
    { id: 'projects', label: t.projects, icon: Layers },
    { id: 'contact', label: t.contact, icon: Mail },
  ];

  // Auto-collapse sidebar after 5 seconds when mouse leaves the sidebar area
  const handleMouseLeave = () => {
    if (isExpanded) {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
      collapseTimeoutRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 5000);
    }
  };

  const handleMouseEnter = () => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
  };

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, []);

  // Close theme menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest('.theme-switcher-container') && 
        !target.closest('.mobile-theme-container')
      ) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`hidden md:flex flex-col justify-between fixed top-0 left-0 h-screen z-40 transition-all duration-300 ease-in-out border-r border-white/10 backdrop-blur-xl bg-slate-950/80 ${
          isExpanded ? 'w-56' : 'w-20'
        }`}
      >
        {/* Top Controls: Collapse Toggle & Theme Switcher */}
        <div className="p-3.5 flex flex-col gap-3">
          {/* Expand/Collapse Button */}
          <button
            id="nav-toggle-btn"
            onClick={() => {
              if (collapseTimeoutRef.current) {
                clearTimeout(collapseTimeoutRef.current);
                collapseTimeoutRef.current = null;
              }
              setIsExpanded(!isExpanded);
            }}
            className="w-full flex items-center justify-center p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer group"
            title={isExpanded ? t.collapse : t.expand}
            aria-label="Toggle navigation width"
          >
            {isExpanded ? (
              <div className="flex items-center gap-2.5 w-full px-1">
                <ChevronLeft className="w-5 h-5 text-accent group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  {t.collapse}
                </span>
              </div>
            ) : (
              <Menu className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" />
            )}
          </button>

          {/* Theme Switcher */}
          <div className="relative theme-switcher-container">
            <button
              id="theme-toggle-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsThemeMenuOpen(!isThemeMenuOpen);
              }}
              className="w-full flex items-center justify-center p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer group"
              title={t.theme}
              aria-label="Change theme accent color"
            >
              <div className={`flex items-center ${isExpanded ? 'gap-2.5 w-full px-1' : 'justify-center'}`}>
                <div className="relative">
                  <Palette className="w-5 h-5 text-accent group-hover:rotate-45 transition-transform" />
                  <span
                    className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-slate-900 shadow-sm"
                    style={{ backgroundColor: THEME_OPTIONS.find((t) => t.id === currentTheme)?.color }}
                  />
                </div>
                {isExpanded && (
                  <span className="text-xs font-medium text-slate-200">
                    {t.theme}
                  </span>
                )}
              </div>
            </button>

            {/* Desktop Theme Dropdown Menu */}
            {isThemeMenuOpen && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute top-0 left-full ml-3 p-3 bg-slate-900/95 border border-white/15 rounded-2xl shadow-2xl backdrop-blur-2xl w-48 z-50 animate-in fade-in zoom-in-95 duration-200"
              >
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                  {t.chooseTheme}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {THEME_OPTIONS.map((theme) => {
                    const isActive = currentTheme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onThemeChange(theme.id);
                          setIsThemeMenuOpen(false);
                        }}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer ${
                          isActive
                            ? 'border-white/40 bg-white/15 scale-105'
                            : 'border-white/5 hover:border-white/20 hover:bg-white/5'
                        }`}
                        title={theme.name}
                      >
                        <span
                          className={`w-6 h-6 rounded-full shadow-md flex items-center justify-center transition-transform ${
                            isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : ''
                          }`}
                          style={{ backgroundColor: theme.color }}
                        />
                        <span className="text-[10px] text-slate-300 truncate max-w-full font-medium">
                          {theme.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle: Navigation Links */}
        <nav className="flex-1 flex flex-col justify-center px-2.5 py-4">
          <ul className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onSectionChange(item.id)}
                    className={`w-full flex items-center rounded-xl p-3 text-sm font-medium transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-accent-soft text-white border border-accent-border shadow-accent-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                    } ${isExpanded ? 'justify-start px-3.5 gap-3.5' : 'justify-center'}`}
                    title={item.label}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 transition-transform ${
                        isActive ? 'text-accent scale-110' : 'text-slate-400'
                      }`}
                    />
                    {isExpanded && (
                      <span className="whitespace-nowrap tracking-wide">
                        {item.label}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Actions: Language Switcher */}
        <div className="p-3 border-t border-white/10 flex flex-col gap-2">
          {/* Prominent Language Switcher Button */}
          <button
            id="lang-switcher-btn"
            onClick={onToggleLanguage}
            className="w-full flex items-center justify-center p-2.5 rounded-xl bg-accent-soft/40 hover:bg-accent-soft border border-accent-border text-white text-xs font-bold transition-all cursor-pointer group shadow-sm hover:scale-[1.02] active:scale-95"
            title={t.switchLang}
            aria-label="Toggle language between English and Vietnamese"
          >
            <div className={`flex items-center ${isExpanded ? 'gap-2.5 w-full px-1 justify-between' : 'justify-center'}`}>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-accent group-hover:rotate-45 transition-transform flex-shrink-0" />
                {isExpanded && (
                  <span className="truncate uppercase font-bold tracking-wider text-[11px]">
                    {language === 'en' ? 'English (EN)' : 'Tiếng Việt (VI)'}
                  </span>
                )}
              </div>
              <span className="px-1.5 py-0.5 rounded-md bg-accent text-slate-950 text-[10px] font-extrabold uppercase shadow-sm">
                {language === 'en' ? 'VI' : 'EN'}
              </span>
            </div>
          </button>

          {/* Quick status pill */}
          <div className={`flex items-center ${isExpanded ? 'px-2 py-1 gap-2' : 'justify-center py-1'}`}>
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {isExpanded && (
              <span className="text-[11px] text-slate-400 truncate">
                {t.available}
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-white/10 px-3.5 py-2.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full border-2 border-accent overflow-hidden shadow-sm flex-shrink-0">
            <img
              src="https://0hoanglong.zone.id/portfolio-long-v20-spa-new/avt.jpg"
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white leading-tight truncate">Trần Hoàng Long</h1>
            <p className="text-[10px] text-accent font-medium truncate">Frontend Developer</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Mobile Theme Switcher */}
          <div className="relative mobile-theme-container">
            <button
              id="mobile-theme-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsThemeMenuOpen(!isThemeMenuOpen);
              }}
              className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-accent cursor-pointer transition-all flex items-center justify-center"
              aria-label="Change theme accent color"
              title={t.theme}
            >
              <Palette className="w-4 h-4" />
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-950 shadow-sm"
                style={{ backgroundColor: THEME_OPTIONS.find((th) => th.id === currentTheme)?.color }}
              />
            </button>

            {/* Mobile Theme Dropdown Floating */}
            {isThemeMenuOpen && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute top-12 right-0 p-3.5 bg-slate-900/98 border border-white/20 rounded-2xl shadow-2xl backdrop-blur-2xl w-48 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between mb-2.5 px-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t.chooseTheme}
                  </p>
                  <span className="text-[9px] font-mono text-accent uppercase">
                    {currentTheme}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {THEME_OPTIONS.map((theme) => {
                    const isActive = currentTheme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onThemeChange(theme.id);
                          setIsThemeMenuOpen(false);
                        }}
                        className={`p-2 rounded-xl flex flex-col items-center gap-1.5 border transition-all cursor-pointer active:scale-95 ${
                          isActive 
                            ? 'border-white/50 bg-white/20 shadow-sm ring-1 ring-white/50' 
                            : 'border-white/10 hover:border-white/30 bg-white/5'
                        }`}
                        title={theme.name}
                      >
                        <span
                          className={`w-5 h-5 rounded-full shadow-md transition-transform ${
                            isActive ? 'scale-110 ring-2 ring-white ring-offset-1 ring-offset-slate-900' : ''
                          }`}
                          style={{ backgroundColor: theme.color }}
                        />
                        <span className="text-[9px] text-slate-300 font-medium truncate max-w-full">
                          {theme.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Language Switcher Button */}
          <button
            id="mobile-lang-btn"
            onClick={onToggleLanguage}
            className="px-2.5 py-1.5 rounded-xl bg-accent-soft hover:bg-accent-soft/80 border border-accent-border text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-sm"
            aria-label="Toggle language"
            title={t.switchLang}
          >
            <Globe className="w-3.5 h-3.5 text-accent flex-shrink-0" />
            <span className="uppercase text-[11px] font-extrabold">{language === 'en' ? 'VI' : 'EN'}</span>
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav 
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-2xl border-t border-white/10 px-2 py-1.5 flex justify-around items-center shadow-2xl"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSectionChange(item.id);
                // Also close any open popup
                setIsThemeMenuOpen(false);
              }}
              className={`relative flex flex-col items-center justify-center py-1 px-3.5 rounded-xl transition-all cursor-pointer active:scale-90 ${
                isActive 
                  ? 'text-white bg-accent-soft/60 border border-accent-border/50 shadow-accent-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon 
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'text-accent scale-110' : 'text-slate-400'
                }`} 
              />
              <span className={`text-[10px] font-semibold mt-0.5 tracking-tight ${
                isActive ? 'text-white' : 'text-slate-400'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
