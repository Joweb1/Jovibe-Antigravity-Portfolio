
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const follower = followerRef.current;

    if (!cursor || !follower) return;

    const onMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      
      // Immediate move for dot
      gsap.to(cursor, {
        x: clientX,
        y: clientY,
        duration: 0.1,
        ease: 'power3.out'
      });

      // Smoother follow for ring
      gsap.to(follower, {
        x: clientX,
        y: clientY,
        duration: 0.6,
        ease: 'expo.out'
      });
    };

    const onMouseDown = () => {
      gsap.to(follower, { scale: 0.8, duration: 0.3 });
    };

    const onMouseUp = () => {
      gsap.to(follower, { scale: 1, duration: 0.3 });
    };

    const onHoverEnter = () => {
      gsap.to(follower, {
        scale: 2.5,
        backgroundColor: 'rgba(192, 132, 252, 0.1)',
        borderColor: 'rgba(192, 132, 252, 0.5)',
        duration: 0.3,
        mixBlendMode: 'screen'
      });
      gsap.to(cursor, { scale: 4, opacity: 0, duration: 0.3 });
    };

    const onHoverLeave = () => {
      gsap.to(follower, {
        scale: 1,
        backgroundColor: 'transparent',
        borderColor: 'rgba(192, 132, 252, 0.3)',
        duration: 0.3,
        mixBlendMode: 'normal'
      });
      gsap.to(cursor, { scale: 1, opacity: 1, duration: 0.3 });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    // Attach to interactive elements
    const links = document.querySelectorAll('a, button, [data-cursor-hover]');
    links.forEach(link => {
      link.addEventListener('mouseenter', onHoverEnter);
      link.addEventListener('mouseleave', onHoverLeave);
    });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      links.forEach(link => {
        link.removeEventListener('mouseenter', onHoverEnter);
        link.removeEventListener('mouseleave', onHoverLeave);
      });
    };
  }, []);

  return (
    <>
      <div 
        ref={cursorRef} 
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-purple-400 rounded-full z-[10000] pointer-events-none -translate-x-1/2 -translate-y-1/2" 
      />
      <div 
        ref={followerRef} 
        className="fixed top-0 left-0 w-10 h-10 border border-purple-500/30 rounded-full z-[9999] pointer-events-none -translate-x-1/2 -translate-y-1/2" 
      />
    </>
  );
};

export default CustomCursor;