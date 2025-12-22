import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowUpRight, Plus, Minus } from 'lucide-react';
import { SERVICES } from '../constants';

const Services: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeService, setActiveService] = useState<string | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.service-item', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="services" ref={sectionRef} className="px-6 md:px-20 py-20 md:py-40 bg-theme-bg relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-20 md:mb-32">
          <div className="space-y-4">
             <h3 className="text-[10px] uppercase tracking-[0.6em] text-purple-600 font-black">Offerings</h3>
             <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-theme-text max-w-2xl leading-none">
                Strategic <span className="italic opacity-30">Solutions.</span>
             </h2>
          </div>
          <p className="max-w-xs text-[11px] uppercase tracking-[0.2em] font-black text-theme-text/30 leading-relaxed">
             Tailored engineering services for high-impact digital products.
          </p>
        </div>

        <div className="flex flex-col border-t border-theme-border">
          {SERVICES.map((service) => (
            <div 
              key={service.id}
              className="service-item group relative border-b border-theme-border transition-colors duration-500"
              onMouseEnter={() => setActiveService(service.id)}
              onMouseLeave={() => setActiveService(null)}
            >
              <div 
                className={`absolute inset-0 bg-theme-text/[0.02] transition-transform duration-500 origin-top ${
                  activeService === service.id ? 'scale-y-100' : 'scale-y-0'
                }`} 
              />
              
              <div className="relative z-10 py-12 md:py-16 flex flex-col md:flex-row gap-8 md:items-start justify-between cursor-default">
                {/* ID & Title */}
                <div className="flex items-start gap-6 md:w-1/3">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-black text-purple-600 mt-2">
                    {service.id}
                  </span>
                  <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-theme-text group-hover:text-purple-600 transition-colors duration-300">
                    {service.title}
                  </h3>
                </div>

                {/* Description - Expands on Desktop, Always visible on mobile but smaller */}
                <div className="md:w-1/3 space-y-6">
                  <p className="text-sm md:text-base font-medium leading-relaxed text-theme-text/60 group-hover:text-theme-text/80 transition-colors">
                    {service.description}
                  </p>
                  
                  {/* Capabilities Tags */}
                  <div className={`overflow-hidden transition-all duration-500 ease-luxury ${
                    activeService === service.id ? 'max-h-40 opacity-100 pt-4' : 'max-h-0 opacity-0 md:max-h-0'
                  }`}>
                    <div className="flex flex-wrap gap-2">
                      {service.capabilities.map((cap) => (
                        <span key={cap} className="px-3 py-1 border border-theme-border rounded-full text-[9px] uppercase tracking-widest font-black text-theme-text/40 bg-theme-bg">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Icon */}
                <div className="hidden md:flex justify-end md:w-1/6">
                   <div className={`w-12 h-12 rounded-full border border-theme-border flex items-center justify-center transition-all duration-500 ${
                     activeService === service.id ? 'bg-purple-600 border-purple-600 rotate-45' : 'bg-transparent'
                   }`}>
                      <ArrowUpRight 
                        size={20} 
                        className={`transition-colors duration-300 ${activeService === service.id ? 'text-white' : 'text-theme-text'}`} 
                      />
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;