
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import gsap from 'gsap';
import { Sparkles, X, Send, Bot } from 'lucide-react';
import { ARCHIVE_PROJECTS, SKILL_CATEGORIES } from '../constants';

const SYSTEM_INSTRUCTION = `You are the AI Assistant for Jonadab Uroh's professional portfolio.
Your purpose is to answer questions about Jonadab's work, skills, and experience based strictly on the provided context.

CONTEXT - CONTACT & SOCIALS:
- Email: nahjonah00@gmail.com
- WhatsApp: https://wa.me/+2349135580911
- GitHub: https://github.com/Joweb1
- LinkedIn: https://www.linkedin.com/in/jonadab-uroh-b92603328
- X (Twitter): https://x.com/JovibeCode

CONTEXT - PROJECTS:
${JSON.stringify(ARCHIVE_PROJECTS.map(p => ({
  title: p.title,
  category: p.category,
  description: p.description,
  techStack: p.techStack,
  year: p.year,
  role: p.role,
  status: p.status,
  features: p.features
})))}

CONTEXT - EXPERTISE:
${JSON.stringify(SKILL_CATEGORIES)}

GUIDELINES:
1. Be concise, professional, and engaging.
2. Use a tone that matches the "Antigravity/High-Tech" aesthetic of the site (intelligent, precise, future-forward).
3. If asked about contact, provide the specific links or email from the context above (nahjonah00@gmail.com).
4. Do not hallucinate projects not listed here.
5. Format responses in plain text.
`;

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Systems online. I am Jonadab's digital assistant. How may I clarify his expertise for you?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Initialize Chat Session
  useEffect(() => {
    if (isOpen && !chatSession) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        const chat = ai.chats.create({
          model: 'gemini-3-flash-preview',
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
          }
        });
        setChatSession(chat);
      } catch (error) {
        console.error("Failed to initialize AI", error);
        setMessages(prev => [...prev, { role: 'model', text: "Error initializing neural link. Please check configuration." }]);
      }
    }
  }, [isOpen, chatSession]);

  // Animation for Toggle and Window
  useEffect(() => {
    if (isOpen) {
       gsap.to(windowRef.current, {
         autoAlpha: 1,
         y: 0,
         scale: 1,
         duration: 0.5,
         ease: 'back.out(1.2)'
       });
       gsap.to(toggleRef.current, { scale: 0, duration: 0.3 });
    } else {
       gsap.to(windowRef.current, {
         autoAlpha: 0,
         y: 20,
         scale: 0.9,
         duration: 0.3,
         ease: 'power3.in'
       });
       gsap.to(toggleRef.current, { scale: 1, duration: 0.4, delay: 0.2, ease: 'back.out(1.7)' });
    }
  }, [isOpen]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || !chatSession) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const result = await chatSession.sendMessage({ message: userMsg });
      const responseText = result.text;
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Connection interrupted. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        ref={toggleRef}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 w-14 h-14 bg-theme-bg border border-theme-border rounded-full shadow-[0_0_30px_rgba(147,51,234,0.3)] flex items-center justify-center group hover:scale-110 transition-transform duration-300"
      >
         <div className="absolute inset-0 bg-purple-600/10 rounded-full animate-ping opacity-75" />
         <Sparkles className="w-6 h-6 text-purple-600 relative z-10" />
      </button>

      {/* Chat Window */}
      <div
        ref={windowRef}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[60] w-[90vw] md:w-[400px] h-[60vh] md:h-[500px] flex flex-col bg-white/70 dark:bg-black/70 backdrop-blur-2xl border border-theme-border rounded-2xl shadow-2xl opacity-0 invisible overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-theme-border bg-theme-text/[0.02]">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-purple-600/10 flex items-center justify-center border border-purple-500/20">
                <Bot size={16} className="text-purple-600" />
             </div>
             <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-theme-text">J-AI System</h3>
                <div className="flex items-center gap-1.5">
                   <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                   <span className="text-[9px] uppercase tracking-wider text-theme-text/50 font-bold">Online</span>
                </div>
             </div>
           </div>
           <button 
             onClick={() => setIsOpen(false)}
             className="p-2 hover:bg-theme-text/5 rounded-full transition-colors text-theme-text/50 hover:text-theme-text"
           >
             <X size={16} />
           </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
           {messages.map((msg, i) => (
             <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs md:text-sm font-medium leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-purple-600 text-white rounded-br-none' 
                      : 'bg-theme-text/5 text-theme-text border border-theme-border rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
             </div>
           ))}
           {isTyping && (
             <div className="flex justify-start">
               <div className="bg-theme-text/5 border border-theme-border p-3.5 rounded-2xl rounded-bl-none flex items-center gap-1">
                 <span className="w-1.5 h-1.5 bg-theme-text/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                 <span className="w-1.5 h-1.5 bg-theme-text/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                 <span className="w-1.5 h-1.5 bg-theme-text/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
               </div>
             </div>
           )}
           <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-theme-border bg-theme-bg/50">
           <div className="relative flex items-center">
             <input 
               type="text" 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={handleKeyPress}
               placeholder="Ask about projects..." 
               className="w-full bg-theme-text/5 border border-theme-border rounded-full py-3 pl-4 pr-12 text-xs md:text-sm font-medium text-theme-text focus:outline-none focus:border-purple-600/50 focus:ring-1 focus:ring-purple-600/20 transition-all placeholder:text-theme-text/20 uppercase placeholder:tracking-widest placeholder:text-[10px]"
             />
             <button 
               onClick={handleSend}
               disabled={!input.trim() || isTyping}
               className="absolute right-2 p-2 bg-theme-text text-theme-bg rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all"
             >
               <Send size={14} />
             </button>
           </div>
           <div className="mt-2 text-center">
             <span className="text-[8px] uppercase tracking-[0.2em] text-theme-text/20 font-black">Powered by Gemini 3 Flash</span>
           </div>
        </div>
      </div>
    </>
  );
};

export default AIAssistant;
