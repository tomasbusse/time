import { useState, useEffect } from 'react';

interface DigitalClockProps {
  isCollapsed: boolean;
}

const DigitalClock = ({ isCollapsed }: DigitalClockProps) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const secondsString = time.toLocaleTimeString([], { second: '2-digit' });

  return (
    <div className={`font-mono ${isCollapsed ? 'text-sm' : 'text-lg'}`}>
      {isCollapsed ? (
        <div>
          <div>{timeString.split(':')[0]}</div>
          <div>{timeString.split(':')[1]}</div>
        </div>
      ) : (
        <span>{time.toLocaleTimeString()}</span>
      )}
    </div>
  );
};

export default DigitalClock;