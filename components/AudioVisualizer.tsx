import React, { useEffect, useRef } from 'react';
import { useTheme } from '../services/theme';

interface AudioVisualizerProps {
  isActive: boolean;
  volume: number; // 0 to 1
  /** rendered size; the canvas keeps its 300px resolution and scales down */
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isActive, volume, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [theme] = useTheme();
  const ink = theme === 'light' ? '13, 17, 23' : '255, 255, 255';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Visualizer state
    let currentRadius = 50;
    const baseRadius = 50;
    const maxRadius = 130;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (isActive) {
        // Smooth volume transition
        const targetRadius = baseRadius + (volume * 5) * (maxRadius - baseRadius);
        currentRadius += (targetRadius - currentRadius) * 0.1;

        // Draw glowing core (White)
        const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, currentRadius);
        gradient.addColorStop(0, `rgba(${ink}, 1)`);
        gradient.addColorStop(0.4, `rgba(${ink}, 0.3)`);
        gradient.addColorStop(1, `rgba(${ink}, 0)`);

        ctx.beginPath();
        ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw outer rings (Silver/Grey)
        ctx.strokeStyle = `rgba(${ink}, 0.8)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, currentRadius * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = `rgba(${ink}, 0.3)`;
        ctx.beginPath();
        ctx.arc(centerX, centerY, currentRadius * 1.1, 0, Math.PI * 2);
        ctx.stroke();

        // Minimalist particles
        for(let i=0; i<8; i++) {
            const angle = (Date.now() / 1000) + (i * (Math.PI * 2) / 8);
            const dist = currentRadius * 1.2;
            const px = centerX + Math.cos(angle) * dist;
            const py = centerY + Math.sin(angle) * dist;
            
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI*2);
            ctx.fillStyle = `rgba(${ink}, 1)`;
            ctx.fill();
        }

      } else {
        // Idle state (Breathing ring)
        currentRadius = baseRadius + Math.sin(Date.now() / 800) * 3;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${ink}, 0.35)`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${ink}, 0.25)`;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [isActive, volume, ink]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={300} 
      className={className ?? 'w-full max-w-[300px] h-auto mx-auto'}
    />
  );
};
