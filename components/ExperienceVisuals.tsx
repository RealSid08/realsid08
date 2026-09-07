import React, { useEffect, useRef } from 'react';

export const BaseCanvas: React.FC<{ draw: (ctx: CanvasRenderingContext2D, time: number) => void }> = ({ draw }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 600 * dpr;
    canvas.height = 400 * dpr;
    ctx.scale(dpr, dpr);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const startTime = Date.now();

    const paint = (time: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, 600, 400);
      drawRef.current(ctx, time);
    };

    if (reduced) {
      paint(0);
      return;
    }

    let animationId: number;
    const render = () => {
      paint((Date.now() - startTime) / 1000);
      animationId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} className="object-cover opacity-80" />;
};

export const MindtekVisual = () => {
  return <BaseCanvas draw={(ctx, time) => {
    // IDE / Coding Visual
    // Background
    ctx.fillStyle = '#1e1e1e'; 
    ctx.fillRect(0, 0, 600, 400);
    
    // Line numbers sidebar
    ctx.fillStyle = '#252526';
    ctx.fillRect(0, 0, 40, 400);
    ctx.fillStyle = '#505050';
    ctx.font = '12px monospace';
    for(let i=1; i<20; i++) {
        ctx.fillText(i.toString(), 15, 20 * i + 10);
    }

    // Code typing simulation
    const speed = 10; // chars per second approx logic
    const totalLines = 15;
    
    const codeLines = [
      { indent: 0, color: '#569cd6', width: 60 },  // import
      { indent: 0, color: '#c586c0', width: 40 },  // const
      { indent: 1, color: '#4ec9b0', width: 80 },  // ClassName
      { indent: 2, color: '#ce9178', width: 120 }, // string
      { indent: 2, color: '#dcdcaa', width: 90 },  // function()
      { indent: 3, color: '#9cdcfe', width: 50 },  // var
      { indent: 0, color: '#569cd6', width: 40 },  // export
    ];

    // Simulate scrolling/typing
    const scrollOffset = Math.floor(time * 20) % 400; 
    
    ctx.translate(50, 20); // Padding for code area

    for (let i = 0; i < totalLines; i++) {
        const lineIdx = i % codeLines.length;
        const line = codeLines[lineIdx];
        const y = i * 24;

        // Syntax highlighting blocks
        ctx.fillStyle = line.color;
        ctx.fillRect(line.indent * 20, y, line.width, 10);
        
        // Arguments / extra tokens
        ctx.fillStyle = '#d4d4d4';
        ctx.fillRect(line.indent * 20 + line.width + 10, y, 30 + (i*10)%50, 10);
        
        // Cursor
        const isCurrentLine = Math.floor(time * 2) % totalLines === i;
        if (isCurrentLine) {
           ctx.fillStyle = '#fff';
           ctx.fillRect(line.indent * 20 + line.width + 10 + 30 + (i*10)%50 + 5, y - 2, 2, 14);
        }
    }
    
    // Minimap on right
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset
    const dpr = window.devicePixelRatio || 1;
    ctx.scale(dpr, dpr);
    
    ctx.fillStyle = '#252526';
    ctx.fillRect(550, 0, 50, 400);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    for(let i=0; i<40; i++) {
        ctx.fillRect(555, i*10, 30 + Math.random()*10, 4);
    }
    // Minimap highlight
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(550, (time * 10) % 350, 50, 50);

  }} />;
};

