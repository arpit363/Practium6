import React, { useState, useEffect, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import CodeEditor from '../components/CodeEditor/CodeEditor';
import ImmersiveNav from '../components/ImmersiveNav';
import './Focus.css';

const AMBIENT_SOUNDS = [
  { label: 'Silence', id: 'none', icon: 'VolumeX' },
  { label: 'Deep Rain', id: 'rain', icon: 'CloudRain', url: 'https://www.soundjay.com/nature/rain-07.mp3' },
  { label: 'White Noise', id: 'white', icon: 'Shield', url: 'https://www.soundjay.com/misc/white-noise-01.mp3' },
  { label: 'Soothing River', id: 'river', icon: 'Waves', url: 'https://www.soundjay.com/nature/river-1.mp3' }
];

function Focus() {
  const [code, setCode] = useState('// Your deep work session starts now...\n');
  const [language, setLanguage] = useState('javascript');
  const [time, setTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [ambient, setAmbient] = useState(AMBIENT_SOUNDS[0]);
  const audioRef = useRef(null);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setTime(prev => {
          if (prev <= 1) {
             clearInterval(interval);
             setIsActive(false);
             alert("Break time!");
             return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTime(25 * 60);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleAmbientChange = (sound) => {
    setAmbient(sound);
    if (audioRef.current) {
      audioRef.current.src = sound.url || '';
      if (sound.id !== 'none') {
        audioRef.current.play().catch(e => console.log("Audio play blocked by browser:", e));
      }
    }
  };

  return (
    <div className="fz-root">
       <audio ref={audioRef} loop />
       <ImmersiveNav 
         title="Focus Mode" 
         subtitle="Flow State Enabled"
         timer={formatTime(time)}
         actions={
           <div className="fz-nav-actions">
             <button className={`fz-timer-btn ${isActive ? 'running' : ''}`} onClick={toggleTimer}>
                {isActive ? <LucideIcons.Pause size={14} /> : <LucideIcons.Play size={14} />}
                {isActive ? 'Pause' : 'Start Focus'}
             </button>
             <button className="fz-reset-btn" onClick={resetTimer} title="Reset Timer">
                <LucideIcons.RotateCcw size={14} />
             </button>
           </div>
         }
       />
       
       <main className="fz-content">
         <div className="fz-editor-container">
           <CodeEditor value={code} onChange={setCode} language={language} theme="vs-dark" />
         </div>

         <div className="fz-floating-pill">
            {AMBIENT_SOUNDS.map(s => {
              const IconComp = LucideIcons[s.icon];
              return (
                <button 
                  key={s.id} 
                  className={`fz-sound-btn ${ambient.id === s.id ? 'active' : ''}`}
                  onClick={() => handleAmbientChange(s)}
                  title={s.label}
                >
                  {IconComp && <IconComp size={16} />}
                </button>
              );
            })}
           <div className="fz-pill-divider" />
           <select className="fz-lang-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
             <option value="javascript">JS</option>
             <option value="python">PY</option>
             <option value="java">JV</option>
             <option value="cpp">C++</option>
           </select>
         </div>
       </main>
    </div>
  );
}

export default Focus;
