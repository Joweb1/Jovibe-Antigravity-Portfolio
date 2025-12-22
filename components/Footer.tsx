import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowUpRight } from 'lucide-react';
import { useMagnetic } from '../hooks/useMagnetic';

const SOCIAL_LINKS = [
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/jonadab-uroh-b92603328' },
  { name: 'GitHub', url: 'https://github.com/Joweb1' },
  { name: 'X (Twitter)', url: 'https://x.com/JovibeCode' },
  { name: 'WhatsApp', url: 'https://wa.me/+2349135580911' }
];

const Footer: React.FC = () => {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const marquee = marqueeRef.current;
    if (!marquee) return;
    const rowWidth = (marquee.firstChild as HTMLElement).offsetWidth;
    gsap.to(marquee, {
      x: -rowWidth,
      duration: 30,
      ease: 'none',
      repeat: -1
    });
  }, []);

  return (
    <footer id="contact" className="relative pt-40 overflow-hidden bg-theme-bg border-t border-theme-border">
      {/* Dynamic Marquee */}
      <div className="py-12 border-b border-theme-border bg-theme-text/[0.02]">
        <div ref={marqueeRef} className="flex whitespace-nowrap will-change-transform">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center px-12">
              <span className="text-[10vw] font-black uppercase tracking-tighter leading-none mx-10 text-theme-text/10 group-hover:text-purple-600 transition-colors duration-700">
                Applied Intelligence
              </span>
              <div className="w-16 h-16 border-2 border-purple-500 rounded-full flex items-center justify-center -rotate-45">
                 <ArrowUpRight className="text-purple-600" size={32} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 md:px-20 py-40 flex flex-col items-center justify-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/[0.03] dark:bg-purple-600/[0.08] rounded-full blur-[150px] pointer-events-none transition-colors duration-1000" />
        
        <h2 className="text-[14vw] font-black tracking-tighter leading-none text-center uppercase mb-16 relative z-10 text-theme-text">
          Let's <span className="text-purple-600 italic">Work</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 w-full max-w-7xl gap-16 relative z-10">
          <div className="space-y-8">
            <h4 className="text-[10px] uppercase tracking-widest text-purple-600 font-black">Social Connections</h4>
            <div className="flex flex-col space-y-3">
              {SOCIAL_LINKS.map((social) => (
                <MagneticLink 
                  key={social.name} 
                  href={social.url} 
                  tooltip={`Open ${social.name}`}
                >
                  {social.name}
                </MagneticLink>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <h4 className="text-[10px] uppercase tracking-widest text-purple-600 font-black">Electronic Mail</h4>
            <a href="mailto:nahjonah00@gmail.com" className="text-2xl md:text-3xl font-black hover:text-purple-600 transition-colors block tracking-tighter text-theme-text break-all">
              nahjonah00@gmail.com
            </a>
            <p className="text-[10px] opacity-30 uppercase tracking-[0.3em] font-black">Global Operations / Remote</p>
          </div>

          <div className="space-y-8">
            <h4 className="text-[10px] uppercase tracking-widest text-purple-600 font-black">The Vision</h4>
            <div className="flex flex-col space-y-3 text-[12px] opacity-50 font-medium leading-relaxed text-theme-text uppercase tracking-widest">
              <span>Merging human intuition with neural scale.</span>
              <span>&copy; {currentYear} Jonadab Uroh &mdash; Engineer.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-12 text-center border-t border-theme-border">
        <span className="text-[10px] uppercase tracking-[1.5em] text-theme-text/10 font-black">
          Defying Gravity. Scaling Minds.
        </span>
      </div>
    </footer>
  );
};

const MagneticLink: React.FC<{ children: React.ReactNode; tooltip?: string; href?: string }> = ({ children, tooltip, href = "#" }) => {
  const ref = useMagnetic<HTMLAnchorElement>();
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (tooltipRef.current) {
      gsap.to(tooltipRef.current, { opacity: 1, y: -8, scale: 1, duration: 0.4, ease: 'expo.out' });
    }
  };

  const handleMouseLeave = () => {
    if (tooltipRef.current) {
      gsap.to(tooltipRef.current, { opacity: 0, y: 0, scale: 0.9, duration: 0.3, ease: 'power2.in' });
    }
  };

  return (
    <div className="relative inline-block w-fit">
      {tooltip && (
        <div 
          ref={tooltipRef}
          className="absolute bottom-full left-0 mb-3 px-3 py-1 bg-purple-600 text-white text-[9px] uppercase tracking-widest font-black pointer-events-none opacity-0 scale-90 origin-bottom-left whitespace-nowrap z-50 rounded shadow-2xl"
        >
          {tooltip}
        </div>
      )}
      <a 
        ref={ref}
        href={href} 
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="text-xl font-black hover:text-purple-600 transition-colors inline-block w-fit tracking-tighter text-theme-text"
      >
        {children}
      </a>
    </div>
  );
};

export default Footer;