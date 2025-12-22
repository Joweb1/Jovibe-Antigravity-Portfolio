
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { IMAGES } from '../assets/images';

const SKILLS = [
  { name: 'PHP', color: '#777BB4', icon: IMAGES.icons.php },
  { name: 'Laravel', color: '#FF2D20', icon: IMAGES.icons.laravel },
  { name: 'Python', color: '#3776AB', icon: IMAGES.icons.python },
  { name: 'JS', color: '#F7DF1E', icon: IMAGES.icons.js },
  { name: 'React', color: '#61DAFB', icon: IMAGES.icons.react },
  { name: 'AI', color: '#9333EA', icon: IMAGES.icons.ai },
];

const OrbitingSkills: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
        const items = itemsRef.current.filter(Boolean) as HTMLDivElement[];
        // Increased radius to accommodate the much larger profile image
        const radius = window.innerWidth < 768 ? 125 : 230;
        
        gsap.set(items, { 
          x: 0, 
          y: 0, 
          scale: 0, 
          opacity: 0 
        });
    
        if (profileRef.current) {
            gsap.fromTo(profileRef.current, 
              { scale: 0, opacity: 0 },
              { scale: 1, opacity: 1, duration: 1.2, ease: 'expo.out', delay: 0.8 }
            );
        }
    
        items.forEach((item, index) => {
          const angle = (index / items.length) * Math.PI * 2;
          const targetX = Math.cos(angle) * radius;
          const targetY = Math.sin(angle) * radius;
    
          gsap.to(item, {
            x: targetX,
            y: targetY,
            scale: 1,
            opacity: 1,
            duration: 1.8,
            delay: 1.2 + (index * 0.1),
            ease: 'expo.out'
          });
        });
    
        const rotationTl = gsap.to(orbitRef.current, {
          rotation: 360,
          duration: 25,
          ease: 'none',
          repeat: -1
        });
    
        gsap.fromTo(rotationTl, 
          { timeScale: 5 }, 
          { 
            timeScale: 1, 
            duration: 4, 
            ease: 'power3.inOut',
            delay: 1.5 
          }
        );
    
        items.forEach((item) => {
            gsap.to(item, {
                rotation: -360,
                duration: 25,
                ease: 'none',
                repeat: -1
            });
        });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-[40vh] md:h-[60vh] flex items-center justify-center overflow-visible">
      {/* Background Glow */}
      <div className="absolute w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[80px] animate-pulse transition-all duration-1000" />
      
      {/* Central Profile Image */}
      <div 
        ref={profileRef}
        className="relative z-20 w-40 h-40 md:w-72 md:h-72 rounded-full border border-purple-500/30 p-2 md:p-3 bg-theme-bg shadow-[0_0_60px_rgba(147,51,234,0.2)] overflow-hidden transition-colors duration-700"
      >
        <img 
          src={IMAGES.profile}
          alt="Jonadab Uroh" 
          className="w-full h-full object-cover rounded-full grayscale-0 hover:grayscale transition-all duration-700 cursor-pointer"
        />
      </div>

      {/* Skills Orbit */}
      <div ref={orbitRef} className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        {SKILLS.map((skill, i) => (
          <div
            key={skill.name}
            ref={(el) => { itemsRef.current[i] = el; }}
            className="absolute w-10 h-10 md:w-16 md:h-16 rounded-full bg-theme-bg border border-purple-500/20 shadow-sm flex items-center justify-center overflow-hidden p-2 md:p-3 transition-colors duration-700"
            style={{ 
                boxShadow: `0 0 15px ${skill.color}20`,
                borderColor: `${skill.color}40`
            }}
          >
            <img 
                src={skill.icon} 
                alt={skill.name} 
                className="w-full h-full object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrbitingSkills;
