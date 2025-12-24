
import React, { useState, useEffect } from 'react';
import { WifiOff, SignalLow } from 'lucide-react';

const NetworkStatus: React.FC = () => {
  const [status, setStatus] = useState<'online' | 'offline' | 'slow'>('online');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      if (!navigator.onLine) {
        setStatus('offline');
        setVisible(true);
        return;
      }

      // Check for slow connection API (Chromium browsers)
      const connection = (navigator as any).connection;
      if (connection) {
        const type = connection.effectiveType; // '4g', '3g', '2g', 'slow-2g'
        if (type === '2g' || type === 'slow-2g') {
          setStatus('slow');
          setVisible(true);
          return;
        }
      }

      setStatus('online');
      setVisible(false);
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    
    // Check connection quality changes if supported
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateStatus);
    }

    // Initial check
    updateStatus();

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      if (connection) {
        connection.removeEventListener('change', updateStatus);
      }
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100000] animate-in fade-in slide-in-from-top-4 duration-500 pointer-events-none">
      <div className={`px-4 py-2 rounded-full border backdrop-blur-md flex items-center gap-2 shadow-xl ${
        status === 'offline' 
          ? 'bg-red-500/10 border-red-500/20 text-red-500' 
          : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
      }`}>
        {status === 'offline' ? <WifiOff size={14} /> : <SignalLow size={14} />}
        <span className="text-[10px] uppercase tracking-widest font-black">
          {status === 'offline' ? 'Connection Lost' : 'Network Unstable'}
        </span>
      </div>
    </div>
  );
};

export default NetworkStatus;
