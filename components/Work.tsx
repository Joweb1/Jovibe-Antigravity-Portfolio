
import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { GoogleGenAI } from "@google/genai";
import { X, ArrowRight, Lock, User, Plus, ExternalLink, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { HOME_PROJECTS } from '../constants';
import { Project } from '../types';

type VibePersona = 'Standard' | 'ELI5' | 'VC Pitch' | 'Sci-Fi Narrator';

const ProjectModal: React.FC<{ project: Project; onClose: () => void }> = ({ project, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();
  
  // Vibe Rewriter State
  const [activePersona, setActivePersona] = useState<VibePersona>('Standard');
  const [description, setDescription] = useState(project.description || '');
  const [isRewriting, setIsRewriting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: 'expo.out', duration: 1.2 } });
        tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.6 })
          .fromTo(modalRef.current, 
            { y: '100%', clipPath: 'inset(100% 0% 0% 0%)' }, 
            { y: '0%', clipPath: 'inset(0% 0% 0% 0%)' }, 
            '-=0.6'
          )
          .fromTo(contentRef.current?.children || [], 
            { y: 30, opacity: 0 }, 
            { y: 0, opacity: 1, stagger: 0.05, duration: 0.8 }, 
            '-=0.8'
          );
    }, modalRef);

    return () => { 
        document.body.style.overflow = ''; 
        ctx.revert();
    };
  }, []);

  const handleClose = () => {
    const tl = gsap.timeline({ onComplete: onClose, defaults: { ease: 'expo.inOut', duration: 0.8 } });
    if (contentRef.current) {
         tl.to(contentRef.current.children, { y: 20, opacity: 0, stagger: 0.02, duration: 0.4 })
    }
    if (modalRef.current) {
        tl.to(modalRef.current, { y: '100%', clipPath: 'inset(100% 0% 0% 0%)' }, '-=0.2')
    }
    if (overlayRef.current) {
        tl.to(overlayRef.current, { opacity: 0, duration: 0.4 }, '-=0.4');
    }
  };

  const handleVibeShift = async (persona: VibePersona) => {
    if (persona === 'Standard') {
        setDescription(project.description || '');
        setActivePersona(persona);
        return;
    }

    if (isRewriting) return;
    setIsRewriting(true);
    setActivePersona(persona);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        const prompt = `Rewrite the following project description in the style of a "${persona}". 
        Keep it concise (under 50 words). Maintain the core meaning but change the tone drastically.
        
        Original Description: "${project.description}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt
        });

        if (response.text) {
            setDescription(response.text);
        }
    } catch (error) {
        console.error("Vibe shift failed", error);
    } finally {
        setIsRewriting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center p-0 md:p-6 lg:p-10">
      <div ref={overlayRef} onClick={handleClose} className="absolute inset-0 bg-theme-bg/90 backdrop-blur-2xl" />
      <div ref={modalRef} className="relative w-full h-[95vh] md:h-full max-w-7xl bg-theme-bg border-t md:border border-theme-border md:rounded-lg overflow-hidden flex flex-col md:flex-row shadow-2xl">
        <button onClick={handleClose} className="absolute top-8 right-8 z-50 p-4 bg-theme-text/5 hover:bg-theme-text/10 rounded-full text-theme-text transition-all duration-300 border border-theme-border">
          <X size={20} />
        </button>
        <div className="w-full md:w-1/2 h-[35vh] md:h-full bg-theme-text/5 overflow-hidden border-b md:border-b-0 md:border-r border-theme-border">
          <img src={project.image} alt={project.title} className="w-full h-full object-cover grayscale-0 brightness-100 hover:grayscale hover:brightness-90 dark:hover:brightness-75 transition-all duration-1000 ease-luxury" />
        </div>
        <div className="w-full md:w-1/2 h-full overflow-y-auto p-8 md:p-16 flex flex-col bg-theme-bg">
          <div ref={contentRef} className="space-y-12">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-[10px] uppercase tracking-[0.4em] text-purple-600 font-black">[{project.id}]</span>
                <span className="w-8 h-px bg-theme-border" />
                <span className="text-[10px] uppercase tracking-[0.4em] text-theme-text/40 font-black">{project.category}</span>
              </div>
              <h2 className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] text-theme-text">{project.title}</h2>
            </div>
            
            {/* Vibe Rewriter Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                  <h4 className="text-[10px] uppercase tracking-widest text-theme-text/30 font-black flex items-center gap-2">
                      <ArrowRight size={10} className="text-purple-600" /> Information
                  </h4>
                  
                  <div className="flex gap-1 bg-theme-text/5 p-1 rounded-full border border-theme-border">
                      {['Standard', 'ELI5', 'VC Pitch', 'Sci-Fi Narrator'].map((persona) => (
                          <button
                              key={persona}
                              onClick={() => handleVibeShift(persona as VibePersona)}
                              disabled={isRewriting}
                              className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider transition-all duration-300 ${
                                  activePersona === persona 
                                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
                                  : 'text-theme-text/40 hover:text-theme-text'
                              }`}
                          >
                              {persona === 'Sci-Fi Narrator' ? 'Sci-Fi' : persona === 'VC Pitch' ? 'VC' : persona}
                          </button>
                      ))}
                  </div>
              </div>
              
              <div className="relative min-h-[80px]">
                   {isRewriting ? (
                       <div className="absolute inset-0 flex items-center gap-2 text-purple-600">
                           <Loader2 size={16} className="animate-spin" />
                           <span className="text-xs font-bold uppercase tracking-widest">Rewriting Vibe...</span>
                       </div>
                   ) : (
                       <p className="text-lg md:text-xl font-medium leading-relaxed text-theme-text/80 animate-in fade-in duration-500">
                           {description}
                       </p>
                   )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] uppercase tracking-widest text-theme-text/30 font-black">Architecture</h4>
              <div className="flex flex-wrap gap-2">
                {project.techStack?.map((tech) => (
                  <span key={tech} className="px-4 py-2 bg-theme-text/[0.03] rounded-sm text-[9px] font-black uppercase tracking-widest text-theme-text/50 border border-theme-border">{tech}</span>
                ))}
              </div>
            </div>
            <div className="pt-12 border-t border-theme-border flex flex-col md:flex-row justify-between items-center gap-8">
               {project.link ? (
                 <a href={project.link} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 px-8 py-4 bg-theme-text text-theme-bg hover:bg-purple-600 hover:text-white transition-all duration-500 rounded-full">
                   <span className="text-[10px] uppercase tracking-[0.2em] font-black">Visit Live Site</span>
                   <ExternalLink size={14} />
                 </a>
               ) : (
                 <div className="flex items-center gap-2 opacity-50">
                    <Lock size={14} />
                    <span className="text-[10px] uppercase tracking-[0.2em] font-black">Private / Internal</span>
                 </div>
               )}
               
               <div className="text-right">
                <span className="text-[9px] uppercase tracking-[0.4em] font-black text-theme-text/10 block mb-1">Jonadab Uroh &mdash; {currentYear}</span>
                <span className="text-[9px] uppercase tracking-[0.2em] font-black text-purple-600/30">{project.status || 'Active Archive'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectCard: React.FC<{ project: Project; onClick: () => void }> = ({ project, onClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
        gsap.fromTo(imageRef.current, { y: '-8%', scale: 1.05 }, { 
          y: '8%', scale: 1, ease: 'none',
          scrollTrigger: { trigger: containerRef.current, start: 'top bottom', end: 'bottom top', scrub: true }
        });
        gsap.fromTo(titleRef.current, { x: -30, opacity: 0 }, {
          x: 0, opacity: 1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: containerRef.current, start: 'top 90%' }
        });
        if (tagsRef.current) {
          gsap.fromTo(tagsRef.current.children, { y: 10, opacity: 0 }, {
            y: 0, opacity: 1, duration: 0.8, stagger: 0.05, ease: 'power3.out', scrollTrigger: { trigger: containerRef.current, start: 'top 85%' }
          });
        }
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} onClick={onClick} className="group relative w-full mb-40 md:mb-72 overflow-visible cursor-pointer">
      <div className="relative aspect-[16/10] md:aspect-[21/9] overflow-hidden bg-theme-bg border border-theme-border rounded-lg shadow-2xl shadow-purple-500/5 group-hover:border-purple-500/20 transition-all duration-700">
        <img ref={imageRef} src={project.image} alt={project.title} className="w-full h-full object-cover grayscale-0 brightness-100 group-hover:grayscale group-hover:brightness-90 dark:group-hover:brightness-75 transition-all duration-1000 ease-luxury scale-105" />
        {project.isComingSoon && (
           <div className="absolute top-6 right-6 bg-theme-bg/80 backdrop-blur-md px-4 py-2 rounded-full border border-theme-border z-20">
              <span className="text-[8px] uppercase tracking-widest font-black text-theme-text flex items-center gap-2"><Lock size={10} className="text-purple-600" /> Coming Soon</span>
           </div>
        )}
      </div>
      <div className="mt-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-3 mb-4">
             <span className="text-[10px] uppercase tracking-[0.4em] text-purple-600 font-black">[{project.id}]</span>
             <span className="text-[10px] uppercase tracking-[0.4em] text-theme-text/30 font-black">{project.category}</span>
             <div ref={tagsRef} className="flex flex-wrap gap-2 ml-0 md:ml-4">
               {project.techStack?.slice(0, 4).map((tech) => (
                 <span key={tech} className="px-3 py-1 bg-theme-text/[0.03] dark:bg-theme-text/[0.05] border border-theme-border rounded-full text-[9px] uppercase tracking-[0.2em] font-black text-theme-text/60 group-hover:text-purple-600 transition-colors duration-500">{tech}</span>
               ))}
             </div>
          </div>
          <h2 ref={titleRef} className="text-6xl md:text-[9vw] font-black tracking-tighter uppercase leading-[0.85] text-theme-text group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-500">{project.title}</h2>
        </div>
        <div className="flex flex-col items-end md:pb-4">
          <span className="text-[10px] uppercase tracking-widest text-theme-text/20 font-black">{project.year}</span>
        </div>
      </div>
    </div>
  );
};

