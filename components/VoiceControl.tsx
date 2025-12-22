
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { Mic, MicOff, Command } from 'lucide-react';
import gsap from 'gsap';

interface VoiceControlProps {
  onNavigate: (section: string) => void;
}

const VoiceControl: React.FC<VoiceControlProps> = ({ onNavigate }) => {
  const [isActive, setIsActive] = useState(false);
  const [volume, setVolume] = useState(0);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'processing'>('idle');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null); // Store session promise

  // Define the tool for navigation
  const navigateTool: FunctionDeclaration = {
    name: 'navigate',
    description: 'Navigate to a specific section of the website.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        section: {
          type: Type.STRING,
          enum: ['home', 'work', 'services', 'process', 'testimonials', 'about', 'archive'],
          description: 'The section ID to navigate to.',
        },
      },
      required: ['section'],
    },
  };

  const startSession = async () => {
    try {
      setStatus('connecting');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

      // Audio setup
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Connect to Gemini Live
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: ['AUDIO'], // Using string literal as enum might differ in build
          tools: [{ functionDeclarations: [navigateTool] }],
          systemInstruction: {
            parts: [{ text: "You are a voice controller for Jonadab Uroh's portfolio. Listen for navigation commands like 'Show me his work', 'Go to about', 'Contact him'. When identified, call the navigate tool. Keep spoken responses extremely brief (e.g. 'Navigating.', 'Here it is.')." }]
          }
        },
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Connected');
            setStatus('listening');
            setIsActive(true);
            
            // Start audio streaming after connection
            const ctx = audioContextRef.current;
            if(!ctx || !streamRef.current) return;
            
            sourceRef.current = ctx.createMediaStreamSource(streamRef.current);
            processorRef.current = ctx.createScriptProcessor(4096, 1, 1);
            
            processorRef.current.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Calculate volume for visualizer
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              setVolume(Math.sqrt(sum / inputData.length));

              // Create Blob for API
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const bytes = new Uint8Array(int16.buffer);
              
              // Encode to base64 manually
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
          },
          onmessage: (msg) => {
             // Handle tool calls
             if (msg.toolCall) {
                setStatus('processing');
                msg.toolCall.functionCalls.forEach((fc: any) => {
                    if (fc.name === 'navigate') {
                        onNavigate(fc.args.section);
                        
                        // Respond to model
                        sessionPromise.then(session => {
                            session.sendToolResponse({
                                functionResponses: {
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: 'Navigated successfully' }
                                }
                            });
                        });
                        setStatus('listening');
                    }
                });
             }
          },
          onclose: () => {
             stopSession();
          },
          onerror: (e) => {
             console.error(e);
             stopSession();
          }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error("Failed to start voice session", err);
      setStatus('idle');
    }
  };

  const stopSession = () => {
    setIsActive(false);
    setStatus('idle');
    setVolume(0);

    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current.onaudioprocess = null;
    }
    if (sourceRef.current) sourceRef.current.disconnect();
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    
    // There is no explicit .close() on the session object returned by connect() wrapper in this SDK version usually,
    // relying on stream tracks closing.
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
        const radius = 20 + (volume * 100); // Dynamic radius
        ctx.arc(width / 2, height / 2, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(147, 51, 234, ${0.5 + volume})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(width / 2, height / 2, radius * 0.7, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(147, 51, 234, ${0.2 + volume})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isActive, volume]);

  const toggleVoice = () => {
    if (isActive) {
      stopSession();
    } else {
      startSession();
    }
  };

  return (
    <div className="fixed bottom-6 left-6 md:bottom-10 md:left-10 z-50 flex items-center gap-4">
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
            isActive ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.5)]' : 'bg-theme-bg text-theme-text hover:bg-theme-text/5'
          }`}
        >
          {status === 'connecting' || status === 'processing' ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isActive ? (
              <Mic size={20} />
          ) : (
              <MicOff size={20} className="opacity-50" />
          )}
        </button>
      </div>

      <div className={`transition-all duration-500 overflow-hidden ${isActive ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
         <div className="bg-theme-bg/80 backdrop-blur-md border border-theme-border rounded-full px-4 py-2 flex items-center gap-2 whitespace-nowrap">
             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
             <span className="text-[10px] uppercase tracking-widest font-black text-theme-text">
                {status === 'listening' ? 'Listening...' : status === 'processing' ? 'Processing...' : 'Connecting...'}
             </span>
         </div>
      </div>
      
      {!isActive && (
          <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-theme-text text-theme-bg text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              Voice Nav
          </div>
      )}
    </div>
  );
};

export default VoiceControl;
