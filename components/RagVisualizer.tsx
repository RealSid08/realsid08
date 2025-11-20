import React, { useState, useEffect } from 'react';

// Sequence Definition
const STAGES = [
  { id: 0, name: 'IDLE', duration: 1000, label: 'System Ready' },
  { id: 1, name: 'INPUT', duration: 1500, label: 'Processing Query' },
  { id: 2, name: 'VECTOR', duration: 1500, label: 'Embedding Text' },
  { id: 3, name: 'RETRIEVE', duration: 1500, label: 'Fetching Context' },
  { id: 4, name: 'SYNTHESIS', duration: 1500, label: 'LLM Synthesis' },
  { id: 5, name: 'OUTPUT', duration: 2000, label: 'Generating Output' },
];

export const RagVisualizer: React.FC = () => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const runSequence = (currentStageIndex: number) => {
      const current = STAGES[currentStageIndex];
      
      timeoutId = setTimeout(() => {
        const next = (currentStageIndex + 1) % STAGES.length;
        setStage(next);
        runSequence(next);
      }, current.duration);
    };

    runSequence(0);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="w-full h-[500px] md:h-[320px] bg-[#050505] border border-white/10 flex flex-col md:flex-row font-mono relative overflow-hidden text-[10px] select-none">
      
      {/* Left Panel: Chat UI (Frontend) */}
      <div className="w-full h-[30%] md:h-full md:w-[35%] border-b md:border-b-0 md:border-r border-white/10 bg-white/5 flex flex-col relative z-10">
        <div className="p-3 border-b border-white/5 flex justify-between items-center">
             <span className="text-gray-500 uppercase tracking-widest text-[9px]">Chat Client</span>
             <div className={`w-1.5 h-1.5 rounded-full ${stage > 0 && stage < 5 ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
        </div>

        <div className="flex-1 p-3 flex flex-col justify-end space-y-3">
            {/* User Message */}
            <div className={`transition-all duration-500 transform ${stage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="ml-auto bg-white text-black px-2 py-1.5 rounded-lg rounded-tr-none max-w-[90%] shadow-lg">
                    How does RAG work?
                </div>
                <div className="text-[8px] text-gray-500 text-right mt-1">10:42 AM</div>
            </div>

            {/* Bot Message */}
            <div className={`transition-all duration-500 transform ${stage === 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="mr-auto bg-zinc-800 border border-white/10 text-gray-200 px-2 py-1.5 rounded-lg rounded-tl-none max-w-[90%] shadow-lg">
                    <span className="text-green-400 font-semibold">RAG</span> retrieves data.
                </div>
                <div className="text-[8px] text-gray-500 mt-1">AI • 10:42 AM</div>
            </div>
        </div>
        
        {/* Data Flow Line (Out) */}
        <div className={`hidden md:block absolute right-0 top-1/2 w-4 h-[1px] bg-white transition-all duration-300 ${stage === 1 ? 'opacity-100' : 'opacity-0'}`}></div>
        <div className={`md:hidden absolute bottom-0 left-1/2 h-4 w-[1px] bg-white transition-all duration-300 ${stage === 1 ? 'opacity-100' : 'opacity-0'}`}></div>
      </div>

      {/* Right Panel: The Engine (Backend) */}
      <div className="w-full h-[70%] md:h-full md:w-[65%] relative bg-[#0a0a0a] p-4">
         <div className="absolute top-3 right-3 text-gray-600 uppercase tracking-widest text-[9px]">RAG Pipeline</div>
         
         {/* Diagram Nodes */}
         <div className="relative w-full h-full mt-2 scale-90 md:scale-100 origin-top-left">
            
            {/* Node 1: Input Processing */}
            <div className={`absolute top-0 left-0 p-2 border w-24 transition-all duration-300 ${stage === 1 || stage === 2 ? 'border-white bg-white/10' : 'border-white/10 bg-black'}`}>
                <div className="text-gray-500 text-[8px] mb-1">QUERY PROCESSOR</div>
                <div className="h-1 w-12 bg-white/30 rounded overflow-hidden">
                    <div className={`h-full bg-white w-full transition-transform duration-1000 ${stage === 1 ? '-translate-x-0' : '-translate-x-full'}`}></div>
                </div>
            </div>

            {/* Connection: Processor -> Embedder */}
            <svg className="absolute top-8 left-12 w-32 h-8 z-0 pointer-events-none overflow-visible">
                <path d="M12,0 L12,10 L100,10 L100,20" fill="none" stroke="#333" strokeWidth="1" />
                {stage === 2 && <circle r="2" fill="#fff">
                    <animateMotion path="M12,0 L12,10 L100,10 L100,20" dur="0.5s" fill="freeze" />
                </circle>}
            </svg>

            {/* Node 2: Embedder */}
            <div className={`absolute top-8 right-8 p-2 border w-24 transition-all duration-300 ${stage === 2 ? 'border-blue-500 bg-blue-900/10' : 'border-white/10 bg-black'}`}>
                <div className="text-blue-500 text-[8px] mb-1">EMBEDDER</div>
                <div className="font-mono text-[7px] text-gray-400 tracking-tighter">
                    {stage >= 2 ? '[0.21, -0.54, ...]' : 'Waiting...'}
                </div>
            </div>

            {/* Connection: Embedder -> DB */}
            <svg className="absolute top-[4.5rem] right-20 w-4 h-12 z-0 pointer-events-none">
                <path d="M12,0 L12,40" fill="none" stroke="#333" strokeWidth="1" />
                {stage === 3 && <circle r="2" fill="#4ade80">
                    <animateMotion path="M12,0 L12,40" dur="0.5s" fill="freeze" />
                </circle>}
            </svg>

            {/* Node 3: Vector DB */}
            <div className={`absolute top-24 right-8 p-2 border w-24 transition-all duration-300 ${stage === 3 ? 'border-green-500 bg-green-900/10' : 'border-white/10 bg-black'}`}>
                <div className="text-green-500 text-[8px] mb-1">VECTOR STORE</div>
                <div className="flex gap-1 mt-1">
                    <div className={`w-2 h-2 rounded-sm ${stage === 3 ? 'bg-green-400 animate-bounce' : 'bg-gray-800'}`}></div>
                    <div className={`w-2 h-2 rounded-sm ${stage === 3 ? 'bg-green-400 animate-bounce delay-75' : 'bg-gray-800'}`}></div>
                    <div className={`w-2 h-2 rounded-sm ${stage === 3 ? 'bg-green-400 animate-bounce delay-150' : 'bg-gray-800'}`}></div>
                </div>
            </div>

            {/* Connection: DB -> LLM */}
            <svg className="absolute top-36 left-0 w-full h-12 z-0 pointer-events-none overflow-visible">
                 <path d="M165,0 L165,10 L40,10 L40,35" fill="none" stroke="#333" strokeWidth="1" />
                 {stage === 4 && <circle r="2" fill="#a855f7">
                    <animateMotion path="M165,0 L165,10 L40,10 L40,35" dur="0.5s" fill="freeze" />
                </circle>}
            </svg>

            {/* Node 4: LLM (Context Window) */}
            <div className={`absolute bottom-0 left-0 w-full border-t transition-all duration-300 p-3 ${stage === 4 || stage === 5 ? 'bg-white/5 border-white/20' : 'bg-black border-white/5'}`}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] text-gray-500">LLM CONTEXT WINDOW</span>
                    <span className={`text-[8px] ${stage === 5 ? 'text-white' : 'text-gray-700'}`}>GENERATING...</span>
                </div>
                
                <div className="flex gap-2 h-12 items-center justify-center">
                     {/* Input Query Block */}
                     <div className={`h-full w-16 border border-dashed border-white/30 flex items-center justify-center text-[8px] text-gray-400 ${stage >= 4 ? 'opacity-100' : 'opacity-20'}`}>
                        USER QUERY
                     </div>
                     <span className="text-gray-600">+</span>
                     {/* Retrieved Docs Block */}
                     <div className={`h-full w-24 border border-green-500/30 bg-green-500/5 flex flex-col items-center justify-center gap-1 ${stage >= 4 ? 'opacity-100' : 'opacity-20'}`}>
                         <div className="w-16 h-1 bg-green-500/40"></div>
                         <div className="w-16 h-1 bg-green-500/40"></div>
                         <span className="text-[7px] text-green-400">CONTEXT</span>
                     </div>
                     <span className="text-gray-600">=</span>
                     {/* Output Block */}
                     <div className={`h-full w-16 bg-white text-black flex items-center justify-center text-[8px] font-bold transition-all duration-300 ${stage === 5 ? 'opacity-100 scale-105 shadow-lg shadow-white/20' : 'opacity-20 scale-90'}`}>
                        ANSWER
                     </div>
                </div>
            </div>

         </div>
      </div>
    </div>
  );
};