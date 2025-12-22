
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowLeft, FileText, Download } from 'lucide-react';

const aboutImg = "https://raw.githubusercontent.com/Joweb1/Codewithmobile/refs/heads/main/Generated%20Image%20September%2026%2C%202025%20-%2010_41AM.jpg";

interface AboutProps {
  onBack: () => void;
}

const About: React.FC<AboutProps> = ({ onBack }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
        const tl = gsap.timeline({ delay: 0.2 });
        
        tl.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.8 })
          .fromTo(imageRef.current, 
            { scale: 1.2, opacity: 0 }, 
            { scale: 1, opacity: 1, duration: 1.2, ease: 'expo.out' }
          )
          .fromTo(contentRef.current?.children || [], 
            { y: 30, opacity: 0 }, 
            { y: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: 'power3.out' }, 
            '-=0.8'
          );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen pt-32 pb-20 px-6 md:px-20 bg-theme-bg relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="mb-16 flex justify-between items-start">
           <div>
             <h1 className="text-7xl md:text-[10vw] font-black tracking-tighter uppercase text-theme-text leading-none mb-6">
               Profile
             </h1>
             <p className="text-[10px] uppercase tracking-[0.5em] text-purple-600 font-black pl-1">
               The Human Element
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
          {/* Image Column */}
          <div className="col-span-1 lg:col-span-5">
            <div ref={imageRef} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-theme-border">
               <img 
                 src={aboutImg}
                 alt="Jonadab Uroh" 
                 className="w-full h-full object-cover grayscale-0 hover:grayscale transition-all duration-1000"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-theme-bg via-transparent to-transparent opacity-50" />
            </div>
          </div>

          {/* Content Column */}
          <div ref={contentRef} className="col-span-1 lg:col-span-7 flex flex-col justify-center space-y-12">
            
            <div className="space-y-6">
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-theme-text leading-[1.1]">
                Bridging the gap between <span className="text-purple-600">abstract logic</span> and <span className="italic opacity-50">human experience</span>.
              </h2>
              <p className="text-base md:text-lg font-medium leading-relaxed text-theme-text/70 max-w-2xl">
                I am Jonadab Uroh, a Full Stack Laravel Developer & AI Engineer based in Lagos, Nigeria. 
                My work exists at the intersection of robust backend architecture and intelligent, generative systems.
                I don't just write code; I engineer digital ecosystems that feel alive, responsive, and intuitively aligned with human intent.
              </p>
              <p className="text-base md:text-lg font-medium leading-relaxed text-theme-text/70 max-w-2xl">
                With a deep specialization in RAG (Retrieval-Augmented Generation) systems and business automation, 
                I help organizations transcend traditional software limitations, deploying solutions that learn, adapt, and scale effortlessly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-t border-b border-theme-border">
               <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-purple-600 font-black mb-4">Core Philosophy</h4>
                  <p className="text-sm font-medium text-theme-text/60 leading-relaxed">
                    Minimalism in code, Maximalism in impact. Every system I architect is designed for weightlessness—high performance with zero friction.
                  </p>
               </div>
               <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-purple-600 font-black mb-4">Current Focus</h4>
                  <p className="text-sm font-medium text-theme-text/60 leading-relaxed">
                    Exploring the frontiers of Agentic AI workflows and hyper-personalized user interfaces using Gemini 1.5 Pro.
                  </p>
               </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
               <a 
                 href="#" 
                 className="group flex items-center gap-3 px-8 py-4 bg-theme-text text-theme-bg rounded-full text-xs uppercase tracking-[0.2em] font-black transition-all duration-500 hover:scale-105 shadow-2xl shadow-purple-500/20"
               >
                 <FileText size={14} />
                 View Resume
                 <Download size={14} className="group-hover:translate-y-1 transition-transform" />
               </a>

               <div className="flex items-center gap-2">
                 <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                 <span className="text-[10px] uppercase tracking-widest font-bold text-theme-text/50">
                   Open to new opportunities
                 </span>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
