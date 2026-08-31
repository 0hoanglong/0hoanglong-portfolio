import React, { useState } from 'react';
import { 
  Layers, 
  ExternalLink, 
  Github, 
  Eye, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  Globe 
} from 'lucide-react';
import { PROJECTS_DATA, UI_TRANSLATIONS } from '../data/portfolioData';
import { ProjectItem, Language } from '../types';
import { MagicCard } from './MagicCard';

interface ProjectsSectionProps {
  language: Language;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({ language }) => {
  const t = UI_TRANSLATIONS[language].projects;
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<'all' | 'edu' | 'web' | 'app'>('all');

  const filteredProjects = PROJECTS_DATA.filter((p) => {
    if (filterCategory === 'all') return true;
    return p.category === filterCategory;
  });

  const FILTER_TABS = [
    { id: 'all', label: t.all },
    { id: 'edu', label: t.edu },
    { id: 'web', label: t.web },
    { id: 'app', label: t.app },
  ];

  return (
    <section id="projects" className="min-h-full py-8 px-4 sm:px-6 lg:px-10 max-w-6xl mx-auto flex flex-col justify-center">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-5 h-5 text-accent" />
            <span className="text-xs font-bold uppercase tracking-widest text-accent">
              {t.tagline}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            {t.title}
          </h2>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {FILTER_TABS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterCategory === cat.id
                  ? 'bg-accent text-slate-950 font-bold shadow-accent-sm'
                  : 'bg-slate-900/60 hover:bg-slate-900 border border-white/10 text-slate-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const title = language === 'en' ? project.titleEn : project.titleVi;
          const subtitle = language === 'en' ? project.subtitleEn : project.subtitleVi;
          const description = language === 'en' ? project.descriptionEn : project.descriptionVi;

          return (
            <MagicCard
              key={project.id}
              enableTilt={true}
              enableBorderGlow={true}
              enableStars={true}
              particleCount={6}
              className="group rounded-3xl bg-slate-900/70 border border-white/10 overflow-hidden backdrop-blur-xl shadow-xl flex flex-col justify-between transition-all duration-300"
            >
              {/* Image Preview Container */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                <img
                  src={project.image}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                {/* Badges on image */}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  {project.featured && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-accent text-slate-950 uppercase tracking-wider shadow-md">
                      {t.featured}
                    </span>
                  )}
                </div>

                {/* Quick inspect overlay button */}
                <button
                  onClick={() => setSelectedProject(project)}
                  className="absolute bottom-3 right-3 p-2 rounded-xl bg-slate-950/80 hover:bg-accent hover:text-slate-950 text-white border border-white/20 backdrop-blur-md transition-all cursor-pointer shadow-lg"
                  title="Inspect project details"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>

              {/* Content Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-accent transition-colors line-clamp-1">
                    {title}
                  </h3>
                  <p className="text-xs text-accent font-medium mt-0.5 mb-2.5">
                    {subtitle}
                  </p>
                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-4">
                    {description}
                  </p>
                </div>

                {/* Tech Tags & Links */}
                <div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/5 text-slate-300 border border-white/5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target={project.liveUrl.startsWith('http') ? '_blank' : '_self'}
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-slate-950 font-bold text-xs hover:opacity-90 transition-all shadow-accent-sm"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>{t.liveDemo}</span>
                        </a>
                      )}
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs border border-white/10 transition-colors"
                        >
                          <Github className="w-3.5 h-3.5" />
                          <span>{t.sourceCode}</span>
                        </a>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedProject(project)}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      {t.viewDetails} <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </MagicCard>
          );
        })}
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
            <button
              onClick={() => setSelectedProject(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="rounded-2xl overflow-hidden mb-5 border border-white/10">
              <img
                src={selectedProject.image}
                alt={language === 'en' ? selectedProject.titleEn : selectedProject.titleVi}
                className="w-full h-64 object-cover"
              />
            </div>

            <div className="space-y-4">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-accent-soft text-accent border border-accent-border uppercase">
                  {selectedProject.category}
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-2">
                  {language === 'en' ? selectedProject.titleEn : selectedProject.titleVi}
                </h3>
                <p className="text-sm text-accent">
                  {language === 'en' ? selectedProject.subtitleEn : selectedProject.subtitleVi}
                </p>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                {language === 'en' ? selectedProject.descriptionEn : selectedProject.descriptionVi}
              </p>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  {t.highlightsTitle}
                </h4>
                <ul className="space-y-2">
                  {(language === 'en' ? selectedProject.highlightsEn : selectedProject.highlightsVi).map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  {t.techStackTitle}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 text-slate-200 border border-white/10"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                {selectedProject.liveUrl && (
                  <a
                    href={selectedProject.liveUrl}
                    target={selectedProject.liveUrl.startsWith('http') ? '_blank' : '_self'}
                    rel="noreferrer"
                    className="flex-1 py-2.5 rounded-xl bg-accent text-slate-950 font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-accent-sm text-center"
                  >
                    <Globe className="w-4 h-4" />
                    <span>{t.liveDemo}</span>
                  </a>
                )}
                {selectedProject.githubUrl && (
                  <a
                    href={selectedProject.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm flex items-center justify-center gap-2 border border-white/10 transition-colors text-center"
                  >
                    <Github className="w-4 h-4" />
                    <span>{t.sourceCode}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
