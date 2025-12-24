
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import gsap from 'gsap';
import { Briefcase, X, Loader2, CheckCircle, AlertCircle, Percent, Send } from 'lucide-react';
import { ARCHIVE_PROJECTS, SKILL_CATEGORIES, SERVICES } from '../constants';

interface SmartRecruiterProps {
  isOpen: boolean;
  onClose: () => void;
}

const SmartRecruiter: React.FC<SmartRecruiterProps> = ({ isOpen, onClose }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{ score: number; pitch: string; matchReason: string } | null>(null);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      gsap.to(overlayRef.current, { opacity: 1, duration: 0.4 });
      gsap.fromTo(modalRef.current, 
        { scale: 0.9, opacity: 0, y: 20 }, 
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' }
      );
    } else {
      document.body.style.overflow = '';
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.3 });
      gsap.to(modalRef.current, { scale: 0.9, opacity: 0, y: 20, duration: 0.3 });
    }
  }, [isOpen]);

  // Animate score when result appears
  useEffect(() => {
    if (result && scoreRef.current) {
      gsap.fromTo(scoreRef.current, 
        { innerText: 0 }, 
        { 
          innerText: result.score, 
          duration: 2, 
          snap: { innerText: 1 }, 
          ease: 'power2.out' 
        }
      );
    }
  }, [result]);

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) return;
    setIsAnalyzing(true);
    setResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const portfolioContext = JSON.stringify({
        projects: ARCHIVE_PROJECTS.map(p => ({ title: p.title, desc: p.description, tech: p.techStack })),
        skills: SKILL_CATEGORIES,
        services: SERVICES
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a career strategist. Compare this Job Description against Jonadab's Portfolio data.
        
        JOB DESCRIPTION:
        ${jobDescription}

        PORTFOLIO DATA:
        ${portfolioContext}

        Generate a compatibility report in JSON format:
        1. "score": An integer 0-100 based on skill overlap and experience relevance.
        2. "pitch": A short, persuasive paragraph (max 60 words) written in first-person ("I am...") explaining exactly why Jonadab is the perfect fit for this specific role, referencing his specific projects.
        3. "matchReason": A bullet point summarizing the strongest technical match.
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              pitch: { type: Type.STRING },
              matchReason: { type: Type.STRING },
            },
            required: ["score", "pitch", "matchReason"],
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      setResult(data);

    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
      <div 
        ref={overlayRef} 
        onClick={onClose}
        className="absolute inset-0 bg-theme-bg/80 backdrop-blur-md opacity-0" 
      />
      
      <div 
        ref={modalRef}
        className="relative w-full max-w-2xl bg-theme-bg border border-theme-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-theme-border flex justify-between items-center bg-theme-text/[0.02]">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-600/10 flex items-center justify-center border border-purple-500/20">
                 <Briefcase size={18} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-tighter text-theme-text leading-none">Smart Recruiter</h2>
                <p className="text-[10px] uppercase tracking-widest text-theme-text/40 font-bold">Compatibility Engine</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 text-theme-text/40 hover:text-theme-text transition-colors"><X size={20} /></button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {!result ? (
            <div className="space-y-6">
              <div className="bg-purple-600/5 border border-purple-600/10 rounded-xl p-4">
                 <p className="text-xs font-medium text-purple-600/80 leading-relaxed">
                   <CheckCircle size={14} className="inline mr-2 mb-0.5" />
                   Paste a Job Description below. I will analyze my entire portfolio history to calculate a compatibility score and generate a personalized pitch for you.
                 </p>
              </div>
              
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste Job Description here (e.g. 'Looking for a Senior Laravel Developer...')"
                className="w-full h-48 bg-theme-text/5 border border-theme-border rounded-xl p-4 text-sm font-medium text-theme-text focus:outline-none focus:border-purple-600/50 resize-none placeholder:text-theme-text/20"
              />

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !jobDescription.trim()}
                className="w-full py-4 bg-theme-text text-theme-bg rounded-xl font-black uppercase tracking-widest text-xs hover:bg-purple-600 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                {isAnalyzing ? 'Analyzing Portfolio...' : 'Run Compatibility Check'}
              </button>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
               {/* Score Card */}
               <div className="flex items-center justify-center py-8 relative">
                  <div className="absolute inset-0 bg-purple-600/5 rounded-full blur-[60px]" />
                  <div className="relative z-10 flex flex-col items-center">
                     <div className="text-7xl font-black tracking-tighter text-theme-text flex items-start">
                        <span ref={scoreRef}>0</span>
                        <span className="text-3xl text-purple-600 mt-2">%</span>
                     </div>
                     <span className="text-[10px] uppercase tracking-[0.4em] font-black text-theme-text/40 mt-2">Match Probability</span>
                  </div>
               </div>

               {/* Pitch */}
               <div className="space-y-4">
                  <h3 className="text-[10px] uppercase tracking-widest text-purple-600 font-black flex items-center gap-2">
                     <CheckCircle size={12} /> Personalized Pitch
                  </h3>
                  <div className="p-6 bg-theme-text/5 border border-theme-border rounded-xl">
                     <p className="text-base md:text-lg font-medium leading-relaxed text-theme-text italic">
                        "{result.pitch}"
                     </p>
                  </div>
               </div>

               {/* Reason */}
               <div className="flex items-start gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                  <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest text-emerald-600 font-black mb-1">Key Strength</h4>
                    <p className="text-sm font-medium text-theme-text/70">{result.matchReason}</p>
                  </div>
               </div>

               <button 
                 onClick={() => setResult(null)}
                 className="w-full py-3 border border-theme-border rounded-xl text-xs font-black uppercase tracking-widest text-theme-text/60 hover:text-theme-text hover:bg-theme-text/5 transition-colors"
               >
                 Analyze Another Role
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartRecruiter;