interface WorkProps {
  onShowArchive?: () => void;
}

const Work: React.FC<WorkProps> = ({ onShowArchive }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <section id="work" className="relative px-6 md:px-20 py-40 bg-theme-bg transition-colors duration-700 ease-luxury">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-32 gap-10">
          <div className="space-y-4">
             <h3 className="text-[10px] uppercase tracking-[0.6em] text-purple-600 font-black">Selected Works</h3>
             <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-theme-text max-w-xl leading-none">
                Architecture of the <span className="italic opacity-30">Future.</span>
             </h2>
          </div>
          <button onClick={onShowArchive} className="group flex items-center space-x-4">
            <span className="text-[10px] font-black text-theme-text/60 uppercase tracking-[0.3em] group-hover:text-purple-600 transition-colors">View All Projects</span>
            <div className="w-12 h-px bg-theme-border group-hover:w-24 group-hover:bg-purple-600 transition-all duration-500" />
          </button>
        </div>

        {HOME_PROJECTS.map((project) => (
          <ProjectCard key={project.id} project={project} onClick={() => setSelectedProject(project)} />
        ))}

        <div className="flex justify-center pt-20">
          <button onClick={onShowArchive} className="group relative px-20 py-8 border border-theme-border rounded-full overflow-hidden hover:border-purple-600 transition-all duration-1000">
            <span className="relative z-10 text-[10px] uppercase tracking-widest font-black text-theme-text group-hover:text-white dark:group-hover:text-black transition-colors duration-500">Explore Project Archive</span>
            <div className="absolute inset-0 bg-theme-text translate-y-full group-hover:translate-y-0 transition-transform duration-1000 ease-luxury" />
          </button>
        </div>
      </div>
      {selectedProject && <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />}
    </section>
  );
};

export default Work;
