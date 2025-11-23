import React from 'react';
import { ThreeBackground } from './components/ThreeBackground';
import { LiveDemo } from './components/LiveDemo';
import { ChatBot } from './components/ChatBot';
import { Experience } from './components/Experience';
import { TrafficViz } from './components/TrafficViz';
import { RagVisualizer } from './components/RagVisualizer';
import { PROJECTS } from './constants';
import { FadeInSection } from './components/FadeInSection';

const App: React.FC = () => {
  return (
    <div className="min-h-screen text-white selection:bg-white selection:text-black relative font-sans animate-appear">
      <ThreeBackground />
      <ChatBot />

      {/* Hero Section */}
      <header className="relative z-10 min-h-[85vh] md:min-h-screen flex flex-col justify-center items-center px-4 md:px-6 text-center">
        <FadeInSection>
          <div className="border border-white/10 bg-black/50 backdrop-blur-sm p-8 md:p-20 relative max-w-3xl mx-auto">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>

            <FadeInSection delay={200}>
              <h1 className="text-4xl md:text-7xl font-light mb-6 tracking-tight text-white break-words">
                SIDHAARTH <span className="font-bold block md:inline">KRISHNAN</span>
              </h1>
            </FadeInSection>

            <FadeInSection delay={400}>
              <p className="text-xs md:text-base text-gray-400 font-mono uppercase tracking-[0.2em] md:tracking-[0.3em] mb-8">
                Software Engineer
              </p>
            </FadeInSection>

            <FadeInSection delay={600}>
              <div className="flex flex-col md:flex-row justify-center gap-4">
                <a href="#experience" className="px-6 py-3 md:py-2 border border-white/20 hover:bg-white hover:text-black transition-colors text-xs uppercase tracking-widest">Experience</a>
                <a href="#projects" className="px-6 py-3 md:py-2 border border-white/20 hover:bg-white hover:text-black transition-colors text-xs uppercase tracking-widest">Projects</a>
              </div>
            </FadeInSection>
          </div>
        </FadeInSection>

        <div className="absolute bottom-12 flex flex-col items-center gap-2 hidden md:flex">
          <FadeInSection delay={1000}>
            <div className="flex flex-col items-center gap-2 animate-bounce opacity-50">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400">Scroll Down</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </FadeInSection>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 md:px-6 pb-20 md:pb-32 max-w-6xl">

        {/* Featured Project: Aura */}
        <section id="aura" className="mb-24 md:mb-40 mt-10 md:mt-20 scroll-mt-20">
          <FadeInSection>
            <div className="mb-8 md:mb-12 border-l-2 border-white pl-4 md:pl-6">
              <h2 className="text-3xl md:text-4xl font-bold mt-2">AURA HUB</h2>
              <p className="text-gray-400 text-xs md:text-sm font-mono mt-2 uppercase">Multimodal Voice AI + IoT Hardware Integration</p>
            </div>
            <LiveDemo />
          </FadeInSection>
        </section>

        {/* Experience Timeline */}
        <section id="experience" className="mb-24 md:mb-40">
          <FadeInSection>
            <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4 mb-10 md:mb-16 border-b border-white/10 pb-6">
              <h2 className="text-3xl md:text-4xl font-bold">CAREER LOG</h2>
              <span className="text-gray-500 font-mono text-xs md:mb-2">/SYS/HISTORY</span>
            </div>
          </FadeInSection>
          <Experience />
        </section>

        {/* Other Projects */}
        <section id="projects" className="mb-24 md:mb-32">
          <FadeInSection>
            <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4 mb-10 md:mb-16 border-b border-white/10 pb-6 max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold">PROJECT SCHEMATICS</h2>
              <span className="text-gray-500 font-mono text-xs md:mb-2">/DEV/BUILD</span>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
            {PROJECTS.filter(p => p.type !== 'live-demo').map((project, idx) => (
              <FadeInSection key={project.id} delay={idx * 100} className="h-full">
                <div className="group relative bg-black border border-white/10 hover:border-white transition-colors duration-500 h-full flex flex-col">
                  {/* Schematic Grid Background */}
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>

                  <div className="p-6 md:p-8 flex flex-col flex-grow relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg md:text-xl font-bold text-white group-hover:underline decoration-1 underline-offset-4">{project.title}</h3>
                        {project.githubUrl && (
                          <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 hover:text-white transition-colors"
                            title="View Source"
                          >
                            <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                            </svg>
                          </a>
                        )}
                      </div>
                      <div className="w-2 h-2 bg-white/20 group-hover:bg-white transition-colors shrink-0 ml-2"></div>
                    </div>

                    {/* Git Commit Style Description */}
                    <div className="bg-black/50 border border-white/5 p-3 mb-6 font-mono text-[11px] text-gray-400 leading-relaxed rounded-sm">
                      <div className="flex gap-2 text-xs mb-2 border-b border-white/5 pb-1">
                        <span className="text-blue-400">commit</span>
                        <span className="text-gray-600">7c2f9a...</span>
                      </div>
                      <span className="text-green-500/80">feat:</span> {project.description.toLowerCase()}
                    </div>

                    {/* Visualizations */}
                    {project.id === 'rag-viz' && (
                      <div className="mb-8 opacity-90 group-hover:opacity-100 transition-opacity -mx-2 md:mx-0">
                        <RagVisualizer />
                      </div>
                    )}

                    {project.id === 'tbrgs' && (
                      <div className="mb-8 opacity-80 group-hover:opacity-100 transition-opacity -mx-2 md:mx-0">
                        <TrafficViz />
                      </div>
                    )}

                    <div className="mt-auto pt-6 border-t border-white/10 flex flex-wrap gap-2 md:gap-3">
                      {project.tech.map(t => (
                        <span key={t} className="text-[10px] font-mono uppercase tracking-wider text-gray-500 border border-white/10 px-2 py-1">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </section>

        {/* Footer */}
        <FadeInSection>
          <footer className="text-center py-12 border-t border-white/10">
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-lg md:text-xl font-light tracking-widest">SIDHAARTH KRISHNAN</h3>
              <p className="text-gray-600 text-xs font-mono px-4">
                +61 0475 508 390
              </p>
              <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-xs uppercase tracking-widest text-gray-400 mt-4">
                <a href="https://www.linkedin.com/in/sidhaarth-krishnan-75b5971a7/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors p-2 md:p-0">LinkedIn</a>
                <a href="https://github.com/RealSid08" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors p-2 md:p-0">GitHub</a>
                <a href="mailto:krishnansidhaarth@gmail.com" className="hover:text-white transition-colors p-2 md:p-0">Email</a>
              </div>
            </div>
          </footer>
        </FadeInSection>

      </main>
    </div>
  );
};

export default App;