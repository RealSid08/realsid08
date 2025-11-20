export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  period: string;
  description: string[];
  tech: string[];
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  link?: string;
  githubUrl?: string;
  tech: string[];
  type: 'live-demo' | 'visualization' | 'standard';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export enum ViewState {
  IDLE,
  LISTENING,
  SPEAKING,
  PROCESSING
}