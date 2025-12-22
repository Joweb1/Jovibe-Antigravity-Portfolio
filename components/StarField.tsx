
import React, { useEffect, useRef } from 'react';

interface StarFieldProps {
  isDark: boolean;
}

const StarField: React.FC<StarFieldProps> = ({ isDark }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const stars: { x: number; y: number; size: number; speed: number; opacity: number }[] = [];
    const starCount = width < 768 ? 40 : 100; // Optimized count for performance

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5,
        speed: Math.random() * 0.2 + 0.05,
        opacity: Math.random() * 0.5 + 0.2
      });
    }

    let animationId: number;
    
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      // White stars in dark mode, Purple accent stars in light mode for visibility
      ctx.fillStyle = isDark ? '#ffffff' : '#9333ea';

      stars.forEach(star => {
        // Antigravity: Move upwards
        star.y -= star.speed;
        
        // Reset when moving off screen
        if (star.y < 0) {
          star.y = height;
          star.x = Math.random() * width;
        }

        ctx.globalAlpha = star.opacity * (isDark ? 0.6 : 0.3);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      // Re-initialize stars on resize to avoid clustering
      stars.length = 0;
      const newCount = width < 768 ? 40 : 100;
      for (let i = 0; i < newCount; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 1.5,
            speed: Math.random() * 0.2 + 0.05,
            opacity: Math.random() * 0.5 + 0.2
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [isDark]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000"
      style={{ opacity: 0.7 }}
    />
  );
};

export default StarField;
