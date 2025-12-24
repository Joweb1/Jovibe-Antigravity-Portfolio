
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, MessageSquare, AudioLines, X, CheckCircle } from 'lucide-react';
import gsap from 'gsap';
import { ARCHIVE_PROJECTS, SKILL_CATEGORIES, SERVICES, TESTIMONIALS } from '../constants';

interface VoiceControlProps {
  onNavigate: (section: string) => void;
  onOpenRecruiter: () => void;
  onToggleTheme: () => void;
  shouldWelcome: boolean;
  isChatOpen: boolean;
}

const HINTS = [
  "Take me to your latest work",
  "Tell me about Jonadab",
  "Show me the services",
  "Open the Smart Recruiter",
  "Switch to light mode",
  "Navigate to testimonials",
  "Contact Jonadab"
];

const VoiceControl: React.FC<VoiceControlProps> = ({ onNavigate, onOpenRecruiter, onToggleTheme, shouldWelcome, isChatOpen }) => {
  const [isActive, setIsActive] = useState(false);
  const isActiveRef = useRef(false);
  const [volume, setVolume] = useState(0);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'processing'>('idle');
  const [showHints, setShowHints] = useState(true);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  
  // Modals
  const [permissionError, setPermissionError] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  
  // Audio Contexts
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  
  // Audio Nodes
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  
  const sessionRef = useRef<Promise<any> | null>(null);
  const hintIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasWelcomedRef = useRef(false);

  // Animation for Permission Error Modal
  useEffect(() => {
    if (permissionError && modalRef.current) {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
        gsap.fromTo(modalRef.current, 
            { scale: 0.9, opacity: 0, y: 20 },
            { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.7)' }
        );
    }
  }, [permissionError]);

  // Cycle hints
  useEffect(() => {
    if (showHints) {
      hintIntervalRef.current = setInterval(() => {
        setCurrentHintIndex(prev => (prev + 1) % HINTS.length);
      }, 4000);
    } else if (hintIntervalRef.current) {
      clearInterval(hintIntervalRef.current);
    }
    return () => {
      if (hintIntervalRef.current) clearInterval(hintIntervalRef.current);
    };
  }, [showHints]);

  // Generate RICH Context for the System Instruction
  const projectContext = ARCHIVE_PROJECTS.map(p => 
    `PROJECT: ${p.title} (${p.category})
     STATUS: ${p.status || 'Active'}
     DESCRIPTION: ${p.description}
     TECH STACK: ${p.techStack?.join(', ')}
     FEATURES: ${p.features?.join(', ')}`
  ).join('\n\n');

  const testimonialContext = TESTIMONIALS.map(t => 
    `REVIEW: "${t.quote}"
     AUTHOR: ${t.author}, ${t.role} at ${t.company}`
  ).join('\n\n');

  const skillsContext = SKILL_CATEGORIES.map(c => 
    `CATEGORY: ${c.name}
     SKILLS: ${c.skills.join(', ')}`
  ).join('\n');

  // Base System Instruction
  const baseSystemContext = `
    You are the intelligent voice interface for Jonadab Uroh's portfolio.
    
    CAPABILITIES:
    - Navigate to sections (Home, Work, Services, etc.)
    - Open the 'Smart Recruiter' tool (for compatibility analysis)
    - Toggle Light/Dark themes
    - Explain specific projects, skills, and testimonials in detail

    WEBSITE SECTIONS (ID to use for navigation):
    - 'home' (Hero, Intro)
    - 'work' (Projects, Case Studies)
    - 'services' (Offerings)
    - 'process' (Methodology)
    - 'testimonials' (Reviews)
    - 'about' (Profile, Biography)
    - 'archive' (All Projects)
    - 'contact' (Footer)

    DATA KNOWLEDGE BASE:
    
    === SKILLS & EXPERTISE ===
    ${skillsContext}

    === TESTIMONIALS ===
    ${testimonialContext}

    === PROJECTS ===
    ${projectContext}

    RULES:
    1. **Speak Back**: Always reply verbally. Keep responses concise (under 2 sentences) unless asked for details.
    2. **Recruiter Tool**: If the user mentions "hiring", "job", "compatibility", "recruiter", or "pitch", say "Opening the Smart Recruiter module" and call the 'openRecruiter' tool.
    3. **Theme**: If the user says "dark mode", "light mode", "switch theme", call the 'toggleTheme' tool.
    4. **Navigate**: If the user wants to go to a section, say "Navigating..." and call 'navigate'.
    5. **Explain**: If asked about a project, use the context to give a smart summary.
    6. **Personality**: You are helpful, futuristic, and precise.
  `;

  const navigateTool: FunctionDeclaration = {
    name: 'navigate',
    description: 'Navigate to a specific section of the website.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        section: {
          type: Type.STRING,
          enum: ['home', 'work', 'services', 'process', 'testimonials', 'about', 'archive', 'contact'],
          description: 'The section ID to navigate to.',
        },
      },
      required: ['section'],
    },
  };

  const openRecruiterTool: FunctionDeclaration = {
    name: 'openRecruiter',
    description: 'Open the Smart Recruiter analysis tool modal.',
    parameters: { type: Type.OBJECT, properties: {} },
  };

  const toggleThemeTool: FunctionDeclaration = {
    name: 'toggleTheme',
    description: 'Toggle the website theme between light and dark mode.',
    parameters: { type: Type.OBJECT, properties: {} },
  };

  // Global listener to start session on user interaction (triggered by App's AudioPermissionModal)
  useEffect(() => {
    if (shouldWelcome && !hasWelcomedRef.current) {
      const handleInteraction = async () => {
         if (hasWelcomedRef.current) return;
         hasWelcomedRef.current = true;
         console.log("User interaction detected, starting session...");
         
         try {
            await startSession('welcome');
         } catch (err) {
            console.debug("Auto-welcome failed", err);
         }
         
         cleanup();
      };

      const cleanup = () => {
          window.removeEventListener('click', handleInteraction);
          window.removeEventListener('keydown', handleInteraction);
          window.removeEventListener('touchstart', handleInteraction);
      };

      window.addEventListener('click', handleInteraction, { once: true });
      window.addEventListener('keydown', handleInteraction, { once: true });
      window.addEventListener('touchstart', handleInteraction, { once: true });

      return () => cleanup();
    }
  }, [shouldWelcome]);

  const startSession = async (mode: 'interactive' | 'welcome' = 'interactive') => {
    await stopSession();
    
    setShowHints(false);
    setStatus('connecting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true
        } 
      });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      inputContextRef.current = new AudioCtx({ sampleRate: 16000 });
      outputContextRef.current = new AudioCtx({ sampleRate: 24000 });
      
      if (inputContextRef.current.state === 'suspended') await inputContextRef.current.resume();
      if (outputContextRef.current.state === 'suspended') await outputContextRef.current.resume();

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

      // Instruct the model to speak immediately based on mode
      const modeInstruction = mode === 'welcome' 
        ? "IMPORTANT: You are initiating the conversation. IMMMEDIATELY welcome the visitor to Jonadab's portfolio. Introduce yourself as his AI agent. Do not wait for input. Speak now."
        : "IMPORTANT: The user has just activated you manually. IMMMEDIATELY say 'Hello, how can I help?' Do not wait for input. Speak now.";

      const fullSystemInstruction = `${modeInstruction}\n\n${baseSystemContext}`;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          tools: [{ functionDeclarations: [navigateTool, openRecruiterTool, toggleThemeTool] }],
          systemInstruction: fullSystemInstruction // Pass as simple string to avoid format errors
        },
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Connected');
            setStatus('listening');
            setIsActive(true);
            isActiveRef.current = true;
            setupAudioInput(sessionPromise);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              setStatus('speaking');
              await playAudio(audioData);
            }

            // Auto-close logic only for welcome mode
            if (mode === 'welcome') {
                if (msg.serverContent?.turnComplete) {
                    const ctx = outputContextRef.current;
                    const remainingTime = ctx ? (nextStartTimeRef.current - ctx.currentTime) * 1000 : 0;
                    setTimeout(() => {
                        if (isActiveRef.current && status !== 'processing') {
                            stopSession();
                        }
                    }, Math.max(0, remainingTime) + 1500);
                }
            } else {
                if (audioData) {
                    setTimeout(() => setStatus('listening'), 2000); 
                }
            }

            if (msg.toolCall) {
              setStatus('processing');
              msg.toolCall.functionCalls.forEach((fc: any) => {
                if (fc.name === 'navigate') {
                  console.log("Navigating to:", fc.args.section);
                  onNavigate(fc.args.section);
                } else if (fc.name === 'openRecruiter') {
                    console.log("Opening Recruiter");
                    onOpenRecruiter();
                } else if (fc.name === 'toggleTheme') {
                    console.log("Toggling Theme");
                    onToggleTheme();
                }

                sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: {
                        id: fc.id,
                        name: fc.name,
                        response: { result: 'Action executed successfully' }
                      }
                    });
                });
              });
            }
          },
          onclose: (e) => {
              console.log("Session closed by server", e);
              if (isActiveRef.current && mode === 'interactive') {
                  setPermissionError(true);
              }
              stopSession();
          },
          onerror: (e) => {
            console.error("Gemini Live Error", e);
            if (isActiveRef.current && mode === 'interactive') {
                setPermissionError(true);
            }
            stopSession();
          }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (err) {
      if (mode === 'welcome') {
          console.debug("Auto-welcome failed.", err);
          stopSession();
          return;
      }
      console.error("Failed to start voice session", err);
      stopSession();
      setPermissionError(true);
    }
  };

  const setupAudioInput = (sessionPromise: Promise<any>) => {
    const ctx = inputContextRef.current;
    if(!ctx || !streamRef.current) return;
    
    sourceRef.current = ctx.createMediaStreamSource(streamRef.current);
    processorRef.current = ctx.createScriptProcessor(4096, 1, 1);
    
    processorRef.current.onaudioprocess = (e) => {
      if (!isActiveRef.current) return;

      const inputData = e.inputBuffer.getChannelData(0);
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      setVolume(Math.sqrt(sum / inputData.length));

      const l = inputData.length;
      const int16 = new Int16Array(l);
      for (let i = 0; i < l; i++) {
        int16[i] = inputData[i] * 32768;
      }
      const bytes = new Uint8Array(int16.buffer);
      
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const b64 = btoa(binary);

      // Only stream if active
      if (isActiveRef.current) {
          sessionPromise.then(session => {
            session.sendRealtimeInput({
              media: {
                mimeType: 'audio/pcm;rate=16000',
                data: b64
              }
            });
          }).catch(e => {
              // Suppress errors during shutdown
              if (isActiveRef.current) console.error("Send input error", e);
          });
      }
    };

    sourceRef.current.connect(processorRef.current);
    processorRef.current.connect(ctx.destination);
  };

  const playAudio = async (base64String: string) => {
    const ctx = outputContextRef.current;
    if (!ctx) return;

    try {
      const binaryString = atob(base64String);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const dataInt16 = new Int16Array(bytes.buffer);
      const float32Data = new Float32Array(dataInt16.length);
      for (let i = 0; i < dataInt16.length; i++) {
        float32Data[i] = dataInt16[i] / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime;
      }
      
      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;

    } catch (error) {
      console.error("Audio playback error", error);
    }
  };

  const stopSession = async () => {
    setIsActive(false);
    isActiveRef.current = false;
    setStatus('idle');
    setVolume(0);
    setShowHints(true);

    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current.onaudioprocess = null;
        processorRef.current = null;
    }
    if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
    }
    
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    
    const closeContext = async (ref: React.MutableRefObject<AudioContext | null>) => {
        if (ref.current) {
            const ctx = ref.current;
            ref.current = null;
            if (ctx.state !== 'closed') {
                try {
                    await ctx.close();
                } catch (e) {
                    console.warn("Context close warning", e);
                }
            }
        }
    };

    await Promise.all([
        closeContext(inputContextRef),
        closeContext(outputContextRef)
    ]);
    
    nextStartTimeRef.current = 0;
    sessionRef.current = null;
  };

  // Visualizer Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (isActiveRef.current) {
        ctx.beginPath();
        const radius = 20 + (volume * 100); 
        ctx.arc(width / 2, height / 2, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = status === 'speaking' 
          ? `rgba(52, 211, 153, ${0.5 + volume})`
          : `rgba(147, 51, 234, ${0.5 + volume})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(width / 2, height / 2, radius * 0.7, 0, 2 * Math.PI);
        ctx.fillStyle = status === 'speaking'
          ? `rgba(52, 211, 153, ${0.2 + volume})`
          : `rgba(147, 51, 234, ${0.2 + volume})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isActive, volume, status]);

  const toggleVoice = () => {
    hasWelcomedRef.current = true;
    if (isActiveRef.current) {
      stopSession();
    } else {
      startSession('interactive');
    }
  };

  return (
    <>
      {/* ERROR MODAL */}
      {permissionError && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-6">
            <div ref={overlayRef} className="absolute inset-0 bg-theme-bg/80 backdrop-blur-md" onClick={() => setPermissionError(false)} />
            <div ref={modalRef} className="relative bg-theme-bg/90 backdrop-blur-2xl border border-theme-border p-8 rounded-2xl max-w-sm w-full shadow-[0_0_50px_rgba(147,51,234,0.2)] flex flex-col items-center text-center overflow-hidden">
                <div className="relative w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 text-red-500 ring-1 ring-red-500/20 shadow-lg shadow-red-500/10">
                   <MicOff size={24} />
                   <div className="absolute inset-0 border border-red-500/20 rounded-full animate-ping opacity-20" />
                </div>
                
                <h3 className="text-xl font-black uppercase tracking-tighter text-theme-text mb-3">
                   Connection Interrupted
                </h3>
                
                <p className="text-xs font-medium text-theme-text/60 leading-relaxed mb-8 relative z-10">
                   The neural link was closed by the server. This may be due to inactivity or network conditions.
                </p>
                
                <div className="grid grid-cols-2 gap-3 w-full relative z-10">
                    <button 
                        onClick={() => setPermissionError(false)}
                        className="py-3 px-4 rounded-xl border border-theme-border text-[10px] uppercase tracking-widest font-black text-theme-text/40 hover:text-theme-text hover:bg-theme-text/5 transition-colors"
                    >
                        Dismiss
                    </button>
                    <button 
                        onClick={() => {
                            setPermissionError(false);
                            startSession('interactive');
                        }}
                        className="py-3 px-4 rounded-xl bg-theme-text text-theme-bg text-[10px] uppercase tracking-widest font-black hover:bg-purple-600 hover:text-white transition-colors shadow-lg shadow-purple-500/20"
                    >
                        Reconnect
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* FLOATING CONTROL */}
      <div className="fixed bottom-6 left-6 md:bottom-10 md:left-10 z-50 flex flex-col items-start gap-4">
        
        {/* Dynamic Hints Tooltip */}
        {showHints && !isActive && !isChatOpen && (
          <div className="absolute bottom-full left-0 mb-4 w-64 pointer-events-none">
            <div className="bg-theme-bg border border-theme-border rounded-xl p-4 shadow-xl relative animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="flex items-start gap-3">
                 <div className="w-8 h-8 rounded-full bg-purple-600/10 flex items-center justify-center shrink-0">
                    <MessageSquare size={14} className="text-purple-600" />
                 </div>
                 <div>
                   <p className="text-[9px] uppercase tracking-widest font-black text-theme-text/40 mb-1">Voice Command</p>
                   <p key={currentHintIndex} className="text-xs font-bold text-theme-text animate-in fade-in duration-300">
                      "{HINTS[currentHintIndex]}"
                   </p>
                 </div>
               </div>
               <div className="absolute -bottom-2 left-6 w-4 h-4 bg-theme-bg border-b border-r border-theme-border rotate-45" />
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="relative">
            <canvas 
              ref={canvasRef} 
              width="80" 
              height="80" 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" 
            />
            
            <button
              onClick={toggleVoice}
              className={`relative z-10 w-14 h-14 rounded-full border border-theme-border flex items-center justify-center transition-all duration-300 ${
                isActive 
                  ? status === 'speaking' ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(52,211,153,0.5)]' : 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.5)]'
                  : 'bg-theme-bg text-theme-text hover:bg-theme-text/5'
              }`}
            >
              {status === 'connecting' || status === 'processing' ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isActive ? (
                  <Mic size={20} className={status === 'speaking' ? 'animate-pulse' : ''} />
              ) : (
                  <MicOff size={20} className="opacity-50" />
              )}
            </button>
          </div>

          <div className={`transition-all duration-500 overflow-hidden ${isActive ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
             <div className="bg-theme-bg/80 backdrop-blur-md border border-theme-border rounded-full px-4 py-2 flex items-center gap-2 whitespace-nowrap">
                 <div className={`w-2 h-2 rounded-full animate-pulse ${status === 'speaking' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                 <span className="text-[10px] uppercase tracking-widest font-black text-theme-text">
                    {status === 'listening' ? 'Listening...' : 
                     status === 'speaking' ? 'Speaking...' : 
                     status === 'processing' ? 'Thinking...' : 'Connecting...'}
                 </span>
             </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VoiceControl;
