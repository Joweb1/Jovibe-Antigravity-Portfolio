
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { SKILL_CATEGORIES } from '../constants';

const Skills: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardsRef.current) return;
    
    gsap.fromTo(cardsRef.current.children, 
      { y: 50, opacity: 0 },
      { 
        y: 0, 
        opacity: 1, 
        duration: 1.2, 
        stagger: 0.2, 
        ease: 'expo.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        }
      }
    );
  }, []);

  return (
    <section id="skills" ref={sectionRef} className="px-6 md:px-20 py-40 bg-theme-bg relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-24 flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
          <div className="space-y-4">
             <h3 className="text-[10px] uppercase tracking-[0.6em] text-purple-600 font-black">Expertise</h3>
             <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-theme-text max-w-2xl leading-none">
                Applied <span className="italic opacity-30">Intelligence.</span>
             </h2>
          </div>
          <p className="max-w-xs text-[11px] uppercase tracking-[0.2em] font-black text-theme-text/30 leading-relaxed">
            Specializing in bridging the gap between legacy infrastructure and generative AI systems.
          </p>
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {SKILL_CATEGORIES.map((cat, idx) => (
            <div key={cat.name} className="group p-10 bg-theme-text/[0.02] border border-theme-border rounded-lg hover:border-purple-600/30 transition-all duration-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="text-6xl font-black italic">0{idx + 1}</span>
              </div>
              <h4 className="text-[10px] uppercase tracking-[0.4em] text-purple-600 font-black mb-10">{cat.name}</h4>
              <div className="flex flex-wrap gap-3">
                {cat.skills.map((skill) => (
                  <span 
                    key={skill} 
                    className="px-4 py-2 border border-theme-border text-[10px] uppercase tracking-widest font-black text-theme-text/60 group-hover:text-theme-text transition-colors"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Skills;
