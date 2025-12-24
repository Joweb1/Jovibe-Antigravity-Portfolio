
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type, LiveServerMessage } from "@google/genai";
import { Mic, MicOff, MessageSquare, X } from 'lucide-react';
import gsap from 'gsap';
import { ARCHIVE_PROJECTS, SKILL_CATEGORIES, SERVICES } from '../constants';

interface VoiceControlProps {
  onNavigate: (section: string) => void;
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

const VoiceControl: React.FC<VoiceControlProps> = ({ onNavigate }) => {
  const [isActive, setIsActive] = useState(false);
  const [volume, setVolume] = useState(0);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'processing'>('idle');
  const [showHints, setShowHints] = useState(true);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
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

  const startSession = async () => {
    setShowHints(false); // Hide hints when interaction starts
    try {
      setStatus('connecting');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

      // Initialize Audio Contexts
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
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
            setupAudioInput(sessionPromise);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle Audio Output (Speaking back)
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              setStatus('speaking');
              await playAudio(audioData);
              // Reset to listening after a rough estimate if needed, or rely on end of playback
              // Ideally, we wait for playback to finish, but for UI feedback:
              setTimeout(() => setStatus('listening'), 2000); 
            }

            // Handle Tool Calls (Navigation)
            if (msg.toolCall) {
              setStatus('processing');
              msg.toolCall.functionCalls.forEach((fc: any) => {
                if (fc.name === 'navigate') {
                  console.log("Navigating to:", fc.args.section);
                  onNavigate(fc.args.section);
                  
                  // Respond to model to complete the turn
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
          onclose: () => stopSession(),
          onerror: (e) => {
            console.error("Gemini Live Error", e);
            stopSession();
          }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error("Failed to start voice session", err);
      setStatus('idle');
      setIsActive(false);
    }
  };

  const setupAudioInput = (sessionPromise: Promise<any>) => {
    const ctx = inputContextRef.current;
    if(!ctx || !streamRef.current) return;
    
    sourceRef.current = ctx.createMediaStreamSource(streamRef.current);
    processorRef.current = ctx.createScriptProcessor(4096, 1, 1);
    
    processorRef.current.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Volume calculation for visualizer
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
            mimeType: 'audio/pcm;rate=16000',
            data: b64
          }
        });
      });
    };

    sourceRef.current.connect(processorRef.current);
    processorRef.current.connect(ctx.destination);
  };

  const playAudio = async (base64String: string) => {
    const ctx = outputContextRef.current;
    if (!ctx) return;

    try {
      // Base64 Decode
      const binaryString = atob(base64String);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert PCM to Float32
      const dataInt16 = new Int16Array(bytes.buffer);
      const float32Data = new Float32Array(dataInt16.length);
      for (let i = 0; i < dataInt16.length; i++) {
        float32Data[i] = dataInt16[i] / 32768.0;
      }

      // Create Buffer
      const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      // Schedule Playback
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

  const stopSession = () => {
    setIsActive(false);
    setStatus('idle');
    setVolume(0);
    setShowHints(true); // Bring back hints when session ends

    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current.onaudioprocess = null;
    }
    if (sourceRef.current) sourceRef.current.disconnect();
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    
    // Close audio contexts to free resources
    if (inputContextRef.current) inputContextRef.current.close();
    if (outputContextRef.current) outputContextRef.current.close();
    
    nextStartTimeRef.current = 0;
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

      if (isActive) {
        ctx.beginPath();
        const radius = 20 + (volume * 100); 
        ctx.arc(width / 2, height / 2, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = status === 'speaking' 
          ? `rgba(52, 211, 153, ${0.5 + volume})` // Green when speaking back
          : `rgba(147, 51, 234, ${0.5 + volume})`; // Purple when listening
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
    if (isActive) {
      stopSession();
    } else {
      startSession();
    }
  };

  return (
    <div className="fixed bottom-6 left-6 md:bottom-10 md:left-10 z-50 flex flex-col items-start gap-4">
      
      {/* Dynamic Hints Tooltip */}
      {showHints && !isActive && (
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
             {/* Arrow */}
             <div className="absolute -bottom-2 left-6 w-4 h-4 bg-theme-bg border-b border-r border-theme-border rotate-45" />
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="relative">
          {/* Visualizer Canvas */}
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
  );
};

export default VoiceControl;
