import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const generateData = (index: number) => ({
  time: index,
  sentiment: 40 + Math.random() * 40,
  volume: 20 + Math.random() * 60,
});

export const SocialDashboard: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Initial Data
    const initData = Array.from({ length: 10 }).map((_, i) => generateData(i));
    setData(initData);

    const interval = setInterval(() => {
      setData(prev => {
        const nextTime = prev[prev.length - 1].time + 1;
        const newData = [...prev.slice(1), generateData(nextTime)];
        return newData;
      });

      // Random Logs
      if (Math.random() > 0.6) {
        const actions = ['ORDER_CREATED', 'MSG_RECEIVED', 'WEBHOOK_PING', 'SENTIMENT_ANALYSIS'];
        const sources = ['Facebook', 'Instagram', 'WhatsApp'];
        const id = Math.floor(Math.random() * 9999);
        const newLog = `[${new Date().toLocaleTimeString()}] ${actions[Math.floor(Math.random()*actions.length)]} <${sources[Math.floor(Math.random()*sources.length)]}> ID:${id}`;
        setLogs(prev => [newLog, ...prev].slice(0, 5));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-[300px] bg-black border border-mono-border flex flex-col md:flex-row overflow-hidden">
      {/* Chart Section */}
      <div className="flex-grow p-4 border-b md:border-b-0 md:border-r border-mono-border relative">
        <div className="absolute top-4 left-4 z-10 flex gap-4">
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-gray-400 font-mono">TRAFFIC VOL</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                <span className="text-[10px] text-gray-400 font-mono">SENTIMENT</span>
            </div>
        </div>
        
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line type="monotone" dataKey="sentiment" stroke="#ffffff" strokeWidth={2} dot={false} />
            <Line type="step" dataKey="volume" stroke="#3b82f6" strokeWidth={1} dot={false} strokeDasharray="5 5" />
            <YAxis hide domain={[0, 100]} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Logs Section */}
      <div className="w-full md:w-48 bg-mono-paper p-3 flex flex-col">
        <div className="text-[10px] font-mono text-gray-500 border-b border-white/10 pb-2 mb-2 uppercase tracking-wider">
          Live Webhooks
        </div>
        <div className="flex-grow overflow-hidden space-y-2 font-mono text-[9px]">
          {logs.map((log, i) => (
            <div key={i} className="text-gray-400 border-l-2 border-white/20 pl-2 animate-in fade-in slide-in-from-right duration-300">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};