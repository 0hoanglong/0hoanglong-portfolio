export type Language = 'en' | 'vi';
export type ThemeColor = 'blue' | 'red' | 'yellow' | 'green' | 'purple' | 'pink';

export interface SkillItem {
  id: string;
  name: string;
  category: 'frontend' | 'backend' | 'soft' | 'tools';
  percent: number;
  icon: string;
  color: string;
  descriptionEn: string;
  descriptionVi: string;
  tagsEn: string[];
  tagsVi: string[];
}

export interface ProjectItem {
  id: string;
  titleEn: string;
  titleVi: string;
  subtitleEn: string;
  subtitleVi: string;
  descriptionEn: string;
  descriptionVi: string;
  image: string;
  category: 'web' | 'edu' | 'app';
  tags: string[];
  liveUrl?: string;
  githubUrl?: string;
  featured: boolean;
  highlightsEn: string[];
  highlightsVi: string[];
}

export interface ContactMessage {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  message: string;
  timestamp: string;
  ip?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}
