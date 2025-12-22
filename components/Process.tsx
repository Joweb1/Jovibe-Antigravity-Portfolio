import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { PROCESS_STEPS } from '../constants';

const Process: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const stepsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Line animation
      gsap.fromTo(lineRef.current, 
        { scaleY: 0 }, 
        { 
          scaleY: 1, 
          ease: 'none',
          transformOrigin: 'top',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
            end: 'bottom 80%',
            scrub: true
          }
        }
      );

      // Steps animation
      const steps = gsap.utils.toArray<HTMLElement>('.process-step');
      steps.forEach((step, i) => {
        gsap.fromTo(step, 
          { y: 50, opacity: 0 }, 
          { 
            y: 0, 
            opacity: 1, 
            duration: 0.8, 
            ease: 'power3.out',
            scrollTrigger: {
              trigger: step,
              start: 'top 85%',
            }
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="process" ref={sectionRef} className="px-6 md:px-20 py-32 bg-theme-bg relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-24 md:text-center max-w-3xl mx-auto">
           <h3 className="text-[10px] uppercase tracking-[0.6em] text-purple-600 font-black mb-4">Methodology</h3>
           <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-theme-text leading-[0.9]">
              From Concept to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-400">Orbit.</span>
           </h2>
        </div>

        <div className="relative">
          {/* Central Line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-theme-border md:-translate-x-1/2">
             <div ref={lineRef} className="w-full h-full bg-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.8)] origin-top" />
          </div>

          <div ref={stepsContainerRef} className="flex flex-col space-y-24 md:space-y-0">
            {PROCESS_STEPS.map((step, idx) => (
              <div 
                key={step.id} 
                className={`process-step relative flex flex-col md:flex-row w-full ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}
              >
                {/* Content Side (50%) */}
                <div className={`w-full md:w-1/2 pl-16 md:pl-0 ${idx % 2 === 0 ? 'md:pr-24 md:text-right' : 'md:pl-24 md:text-left'}`}>
                   {/* Giant Number Background */}
                   <div className="relative pt-6">
                       <span className={`hidden md:block text-[120px] leading-none font-black text-theme-text opacity-10 absolute -top-12 select-none pointer-events-none z-0 ${idx % 2 === 0 ? 'right-0' : 'left-0'}`}>
                         {step.id}
                       </span>
                       
                       {/* Mobile Number (Smaller) */}
                       <span className="md:hidden text-[80px] leading-none font-black text-theme-text opacity-10 absolute -top-6 left-16 select-none pointer-events-none z-0">
                         {step.id}
                       </span>
                       
                       <div className="relative z-10">
                         <span className="text-[10px] uppercase tracking-[0.3em] font-black text-purple-600 mb-3 block">
                            Phase {step.id}: {step.phase}
                         </span>
                         <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-theme-text opacity-10 mb-6">
                            {step.title}
                         </h3>
                         <p className={`text-sm md:text-base font-medium text-theme-text/80 leading-relaxed max-w-md ${idx % 2 === 0 ? 'md:ml-auto' : 'md:mr-auto'}`}>
                            {step.description}
                         </p>
                       </div>
                   </div>
                </div>

                {/* Center Dot (Absolute positioned in center) */}
                <div className="absolute left-6 md:left-1/2 -translate-x-1/2 top-5 md:top-8 w-3 h-3 md:w-4 md:h-4 bg-theme-bg border-2 border-purple-600 rounded-full z-20 shadow-[0_0_10px_rgba(147,51,234,0.5)]" />
                
                {/* Empty Side for alignment (50%) - Spacer */}
                <div className="hidden md:block w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Process;