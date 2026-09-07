import React from 'react';
import { PROJECTS } from '../constants';
import { ProjectItem } from '../types';
import { FadeInSection } from './FadeInSection';
import { FoodlyViz } from './FoodlyViz';
import { ParkAlongViz } from './ParkAlongViz';
import { TrafficViz } from './TrafficViz';
import { RagVisualizer } from './RagVisualizer';

const GitHubIcon: React.FC = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

const ProjectVisual: React.FC<{ id: string }> = ({ id }) => {
  switch (id) {
    case 'foodly':
      return <FoodlyViz />;
    case 'parkalong':
      return <ParkAlongViz />;
    case 'tbrgs':
      return <TrafficViz />;
    case 'rag-viz':
      return <RagVisualizer />;
    default:
      return null;
  }
};

const Exhibit: React.FC<{ project: ProjectItem; featured?: boolean }> = ({ project, featured }) => {
  const isCanvasViz = project.id === 'foodly' || project.id === 'parkalong';

  return (
  <div className="group relative bg-black border border-white/10 hover:border-white transition-colors duration-500 h-full flex flex-col">
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
    {isCanvasViz && (
      <div className={`relative overflow-hidden border-b border-white/10 bg-gray-900/20 ${featured ? 'h-[200px] md:h-[280px]' : 'h-[180px] md:h-[220px]'}`}>
        <div className="absolute inset-0 opacity-90 group-hover:opacity-100 transition-opacity">
          <ProjectVisual id={project.id} />
        </div>
      </div>
    )}
    <div className="p-6 md:p-8 flex flex-col flex-grow relative z-10">
      <div className="flex justify-between items-start mb-4 gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg md:text-2xl font-bold text-white">{project.title}</h3>
            {project.githubUrl && (
              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors" title="View Source">
                <GitHubIcon />
              </a>
            )}
          </div>
          {project.subtitle && (
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400 mt-2">{project.subtitle}</p>
          )}
          {project.period && (
            <p className="font-mono text-[10px] text-gray-600 mt-1">{project.period}</p>
          )}
        </div>
        <div className="w-2 h-2 bg-white/20 group-hover:bg-white transition-colors shrink-0 mt-2" />
      </div>

      <div className="space-y-3 mb-6">
        {(project.bullets ?? [project.description]).map((bullet) => (
          <p key={bullet} className="font-mono text-[11px] md:text-xs text-gray-400 leading-relaxed">
            <span className="text-white mr-2">+</span>
            {bullet}
          </p>
        ))}
      </div>

      {!isCanvasViz && (
        <div className="mb-8 opacity-90 group-hover:opacity-100 transition-opacity -mx-2 md:mx-0">
          <ProjectVisual id={project.id} />
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-white/10 flex flex-wrap gap-2 md:gap-3">
        {project.tech.map((t) => (
          <span key={t} className="text-[10px] font-mono uppercase tracking-wider text-gray-500 border border-white/10 px-2 py-1">
            {t}
          </span>
        ))}
      </div>
    </div>
  </div>
  );
};

export const ProjectExhibits: React.FC = () => {
  const exhibits = PROJECTS.filter((project) => project.type !== 'live-demo');
  const featured = exhibits.filter((project) => project.featured);
  const rest = exhibits.filter((project) => !project.featured);

  return (
    <section id="projects" className="mb-24 md:mb-40 scroll-mt-16">
      <FadeInSection>
        <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4 mb-10 md:mb-16 border-b border-white/10 pb-6">
          <h2 className="text-3xl md:text-4xl font-bold">PROJECT EXHIBITS</h2>
          <span className="text-gray-500 font-mono text-xs md:mb-2">/DEV/BUILD</span>
        </div>
      </FadeInSection>

      <div className="space-y-6 md:space-y-8 mb-8">
        {featured.map((project, idx) => (
          <FadeInSection key={project.id} delay={idx * 80}>
            <div id={`project-${project.id}`}>
              <Exhibit project={project} featured />
            </div>
          </FadeInSection>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {rest.map((project, idx) => (
          <FadeInSection key={project.id} delay={idx * 100} className="h-full">
            <Exhibit project={project} />
          </FadeInSection>
        ))}
      </div>
    </section>
  );
};
