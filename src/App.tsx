import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ThemeColor, Language, ToastMessage } from './types';
import { UI_TRANSLATIONS } from './data/portfolioData';
import { CosmicBackground } from './components/CosmicBackground';
import { Header } from './components/Header';
import { AboutSection } from './components/AboutSection';
import { SkillsSection } from './components/SkillsSection';
import { ProjectsSection } from './components/ProjectsSection';
import { ContactSection } from './components/ContactSection';
import { ToastContainer } from './components/ToastContainer';
import { LofiProvider } from './context/LofiContext';
import { LofiMiniPlayer } from './components/LofiMiniPlayer';

export default function App() {
  const [activeSection, setActiveSection] = useState<string>('about');
  const [currentTheme, setCurrentTheme] = useState<ThemeColor>('blue');
  const [language, setLanguage] = useState<Language>('en'); // Default to English
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Load language and theme from localStorage on initial load
  useEffect(() => {
    // 1. Language (English default)
    const savedLang = (localStorage.getItem('portfolio-language') as Language) || 'en';
    setLanguage(savedLang);
    document.documentElement.lang = savedLang;

    // 2. Theme
    const savedTheme = (localStorage.getItem('portfolio-theme') as ThemeColor) || 'blue';
    setCurrentTheme(savedTheme);
    document.documentElement.dataset.theme = savedTheme;
  }, []);

  // Toggle Language Handler (EN <-> VI)
  const handleToggleLanguage = () => {
    const nextLang: Language = language === 'en' ? 'vi' : 'en';
    setLanguage(nextLang);
    document.documentElement.lang = nextLang;
    localStorage.setItem('portfolio-language', nextLang);

    const toastText = UI_TRANSLATIONS[nextLang].toasts;
    showToast(
      'info',
      toastText.langChangedTitle,
      nextLang === 'en'
        ? 'Switched application language to English.'
        : 'Đã chuyển giao diện sang Tiếng Việt.'
    );
  };

  // Change Theme handler
  const handleThemeChange = (theme: ThemeColor) => {
    setCurrentTheme(theme);
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('portfolio-theme', theme);
    
    const toastText = UI_TRANSLATIONS[language].toasts;
    showToast(
      'info',
      toastText.themeChangedTitle,
      `${toastText.themeChangedMsg} ${theme.toUpperCase()}.`
    );
  };

  // Toast notification helper
  const showToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Keyboard navigation shortcuts (Arrow keys / 1-4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const sections = ['about', 'skills', 'projects', 'contact'];
      const currentIndex = sections.indexOf(activeSection);

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        const nextIndex = (currentIndex + 1) % sections.length;
        setActiveSection(sections[nextIndex]);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        const prevIndex = (currentIndex - 1 + sections.length) % sections.length;
        setActiveSection(sections[prevIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSection]);

  return (
    <LofiProvider>
      <div className="min-h-screen bg-[#090a0f] text-slate-100 relative overflow-x-hidden flex flex-col md:flex-row">
        {/* Cosmic Animated Starfield Background */}
        <CosmicBackground />

        {/* Navigation Header / Sidebar */}
        <Header
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          currentTheme={currentTheme}
          onThemeChange={handleThemeChange}
          language={language}
          onToggleLanguage={handleToggleLanguage}
        />

        {/* Main Content Area */}
        <main className="flex-1 md:ml-20 transition-all duration-300 min-h-screen pt-16 pb-20 md:pt-0 md:pb-0 relative z-10 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {activeSection === 'about' && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 25, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -25, filter: 'blur(8px)' }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="w-full h-full"
              >
                <AboutSection
                  onNavigate={setActiveSection}
                  language={language}
                />
              </motion.div>
            )}

            {activeSection === 'skills' && (
              <motion.div
                key="skills"
                initial={{ opacity: 0, y: 25, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -25, filter: 'blur(8px)' }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="w-full h-full"
              >
                <SkillsSection language={language} />
              </motion.div>
            )}

            {activeSection === 'projects' && (
              <motion.div
                key="projects"
                initial={{ opacity: 0, y: 25, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -25, filter: 'blur(8px)' }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="w-full h-full"
              >
                <ProjectsSection language={language} />
              </motion.div>
            )}

            {activeSection === 'contact' && (
              <motion.div
                key="contact"
                initial={{ opacity: 0, y: 25, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -25, filter: 'blur(8px)' }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="w-full h-full"
              >
                <ContactSection
                  language={language}
                  onShowToast={showToast}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Global Floating Mini Lofi Player when on other sections */}
        <LofiMiniPlayer
          language={language}
          onNavigate={setActiveSection}
          activeSection={activeSection}
        />

        {/* Floating Toast Notification Container */}
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      </div>
    </LofiProvider>
  );
}

