
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Mic, AudioLines } from 'lucide-react';

interface AudioPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AudioPermissionModal: React.FC<AudioPermissionModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // GSAP entrance animation
      gsap.to(overlayRef.current, { opacity: 1, duration: 0.6 });
      gsap.fromTo(modalRef.current, 
        { scale: 0.9, opacity: 0, y: 30 }, 
        { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', delay: 0.1 }
      );
    } else {
      document.body.style.overflow = '';
      // GSAP exit animation
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.4 });
      gsap.to(modalRef.current, { scale: 0.95, opacity: 0, y: 20, duration: 0.4, ease: 'power2.in' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-6">
       {/* Backdrop */}
       <div ref={overlayRef} className="absolute inset-0 bg-black/60 backdrop-blur-md opacity-0" />
       
       {/* Modal Card */}
       <div 
         ref={modalRef} 
         className="relative bg-theme-bg/80 backdrop-blur-2xl border border-theme-border p-10 rounded-2xl max-w-sm w-full shadow-[0_0_80px_rgba(147,51,234,0.3)] flex flex-col items-center text-center opacity-0 overflow-hidden"
       >
          {/* Decor */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-600 to-transparent opacity-50" />
          
          <div className="w-20 h-20 rounded-full bg-purple-600/10 flex items-center justify-center mb-6 relative group">
              <div className="absolute inset-0 border border-purple-600/30 rounded-full animate-ping opacity-30" />
              <AudioLines size={32} className="text-purple-600" />
          </div>
          
          <h3 className="text-2xl font-black uppercase tracking-tighter text-theme-text mb-3">
             Initialize Audio
          </h3>
          <p className="text-xs font-medium text-theme-text/60 leading-relaxed mb-8">
             Microphone permission is required to enable the neural voice interface. Click below to connect.
          </p>

          <button 
             onClick={onClose} 
             className="w-full py-4 rounded-xl bg-theme-text text-theme-bg text-[10px] uppercase tracking-[0.2em] font-black hover:bg-purple-600 hover:text-white transition-all duration-300 shadow-lg shadow-purple-600/20 group flex items-center justify-center gap-2"
          >
             <Mic size={14} className="group-hover:scale-110 transition-transform" />
             Enable Microphone
          </button>
       </div>
    </div>
  );
};

export default AudioPermissionModal;
