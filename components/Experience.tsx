import React from 'react';
import { EXPERIENCES } from '../constants';
import { FadeInSection } from './FadeInSection';
import { MindtekVisual, UniEatsVisual, IdhayamVisual, HiDaVisual, ImaginetVisual } from './ExperienceVisuals';

const getVisual = (id: string) => {
  switch (id) {
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

export const Experience: React.FC = () => {
  return (
    <div className="relative max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {EXPERIENCES.map((exp, index) => (
          <FadeInSection key={exp.id} delay={index * 100}>
            <div className="group relative flex flex-col h-full border border-white/10 bg-black hover:border-white/40 transition-colors duration-500">
              
              {/* Visual Area - Dominant */}
              <div className="relative h-[200px] md:h-[300px] overflow-hidden border-b border-white/10 bg-gray-900/20">
                 <div className="absolute inset-0 opacity-70 group-hover:opacity-100 transition-opacity duration-500">
                    {getVisual(exp.id)}
                 </div>
                 
                 {/* Overlay Labels */}
                 <div className="absolute top-4 left-4 bg-black/80 backdrop-blur border border-white/20 px-2 py-1">
                    <span className="text-[10px] font-mono text-white tracking-widest uppercase">{exp.role}</span>
                 </div>
                 <div className="absolute top-4 right-4">
                    <span className="text-[10px] font-mono text-gray-400 bg-black/50 px-2 py-1">{exp.period}</span>
                 </div>

                 {/* Tech Stack Overlay - Minimal */}
                 <div className="absolute bottom-2 right-2 flex gap-1">
                    {exp.tech.slice(0,3).map(t => (
                       <span key={t} className="text-[9px] font-mono text-gray-500 bg-black/80 border border-white/5 px-1.5 py-0.5">{t}</span>
                    ))}
                 </div>
              </div>

              {/* Terminal / Git Log Footer - Minimal Text */}
              <div className="bg-black p-4 flex-grow flex flex-col justify-end font-mono text-[11px] md:text-xs text-gray-400">
                <div className="flex items-center gap-2 mb-2 text-gray-600 text-[10px] border-b border-white/5 pb-1">
                   <span>commit {generateHash(exp.id + exp.company)}</span>
                   <span className="flex-grow"></span>
                   <span className="uppercase tracking-wider text-gray-500 truncate max-w-[100px] md:max-w-none">{exp.company}</span>
                </div>

                <div className="space-y-1.5">
                  {exp.description.slice(0, 2).map((point, i) => (
                    <div key={i} className="flex gap-2 opacity-90 md:opacity-80 md:group-hover:opacity-100 transition-opacity">
                      <span className="text-green-500/70 shrink-0">+</span>
                      <span className="leading-tight hover:whitespace-normal md:truncate md:hover:bg-black/90 md:hover:absolute md:hover:z-20 md:hover:p-2 md:hover:border md:hover:border-white/20 md:hover:shadow-xl transition-all duration-200 cursor-crosshair">
                         {point.toLowerCase()}
                      </span>
                    </div>
                  ))}
                  {exp.description.length > 2 && (
                     <div className="text-gray-700 italic pl-4">... {exp.description.length - 2} more changes</div>
                  )}
                </div>
              </div>

            </div>
          </FadeInSection>
        ))}
      </div>
    </div>
  );
};