export const UniEatsVisual = () => {
  return <BaseCanvas draw={(ctx, time) => {
    // Video Editing / Timeline Visual
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, 600, 400);

    // Timeline Header
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, 600, 30);
    // Time ticks
    ctx.fillStyle = '#666';
    for(let i=0; i<600; i+=20) {
        ctx.fillRect(i, 20, 1, 10);
    }

    // Tracks
    const tracks = 5;
    const trackHeight = 60;
    const gap = 5;
    const startY = 40;

    for (let i = 0; i < tracks; i++) {
        const y = startY + i * (trackHeight + gap);
        // Track bg
        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(0, y, 600, trackHeight);
        
        // Track Header (Left)
        ctx.fillStyle = '#252526';
        ctx.fillRect(0, y, 80, trackHeight);
        // Icon placeholder
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(40, y + trackHeight/2, 10, 0, Math.PI*2);
        ctx.fill();

        // Clips
        const clipCount = 3 + (i % 3);
        for (let j = 0; j < clipCount; j++) {
            const clipW = 60 + ((i * j * 50) % 100);
            const clipX = 100 + (j * 140) + (i * 20);
            
            // Clip Color (Video vs Audio)
            if (i < 3) {
                // Video tracks (Purple/Blue)
                ctx.fillStyle = `rgba(100, 149, 237, 0.6)`;
                ctx.fillRect(clipX, y + 5, clipW, trackHeight - 10);
                // Clip Header
                ctx.fillStyle = `rgba(100, 149, 237, 1)`;
                ctx.fillRect(clipX, y + 5, clipW, 15);
            } else {
                // Audio tracks (Green)
                ctx.fillStyle = `rgba(60, 179, 113, 0.6)`;
                ctx.fillRect(clipX, y + 10, clipW, trackHeight - 20);
                // Waveform simulation
                ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath();
                for(let w=0; w<clipW; w+=2) {
                    ctx.moveTo(clipX + w, y + trackHeight/2 - Math.random()*10);
                    ctx.lineTo(clipX + w, y + trackHeight/2 + Math.random()*10);
                }
                ctx.stroke();
            }
        }
    }

    // Playhead
    const playheadX = 100 + (time * 100) % 500;
    ctx.strokeStyle = '#e53935'; // Red
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 15);
    ctx.lineTo(playheadX, 400);
    ctx.stroke();
    
    // Playhead top handle
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.moveTo(playheadX - 6, 15);
    ctx.lineTo(playheadX + 6, 15);
    ctx.lineTo(playheadX, 25);
    ctx.fill();

  }} />;
};

export const IdhayamVisual = () => {
  return <BaseCanvas draw={(ctx, time) => {
    // Bar Chart / Market Analysis
    const bars = 12;
    const gap = 35;
    const startX = 80;
    const baseHeight = 300;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    
    for (let i = 0; i < bars; i++) {
        // Perlin-ish noise for movement
        const h = 80 + Math.sin(time * 2 + i * 0.5) * 60 + Math.cos(time + i) * 40;
        const x = startX + i * gap;
        const y = baseHeight - h;
        
        ctx.fillRect(x, y, 20, h);
        
        // Highlight top
        ctx.fillStyle = '#fff';
        ctx.fillRect(x, y, 20, 4);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    }
    
    // Axis lines
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 300);
    ctx.lineTo(540, 300); // X
    ctx.moveTo(60, 300);
    ctx.lineTo(60, 60); // Y
    ctx.stroke();
  }} />;
};

