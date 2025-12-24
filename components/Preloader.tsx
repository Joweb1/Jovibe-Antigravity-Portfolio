
import React, { useEffect, useState, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { IMAGES } from '../assets/images';

interface PreloaderProps {
  onComplete: () => void;
}

const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const handleEnter = useCallback(() => {
    if (!textRef.current || !containerRef.current) return;

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
  }, [onComplete]);

  useEffect(() => {
    // ONLY preload critical assets: Profile image + Skill Icons (for Hero)
    // Other images (Projects, About, etc.) will load lazily as needed
    const criticalImages = [
      IMAGES.profile,
      ...Object.values(IMAGES.icons)
    ];

    const totalImages = criticalImages.length;
    let loadedCount = 0;

    if (totalImages === 0) {
      setProgress(100);
      return;
    }

    const updateProgress = () => {
      loadedCount++;
      const currentProgress = Math.min(Math.round((loadedCount / totalImages) * 100), 100);
      setProgress(currentProgress);
    };

    criticalImages.forEach(url => {
      const img = new Image();
      img.src = url;
      
      // Use decode() for optimized handling
      if ('decode' in (img as any)) {
        (img as any).decode()
          .then(updateProgress)
          .catch((err: any) => {
            console.warn(`Failed to decode image: ${url}`, err);
            updateProgress(); 
          });
      } else {
        img.onload = updateProgress;
        img.onerror = updateProgress;
      }
    });

  }, []);

  // Auto-trigger enter when progress hits 100%
  useEffect(() => {
      if (progress === 100) {
          // Short delay to let the user register "100%", then auto-enter
          const timer = setTimeout(() => {
              handleEnter();
          }, 800);
          return () => clearTimeout(timer);
      }
  }, [progress, handleEnter]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[99999] bg-theme-bg flex items-center justify-center transition-colors duration-700"
    >
      <div ref={textRef} className="flex flex-col items-center relative z-10">
        <div className="text-xs uppercase tracking-[0.5em] text-purple-600 dark:text-purple-300 mb-4 font-black transition-colors duration-700 animate-pulse">
          {progress < 100 ? 'Initializing Environment' : 'System Ready'}
        </div>
        
        <div className="relative h-px w-48 bg-purple-500/10 overflow-hidden transition-colors duration-700 mb-6">
          <div 
            ref={progressBarRef}
            className="absolute top-0 left-0 h-full bg-purple-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="relative h-24 overflow-hidden flex flex-col items-center justify-center">
            <div className="font-black text-6xl md:text-8xl tracking-tighter text-theme-text transition-colors duration-700">
                {progress}<span className="text-purple-600/30">%</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Preloader;
