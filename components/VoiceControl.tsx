
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type, LiveServerMessage } from "@google/genai";
import { Mic, MicOff, MessageSquare, Settings, AlertCircle } from 'lucide-react';
import gsap from 'gsap';
import { ARCHIVE_PROJECTS, SKILL_CATEGORIES, SERVICES } from '../constants';

interface VoiceControlProps {
  onNavigate: (section: string) => void;
  shouldWelcome: boolean;
  isChatOpen: boolean;
}

const HINTS = [
  "Take me to your latest work",
  "Tell me about Jonadab",
  "Show me the services",
  "Go to the process section",
  "Navigate to testimonials",
  "Contact Jonadab",
  "Switch to light mode"
];

const VoiceControl: React.FC<VoiceControlProps> = ({ onNavigate, shouldWelcome, isChatOpen }) => {
  const [isActive, setIsActive] = useState(false);
  const isActiveRef = useRef(false); // Sync ref for audio processor
  const [volume, setVolume] = useState(0);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'processing'>('idle');
  const [showHints, setShowHints] = useState(true);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
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

  // Trigger welcome on FIRST interaction to bypass browser autoplay blocks
  useEffect(() => {
    if (shouldWelcome && !isActiveRef.current && !hasWelcomedRef.current) {
        
        const handleInteraction = async () => {
             // Check again to prevent race conditions if user clicked mic button manually
             if (hasWelcomedRef.current) return;
             
             hasWelcomedRef.current = true;
             console.log("User interaction detected, starting auto-welcome sequence...");
             
             try {
                await startSession(true);
             } catch (err) {
                console.debug("Auto-welcome failed", err);
             }
             
             // Clean up listeners
             cleanup();
        };

        const cleanup = () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };

        // Listen for any valid user gesture
        window.addEventListener('click', handleInteraction, { once: true });
        window.addEventListener('keydown', handleInteraction, { once: true });
        window.addEventListener('touchstart', handleInteraction, { once: true });

        return () => cleanup();
    }
  }, [shouldWelcome]);

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

  // Permission Modal Animation
  useEffect(() => {
    if (permissionError) {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
        gsap.fromTo(modalRef.current, 
            { scale: 0.9, opacity: 0, y: 20 },
            { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.7)' }
        );
    }
  }, [permissionError]);

  // Construct System Instruction with Context
  const systemContext = `
    You are the intelligent voice interface for Jonadab Uroh's portfolio.
    
    WEBSITE SECTIONS (ID to use for navigation):
    - 'home' (Hero, Intro)
    - 'work' (Projects, Case Studies)
    - 'services' (Offerings)
    - 'process' (Methodology)
    - 'testimonials' (Reviews)
    - 'about' (Profile, Biography)
    - 'archive' (All Projects)
    - 'contact' (Footer)

    PROFILE CONTEXT:
    - Name: Jonadab Uroh
    - Role: Full Stack Laravel Developer & AI Engineer
    - Skills: ${SKILL_CATEGORIES.map(s => s.name + ': ' + s.skills.join(', ')).join('; ')}
    - Projects: ${ARCHIVE_PROJECTS.map(p => `${p.title} (${p.category})`).join(', ')}
    - Services: ${SERVICES.map(s => s.title).join(', ')}

    RULES:
    1. **Speak Back**: Always reply verbally to the user. Keep responses concise, professional, and friendly (under 2 sentences).
    2. **Navigate**: If the user's intent is to see a section (e.g., "Show me work", "Go to about"), say something like "Navigating to the Work section" AND call the 'navigate' tool immediately.
    3. **Explain & Navigate**: If asked "Tell me about Jonadab", provide a brief 1-sentence summary of his role/expertise, then say "Taking you to his profile" and call the 'navigate' tool with section 'about'.
    4. **Unclear Requests**: If the request is unclear, politely say "I didn't catch that. You can ask me to navigate to Work, Services, or About."
    5. **Personality**: You are helpful, futuristic, and precise.
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

  const startSession = async (isWelcome = false) => {
    // 1. Clean up any existing session properly
    await stopSession();
    
    setShowHints(false);
    setStatus('connecting');

    try {
      // 2. Get Media Stream FIRST (Must be triggered during user interaction)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true
        } 
      });
      streamRef.current = stream;

      // 3. Initialize Audio Contexts
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      inputContextRef.current = new AudioCtx({ sampleRate: 16000 });
      outputContextRef.current = new AudioCtx({ sampleRate: 24000 });
      
      // Resume contexts immediately (crucial for Safari/Chrome)
      if (inputContextRef.current.state === 'suspended') await inputContextRef.current.resume();
      if (outputContextRef.current.state === 'suspended') await outputContextRef.current.resume();

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: ['AUDIO'],
          tools: [{ functionDeclarations: [navigateTool] }],
          systemInstruction: { parts: [{ text: systemContext }] }
        },
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Connected');
            setStatus('listening');
            setIsActive(true);
            isActiveRef.current = true;
            
            // Start processing microphone input
            setupAudioInput(sessionPromise);

            // Auto-welcome message
            if (isWelcome) {
                setTimeout(() => {
                    sessionPromise.then(session => {
                        session.sendRealtimeInput({
                            text: "Greet the visitor warmly to Jonadab's portfolio. Briefly mention that you can navigate the site or answer questions about his work."
                        });
                    });
                }, 500);
            }
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              setStatus('speaking');
              await playAudio(audioData);
            }

            // --- Auto-Deactivation for Welcome Message ---
            if (isWelcome) {
                if (msg.serverContent?.turnComplete) {
                    const ctx = outputContextRef.current;
                    const remainingTime = ctx ? (nextStartTimeRef.current - ctx.currentTime) * 1000 : 0;
                    
                    // Add buffer to ensure audio fully fades/ends before cutting off
                    setTimeout(() => {
                        // Only stop if user hasn't engaged further
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
                  
                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: {
                        id: fc.id,
                        name: fc.name,
                        response: { result: 'Navigated successfully' }
                      }
                    });
                  });
                }
              });
            }
          },
          onclose: () => {
              console.log("Session closed by server");
              stopSession();
          },
          onerror: (e) => {
            console.error("Gemini Live Error", e);
            stopSession();
          }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (err) {
      if (isWelcome) {
          console.debug("Auto-welcome failed (permission denied or no user gesture).", err);
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
    
    // Create new nodes
    sourceRef.current = ctx.createMediaStreamSource(streamRef.current);
    processorRef.current = ctx.createScriptProcessor(4096, 1, 1);
    
    processorRef.current.onaudioprocess = (e) => {
      if (!isActiveRef.current) return;

      const inputData = e.inputBuffer.getChannelData(0);
      
      // Volume calculation
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      setVolume(Math.sqrt(sum / inputData.length));

      // PCM Conversion
      const l = inputData.length;
      const int16 = new Int16Array(l);
      for (let i = 0; i < l; i++) {
        int16[i] = inputData[i] * 32768;
      }
      const bytes = new Uint8Array(int16.buffer);
      
      // Base64 Encode
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const b64 = btoa(binary);

      sessionPromise.then(session => {
        session.sendRealtimeInput({
          media: {
            mimeType: 'audio/pcm;rate=16000', // Standard rate for Gemini
            data: b64
          }
        });
      }).catch(e => console.error("Send input error", e));
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
    // If user manually clicks, mark welcome as done to avoid double-trigger
    hasWelcomedRef.current = true;
    
    if (isActiveRef.current) {
      stopSession();
    } else {
      startSession();
    }
  };

  return (
    <>
      {/* Permission Modal */}
      {permissionError && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-6">
            <div ref={overlayRef} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setPermissionError(false)} />
            <div ref={modalRef} className="relative bg-theme-bg/90 backdrop-blur-2xl border border-theme-border p-8 rounded-2xl max-w-sm w-full shadow-[0_0_50px_rgba(147,51,234,0.2)] flex flex-col items-center text-center overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-600 to-transparent opacity-50" />
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl" />
                
                <div className="relative w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 text-red-500 ring-1 ring-red-500/20 shadow-lg shadow-red-500/10">
                   <MicOff size={24} />
                   <div className="absolute inset-0 border border-red-500/20 rounded-full animate-ping opacity-20" />
                </div>
                
                <h3 className="text-xl font-black uppercase tracking-tighter text-theme-text mb-3">
                   Audio Feed Locked
                </h3>
                
                <p className="text-xs font-medium text-theme-text/60 leading-relaxed mb-8 relative z-10">
                   To initialize the neural voice interface, microphone permission is required. Please check your browser settings and try again.
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
                            startSession();
                        }}
                        className="py-3 px-4 rounded-xl bg-theme-text text-theme-bg text-[10px] uppercase tracking-widest font-black hover:bg-purple-600 hover:text-white transition-colors shadow-lg shadow-purple-500/20"
                    >
                        Retry Access
                    </button>
                </div>
            </div>
        </div>
      )}

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
