import React, { useState } from 'react';
import { 
  Code2, 
  Layers, 
  Terminal, 
  Database, 
  Users, 
  Lightbulb, 
  Clock, 
  MessageSquare, 
  HeartHandshake, 
  Search, 
  Sparkles, 
  CheckCircle, 
  FileCode, 
  Palette, 
  Server, 
  Cpu, 
  Atom, 
  GitBranch 
} from 'lucide-react';
import { SKILLS_DATA, UI_TRANSLATIONS } from '../data/portfolioData';
import { SkillItem, Language } from '../types';
import { MagicCard } from './MagicCard';

interface SkillsSectionProps {
  language: Language;
}

type CategoryFilter = 'all' | 'frontend' | 'backend' | 'soft' | 'tools';

export const SkillsSection: React.FC<SkillsSectionProps> = ({ language }) => {
  const t = UI_TRANSLATIONS[language].skills;
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSkill, setActiveSkill] = useState<SkillItem | null>(null);

  const CATEGORY_TABS: { id: CategoryFilter; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: t.all, icon: Sparkles },
    { id: 'frontend', label: t.frontend, icon: Layers },
    { id: 'backend', label: t.backend, icon: Database },
    { id: 'soft', label: t.soft, icon: Users },
    { id: 'tools', label: t.tools, icon: Terminal },
  ];

  const filteredSkills = SKILLS_DATA.filter((skill) => {
    const desc = language === 'en' ? skill.descriptionEn : skill.descriptionVi;
    const tags = language === 'en' ? skill.tagsEn : skill.tagsVi;

    const matchesCat = selectedCategory === 'all' || skill.category === selectedCategory;
    const matchesSearch =
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tags.some((tg) => tg.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const getSkillIcon = (iconName: string) => {
    switch (iconName) {
      case 'Code2':
        return Code2;
      case 'Palette':
        return Palette;
      case 'Layers':
        return Layers;
      case 'FileCode':
        return FileCode;
      case 'Atom':
        return Atom;
      case 'Server':
        return Server;
      case 'Cpu':
        return Cpu;
      case 'Terminal':
        return Terminal;
      case 'Database':
        return Database;
      case 'GitBranch':
        return GitBranch;
      case 'MessageSquare':
        return MessageSquare;
      case 'Clock':
        return Clock;
      case 'Users':
        return Users;
      case 'Lightbulb':
        return Lightbulb;
      case 'HeartHandshake':
        return HeartHandshake;
      default:
        return Code2;
    }
  };

  return (
    <section id="skills" className="min-h-full py-8 px-4 sm:px-6 lg:px-10 max-w-6xl mx-auto flex flex-col justify-center">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Code2 className="w-5 h-5 text-accent" />
            <span className="text-xs font-bold uppercase tracking-widest text-accent">
              {t.tagline}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              {t.title}
            </h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-accent/20 via-purple-500/20 to-emerald-500/20 border border-accent/40 text-xs text-slate-200 font-medium backdrop-blur-md shadow-[0_0_16px_rgba(0,210,255,0.2)]">
              <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
              <span className="font-semibold text-white tracking-wide">
                {t.aiBoost}
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {CATEGORY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-accent text-slate-950 shadow-accent-sm font-bold scale-102'
                  : 'bg-slate-900/60 hover:bg-slate-900 border border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-white/10 text-slate-400'
                }`}
              >
                {tab.id === 'all'
                  ? SKILLS_DATA.length
                  : SKILLS_DATA.filter((s) => s.category === tab.id).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSkills.map((skill) => {
          const Icon = getSkillIcon(skill.icon);
          const isSelected = activeSkill?.id === skill.id;
          const description = language === 'en' ? skill.descriptionEn : skill.descriptionVi;
          const tags = language === 'en' ? skill.tagsEn : skill.tagsVi;

          return (
            <MagicCard
              key={skill.id}
              enableTilt={true}
              enableBorderGlow={true}
              enableStars={true}
              particleCount={5}
              onClick={() => setActiveSkill(isSelected ? null : skill)}
              className={`p-4 sm:p-5 rounded-2xl bg-slate-900/70 border backdrop-blur-xl transition-all duration-300 cursor-pointer group ${
                isSelected
                  ? 'border-accent shadow-accent-sm bg-slate-900/90'
                  : 'border-white/10 hover:border-white/25 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 transition-transform group-hover:scale-110 group-hover:rotate-6"
                    style={{ backgroundColor: `${skill.color}18`, color: skill.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-accent transition-colors">
                      {skill.name}
                    </h3>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                      {skill.category === 'soft'
                        ? language === 'en' ? 'Soft Skill' : 'Kỹ năng mềm'
                        : skill.category}
                    </span>
                  </div>
                </div>

                {/* Percentage pill */}
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold"
                  style={{ backgroundColor: `${skill.color}20`, color: skill.color }}
                >
                  {skill.percent}%
                </span>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3 border border-white/5">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${skill.percent}%`,
                    backgroundColor: skill.color,
                    boxShadow: `0 0 10px ${skill.color}80`,
                  }}
                />
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
                {description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/5 text-slate-400 group-hover:text-slate-200 border border-white/5"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </MagicCard>
          );
        })}
      </div>

      {filteredSkills.length === 0 && (
        <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-white/10">
          <p className="text-slate-400 text-sm">{t.noResult} "{searchQuery}".</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-2 text-xs text-accent underline cursor-pointer"
          >
            {t.clearSearch}
          </button>
        </div>
      )}

      {/* Bottom Summary Bar */}
      <MagicCard 
        enableTilt={false}
        enableBorderGlow={true}
        enableStars={false}
        className="mt-8 p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 to-slate-950 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300"
      >
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{t.bottomSummary}</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-slate-400 shrink-0">
          <span className="flex items-center gap-1 text-accent">
            <Sparkles className="w-3.5 h-3.5" />
            <strong className="text-white">+50% AI Boost</strong>
          </span>
          <span className="text-slate-600">|</span>
          <span>{t.totalSkills} <strong className="text-white">{SKILLS_DATA.length}</strong> {t.skillsCount}</span>
        </div>
      </MagicCard>
    </section>
  );
};
