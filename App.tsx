import React from 'react';
import { ThreeBackground } from './components/ThreeBackground';
import { LiveDemo } from './components/LiveDemo';
import { ChatBot } from './components/ChatBot';
import { Experience } from './components/Experience';
import { Hero } from './components/Hero';
import { SkillsMap } from './components/SkillsMap';
import { ProjectExhibits } from './components/ProjectExhibits';
import { FadeInSection } from './components/FadeInSection';
import { EDUCATION, PROFILE } from './constants';

const App: React.FC = () => {
  return (
    <div className="min-h-screen text-white selection:bg-white selection:text-black relative font-sans animate-appear">
      <ThreeBackground />
      <ChatBot />
      <Hero />

      <main className="relative z-10 container mx-auto px-4 md:px-6 pb-20 md:pb-32 max-w-7xl">
        <SkillsMap />

        <section id="experience" className="mb-24 md:mb-40 scroll-mt-16">
          <Experience />
        </section>

        <ProjectExhibits />

        <section id="education" className="mb-24 md:mb-40 scroll-mt-16">
          <FadeInSection>
            <div className="border border-white/10 bg-black/50 p-6 md:p-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-3">/EDU/CURRENT</p>
                <h2 className="text-2xl md:text-4xl font-bold">{EDUCATION.school}</h2>
                <p className="text-gray-400 mt-3 text-sm md:text-base">{EDUCATION.degree}</p>
              </div>
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-gray-400 text-left md:text-right">
                <p>{EDUCATION.campus}</p>
                <p className="text-white mt-2">Graduating {EDUCATION.graduating}</p>
              </div>
            </div>
          </FadeInSection>
        </section>

        <section id="aura" className="mb-24 md:mb-40 scroll-mt-16">
          <FadeInSection>
            <div className="mb-8 md:mb-12 border-l-2 border-white pl-4 md:pl-6">
              <h2 className="text-3xl md:text-4xl font-bold mt-2">VOICE HUB</h2>
            </div>
            <LiveDemo />
          </FadeInSection>
        </section>

        <FadeInSection>
          <footer id="contact" className="text-center py-12 border-t border-white/10 scroll-mt-16">
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-lg md:text-xl font-light tracking-widest">SIDHAARTH KRISHNAN</h3>
              <p className="text-gray-500 text-xs font-mono px-4">{PROFILE.phone}</p>
              <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-xs uppercase tracking-widest text-gray-400 mt-4">
                <a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors p-2 md:p-0">LinkedIn</a>
                <a href={PROFILE.github} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors p-2 md:p-0">GitHub</a>
                <a href={`mailto:${PROFILE.email}`} className="hover:text-white transition-colors p-2 md:p-0">Email</a>
                <a href={PROFILE.resumeUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors p-2 md:p-0">Résumé</a>
              </div>
            </div>
          </footer>
        </FadeInSection>
      </main>
    </div>
  );
};

export default App;
