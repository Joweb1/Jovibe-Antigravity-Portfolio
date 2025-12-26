
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import gsap from 'gsap';
import { Briefcase, X, Loader2, CheckCircle, Send, Copy, FileText, Sparkles, AlertCircle } from 'lucide-react';
import { ARCHIVE_PROJECTS, SKILL_CATEGORIES, SERVICES } from '../constants';

interface SmartRecruiterProps {
  isOpen: boolean;
  onClose: () => void;
}

const SmartRecruiter: React.FC<SmartRecruiterProps> = ({ isOpen, onClose }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{ score: number; pitch: string; matchReason: string; emailDraft: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const portfolioContext = JSON.stringify({
        projects: ARCHIVE_PROJECTS.map(p => ({ title: p.title, desc: p.description?.substring(0, 200), tech: p.techStack })), // Truncate desc to save tokens
        skills: SKILL_CATEGORIES.map(s => ({ name: s.name, skills: s.skills.slice(0, 10) })), // Limit skills
        services: SERVICES.map(s => s.title)
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Switch to Flash for speed/reliability
        contents: `You are a career strategist for Jonadab Uroh. Compare this Job Description against his Portfolio.
        
        JOB DESCRIPTION:
        ${jobDescription}

        PORTFOLIO DATA:
        ${portfolioContext}

        Generate a compatibility report in JSON format:
        1. "score": Integer 0-100 based on skill overlap.
        2. "pitch": A very short elevator pitch (max 40 words).
        3. "matchReason": One specific technical match (e.g. "Strong Laravel & AI integration experience").
        4. "emailDraft": A tailored "Cover Letter" or "Intro Application" text. 
           - Tone: Professional, confident, but NOT corporate/stiff. Fits a "No polished cover letter needed" instruction but is high quality.
           - Content: Directly address how Jonadab's specific projects (like Jovibe or Clymail) prove he can do the job. 
           - Mention specific stack matches (e.g. Laravel, Inertia, React, AI).
           - Structure it ready to copy-paste into an email/form.
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              pitch: { type: Type.STRING },
              matchReason: { type: Type.STRING },
              emailDraft: { type: Type.STRING },
            },
            required: ["score", "pitch", "matchReason", "emailDraft"],
          }
        }
      });

      const text = response.text || '{}';
      // Basic cleanup for markdown json blocks if model adds them
      const cleanText = text.replace(/```json\n?|```/g, '').trim();
      const data = JSON.parse(cleanText);
      
      setResult(data);

    } catch (error) {
      console.error("Analysis failed", error);
      setError("Analysis failed. Please check your connection or try a shorter job description.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = () => {
    if (result?.emailDraft) {
      navigator.clipboard.writeText(result.emailDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
                <p className="text-[10px] uppercase tracking-widest text-theme-text/40 font-bold">Compatibility & Cover Letter Engine</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 text-theme-text/40 hover:text-theme-text transition-colors"><X size={20} /></button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500">
                <AlertCircle size={16} />
                <p className="text-xs font-bold">{error}</p>
            </div>
          )}

          {!result ? (
            <div className="space-y-6">
              <div className="bg-purple-600/5 border border-purple-600/10 rounded-xl p-4">
                 <p className="text-xs font-medium text-purple-600/80 leading-relaxed">
                   <CheckCircle size={14} className="inline mr-2 mb-0.5" />
                   Paste a Job Description below. I will analyze my entire portfolio history to calculate a compatibility score and generate a custom cover letter / intro.
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
                {isAnalyzing ? 'Analyzing Portfolio...' : 'Generate Application & Cover Letter'}
              </button>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
               {/* Score Card */}
               <div className="flex items-center justify-center py-6 relative">
                  <div className="absolute inset-0 bg-purple-600/5 rounded-full blur-[60px]" />
                  <div className="relative z-10 flex flex-col items-center">
                     <div className="text-6xl font-black tracking-tighter text-theme-text flex items-start">
                        <span ref={scoreRef}>0</span>
                        <span className="text-2xl text-purple-600 mt-2">%</span>
                     </div>
                     <span className="text-[10px] uppercase tracking-[0.4em] font-black text-theme-text/40 mt-2">Match Strength</span>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Pitch */}
                 <div className="p-4 bg-theme-text/5 border border-theme-border rounded-xl">
                    <h3 className="text-[9px] uppercase tracking-widest text-purple-600 font-black mb-2 flex items-center gap-2">
                       <Sparkles size={10} /> Quick Pitch
                    </h3>
                    <p className="text-xs font-medium leading-relaxed text-theme-text italic">
                       "{result.pitch}"
                    </p>
                 </div>

                 {/* Reason */}
                 <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                    <h3 className="text-[9px] uppercase tracking-widest text-emerald-600 font-black mb-2 flex items-center gap-2">
                       <CheckCircle size={10} /> Key Logic
                    </h3>
                    <p className="text-xs font-medium text-theme-text/80">{result.matchReason}</p>
                 </div>
               </div>

               {/* Application Draft */}
               <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-end">
                    <h3 className="text-[10px] uppercase tracking-widest text-theme-text/40 font-black flex items-center gap-2">
                       <FileText size={12} /> Smart Cover Letter
                    </h3>
                    <button 
                      onClick={copyToClipboard}
                      className="text-[9px] uppercase tracking-widest font-black text-purple-600 hover:text-purple-400 flex items-center gap-2 transition-colors"
                    >
                      {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                      {copied ? 'Copied' : 'Copy Text'}
                    </button>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-purple-600/5 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative p-5 bg-theme-bg border border-theme-border rounded-xl shadow-inner">
                       <p className="text-sm font-mono text-theme-text/80 whitespace-pre-wrap leading-relaxed">
                          {result.emailDraft}
                       </p>
                    </div>
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
