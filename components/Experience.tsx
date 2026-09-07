import React from 'react';
import { EXPERIENCES } from '../constants';
import { ExperienceItem } from '../types';
import { FadeInSection } from './FadeInSection';
import { HiDaVisual, IdhayamVisual, ImaginetVisual, MindtekVisual, UniEatsVisual } from './ExperienceVisuals';
import { BesmakVisual, CompleteLeaderVisual, KenspireVisual } from './WorkstreamVisuals';

const getVisual = (id: string) => {
  switch (id) {
    case 'besmak': return <BesmakVisual />;
    case 'complete-leader': return <CompleteLeaderVisual />;
    case 'kenspire': return <KenspireVisual />;
    case 'mindtek': return <MindtekVisual />;
    case 'unieats': return <UniEatsVisual />;
    case 'idhayam': return <IdhayamVisual />;
    case 'hida': return <HiDaVisual />;
    case 'imaginet': return <ImaginetVisual />;
    default: return null;
  }
};

const generateHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).substring(0, 7);
};

const ActiveCard: React.FC<{ exp: ExperienceItem; featured?: boolean }> = ({ exp, featured }) => (
  <div id={`exp-${exp.id}`} className="group relative flex flex-col h-full border border-white/10 bg-black hover:border-white/50 transition-colors duration-500 scroll-mt-20">
    <div className={`relative overflow-hidden border-b border-white/10 bg-gray-900/20 ${featured ? 'h-[200px] md:h-[340px]' : 'h-[200px] md:h-[260px]'}`}>
      <div className="absolute inset-0 opacity-80 group-hover:opacity-100 transition-opacity duration-500">
        {getVisual(exp.id)}
      </div>
      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur border border-white/20 px-2 py-1">
        <span className="text-[10px] font-mono text-white tracking-widest uppercase">{exp.role}</span>
      </div>
      <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
        <span className="text-[10px] font-mono text-gray-300 bg-black/60 px-2 py-1">{exp.period}</span>
        {exp.employmentType && (
          <span className="text-[9px] font-mono uppercase tracking-widest text-gray-500 bg-black/60 px-2 py-0.5">
            {exp.employmentType}
          </span>
        )}
      </div>
    </div>

    <div className="p-5 md:p-6 flex-grow flex flex-col">
      <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
        <div>
          <h3 className="text-xl md:text-2xl font-bold tracking-tight">{exp.company}</h3>
          {exp.location && (
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-1">{exp.location}</p>
          )}
        </div>
        <span className="font-mono text-[10px] text-gray-600">commit {generateHash(exp.id + exp.company)}</span>
      </div>

      <ul className="space-y-3 mb-6">
        {exp.description.map((point) => (
          <li key={point} className="flex gap-2 font-mono text-[11px] md:text-xs text-gray-300 leading-relaxed">
            <span className="text-white shrink-0">+</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-4 border-t border-white/10 flex flex-wrap gap-2">
        {exp.tech.map((t) => (
          <span key={t} className="text-[10px] font-mono uppercase tracking-wider text-gray-500 border border-white/10 px-2 py-1">
            {t}
          </span>
        ))}
      </div>
    </div>
  </div>
);

const ArchiveCard: React.FC<{ exp: ExperienceItem }> = ({ exp }) => (
  <div className="group relative flex flex-col h-full border border-white/10 bg-black hover:border-white/40 transition-colors duration-500">
    <div className="relative h-[140px] md:h-[180px] overflow-hidden border-b border-white/10 bg-gray-900/20">
      <div className="absolute inset-0 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
        {getVisual(exp.id)}
      </div>
      <div className="absolute top-3 left-3 bg-black/80 backdrop-blur border border-white/20 px-2 py-1">
        <span className="text-[10px] font-mono text-white tracking-widest uppercase">{exp.role}</span>
      </div>
      <div className="absolute top-3 right-3">
        <span className="text-[10px] font-mono text-gray-400 bg-black/50 px-2 py-1">{exp.period}</span>
      </div>
    </div>

    <div className="bg-black p-4 flex-grow font-mono text-[11px] md:text-xs text-gray-400">
      <div className="flex items-center gap-2 mb-2 text-gray-600 text-[10px] border-b border-white/5 pb-1">
        <span>commit {generateHash(exp.id + exp.company)}</span>
        <span className="flex-grow" />
        <span className="uppercase tracking-wider text-gray-500 truncate">{exp.company}</span>
      </div>
      <div className="space-y-1.5">
        {exp.description.map((point) => (
          <div key={point} className="flex gap-2 opacity-90">
            <span className="text-green-500/70 shrink-0">+</span>
            <span className="leading-tight">{point.toLowerCase()}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const Experience: React.FC = () => {
  const active = EXPERIENCES.filter((exp) => exp.lane === 'active');
  const archive = EXPERIENCES.filter((exp) => exp.lane === 'archive');
  const featured = active[0];
  const rest = active.slice(1);

  return (
    <div className="relative max-w-7xl mx-auto">
      <FadeInSection>
        <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4 mb-8 md:mb-12 border-b border-white/10 pb-6">
          <h2 className="text-3xl md:text-4xl font-bold">ACTIVE WORKSTREAMS</h2>
          <span className="text-gray-500 font-mono text-xs md:mb-2">/PROC/RUNNING</span>
        </div>
      </FadeInSection>

      {featured && (
        <FadeInSection className="mb-6">
          <ActiveCard exp={featured} featured />
        </FadeInSection>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20 md:mb-28">
        {rest.map((exp, index) => (
          <FadeInSection key={exp.id} delay={index * 80} className={exp.id === 'mindtek' ? 'md:col-span-2' : ''}>
            <ActiveCard exp={exp} featured={exp.id === 'mindtek'} />
          </FadeInSection>
        ))}
      </div>

      <FadeInSection>
        <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4 mb-8 md:mb-12 border-b border-white/10 pb-6">
          <h2 className="text-2xl md:text-3xl font-light">ARCHIVE</h2>
          <span className="text-gray-500 font-mono text-xs md:mb-2">/SYS/HISTORY</span>
        </div>
      </FadeInSection>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {archive.map((exp, index) => (
          <FadeInSection key={exp.id} delay={index * 80}>
            <ArchiveCard exp={exp} />
          </FadeInSection>
        ))}
      </div>
    </div>
  );
};
