import React, { useEffect, useState } from 'react';

interface RoundClockProps {
  className?: string;
  isCollapsed?: boolean;
}

const RoundClock: React.FC<RoundClockProps> = ({ className = '', isCollapsed = false }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();

  const secondHandAngle = (seconds / 60) * 360;
  const minuteHandAngle = ((minutes * 60 + seconds) / 3600) * 360;
  const hourHandAngle = ((hours % 12) / 12) * 360 + ((minutes / 60) * 30);

  const clockSize = isCollapsed ? 60 : 120;
  const handBaseStyle = {
    position: 'absolute',
    bottom: '50%',
    left: '50%',
    transformOrigin: 'bottom',
  } as React.CSSProperties;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className="relative rounded-full"
        style={{
          width: `${clockSize}px`,
          height: `${clockSize}px`,
          backgroundColor: '#F1F5EE',
          border: `4px solid #A78573`,
          boxShadow: '0 0 15px rgba(0,0,0,0.15) inset, 0 0 5px rgba(0,0,0,0.2)',
        }}
      >
        {/* Hour Hand */}
        <div
          style={{
            ...handBaseStyle,
            width: '4px',
            height: '25%',
            backgroundColor: '#384C5A',
            transform: `translateX(-50%) rotate(${hourHandAngle}deg)`,
            borderRadius: '2px',
          }}
        />
        {/* Minute Hand */}
        <div
          style={{
            ...handBaseStyle,
            width: '3px',
            height: '35%',
            backgroundColor: '#384C5A',
            transform: `translateX(-50%) rotate(${minuteHandAngle}deg)`,
            borderRadius: '1.5px',
          }}
        />
        {/* Second Hand */}
        <div
          style={{
            ...handBaseStyle,
            width: '2px',
            height: '40%',
            backgroundColor: '#A78573',
            transform: `translateX(-50%) rotate(${secondHandAngle}deg)`,
          }}
        />
        {/* Center Dot */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
          style={{
            backgroundColor: '#384C5A',
            border: '2px solid #F1F5EE',
            zIndex: 10,
          }}
        />
      </div>
    </div>
  );
};

export default RoundClock;