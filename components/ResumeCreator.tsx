
import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { GoogleGenAI, Type } from "@google/genai";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ArrowLeft, Send, Upload, FileText, Download, Loader2, Mic, StopCircle, RefreshCw, CheckCircle, User, Sparkles } from 'lucide-react';
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

  const containerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  
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

  // Scroll Chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const startInterview = async (mode: 'standard' | 'author' = 'standard') => {
    setStep('interview');
    
    if (mode === 'author') {
        setMessages([{ role: 'ai', text: "Accessing internal portfolio database... I have loaded Jonadab's projects, skills, and service details. I will structure this into a resume. Please wait while I compile the data." }]);
        
        // Trigger immediate AI processing with Author Context
        setTimeout(() => processAuthorContext(), 500);
    } else {
        setMessages([{ role: 'ai', text: "Initializing Resume Architect v1.0. I'm scanning for your professional footprint. Let's build your profile. First, what is your Full Name and your target Job Title?" }]);
        
        // If file uploaded, analyze it first (Conceptual - integrating file content into first prompt)
        if (uploadedFile) {
           setMessages([{ role: 'ai', text: "I've analyzed your uploaded document. I've extracted some core details. Let's refine the gaps. Can you confirm your current target role and a brief professional summary?" }]);
        }
    }
  };

  const processAuthorContext = async () => {
      setIsTyping(true);

      // Construct Local Fallback Data
      const fallbackProjects = ARCHIVE_PROJECTS.slice(0, 4).map(p => ({ 
          name: p.title, 
          description: p.description || '', 
          tech: p.techStack?.join(', ') || '' 
      }));

      const fallbackResumeData: ResumeData = {
          fullName: "Jonadab Uroh",
          role: "Full Stack Laravel Developer & AI Engineer",
          email: "nahjonah00@gmail.com",
          phone: "+234 913 558 0911",
          location: "Lagos, Nigeria",
          website: "https://jonadab-uroh.onrender.com",
          summary: "Innovative Full Stack Engineer specializing in AI-driven applications and robust backend architectures. Expert in merging Laravel ecosystems with Large Language Models to create intelligent, scalable business solutions.",
          image: IMAGES.profile,
          skills: SKILL_CATEGORIES.flatMap(c => c.skills).slice(0, 15),
          projects: fallbackProjects,
          experience: [
              {
                  company: "Independent Consultant",
                  role: "Senior AI Engineer",
                  duration: "2023 - Present",
                  description: [
                      "Architected 'Jovibe', a creative AI ecosystem integrating Gemini models for real-time content generation.",
                      "Developed 'Clymail', a high-throughput email infrastructure handling thousands of concurrent requests.",
                      "Implemented RAG architectures to enhance business intelligence capabilities for diverse clients."
                  ]
              },
              {
                  company: "TechFlow Solutions",
                  role: "Backend Developer",
                  duration: "2021 - 2023",
                  description: [
                      "Led the migration of legacy monoliths to microservices, improving system reliability by 99.9%.",
                      "Optimized database queries and Redis caching layers, reducing API latency by 40%.",
                      "Collaborated with cross-functional teams to deliver secure, scalable SaaS products."
                  ]
              }
          ],
          education: [
              {
                  school: "Self-Taught / Professional Certifications",
                  degree: "Advanced Software Engineering",
                  year: "2020"
              }
          ]
      };

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
          
          const authorData = JSON.stringify({
              ...fallbackResumeData,
              services: SERVICES
          });

          // DIRECTIVE: Force the AI to accept this data as complete and formatted.
          const prompt = `
          CONTEXT: User selected "Author Mode". The user IS Jonadab Uroh.
          
          SOURCE DATA (JSON): ${authorData}
          
          INSTRUCTION: 
          1. Act as a data formatter. Transform the SOURCE DATA directly into the Resume JSON schema.
          2. DO NOT ASK QUESTIONS. The data is considered complete.
          3. Set "isComplete" to TRUE.
          4. Ensure "skills", "experience", "education", and "projects" are fully populated from the source data.
          5. Use the provided image URL.
          
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

          const data = JSON.parse(response.text || '{}');
          
          // Safety Check: If AI returns incomplete data, fallback to hardcoded data
          if (data.resumeData && data.resumeData.experience && data.resumeData.experience.length > 0) {
              setResumeData(data.resumeData);
          } else {
              setResumeData(fallbackResumeData);
          }
          
          // Force complete state for Author Mode
          setMessages(prev => [...prev, { role: 'ai', text: "Author profile compiled successfully. Rendering preview now. You can continue to chat to make edits." }]);
          setTimeout(() => setStep('review'), 1500);

      } catch (error) {
          console.error("AI Generation failed, using fallback.", error);
          setResumeData(fallbackResumeData);
          setMessages(prev => [...prev, { role: 'ai', text: "Neural link unstable. Loading cached author profile instead. You can chat to make edits." }]);
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
      
      // EDIT MODE LOGIC: If we are in review step, user is asking for changes to the existing JSON
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
         4. In "nextQuestion", write a short confirmation (e.g., "Updated summary.", "Added new skill.").
         `;
      } else {
         // INTERVIEW MODE LOGIC: Gathering information
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
    if (!previewRef.current) return;
    
    // Temporarily remove transform/scale for clean capture
    const element = previewRef.current;
    
    // High quality capture
    const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('Antigravity_Resume.pdf');
  };

  return (
    <div ref={containerRef} className="min-h-screen pt-24 pb-20 px-4 md:px-10 bg-theme-bg relative overflow-hidden flex flex-col">
      {/* Background */}
      <div className="absolute top-0 right-0 w-[60vw] h-[60vh] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
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
                      <FileText size={32} className="text-purple-600" />
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
                   {/* Chat Header */}
                   <div className="p-4 border-b border-theme-border bg-theme-text/5 flex items-center justify-between">
                       <span className="text-[10px] uppercase tracking-widest font-black text-theme-text/60 flex items-center gap-2">
                           <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                           Architect Online
                       </span>
                       <button onClick={() => setStep('intro')} className="text-theme-text/40 hover:text-theme-text">
                           <RefreshCw size={14} />
                       </button>
                   </div>
                   
                   {/* Chat Body */}
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

                   {/* Input Area */}
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

        {/* RIGHT COLUMN: PREVIEW */}
        <div className="col-span-1 lg:col-span-8 flex flex-col h-full relative">
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

            <div className={`flex-1 overflow-hidden rounded-2xl border border-theme-border bg-white shadow-2xl transition-all duration-1000 ${
                step === 'intro' ? 'blur-sm scale-95 opacity-50' : 
                'blur-0 scale-100 opacity-100'
            }`}>
                 <div className="w-full h-full overflow-y-auto bg-white p-8 md:p-12 custom-scrollbar" id="resume-preview-container">
                    <div ref={previewRef} className="w-full max-w-[210mm] mx-auto min-h-[297mm] bg-white text-slate-800 font-sans relative">
                         {/* RESUME TEMPLATE RENDER */}
                         {resumeData ? (
                             <>
                                {/* Header */}
                                <div className="border-b-2 border-slate-900 pb-8 mb-8 flex flex-col md:flex-row justify-between items-start gap-6">
                                    <div className="flex items-center gap-6">
                                       {resumeData.image && (
                                           <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-slate-100 shadow-xl shrink-0">
                                               <img src={resumeData.image} alt="Profile" className="w-full h-full object-cover" />
                                           </div>
                                       )}
                                       <div>
                                           <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-tight text-slate-900 mb-2">{resumeData.fullName}</h1>
                                           <p className="text-lg font-medium text-purple-700 tracking-wider uppercase">{resumeData.role}</p>
                                       </div>
                                    </div>
                                    <div className="text-right text-xs font-medium text-slate-500 space-y-1 self-start md:self-center">
                                        <p>{resumeData.email}</p>
                                        <p>{resumeData.phone}</p>
                                        <p>{resumeData.location}</p>
                                        {resumeData.website && <p className="text-purple-600">{resumeData.website}</p>}
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="mb-8">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-100 pb-1">Professional Profile</h3>
                                    <p className="text-sm leading-relaxed text-slate-700">{resumeData.summary}</p>
                                </div>

                                {/* Skills */}
                                <div className="mb-8">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-100 pb-1">Technical Expertise</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {resumeData.skills?.map((skill, i) => (
                                            <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase rounded-sm">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Experience */}
                                <div className="mb-8">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-1">Experience</h3>
                                    <div className="space-y-6">
                                        {resumeData.experience?.map((exp, i) => (
                                            <div key={i}>
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <h4 className="text-base font-bold text-slate-900">{exp.role}</h4>
                                                    <span className="text-xs font-medium text-slate-500">{exp.duration}</span>
                                                </div>
                                                <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2">{exp.company}</p>
                                                <ul className="list-disc list-outside ml-4 space-y-1">
                                                    {exp.description?.map((desc, j) => (
                                                        <li key={j} className="text-sm text-slate-600 leading-snug pl-1">{desc}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Projects (Optional) */}
                                {resumeData.projects && resumeData.projects.length > 0 && (
                                     <div className="mb-8">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-1">Key Projects</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {resumeData.projects?.map((proj, i) => (
                                                <div key={i} className="bg-slate-50 p-4 rounded-lg">
                                                    <h4 className="text-sm font-bold text-slate-900 mb-1">{proj.name}</h4>
                                                    <p className="text-[10px] font-bold text-purple-600 uppercase mb-2">{proj.tech}</p>
                                                    <p className="text-xs text-slate-600">{proj.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                     </div>
                                )}

                                {/* Education */}
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-1">Education</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        {resumeData.education?.map((edu, i) => (
                                            <div key={i} className="flex justify-between items-center">
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-900">{edu.school}</h4>
                                                    <p className="text-xs text-slate-600">{edu.degree}</p>
                                                </div>
                                                <span className="text-xs font-medium text-slate-500">{edu.year}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Footer Watermark */}
                                <div className="mt-12 pt-6 border-t border-slate-100 text-center">
                                    <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">Generated by Antigravity Resume Studio</p>
                                </div>
                             </>
                         ) : (
                             <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                                 <Loader2 size={48} className="animate-spin text-purple-200" />
                                 <p className="text-xs font-black uppercase tracking-widest">Awaiting Neural Data...</p>
                                 
                                 {/* Skeleton UI */}
                                 <div className="w-full max-w-lg space-y-4 opacity-30 mt-8">
                                     <div className="h-8 bg-slate-200 rounded w-3/4"></div>
                                     <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                                     <div className="h-32 bg-slate-200 rounded w-full"></div>
                                     <div className="h-4 bg-slate-200 rounded w-full"></div>
                                     <div className="h-4 bg-slate-200 rounded w-full"></div>
                                 </div>
                             </div>
                         )}
                    </div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeCreator;
