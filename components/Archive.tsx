
import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowLeft, ArrowRight, X, Info, Lock, User, Terminal, ExternalLink } from 'lucide-react';
import { ARCHIVE_PROJECTS } from '../constants';
import { Project } from '../types';

interface ArchiveProps {
  onBack: () => void;
}

const ProjectModal: React.FC<{ project: Project; onClose: () => void }> = ({ project, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

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

  const handleClose = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const tl = gsap.timeline({ 
      onComplete: onClose,
      defaults: { ease: 'expo.inOut', duration: 0.8 }
    });
    
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

  return (
    <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center p-0 md:p-6 lg:p-10">
      <div 
        ref={overlayRef}
        onClick={handleClose}
        className="absolute inset-0 bg-theme-bg/95 backdrop-blur-3xl"
      />
      
      <div 
        ref={modalRef}
        className="relative w-full h-[95vh] md:h-full max-w-7xl bg-theme-bg border-t md:border border-theme-border md:rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-[0_50px_100px_rgba(0,0,0,0.5)]"
      >
        <button 
          onClick={handleClose}
          className="absolute top-6 right-6 md:top-10 md:right-10 z-50 p-4 bg-theme-text/5 hover:bg-theme-text/10 rounded-full text-theme-text transition-all duration-300 border border-theme-border backdrop-blur-md"
        >
          <X size={20} />
        </button>

        {/* Image Section */}
        <div className="w-full md:w-1/2 h-[40vh] md:h-full bg-theme-text/5 overflow-hidden border-b md:border-b-0 md:border-r border-theme-border relative">
          <img 
            src={project.image} 
            alt={project.title} 
            className="w-full h-full object-cover grayscale brightness-50 dark:brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-1000 ease-luxury"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-theme-bg/80 via-transparent to-transparent md:hidden" />
        </div>

        {/* Content Section */}
        <div className="w-full md:w-1/2 h-full overflow-y-auto p-8 md:p-20 flex flex-col bg-theme-bg">
          <div ref={contentRef} className="space-y-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <span className="text-[10px] uppercase tracking-[0.4em] text-purple-600 font-black">
                  [{project.id}]
                </span>
                <span className="w-12 h-px bg-theme-border" />
                <span className="text-[10px] uppercase tracking-[0.4em] text-theme-text/40 font-black">
                  {project.category}
                </span>
              </div>
              <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.85] text-theme-text mb-4">
                {project.title}
              </h2>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] uppercase tracking-widest text-theme-text/30 font-black flex items-center gap-3">
                <Info size={12} className="text-purple-600" /> Brief
              </h4>
              <p className="text-xl md:text-2xl font-medium leading-relaxed text-theme-text/90 tracking-tight">
                {project.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-10">
               <div className="space-y-4">
                  <h4 className="text-[10px] uppercase tracking-widest text-theme-text/30 font-black flex items-center gap-3">
                    <User size={12} className="text-purple-600" /> Capacity
                  </h4>
                  <p className="text-xs font-black uppercase tracking-widest text-theme-text leading-snug">
                    {project.role || 'Lead Engineer'}
                  </p>
                </div>
              <div className="space-y-4">
                <h4 className="text-[10px] uppercase tracking-widest text-theme-text/30 font-black">
                   Temporal
                </h4>
                <p className="text-3xl font-black text-theme-text tracking-tighter">{project.year}</p>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] uppercase tracking-widest text-theme-text/30 font-black flex items-center gap-3">
                <Terminal size={12} className="text-purple-600" /> Technology
              </h4>
              <div className="flex flex-wrap gap-2">
                {project.techStack?.map((tech) => (
                  <span key={tech} className="px-5 py-2.5 bg-theme-text/[0.03] rounded-full text-[9px] font-black uppercase tracking-widest text-theme-text/60 border border-theme-border hover:bg-theme-text/[0.08] transition-colors">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-16 border-t border-theme-border flex flex-col md:flex-row justify-between items-center gap-10">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex items-center space-x-4 px-10 py-5 bg-theme-text rounded-full text-theme-bg shadow-xl shadow-purple-500/10">
                  <span className="text-[10px] uppercase tracking-[0.3em] font-black">
                    {project.isComingSoon ? 'Prototype Status' : 'Stable Build'}
                  </span>
                </div>
                {project.link && (
                    <a href={project.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-black text-purple-600 hover:text-purple-400 transition-colors">
                        Visit Site <ExternalLink size={12} />
                    </a>
                )}
              </div>
              
              <div className="text-center md:text-right">
                <span className="text-[9px] uppercase tracking-[0.4em] font-black text-theme-text/20 block mb-2">Jonadab Uroh &mdash; Portfolio Archive</span>
                <span className={`text-[9px] uppercase tracking-[0.3em] font-black px-3 py-1 rounded border ${project.status === 'Live' ? 'text-emerald-500 border-emerald-500/20' : 'text-purple-600 border-purple-600/20'}`}>
                  {project.status || 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Archive: React.FC<ArchiveProps> = ({ onBack }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
        gsap.fromTo(containerRef.current, 
          { opacity: 0 }, 
          { opacity: 1, duration: 1.2, ease: 'power2.out' }
        );
        
        if (rowsRef.current) {
          gsap.fromTo(rowsRef.current.children, 
            { y: 30, opacity: 0 }, 
            { y: 0, opacity: 1, stagger: 0.08, duration: 1, ease: 'expo.out', delay: 0.2 }
          );
        }
    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  const getStatusStyles = (status: Project['status']) => {
    switch (status) {
      case 'Live':
        return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5';
      case 'Development':
        return 'text-amber-500 border-amber-500/20 bg-amber-500/5';
      case 'MVP':
        return 'text-sky-500 border-sky-500/20 bg-sky-500/5';
      default:
        return 'text-theme-text/30 border-theme-border bg-theme-text/[0.02]';
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen pt-40 pb-40 px-6 md:px-20 bg-theme-bg">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-24 flex items-center justify-between border-b border-theme-border pb-12">
          <div>
            <h1 className="text-7xl md:text-[10vw] font-black tracking-tighter uppercase text-theme-text leading-none">Archive</h1>
            <p className="text-[10px] uppercase tracking-[0.5em] text-purple-600 font-black mt-6 pl-1">Comprehensive Repository & Chronology</p>
          </div>
          <button 
            onClick={onBack}
            className="group flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] font-black text-theme-text/40 hover:text-purple-600 transition-all duration-500"
          >
            <span className="w-10 h-10 rounded-full border border-theme-border flex items-center justify-center group-hover:border-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
              <ArrowLeft size={16} />
            </span>
            <span className="hidden md:inline">Dismiss</span>
          </button>
        </div>

        <div className="hidden md:grid grid-cols-12 gap-6 px-10 mb-10 text-[10px] uppercase tracking-[0.5em] font-black text-theme-text/20">
          <div className="col-span-1">Epoch</div>
          <div className="col-span-4">System Title</div>
          <div className="col-span-4">Category & Status</div>
          <div className="col-span-2">Environment</div>
          <div className="col-span-1 text-right">Access</div>
        </div>

        <div ref={rowsRef} className="flex flex-col">
          {ARCHIVE_PROJECTS.map((project) => (
            <div 
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className="group grid grid-cols-1 md:grid-cols-12 gap-6 items-center px-6 md:px-10 py-12 md:py-16 border-b border-theme-border hover:bg-theme-text/[0.03] transition-all duration-700 cursor-pointer relative"
            >
              <div className="col-span-1 text-base md:text-xl font-black text-theme-text/20 group-hover:text-purple-600/60 transition-colors">
                {project.year}
              </div>
              <div className="col-span-1 md:col-span-4">
                <h3 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-theme-text group-hover:translate-x-4 transition-transform duration-700 ease-luxury">
                  {project.title}
                </h3>
              </div>
              <div className="col-span-1 md:col-span-4 flex flex-wrap items-center gap-4">
                <span className="text-[10px] md:text-xs uppercase tracking-[0.3em] font-black text-theme-text/40">
                  {project.category}
                </span>
                {project.status && (
                  <span className={`text-[8px] px-3 py-1 rounded-full border font-black uppercase tracking-[0.2em] ${getStatusStyles(project.status)}`}>
                    {project.status}
                  </span>
                )}
              </div>
              <div className="col-span-1 md:col-span-2 flex flex-wrap gap-3">
                {project.techStack?.slice(0, 2).map(tech => (
                  <span key={tech} className="text-[9px] uppercase tracking-widest font-black text-theme-text/20 group-hover:text-theme-text/60 transition-colors border border-theme-border/50 px-2 py-0.5 rounded">
                    {tech}
                  </span>
                ))}
              </div>
              <div className="col-span-1 text-right flex justify-end">
                <div 
                  className="w-12 h-12 rounded-full border border-theme-border flex items-center justify-center group-hover:border-purple-600 group-hover:bg-purple-600 group-hover:text-white group-hover:scale-110 group-active:scale-95 transition-all duration-500"
                >
                   <ArrowRight size={20} className="-rotate-45" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedProject && (
        <ProjectModal 
          project={selectedProject} 
          onClose={() => setSelectedProject(null)} 
        />
      )}
    </div>
  );
};

export default Archive;