export const HiDaVisual = () => {
  return <BaseCanvas draw={(ctx, time) => {
    // Video Conference Platform Visual
    
    // Background (Dark UI)
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, 600, 400);

    // Grid Layout
    const cols = 3;
    const rows = 2;
    const margin = 10;
    const w = (600 - margin * (cols + 1)) / cols;
    const h = (340 - margin * (rows + 1)) / rows; // Reserve bottom for controls

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = margin + c * (w + margin);
            const y = margin + r * (h + margin);
            
            // User Card Background
            ctx.fillStyle = '#222';
            ctx.fillRect(x, y, w, h);
            
            // Animated Silhouette / "Video Feed"
            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, w, h);
            ctx.clip();
            
            // Dynamic background blob for "video"
            const offset = (r * cols + c);
            const moveX = Math.sin(time + offset) * 10;
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(x + w/2, y + h/2 + 20, 50, 0, Math.PI*2); // Body
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + w/2 + moveX, y + h/2 - 30, 25, 0, Math.PI*2); // Head
            ctx.fill();
            
            ctx.restore();

            // Active Speaker Border
            // Cycle through active speaker
            const activeIdx = Math.floor(time / 2) % (cols * rows);
            if (offset === activeIdx) {
                ctx.lineWidth = 4;
                ctx.strokeStyle = '#4ade80'; // Green
                ctx.strokeRect(x, y, w, h);
                
                // Name tag highlight
                ctx.fillStyle = '#4ade80';
                ctx.fillRect(x + 10, y + h - 30, 60, 20);
                ctx.fillStyle = '#000';
                ctx.font = '10px sans-serif';
                ctx.fillText("Speaking", x + 15, y + h - 16);
            } else {
                // Normal Name tag
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(x + 10, y + h - 30, 50, 20);
                ctx.fillStyle = '#fff';
                ctx.font = '10px sans-serif';
                ctx.fillText(`User ${offset + 1}`, x + 15, y + h - 16);
                
                // Mute Icon (Red dot)
                if (offset % 2 === 0) {
                   ctx.fillStyle = '#ef4444';
                   ctx.beginPath();
                   ctx.arc(x + w - 20, y + h - 20, 6, 0, Math.PI*2);
                   ctx.fill();
                }
            }
        }
    }

    // Bottom Controls Bar
    const barY = 340;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, barY, 600, 60);
    ctx.fillStyle = '#333';
    ctx.fillRect(0, barY, 600, 1); // Border top

    // Control Buttons
    const btnCount = 5;
    const btnSpacing = 60;
    const startBtnX = 300 - (btnCount * btnSpacing) / 2 + btnSpacing/2;
    
    for (let i = 0; i < btnCount; i++) {
        const bx = startBtnX + i * btnSpacing;
        const by = barY + 30;
        
        ctx.beginPath();
        ctx.arc(bx, by, 20, 0, Math.PI*2);
        
        if (i === 2) {
            // Hangup button (Red)
            ctx.fillStyle = '#ef4444';
        } else {
            // Normal button (Dark Grey)
            ctx.fillStyle = '#404040';
        }
        ctx.fill();
    }

  }} />;
};

export const ImaginetVisual = () => {
  return <BaseCanvas draw={(ctx, time) => {
    // Database / Matrix Style
    const w = 600, h = 400;
    const fontSize = 14;
    const cols = Math.floor(w / fontSize);
    
    ctx.font = '14px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    
    // Simplified binary rain
    for (let i = 0; i < cols; i++) {
       const y = (time * 60 + i * 30) % (h + 50) - 20;
       const char = Math.random() > 0.5 ? '1' : '0';
       
       if (y < h) {
           ctx.fillText(char, i * fontSize, y);
           // Trailing
           for (let k = 1; k < 5; k++) {
               ctx.fillStyle = `rgba(255, 255, 255, ${0.5 - k * 0.1})`;
               ctx.fillText(Math.random() > 0.5 ? '1' : '0', i * fontSize, y - k * 14);
           }
           ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // Reset head color
       }
    }
    
    // Database cylinder icon overlay
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    const cx = w/2, cy = h/2;
    
    for (let k=0; k<3; k++) {
        const dy = k * 35;
        ctx.beginPath();
        ctx.ellipse(cx, cy - 35 + dy, 60, 15, 0, 0, Math.PI * 2);
        ctx.stroke();
        if (k < 2) {
           ctx.beginPath();
           ctx.moveTo(cx - 60, cy - 35 + dy);
           ctx.lineTo(cx - 60, cy + dy);
           ctx.stroke();
           ctx.beginPath();
           ctx.moveTo(cx + 60, cy - 35 + dy);
           ctx.lineTo(cx + 60, cy + dy);
           ctx.stroke();
        }
    }
  }} />;
};
