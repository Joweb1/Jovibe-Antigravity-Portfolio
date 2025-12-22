
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import OrbitingSkills from './OrbitingSkills';
import { useMagnetic } from '../hooks/useMagnetic';

const Hero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLDivElement>(null);
  const line3Ref = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 1 });

      const lines = [line1Ref.current, line2Ref.current, line3Ref.current];
      
      // Ensure targets exist before animating
      if (lines.every(l => l) && descriptionRef.current && ctaRef.current) {
        tl.fromTo(lines, 
          { y: '110%', opacity: 0 }, 
          { 
            y: '0%', 
            opacity: 1,
            duration: 1.2, 
            stagger: 0.1, 
            ease: 'expo.out' 
          }
        )
        .fromTo(descriptionRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: 'power3.out' },
          '-=0.5'
        )
        .fromTo(ctaRef.current,
          { scale: 0.9, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.7)' },
          '-=0.3'
        );
      }

      gsap.to(containerRef.current, {
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true
        },
        y: 100,
        opacity: 0.3,
        ease: 'none'
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center px-6 md:px-20 overflow-hidden pt-24"
    >
      <div className="w-full max-w-7xl mx-auto z-10 flex flex-col items-center space-y-2 md:space-y-4">
        
        {/* Profile and Orbiting Skills - Integrated view */}
        <div className="w-full transform scale-90 md:scale-100 mb-4 md:mb-8">
          <OrbitingSkills />
        </div>

        {/* Hero Headline Section */}
        <div className="w-full text-center space-y-0.5">
          <div className="text-mask">
            <h1 
              ref={line1Ref}
              className="text-[12vw] md:text-[8.5vw] font-black leading-[0.85] tracking-tighter uppercase text-theme-text"
            >
              Intelligent
            </h1>
          </div>
          <div className="text-mask">
            <h1 
              ref={line2Ref}
              className="text-[12vw] md:text-[8.5vw] font-black leading-[0.85] tracking-tighter uppercase text-purple-600 dark:text-purple-400 transition-colors duration-700"
            >
              Engineering
            </h1>
          </div>
          <div className="text-mask">
            <h1 
              ref={line3Ref}
              className="text-[12vw] md:text-[8.5vw] font-black leading-[0.85] tracking-tighter uppercase opacity-10 text-theme-text transition-colors duration-700"
            >
              & Research
            </h1>
          </div>
        </div>

        {/* Description Section */}
        <div 
          ref={descriptionRef}
          className="w-full flex flex-col md:flex-row justify-between items-center md:items-end gap-6 pt-8 text-center md:text-left"
        >
          <div className="max-w-md space-y-2">
            <p className="text-[10px] md:text-xs opacity-60 leading-relaxed font-light uppercase tracking-widest text-theme-text">
              Full Stack Laravel Developer & AI Engineer specializing in RAG systems and business automation.
            </p>
            <p className="text-[10px] uppercase tracking-widest text-purple-600 dark:text-purple-400 font-black transition-colors duration-700">
              PHP • Python • JavaScript • Gemini • LLMs
            </p>
          </div>
          
          <div ref={ctaRef} className="flex flex-col items-center md:items-end gap-4">
             <div className="flex flex-col items-center md:items-end space-y-4">
               <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 animate-pulse">
                  Deploying Excellence
               </span>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 text-theme-text">
                  Lagos, Nigeria // Remote
               </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Visual Scroll Cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-2">
        <span className="text-[8px] uppercase tracking-[0.5em] opacity-30 font-black text-theme-text">Explore</span>
        <div className="w-[1px] h-8 bg-gradient-to-b from-purple-500 to-transparent opacity-20" />
      </div>
    </section>
  );
};

export default Hero;
