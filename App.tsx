
import React, { useEffect, useState, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';
import CustomCursor from './components/Cursor';
import Preloader from './components/Preloader';
import Header from './components/Header';
import Hero from './components/Hero';
import Work from './components/Work';
import Services from './components/Services';
import Process from './components/Process';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import Archive from './components/Archive';
import About from './components/About';
import Skills from './components/Skills';
import AIAssistant from './components/AIAssistant';
import CommandPalette from './components/CommandPalette';
import ThemeGenerator from './components/ThemeGenerator';
import StarField from './components/StarField';
import SmartRecruiter from './components/SmartRecruiter';
import VoiceControl from './components/VoiceControl';

gsap.registerPlugin(ScrollTrigger);

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [shouldWelcome, setShouldWelcome] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [view, setView] = useState<'home' | 'archive' | 'about' | 'testimonials'>('home');
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [isThemeGenOpen, setIsThemeGenOpen] = useState(false);
  const [isRecruiterOpen, setIsRecruiterOpen] = useState(false);
  
  // Initialize theme based on localStorage or system preference
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved !== null) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });
  
  const lenisRef = useRef<Lenis | null>(null);

  // Listen for system theme changes if user hasn't set a preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('theme') === null) {
        setIsDark(e.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
  }, [isDark]);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.1,
      touchMultiplier: 2,
      infinite: false,
      lerp: 0.1
    });

    lenisRef.current = lenis;

    const raf = (time: number) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };

    requestAnimationFrame(raf);
    
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Keyboard shortcut for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCmdOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const newTheme = !prev;
      // Only save to localStorage when user explicitly toggles
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      return newTheme;
    });
  }, []);

  const handleLoadingComplete = useCallback(() => {
    setLoading(false);
    // Trigger welcome immediately after preloader removal
    // Use requestAnimationFrame instead of timeout to keep permission context active if possible
    requestAnimationFrame(() => {
      setShouldWelcome(true);
      ScrollTrigger.refresh();
    });
  }, []);

  const switchView = (newView: 'home' | 'archive' | 'about' | 'testimonials') => {
    if (view === newView) return;
    
    const lenis = lenisRef.current;
    
    // Smooth scroll to top before switching
    if (lenis) {
      lenis.scrollTo(0, { duration: 1, easing: (t) => t * (2 - t) });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    const tl = gsap.timeline();
    tl.to('.view-content', { 
      opacity: 0, 
      y: 10, 
      duration: 0.5, 
      ease: 'power2.inOut' 
    })
    .call(() => {
      setView(newView);
      // Immediate reset for the new view content
      if (lenis) {
        lenis.scrollTo(0, { immediate: true });
      } else {
        window.scrollTo(0, 0);
      }
    })
    .to('.view-content', { 
      opacity: 1, 
      y: 0, 
      duration: 0.7, 
      ease: 'power3.out',
      clearProps: 'all'
    });
  };

  const handleCmdNavigate = (section: string) => {
      if (['home', 'archive', 'about', 'testimonials'].includes(section)) {
          switchView(section as any);
      } else if (section === 'theme') {
          toggleTheme();
      } else if (section === 'generate-theme') {
          setIsThemeGenOpen(true);
      } else if (section === 'recruiter') {
          setIsRecruiterOpen(true);
      } else {
          // Scroll to ID
          if (view !== 'home') {
            switchView('home');
            setTimeout(() => {
                const el = document.getElementById(section);
                el?.scrollIntoView({ behavior: 'smooth' });
            }, 800);
          } else {
             const el = document.getElementById(section);
             lenisRef.current?.scrollTo(el || 0);
          }
      }
  };

  return (
    <div className="relative min-h-screen transition-colors duration-700 ease-luxury bg-theme-bg text-theme-text selection:bg-theme-accent selection:text-white">
      <div className="grain-overlay" />
      <CustomCursor />
      {loading && <Preloader onComplete={handleLoadingComplete} />}
      
      <CommandPalette 
        isOpen={isCmdOpen} 
        onClose={() => setIsCmdOpen(false)}
        onNavigate={handleCmdNavigate}
        onToggleTheme={toggleTheme}
      />
      <ThemeGenerator 
        isOpen={isThemeGenOpen}
        onClose={() => setIsThemeGenOpen(false)}
      />
      <SmartRecruiter 
        isOpen={isRecruiterOpen}
        onClose={() => setIsRecruiterOpen(false)}
      />
      <VoiceControl 
        onNavigate={handleCmdNavigate} 
        shouldWelcome={shouldWelcome}
        isChatOpen={isChatOpen}
      />
      
      {!loading && (
        <>
          <StarField isDark={isDark} />
          <div className="relative z-10 flex flex-col">
            <Header 
              isDark={isDark} 
              onToggleTheme={toggleTheme} 
              currentView={view}
              onViewChange={switchView}
              onOpenThemeGen={() => setIsThemeGenOpen(true)}
              onOpenRecruiter={() => setIsRecruiterOpen(true)}
            />
            <main className="view-content flex-grow">
              {view === 'home' && (
                <>
                  <Hero />
                  <Skills />
                  <Services />
                  <Process />
                  <Work onShowArchive={() => switchView('archive')} />
                </>
              )}
              {view === 'archive' && <Archive onBack={() => switchView('home')} />}
              {view === 'about' && <About onBack={() => switchView('home')} />}
              {view === 'testimonials' && <Testimonials onBack={() => switchView('home')} />}
            </main>
            {view === 'home' && <Footer />}
            <AIAssistant isOpen={isChatOpen} onToggle={setIsChatOpen} />
          </div>
        </>
      )}
    </div>
  );
};

export default App;
