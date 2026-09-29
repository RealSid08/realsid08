export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  period: string;
  description: string[];
  tech: string[];
  location?: string;
  employmentType?: string;
  lane: 'active' | 'archive';
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  bullets?: string[];
  link?: string;
  githubUrl?: string;
  tech: string[];
  type: 'live-demo' | 'visualization' | 'standard' | 'open-source';
  subtitle?: string;
  period?: string;
  featured?: boolean;
}

export interface SkillCluster {
  id: string;
  label: string;
  items: string[];
  emphasis?: boolean;
}

export interface ProfileInfo {
  givenName: string;
  familyName: string;
  title: string;
  /** one or two sentences under the name */
  tagline: string;
  location: string;
  visa: string;
  availability: string;
  manifesto: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
  website: string;
  resumeUrl: string;
}

export interface EducationInfo {
  school: string;
  campus: string;
  degree: string;
  graduating: string;
  /** units passed with a High Distinction, best first */
  distinctions: Array<{ unit: string; mark: number }>;
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
