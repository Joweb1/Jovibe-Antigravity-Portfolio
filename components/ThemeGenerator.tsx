import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import gsap from 'gsap';
import { Wand2, X, Loader2, Sparkles, RefreshCcw } from 'lucide-react';

interface ThemeGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThemeGenerator: React.FC<ThemeGeneratorProps> = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTheme, setGeneratedTheme] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

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

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a UI color theme based on this mood/description: "${prompt}".
        
        The theme should be sophisticated, readable, and fit a "high-tech/luxury" portfolio aesthetic.
        Return ONLY a JSON object with these exact properties:
        - bgRGB: string "r, g, b" (e.g., "10, 15, 30") - The main background color
        - textRGB: string "r, g, b" (e.g., "240, 240, 255") - The main text color
        - cardRGB: string "r, g, b" (e.g., "20, 25, 40") - For cards/modals
        - accentHex: string "#hex" (e.g., "#00ffcc") - The primary accent color
        
        Ensure high contrast between bgRGB and textRGB.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              bgRGB: { type: Type.STRING },
              textRGB: { type: Type.STRING },
              cardRGB: { type: Type.STRING },
              accentHex: { type: Type.STRING },
            },
            required: ["bgRGB", "textRGB", "cardRGB", "accentHex"],
          }
        }
      });

      const themeData = JSON.parse(response.text || '{}');
      
      if (themeData.bgRGB) {
        applyTheme(themeData);
        setGeneratedTheme(prompt);
      }
    } catch (error) {
      console.error("Theme generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyTheme = (data: any) => {
    const root = document.documentElement;
    
    // Animate CSS variables for smooth transition
    const targetObj = { val: 0 };
    gsap.to(targetObj, {
      val: 1,
      duration: 1.5,
      onUpdate: () => {
         // This is a simplified way to just set them, GSAP CSS plugin handles vars but directly setting is safer for custom properties
      }
    });

    root.style.setProperty('--bg-rgb', data.bgRGB);
    root.style.setProperty('--text-rgb', data.textRGB);
    root.style.setProperty('--card-rgb', data.cardRGB);
    root.style.setProperty('--accent-hex', data.accentHex);
    root.style.setProperty('--accent-glow', `${data.accentHex}15`); // Low opacity version
  };

  const resetTheme = () => {
    const root = document.documentElement;
    // Reset to default dark/light mode values (simplified reset to dark for now as "default")
    // In a real app, you might want to read from the 'dark' class state
    const isDark = root.classList.contains('dark');
    if (isDark) {
        root.style.setProperty('--bg-rgb', '5, 1, 13');
        root.style.setProperty('--text-rgb', '250, 250, 250');
        root.style.setProperty('--card-rgb', '13, 5, 22');
        root.style.setProperty('--accent-hex', '#9333ea');
    } else {
        root.style.setProperty('--bg-rgb', '252, 252, 255');
        root.style.setProperty('--text-rgb', '18, 8, 38');
        root.style.setProperty('--card-rgb', '255, 255, 255');
        root.style.setProperty('--accent-hex', '#9333ea');
    }
    setGeneratedTheme(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
      <div 
        ref={overlayRef} 
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0" 
      />
      
      <div 
        ref={modalRef}
        className="relative w-full max-w-lg bg-theme-bg border border-theme-border rounded-2xl p-8 shadow-2xl overflow-hidden"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-theme-text/40 hover:text-theme-text transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mb-8 text-center">
           <div className="w-16 h-16 mx-auto bg-theme-accent/10 rounded-full flex items-center justify-center mb-6">
              <Wand2 className="w-8 h-8 text-theme-accent" />
           </div>
           <h2 className="text-3xl font-black uppercase tracking-tighter text-theme-text mb-2">
             Reality Distortion
           </h2>
           <p className="text-xs font-bold uppercase tracking-widest text-theme-text/40">
             Generative Theme Engine
           </p>
        </div>

        <div className="space-y-6">
           <div className="relative">
             <input
               type="text"
               value={prompt}
               onChange={(e) => setPrompt(e.target.value)}
               placeholder="Describe a mood (e.g. 'Cyberpunk Tokyo', 'Martian Dust', 'Deep Ocean')..."
               className="w-full bg-theme-text/5 border border-theme-border rounded-xl px-5 py-4 text-sm font-medium text-theme-text outline-none focus:border-theme-accent/50 transition-all placeholder:text-theme-text/20"
               onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
             />
             <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isGenerating && <Loader2 className="animate-spin text-theme-accent" size={20} />}
             </div>
           </div>

           <div className="flex gap-3">
             <button
               onClick={handleGenerate}
               disabled={isGenerating || !prompt.trim()}
               className="flex-1 bg-theme-text text-theme-bg font-black uppercase tracking-widest text-xs py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
             >
               {isGenerating ? 'Synthesizing...' : (
                 <>
                   <Sparkles size={14} /> Generate Reality
                 </>
               )}
             </button>
             
             {generatedTheme && (
               <button
                 onClick={resetTheme}
                 className="px-4 border border-theme-border rounded-xl text-theme-text/60 hover:text-theme-text hover:border-theme-text/40 transition-all"
                 title="Reset to Default"
               >
                 <RefreshCcw size={18} />
               </button>
             )}
           </div>
        </div>

        {generatedTheme && !isGenerating && (
          <div className="mt-8 pt-6 border-t border-theme-border text-center">
             <span className="text-[10px] uppercase tracking-widest text-theme-text/40">
               Active Theme: <span className="text-theme-accent font-bold">{generatedTheme}</span>
             </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemeGenerator;
