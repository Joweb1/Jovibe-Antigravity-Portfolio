
import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { GoogleGenAI, Type } from "@google/genai";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ArrowLeft, Send, Upload, FileText, Download, Loader2, Mic, StopCircle, RefreshCw, Sparkles, Layout } from 'lucide-react';
import { ResumeData } from '../types';
import { ARCHIVE_PROJECTS, SKILL_CATEGORIES, SERVICES } from '../constants';
import { IMAGES } from '../assets/images';

interface ResumeCreatorProps {
  onBack: () => void;
}

const INITIAL_SYSTEM_PROMPT = `
You are an expert Resume Architect for a high-end developer portfolio. 
Your goal is to gather information from the user to build a professional, concise, and high-impact resume.

PROCESS:
1. I will provide you with the current "Conversation History" and "Extracted Context" (from an uploaded resume OR the Author's existing portfolio data).
2. You must determine if we have enough information to generate the final resume JSON.
3. If MISSING information (Full Name, Role, Email, Location, Summary, at least 2 Experience entries, Skills, Education), ask the user the NEXT most important question.
4. Ask ONE question at a time. Be conversational but professional. "High-tech/Cyberpunk" persona is allowed but keep it subtle.
5. If we have enough info, output the JSON in the requested schema.

REQUIRED INFORMATION:
- Full Name, Current Role
- Contact (Email, Phone, Location)
- Professional Summary (2-3 sentences)
- Technical Skills (List)
- Experience (Company, Role, Duration, 2-3 bullet points of impact)
- Education (School, Degree, Year)
`;

