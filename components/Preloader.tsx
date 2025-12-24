
import React, { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { IMAGES } from '../assets/images';

interface PreloaderProps {
  onComplete: () => void;
}

const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Flatten images object to array of strings
    const getAllImages = (obj: any): string[] => {
      let images: string[] = [];
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          images.push(obj[key]);
        } else if (typeof obj[key] === 'object') {
          images = images.concat(getAllImages(obj[key]));
        }
      }
      return images;
    };

    const imageUrls = getAllImages(IMAGES);
    const totalImages = imageUrls.length;
    let loadedCount = 0;

    if (totalImages === 0) {
      setProgress(100);
      setLoaded(true);
      return;
    }

    const updateProgress = () => {
      loadedCount++;
      const currentProgress = Math.min(Math.round((loadedCount / totalImages) * 100), 100);
      setProgress(currentProgress);
      
      if (loadedCount === totalImages) {
        setLoaded(true);
      }
    };

    imageUrls.forEach(url => {
      const img = new Image();
      img.src = url;
      img.onload = updateProgress;
      img.onerror = updateProgress; // Continue even if one fails
    });

  }, []);

  const handleEnter = () => {
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
  };

  // Auto-trigger transition when loaded
  useEffect(() => {
    if (loaded) {
      const timer = setTimeout(() => {
        handleEnter();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[99999] bg-theme-bg flex items-center justify-center transition-colors duration-700"
    >
      <div ref={textRef} className="flex flex-col items-center relative z-10">
        <div className="text-xs uppercase tracking-[0.5em] text-purple-600 dark:text-purple-300 mb-4 font-black transition-colors duration-700">
          {loaded ? 'System Ready' : 'Initializing Environment'}
        </div>
        
        <div className="relative h-px w-48 bg-purple-500/10 overflow-hidden transition-colors duration-700 mb-6">
          <div 
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
