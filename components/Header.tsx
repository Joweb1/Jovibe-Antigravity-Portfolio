
import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Sun, Moon, ArrowLeft, Menu, X } from 'lucide-react';
import { NAV_LINKS } from '../constants';
import { useMagnetic } from '../hooks/useMagnetic';

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  currentView: 'home' | 'archive' | 'about' | 'testimonials';
  onViewChange: (view: 'home' | 'archive' | 'about' | 'testimonials') => void;
}

const Header: React.FC<HeaderProps> = ({ isDark, onToggleTheme, currentView, onViewChange }) => {
  const headerRef = useRef<HTMLElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const [hidden, setHidden] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100 && !isMobileMenuOpen) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (headerRef.current) {
        gsap.to(headerRef.current, {
          y: hidden ? -100 : 0,
          opacity: hidden ? 0 : 1,
          duration: 0.6,
          ease: 'expo.out'
        });
    }
  }, [hidden]);

  useEffect(() => {
    if (!mobileMenuRef.current) return;
    
    if (isMobileMenuOpen) {
        document.body.style.overflow = 'hidden';
        gsap.to(mobileMenuRef.current, {
            clipPath: 'circle(150% at 100% 0%)',
            duration: 0.8,
            ease: 'expo.inOut'
        });
        gsap.fromTo('.mobile-nav-link', 
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.1, duration: 0.8, delay: 0.2, ease: 'power3.out' }
        );
    } else {
        document.body.style.overflow = '';
        gsap.to(mobileMenuRef.current, {
            clipPath: 'circle(0% at 100% 0%)',
            duration: 0.6,
            ease: 'expo.inOut'
        });
    }
  }, [isMobileMenuOpen]);

  const handleNavClick = (link: typeof NAV_LINKS[0], e: any) => {
    if (link.isAction) {
      e.preventDefault();
      if (['archive', 'about', 'testimonials'].includes(link.href)) {
        onViewChange(link.href as any);
      }
    } else {
        if (currentView !== 'home') {
            e.preventDefault();
            onViewChange('home');
            setTimeout(() => {
                const element = document.querySelector(link.href);
                element?.scrollIntoView({ behavior: 'smooth' });
            }, 500);
        }
    }
  };

  const mobileLinks = [
    { label: 'Home', action: () => onViewChange('home') },
    { label: 'Archive', action: () => onViewChange('archive') },
    { label: 'Testimonials', action: () => onViewChange('testimonials') },
    { label: 'About Me', action: () => onViewChange('about') },
  ];

  return (
    <>
      <header 
        ref={headerRef}
        className="fixed top-0 left-0 w-full z-[80] p-6 md:p-10 flex justify-between items-center bg-theme-bg/40 backdrop-blur-md transition-all duration-700 border-b border-theme-border"
      >
        <div 
          onClick={() => onViewChange('home')}
          className="text-xl font-black tracking-tighter text-theme-text transition-colors duration-500 cursor-pointer relative z-[90]"
        >
          JONADAB<span className="opacity-40">.UROH</span>
        </div>
        
        <div className="flex items-center space-x-4 md:space-x-8">
          <nav className="hidden lg:flex items-center space-x-8">
            {currentView !== 'home' ? (
              <button 
                onClick={() => onViewChange('home')}
                className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-purple-600 font-black"
              >
                <ArrowLeft size={12} /> Back Home
              </button>
            ) : (
              NAV_LINKS.map((link) => (
                <MagneticLink 
                  key={link.label} 
                  href={link.href}
                  onClick={(e) => handleNavClick(link, e)}
                >
                  {link.label}
                </MagneticLink>
              ))
            )}
          </nav>

          <div className="flex items-center gap-3 relative z-[90]">
            <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
            <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden text-theme-text p-2 rounded-full border border-theme-border hover:bg-theme-text/5 transition-colors"
            >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Modal */}
      <div 
        ref={mobileMenuRef}
        className="fixed inset-0 z-[70] bg-theme-bg flex flex-col justify-center items-center clip-path-circle-0"
        style={{ clipPath: 'circle(0% at 100% 0%)' }}
      >
        <div className="flex flex-col space-y-8 text-center">
            {mobileLinks.map((link, idx) => (
                <button
                    key={idx}
                    onClick={() => {
                        link.action();
                        setIsMobileMenuOpen(false);
                    }}
                    className="mobile-nav-link text-5xl font-black uppercase tracking-tighter text-theme-text hover:text-purple-600 transition-colors duration-300"
                >
                    {link.label}
                </button>
            ))}
        </div>
        
        <div className="absolute bottom-10 left-0 w-full text-center">
             <p className="mobile-nav-link text-[10px] uppercase tracking-[0.3em] font-black text-theme-text/20">
                Jonadab Uroh &copy; {currentYear}
             </p>
        </div>
      </div>
    </>
  );
};

const ThemeToggle: React.FC<{ isDark: boolean; onToggle: () => void }> = ({ isDark, onToggle }) => {
  const ref = useMagnetic<HTMLButtonElement>();
  return (
    <button
      ref={ref}
      onClick={onToggle}
      className="p-2.5 bg-theme-text/5 hover:bg-theme-text/10 border border-theme-border rounded-full text-theme-text transition-all duration-300"
      aria-label="Toggle Theme"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
};

const MagneticLink: React.FC<{ children: React.ReactNode; href: string; onClick?: (e: any) => void }> = ({ children, href, onClick }) => {
  const ref = useMagnetic<HTMLAnchorElement>();
  return (
    <a 
      ref={ref}
      href={href} 
      onClick={onClick}
      className="text-[10px] uppercase tracking-[0.2em] text-theme-text/60 hover:text-theme-text transition-colors inline-block px-2 py-2 font-black"
    >
      {children}
    </a>
  );
};

export default Header;