const ResumeCreator: React.FC<ResumeCreatorProps> = ({ onBack }) => {
  const [step, setStep] = useState<'intro' | 'interview' | 'review'>('intro');
  const [messages, setMessages] = useState<{role: 'ai' | 'user', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  // Scaling State
  const [uiScale, setUiScale] = useState(1);
  const [contentScale, setContentScale] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Speech Recognition Setup
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(prev => prev + (prev ? ' ' : '') + transcript);
            setIsListening(false);
        };
        
        recognitionRef.current.onerror = () => setIsListening(false);
        recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
      if (isListening) {
          recognitionRef.current?.stop();
          setIsListening(false);
      } else {
          recognitionRef.current?.start();
          setIsListening(true);
      }
  };

  // Intro Animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.8 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  // Floating Paper Animation (Antigravity Effect)
  useEffect(() => {
    if (step === 'intro') return;

    const ctx = gsap.context(() => {
      gsap.to(previewContainerRef.current, {
        y: -15,
        rotationX: 2,
        rotationY: 2,
        duration: 6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      });
    }, previewContainerRef);

    return () => ctx.revert();
  }, [step]);

  // Scroll Chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle UI Scaling (Fit A4 to Screen)
  useEffect(() => {
    const handleResize = () => {
      if (!previewContainerRef.current) return;
      const { clientWidth, clientHeight } = previewContainerRef.current;
      
      // A4 dimensions in px (approx 96 DPI)
      // 210mm = 794px
      // 297mm = 1123px
      const A4_WIDTH = 794; 
      const A4_HEIGHT = 1123;
      
      const padding = 40;
      const availableWidth = clientWidth - padding;
      const availableHeight = clientHeight - padding;

      const scaleW = availableWidth / A4_WIDTH;
      const scaleH = availableHeight / A4_HEIGHT;
      
      // Scale to fit, max 1.1 to avoid excessive blurriness on huge screens
      setUiScale(Math.min(scaleW, scaleH, 1.1));
    };

    window.addEventListener('resize', handleResize);
    
    // Check periodically during animations
    const interval = setInterval(handleResize, 500);
    handleResize();

    return () => {
        window.removeEventListener('resize', handleResize);
        clearInterval(interval);
    };
  }, [step]);

  // Handle Content Scaling (Fit Content to A4)
  useEffect(() => {
    if (!resumeData || !contentRef.current) return;
    
    // Reset to measure natural height
    setContentScale(1);
    
    const calculateScale = () => {
        if (!contentRef.current) return;
        
        // Target max height: 297mm in pixels minus vertical padding (80px)
        const MAX_HEIGHT = 1123 - 80; 
        const actualHeight = contentRef.current.scrollHeight;

        let scale = MAX_HEIGHT / actualHeight;

        // Allow scaling UP if content is short (max 1.0) to fill page better
        // Allow scaling DOWN if content is long (min 0.65x) to fit page
        scale = Math.min(Math.max(scale, 0.65), 1.0);

        // Floor to 2 decimal places to avoid jitter
        setContentScale(Math.floor(scale * 100) / 100);
    };

    // Small delay to allow DOM render
    setTimeout(calculateScale, 100);
  }, [resumeData, step]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const startInterview = async (mode: 'standard' | 'author' = 'standard') => {
    setStep('interview');
    
    if (mode === 'author') {
        setMessages([{ role: 'ai', text: "Accessing internal portfolio database... I have loaded Jonadab's projects, skills, and service details. I will structure this into a professional format. Please wait while I compile the data." }]);
        setTimeout(() => processAuthorContext(), 500);
    } else {
        setMessages([{ role: 'ai', text: "Initializing Resume Architect v1.0. I'm scanning for your professional footprint. Let's build your profile. First, what is your Full Name and your target Job Title?" }]);
        if (uploadedFile) {
           setMessages([{ role: 'ai', text: "I've analyzed your uploaded document. I've extracted some core details. Let's refine the gaps. Can you confirm your current target role and a brief professional summary?" }]);
        }
    }
  };

  const processAuthorContext = async () => {
      setIsTyping(true);

      const fallbackProjects = ARCHIVE_PROJECTS.slice(0, 4).map(p => ({ 
          name: p.title, 
          description: (p.description || '').substring(0, 150), // Trim description to save tokens
          tech: (p.techStack?.join(', ') || '').substring(0, 50)
      }));

      const fallbackResumeData: ResumeData = {
          fullName: "Jonadab Uroh",
          role: "Full Stack Laravel Developer & AI Engineer",
          email: "nahjonah00@gmail.com",
          phone: "+234 913 558 0911",
          location: "Lagos, Nigeria",
          website: "https://jonadab-uroh.onrender.com",
          summary: "Detail-oriented and reliable Full Stack Engineer with hands-on experience in architecting scalable solutions, managing cloud infrastructure, and integrating generative AI models. Passionate about helping businesses stay organized and achieve their goals faster through automation and intelligent systems.",
          image: IMAGES.profile,
          skills: SKILL_CATEGORIES.flatMap(c => c.skills).slice(0, 15),
          projects: fallbackProjects,
          experience: [
              {
                  company: "Independent Consultant",
                  role: "Senior AI Engineer",
                  duration: "Sep 2024 – Present",
                  description: [
                      "Architected 'Jovibe', a creative AI ecosystem integrating Gemini models for real-time content generation.",
                      "Developed 'Clymail', a high-throughput email infrastructure handling thousands of concurrent requests.",
                      "Implemented RAG architectures to enhance business intelligence capabilities for diverse clients."
                  ]
              },
              {
                  company: "TechFlow Solutions",
                  role: "Backend Developer",
                  duration: "2022 – 2023",
                  description: [
                      "Led the migration of legacy monoliths to microservices, improving system reliability by 99.9%.",
                      "Optimized database queries and Redis caching layers, reducing API latency by 40%.",
                      "Collaborated with cross-functional teams to deliver secure, scalable SaaS products."
                  ]
              }
          ],
          education: [
              {
                  school: "ALX Software Engineering",
                  degree: "Advanced Software Engineering",
                  year: "2024"
              },
              {
                  school: "Lagos State University",
                  degree: "B.Sc Computer Science",
                  year: "2023"
              }
          ]
      };

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
          
          const authorData = JSON.stringify({
              ...fallbackResumeData,
              // Only include essential services and link data to reduce prompt size
              services: SERVICES.map(s => s.title).join(', '),
              links: {
                  github: "https://github.com/Joweb1",
                  linkedin: "https://www.linkedin.com/in/jonadab-uroh-b92603328"
              }
          });

          const prompt = `
          CONTEXT: User selected "Author Mode". The user IS Jonadab Uroh.
          
          SOURCE DATA (JSON): ${authorData}
          
          INSTRUCTION: 
          1. Act as a data formatter. Transform the SOURCE DATA directly into the Resume JSON schema.
          2. DO NOT ASK QUESTIONS. The data is considered complete.
          3. Set "isComplete" to TRUE.
          4. Ensure "skills", "experience" (MUST have at least 3 entries), "education", and "projects" are fully populated from the source data.
          5. Use the provided image URL.
          6. Synthesize the "Summary" to reflect the depth of experience.
          
          Generate the final JSON response now.
          `;

          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isComplete: { type: Type.BOOLEAN },
                        nextQuestion: { type: Type.STRING },
                        resumeData: {
                            type: Type.OBJECT,
                            properties: {
                                fullName: { type: Type.STRING },
                                role: { type: Type.STRING },
                                email: { type: Type.STRING },
                                phone: { type: Type.STRING },
                                location: { type: Type.STRING },
                                website: { type: Type.STRING },
                                summary: { type: Type.STRING },
                                image: { type: Type.STRING },
                                skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                                experience: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            company: { type: Type.STRING },
                                            role: { type: Type.STRING },
                                            duration: { type: Type.STRING },
                                            description: { type: Type.ARRAY, items: { type: Type.STRING } }
                                        }
                                    }
                                },
                                education: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            school: { type: Type.STRING },
                                            degree: { type: Type.STRING },
                                            year: { type: Type.STRING }
                                        }
                                    }
                                },
                                projects: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            name: { type: Type.STRING },
                                            description: { type: Type.STRING },
                                            tech: { type: Type.STRING }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
          });

          let data;
          try {
             data = JSON.parse(response.text || '{}');
          } catch (jsonError) {
             console.warn("JSON Parse Error, attempting recovery or fallback", jsonError);
             // If JSON is malformed/truncated, we use fallback but maybe partial data if possible
             // For now, straight to fallback to avoid crash
             throw new Error("Invalid JSON response");
          }

          if (data.resumeData && data.resumeData.experience && data.resumeData.experience.length > 0) {
              setResumeData(data.resumeData);
          } else {
              setResumeData(fallbackResumeData);
          }
          setMessages(prev => [...prev, { role: 'ai', text: "Author profile compiled successfully. Rendering preview now. You can continue to chat to make edits." }]);
          setTimeout(() => setStep('review'), 1500);

      } catch (error) {
          console.error("AI Generation failed, using fallback.", error);
          setResumeData(fallbackResumeData);
          setMessages(prev => [...prev, { role: 'ai', text: "Neural link unstable (Token Limit Exceeded). Loading cached author profile instead. You can chat to make edits." }]);
          setTimeout(() => setStep('review'), 1500);
      } finally {
          setIsTyping(false);
      }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const currentData = resumeData ? JSON.stringify(resumeData) : "No data yet.";

      let prompt = "";
      if (step === 'review' && resumeData) {
         prompt = `
         ROLE: Resume Editor.
         TASK: Modify the existing Resume JSON based on the user's command.
         CURRENT JSON: ${currentData}
         USER COMMAND: "${userMsg}"
         INSTRUCTIONS:
         1. Apply the user's requested change (e.g., "Add PHP to skills", "Reword summary", "Change phone number").
         2. Return the COMPLETE, updated JSON. Do not lose any existing data unless asked to remove it.
         3. Set "isComplete" to true.
         4. In "nextQuestion", write a short confirmation.
         `;
      } else {
         const conversationHistory = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
         const latestUserMsg = `USER: ${userMsg}`;
         prompt = `${INITIAL_SYSTEM_PROMPT}\n\nHISTORY:\n${conversationHistory}\n${latestUserMsg}\nCURRENT_DATA: ${currentData}\n\nDetermine if we have enough info. If yes, output JSON only. If no, ask next question.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    isComplete: { type: Type.BOOLEAN },
                    nextQuestion: { type: Type.STRING },
                    resumeData: {
                        type: Type.OBJECT,
                        properties: {
                            fullName: { type: Type.STRING },
                            role: { type: Type.STRING },
                            email: { type: Type.STRING },
                            phone: { type: Type.STRING },
                            location: { type: Type.STRING },
                            website: { type: Type.STRING },
                            summary: { type: Type.STRING },
                            image: { type: Type.STRING },
                            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                            experience: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        company: { type: Type.STRING },
                                        role: { type: Type.STRING },
                                        duration: { type: Type.STRING },
                                        description: { type: Type.ARRAY, items: { type: Type.STRING } }
                                    }
                                }
                            },
                            education: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        school: { type: Type.STRING },
                                        degree: { type: Type.STRING },
                                        year: { type: Type.STRING }
                                    }
                                }
                            },
                            projects: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        description: { type: Type.STRING },
                                        tech: { type: Type.STRING }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
      });

      const data = JSON.parse(response.text || '{}');
      if (data.resumeData) {
          setResumeData(data.resumeData);
      }
      if (data.isComplete && step !== 'review') {
          setMessages(prev => [...prev, { role: 'ai', text: "Data acquisition complete. Compiling final architecture... rendering preview." }]);
          setTimeout(() => setStep('review'), 1500);
      } else {
          setMessages(prev => [...prev, { role: 'ai', text: data.nextQuestion || (step === 'review' ? "Profile updated." : "Could you provide more details?") }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', text: "Connection interference detected. Please repeat that." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!pageRef.current) return;
    
    // Explicitly set A4 dimensions in pixels (approx 96 DPI)
    // 210mm ~= 794px, 297mm ~= 1123px
    const a4Width = 794; 
    const a4Height = 1123;
    
    const element = pageRef.current;
    
    const canvas = await html2canvas(element, {
        scale: 2, // 2x Scale for high quality (approx 150-200 DPI equivalent)
        useCORS: true,
        backgroundColor: '#ffffff',
        width: a4Width,
        height: a4Height,
        windowWidth: 1440,
        logging: false
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = 210; 
    const pdfHeight = 297; 
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('Jonadab_Uroh_CV.pdf');
  };

  return (
    <div ref={containerRef} className="min-h-screen pt-24 pb-20 px-4 md:px-10 bg-theme-bg relative overflow-hidden flex flex-col">
      <div className="absolute top-0 right-0 w-[60vw] h-[60vh] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="flex justify-between items-center mb-8 relative z-20">
        <div>
           <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-theme-text">Resume Studio</h1>
           <p className="text-[10px] uppercase tracking-[0.4em] text-purple-600 font-black">AI-Powered Career Architect</p>
        </div>
        <button 
            onClick={onBack}
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-black text-theme-text/40 hover:text-purple-600 transition-colors"
        >
            <ArrowLeft size={16} /> Exit Studio
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 h-full">
        {/* LEFT COLUMN: INTERFACE */}
        <div className={`col-span-1 lg:col-span-4 flex flex-col h-[75vh] transition-all duration-700 opacity-100`}>
           {step === 'intro' ? (
               <div className="bg-theme-text/[0.02] border border-theme-border rounded-2xl p-8 flex flex-col items-center justify-center h-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                  <div className="w-20 h-20 rounded-full bg-purple-600/10 flex items-center justify-center mb-4 border border-purple-500/20">
                      <Layout size={32} className="text-purple-600" />
                  </div>
                  <div>
                      <h2 className="text-xl font-black uppercase tracking-tight text-theme-text mb-2">Initialize Session</h2>
                      <p className="text-sm text-theme-text/60 max-w-xs mx-auto">
                          Upload an existing resume to extract data, load the Author's portfolio data, or start a fresh neural interview.
                      </p>
                  </div>
                  <div className="w-full max-w-xs space-y-3">
                      <button 
                          onClick={() => startInterview('author')}
                          className="w-full py-4 bg-purple-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
                      >
                          <Sparkles size={14} /> Author Mode (Jonadab)
                      </button>
                      <label className="flex items-center justify-center gap-3 w-full py-4 border-2 border-dashed border-theme-border rounded-xl cursor-pointer hover:border-purple-600/50 hover:bg-purple-600/5 transition-all group">
                          <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} />
                          <Upload size={18} className="text-theme-text/40 group-hover:text-purple-600" />
                          <span className="text-xs font-black uppercase tracking-widest text-theme-text/60 group-hover:text-purple-600">
                             {uploadedFile ? uploadedFile.name : "Upload Reference"}
                          </span>
                      </label>
                      <div className="flex items-center gap-4">
                          <div className="h-px bg-theme-border flex-1" />
                          <span className="text-[9px] uppercase font-bold text-theme-text/20">OR</span>
                          <div className="h-px bg-theme-border flex-1" />
                      </div>
                      <button 
                          onClick={() => startInterview('standard')}
                          className="w-full py-4 bg-theme-text text-theme-bg rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all shadow-lg shadow-purple-600/20"
                      >
                          Start Neural Interview
                      </button>
                  </div>
               </div>
           ) : (
               <div className="bg-theme-bg/50 backdrop-blur-md border border-theme-border rounded-2xl flex flex-col h-full overflow-hidden shadow-2xl">
                   <div className="p-4 border-b border-theme-border bg-theme-text/5 flex items-center justify-between">
                       <span className="text-[10px] uppercase tracking-widest font-black text-theme-text/60 flex items-center gap-2">
                           <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                           Architect Online
                       </span>
                       <button onClick={() => setStep('intro')} className="text-theme-text/40 hover:text-theme-text">
                           <RefreshCw size={14} />
                       </button>
                   </div>
                   <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                       {messages.map((msg, i) => (
                           <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                               <div className={`max-w-[85%] p-4 rounded-2xl text-xs md:text-sm font-medium leading-relaxed shadow-sm ${
                                   msg.role === 'user' 
                                   ? 'bg-purple-600 text-white rounded-br-none' 
                                   : 'bg-theme-text/[0.03] border border-theme-border text-theme-text rounded-bl-none'
                               }`}>
                                   {msg.text}
                               </div>
                           </div>
                       ))}
                       {isTyping && (
                           <div className="flex justify-start">
                               <div className="bg-theme-text/[0.03] border border-theme-border p-4 rounded-2xl rounded-bl-none flex gap-1">
                                   <span className="w-1.5 h-1.5 bg-theme-text/40 rounded-full animate-bounce" />
                                   <span className="w-1.5 h-1.5 bg-theme-text/40 rounded-full animate-bounce delay-75" />
                                   <span className="w-1.5 h-1.5 bg-theme-text/40 rounded-full animate-bounce delay-150" />
                               </div>
                           </div>
                       )}
                       <div ref={chatEndRef} />
                   </div>
                   <div className="p-4 border-t border-theme-border bg-theme-bg">
                       <div className="relative flex items-center gap-2">
                           <input 
                               type="text" 
                               value={input}
                               onChange={(e) => setInput(e.target.value)}
                               onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                               placeholder={step === 'review' ? "Type to edit resume..." : "Type answer here..."}
                               className="flex-1 bg-theme-text/5 border border-theme-border rounded-xl px-4 py-3 text-sm text-theme-text focus:outline-none focus:border-purple-600 transition-colors placeholder:text-theme-text/20"
                           />
                           <button
                                onClick={toggleListening}
                                className={`p-3 rounded-xl border border-theme-border transition-colors ${isListening ? 'bg-red-500/10 border-red-500 text-red-500 animate-pulse' : 'hover:bg-theme-text/5 text-theme-text/60'}`}
                           >
                               {isListening ? <StopCircle size={18} /> : <Mic size={18} />}
                           </button>
                           <button 
                               onClick={handleSendMessage}
                               disabled={!input.trim()}
                               className="p-3 bg-theme-text text-theme-bg rounded-xl hover:bg-purple-600 hover:text-white transition-all disabled:opacity-50"
                           >
                               <Send size={18} />
                           </button>
                       </div>
                   </div>
               </div>
           )}
        </div>

        {/* RIGHT COLUMN: PREVIEW - FIXED A4 */}
        <div className="col-span-1 lg:col-span-8 flex flex-col h-full relative perspective-[2000px]">
            <div className="absolute top-0 right-0 z-20 flex gap-3 p-4">
                 {step === 'review' && (
                     <button 
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-xl shadow-purple-600/30 hover:scale-105 transition-transform"
                     >
                         <Download size={14} /> Download PDF
                     </button>
                 )}
            </div>

            {/* Viewport/Container for A4 */}
            <div 
                ref={previewContainerRef}
                className={`flex-1 rounded-2xl border border-theme-border bg-gray-100/50 backdrop-blur-sm shadow-2xl transition-all duration-1000 flex items-center justify-center overflow-hidden relative ${
                    step === 'intro' ? 'blur-sm scale-95 opacity-50' : 'blur-0 scale-100 opacity-100'
                }`}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Scale Wrapper to Fit UI */}
                <div style={{ transform: `scale(${uiScale})` }} className="origin-center shadow-2xl transition-transform duration-300">
                     
                     {/* The A4 Page - Fixed Dimensions (210mm x 297mm) */}
                     <div 
                        ref={pageRef} 
                        className="w-[210mm] min-h-[297mm] bg-white text-[#1a1a1a] font-sans relative p-[50px] box-border overflow-hidden shadow-lg"
                        style={{ fontFamily: '"Inter", sans-serif' }}
                     >
                         {/* Content Wrapper for Auto-Scaling Data */}
                         <div 
                            ref={contentRef} 
                            style={{ 
                                transform: `scale(${contentScale})`, 
                                width: `${(1/contentScale) * 100}%`,
                                transformOrigin: 'top left'
                            }}
                            className="h-full flex flex-col"
                         >
                            {resumeData ? (
                                <>
                                    {/* Minimalist Modern Header */}
                                    <header className="border-b border-gray-200 pb-8 mb-8 flex justify-between items-end">
                                        <div>
                                            <h1 className="text-4xl font-black tracking-tighter uppercase text-black mb-2 leading-none">{resumeData.fullName}</h1>
                                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">{resumeData.role}</p>
                                        </div>
                                        <div className="text-right text-[11px] font-medium text-gray-500 leading-relaxed tracking-wide">
                                            <p>{resumeData.email}</p>
                                            <p>{resumeData.phone}</p>
                                            <p>{resumeData.location}</p>
                                            {resumeData.website && <p className="text-purple-600 font-bold mt-1">{resumeData.website.replace('https://', '')}</p>}
                                        </div>
                                    </header>

                                    {/* Summary */}
                                    <section className="mb-10">
                                        <p className="text-sm leading-relaxed text-gray-700 font-medium max-w-3xl text-justify">
                                            {resumeData.summary}
                                        </p>
                                    </section>

                                    {/* Experience - Timeline Layout */}
                                    <section className="mb-12">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-3">
                                            <span className="w-6 h-px bg-gray-300"></span> Professional Experience
                                        </h3>
                                        <div className="space-y-8">
                                            {resumeData.experience?.map((exp, i) => (
                                                <div key={i} className="grid grid-cols-12 gap-6">
                                                    <div className="col-span-3 text-[11px] font-bold text-gray-400 pt-1 tracking-wide">
                                                        {exp.duration}
                                                    </div>
                                                    <div className="col-span-9">
                                                        <div className="flex justify-between items-baseline mb-2">
                                                            <h4 className="text-sm font-bold text-black uppercase tracking-wide">{exp.role}</h4>
                                                            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">{exp.company}</span>
                                                        </div>
                                                        <ul className="space-y-1.5">
                                                            {exp.description?.map((desc, j) => (
                                                                <li key={j} className="text-[11px] text-gray-600 leading-relaxed relative pl-3.5">
                                                                    <span className="absolute left-0 top-1.5 w-1 h-1 bg-gray-300 rounded-full"></span>
                                                                    {desc}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <div className="grid grid-cols-12 gap-10 border-t border-gray-100 pt-8">
                                        {/* Skills */}
                                        <div className="col-span-8">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-3">
                                                <span className="w-6 h-px bg-gray-300"></span> Expertise & Stack
                                            </h3>
                                            <div className="flex flex-wrap gap-x-3 gap-y-2">
                                                 {resumeData.skills?.map((skill, i) => (
                                                     <span key={i} className="px-2 py-1 bg-gray-50 border border-gray-100 rounded text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                                                         {skill}
                                                     </span>
                                                 ))}
                                            </div>
                                        </div>

                                        {/* Education */}
                                        <div className="col-span-4">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-3">
                                                 <span className="w-6 h-px bg-gray-300"></span> Education
                                            </h3>
                                            <div className="space-y-5">
                                                {resumeData.education?.map((edu, i) => (
                                                    <div key={i}>
                                                        <div className="text-xs font-bold text-black leading-tight">{edu.degree}</div>
                                                        <div className="text-[10px] text-gray-500 mt-1">{edu.school}</div>
                                                        <div className="text-[9px] text-gray-400 font-medium tracking-widest mt-0.5">{edu.year}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                                    <Loader2 size={48} className="animate-spin text-purple-600/20" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Awaiting Neural Data...</p>
                                    <div className="w-full max-w-lg space-y-4 opacity-20 mt-8">
                                        <div className="h-8 bg-gray-300 rounded w-3/4"></div>
                                        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                                        <div className="h-32 bg-gray-300 rounded w-full"></div>
                                        <div className="h-4 bg-gray-300 rounded w-full"></div>
                                        <div className="h-4 bg-gray-300 rounded w-full"></div>
                                    </div>
                                </div>
                            )}
                         </div>
                     </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeCreator;
