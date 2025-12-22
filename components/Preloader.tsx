import React, { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';

interface PreloaderProps {
  onComplete: () => void;
}

const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    let timeoutId: ReturnType<typeof setTimeout>;
    const ctx = gsap.context(() => {}); // Create a context for cleanup

    const finishLoading = () => {
      // Safety check if component unmounted
      if (!textRef.current || !containerRef.current) return;

      ctx.add(() => {
        const tl = gsap.timeline({
          onComplete: () => {
            onComplete();
          }
        });

        tl.to(textRef.current, {
          y: -40,
          opacity: 0,
          duration: 0.6,
          ease: 'power4.inOut'
        })
        .to(containerRef.current, {
          y: '-100%',
          duration: 1,
          ease: 'expo.inOut'
        }, '-=0.3');
      });
    };

    let count = 0;
    intervalId = setInterval(() => {
      count += Math.floor(Math.random() * 5) + 1;
      if (count >= 100) {
        count = 100;
        clearInterval(intervalId);
        timeoutId = setTimeout(finishLoading, 200);
      }
      setProgress(count);
    }, 40);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      ctx.revert(); // Cleanup GSAP animations
    };
  }, [onComplete]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[99999] bg-theme-bg flex items-center justify-center transition-colors duration-700"
    >
      <div ref={textRef} className="flex flex-col items-center">
        <div className="text-xs uppercase tracking-[0.5em] text-purple-600 dark:text-purple-300 mb-4 font-black transition-colors duration-700">
          Initialising Environment
        </div>
        <div className="relative h-px w-48 bg-purple-500/10 overflow-hidden transition-colors duration-700">
          <div 
            className="absolute top-0 left-0 h-full bg-purple-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-4 font-black text-6xl md:text-8xl tracking-tighter text-theme-text transition-colors duration-700">
          {progress}<span className="text-purple-600/30">%</span>
        </div>
      </div>
    </div>
  );
};

export default Preloader;