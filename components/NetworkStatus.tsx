
import React, { useState, useEffect } from 'react';
import { WifiOff, Signal, Wifi } from 'lucide-react';

const NetworkStatus: React.FC = () => {
  const [status, setStatus] = useState<'good' | 'slow' | 'offline'>('good');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Helper to get connection info (safe cast for TS)
    const getConnection = () => (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    const updateStatus = () => {
      // 1. Check Offline Status
      if (!navigator.onLine) {
        setStatus('offline');
        setIsVisible(true);
        return;
      }

      // 2. Check Connection Quality
      const connection = getConnection();
      if (connection) {
        // Criteria for "Slow": 2G, high latency (>700ms), or low bandwidth (<1Mbps)
        const isSlow = 
          connection.saveData ||
          connection.effectiveType === 'slow-2g' || 
          connection.effectiveType === '2g' || 
          connection.rtt > 700 || 
          (connection.downlink && connection.downlink < 1);

        if (isSlow) {
          setStatus('slow');
          setIsVisible(true);
        } else {
            // Connection is good. If we were previously bad, show "Restored" briefly.
            setStatus((prev) => {
                if (prev !== 'good') {
                    // Show "Restored" message
                    setIsVisible(true);
                    // Auto-hide after 4 seconds
                    setTimeout(() => setIsVisible(false), 4000);
                    return 'good';
                }
                // Already good, ensure hidden
                setIsVisible(false);
                return 'good';
            });
        }
      }
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    const connection = getConnection();
    if (connection) {
      connection.addEventListener('change', updateStatus);
    }
    
    // Initial check (delay slightly to avoid flash on load)
    const timer = setTimeout(updateStatus, 1000);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      if (connection) connection.removeEventListener('change', updateStatus);
      clearTimeout(timer);
    };
  }, []);

  // Don't render if visible is false
  if (!isVisible && status === 'good') return null;

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100000] transition-all duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0 pointer-events-none'}`}>
      <div className={`
        flex items-center gap-3 px-6 py-3 rounded-full border backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)]
        ${status === 'offline' ? 'bg-red-500/10 border-red-500/20 text-red-500' : ''}
        ${status === 'slow' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : ''}
        ${status === 'good' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : ''}
      `}>
        {status === 'offline' && <WifiOff size={14} className="animate-pulse" />}
        {status === 'slow' && <Signal size={14} className="animate-pulse" />}
        {status === 'good' && <Wifi size={14} />}
        
        <span className="text-[9px] uppercase tracking-[0.2em] font-black whitespace-nowrap">
          {status === 'offline' ? 'Connection Lost' : status === 'slow' ? 'Network Unstable' : 'Signal Restored'}
        </span>
      </div>
    </div>
  );
};

export default NetworkStatus;
