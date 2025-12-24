
import React, { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { Search, Command, ArrowRight, Sun, Moon, Briefcase, User, Mail, Zap, Quote, Wand2 } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (sectionId: string) => void;
  onToggleTheme: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate, onToggleTheme }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const actions = [
    { id: 'generate-theme', label: 'AI Theme Generator', icon: <Wand2 size={14} />, action: () => onNavigate('generate-theme') },
    { id: 'home', label: 'Go Home', icon: <Zap size={14} />, action: () => onNavigate('home') },
    { id: 'work', label: 'View Projects', icon: <Briefcase size={14} />, action: () => onNavigate('work') },
    { id: 'services', label: 'Services', icon: <Command size={14} />, action: () => onNavigate('services') },
    { id: 'process', label: 'Methodology', icon: <ArrowRight size={14} />, action: () => onNavigate('process') },
    { id: 'testimonials', label: 'Testimonials', icon: <Quote size={14} />, action: () => onNavigate('testimonials') },
    { id: 'about', label: 'About Me', icon: <User size={14} />, action: () => onNavigate('about') },
    { id: 'contact', label: 'Contact', icon: <Mail size={14} />, action: () => onNavigate('contact') },
    { id: 'theme', label: 'Toggle Theme', icon: <Sun size={14} />, action: () => onToggleTheme() },
  ];

  const filteredActions = actions.filter(action => 
    action.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      gsap.to(overlayRef.current, { opacity: 1, duration: 0.3 });
      gsap.fromTo(modalRef.current, 
        { scale: 0.95, opacity: 0, y: 10 }, 
        { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: 'expo.out' }
      );
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.2 });
      gsap.to(modalRef.current, { scale: 0.95, opacity: 0, duration: 0.2 });
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredActions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        filteredActions[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-[20vh] px-4">
      <div 
        ref={overlayRef} 
        onClick={onClose}
        className="absolute inset-0 bg-theme-bg/80 backdrop-blur-sm opacity-0"
      />
      
      <div 
        ref={modalRef}
        className="relative w-full max-w-xl bg-theme-bg border border-theme-border rounded-xl shadow-2xl overflow-hidden opacity-0 flex flex-col"
      >
        <div className="flex items-center px-4 py-4 border-b border-theme-border">
          <Search className="text-theme-text/40 mr-3" size={18} />
          <input 
            ref={inputRef}
            value={query}
            onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent border-none outline-none text-theme-text text-sm font-medium placeholder:text-theme-text/30"
          />
          <span className="text-[10px] font-bold bg-theme-text/10 px-2 py-1 rounded text-theme-text/50">ESC</span>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto py-2">
            {filteredActions.length === 0 ? (
                <div className="px-4 py-8 text-center text-theme-text/40 text-xs">No commands found.</div>
            ) : (
                filteredActions.map((action, idx) => (
                    <button
                        key={action.id}
                        onClick={() => {
                            action.action();
                            onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                            idx === selectedIndex ? 'bg-theme-accent/10 border-l-2 border-theme-accent' : 'border-l-2 border-transparent'
                        }`}
                    >
                        <span className={`p-1 rounded ${idx === selectedIndex ? 'text-theme-accent' : 'text-theme-text/40'}`}>
                            {action.icon}
                        </span>
                        <span className={`text-sm font-medium ${idx === selectedIndex ? 'text-theme-text' : 'text-theme-text/60'}`}>
                            {action.label}
                        </span>
                        {idx === selectedIndex && (
                            <span className="ml-auto text-[10px] uppercase tracking-wider font-bold text-theme-accent/50">Enter</span>
                        )}
                    </button>
                ))
            )}
        </div>
        
        <div className="px-4 py-2 bg-theme-text/[0.02] border-t border-theme-border flex justify-between items-center text-[10px] text-theme-text/30 font-bold uppercase tracking-wider">
            <span>Command Menu</span>
            <span className="flex items-center gap-1">
                <Command size={10} /> + K
            </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
