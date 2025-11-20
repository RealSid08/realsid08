import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const TrafficViz: React.FC = () => {
  const [data, setData] = useState<any[]>([]);

  // Generate initial data
  useEffect(() => {
    const now = Date.now();
    const initialData = Array.from({ length: 20 }).map((_, i) => {
      const time = new Date(now - (20 - i) * 300000); // 5 min intervals
      const base = 400 + Math.random() * 300;
      return {
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actual: base,
        predicted: base + (Math.random() * 40 - 20),
      };
    });
    setData(initialData);
  }, []);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(current => {
        const lastTime = new Date();
        const base = 500 + Math.sin(Date.now() / 5000) * 200 + Math.random() * 100;
        const newPoint = {
          time: lastTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actual: base,
          predicted: base + (Math.random() * 60 - 30),
        };
        return [...current.slice(1), newPoint];
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-[320px] bg-[#050505] rounded-sm border border-white/10 flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border-b border-white/10 bg-white/5 gap-3 md:gap-0">
        <div className="flex items-center gap-3">
          <h3 className="text-white font-mono text-xs uppercase tracking-wider">LSTM_Traffic_Net</h3>
          <div className="flex items-center gap-2 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded">
             <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
             <span className="text-[9px] text-green-400 font-mono">LIVE INFERENCE</span>
          </div>
        </div>
        <div className="flex gap-4 text-[9px] font-mono text-gray-400 uppercase">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500/80 rounded-sm"></div>
                <span>Sensor Feed</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500/80 rounded-sm"></div>
                <span>Predicted</span>
            </div>
        </div>
      </div>
      
      <div className="flex-grow relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="splitColorPred" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
            <XAxis 
                dataKey="time" 
                stroke="#444" 
                tick={{fontSize: 9, fontFamily: 'monospace', fill: '#666'}} 
                tickLine={false}
                axisLine={false}
                interval={4}
            />
            <YAxis 
                stroke="#444" 
                tick={{fontSize: 9, fontFamily: 'monospace', fill: '#666'}} 
                tickLine={false}
                axisLine={false}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #333', fontFamily: 'monospace', fontSize: '11px' }}
              itemStyle={{ padding: 0 }}
              cursor={{stroke: '#666', strokeWidth: 1, strokeDasharray: '4 4'}}
            />
            <Area 
              type="monotone" 
              dataKey="predicted" 
              stroke="#a855f7" 
              strokeWidth={2}
              fill="url(#splitColorPred)" 
              animationDuration={500}
              isAnimationActive={false}
            />
            <Area 
              type="monotone" 
              dataKey="actual" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fill="url(#splitColor)" 
              animationDuration={500}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};