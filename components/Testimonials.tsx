
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Quote, ArrowLeft } from 'lucide-react';
import { TESTIMONIALS } from '../constants';

interface TestimonialsProps {
  onBack: () => void;
}

const Testimonials: React.FC<TestimonialsProps> = ({ onBack }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
        const tl = gsap.timeline({ delay: 0.2 });
    
        tl.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.8 })
          .fromTo(headerRef.current, 
            { y: 30, opacity: 0 }, 
            { y: 0, opacity: 1, duration: 1, ease: 'expo.out' }
          )
          .fromTo(gridRef.current?.children || [], 
            { y: 50, opacity: 0 }, 
            { y: 0, opacity: 1, stagger: 0.15, duration: 1, ease: 'power3.out' },
            '-=0.6'
          );
    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen pt-32 pb-40 px-6 md:px-20 bg-theme-bg relative overflow-hidden">
       {/* Background Elements */}
       <div className="absolute bottom-0 left-0 w-[50vw] h-[50vh] bg-purple-600/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto relative z-10">
        <div ref={headerRef} className="mb-20 flex justify-between items-start border-b border-theme-border pb-12">
           <div className="space-y-4">
             <h1 className="text-7xl md:text-[10vw] font-black tracking-tighter uppercase text-theme-text leading-none">
               Impact
             </h1>
             <p className="text-[10px] uppercase tracking-[0.5em] text-purple-600 font-black pl-1">
               Client Validation & Reviews
             </p>
           </div>
           
           <button 
            onClick={onBack}
            className="group flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] font-black text-theme-text/40 hover:text-purple-600 transition-all duration-500"
          >
            <span className="w-10 h-10 rounded-full border border-theme-border flex items-center justify-center group-hover:border-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
              <ArrowLeft size={16} />
            </span>
            <span className="hidden md:inline">Back</span>
          </button>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, idx) => (
            <div 
              key={t.id} 
              className="p-10 bg-theme-text/[0.02] border border-theme-border rounded-xl hover:border-purple-600/30 hover:bg-theme-text/[0.04] transition-all duration-500 flex flex-col justify-between h-full group"
            >
              <div className="mb-8 relative">
                 <div className="absolute -top-4 -left-4 text-6xl font-black text-theme-text/5 select-none font-serif">“</div>
                 <Quote size={24} className="text-purple-600 mb-6 opacity-50 group-hover:opacity-100 transition-opacity" />
                 <p className="text-lg md:text-xl font-medium leading-relaxed text-theme-text/80 italic relative z-10">
                   "{t.quote}"
                 </p>
              </div>
              
              <div className="flex items-center gap-4 pt-6 border-t border-theme-border/50">
                 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-purple-500/20">
                    {t.author.charAt(0)}
                 </div>
                 <div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-theme-text group-hover:text-purple-600 transition-colors">
                        {t.author}
                    </h4>
                    <p className="text-[10px] uppercase tracking-widest text-theme-text/40 font-bold mt-1">
                        {t.role}
                        <span className="mx-2 opacity-50">•</span>
                        {t.company}
                    </p>
                 </div>
              </div>
            </div>
          ))}
          
          {/* Placeholder for future testimonials */}
          <div className="p-10 border border-dashed border-theme-border rounded-xl flex items-center justify-center min-h-[300px] opacity-50 hover:opacity-100 transition-opacity">
            <div className="text-center space-y-4">
                <p className="text-[10px] uppercase tracking-[0.3em] font-black text-theme-text/40">
                    Your Quote Here
                </p>
                <a href="mailto:nahjonah00@gmail.com" className="inline-block px-6 py-3 bg-theme-text/5 rounded-full text-[9px] uppercase tracking-widest font-black hover:bg-purple-600 hover:text-white transition-all">
                    Start a Project
                </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
