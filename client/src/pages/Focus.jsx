import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as LucideIcons from 'lucide-react';
import CodeEditor from '../components/CodeEditor/CodeEditor';
import ImmersiveNav from '../components/ImmersiveNav';
import './Focus.css';

/* ═══════════════════════════════════════════
   PROGRAMMATIC AMBIENT SOUND GENERATORS
   No external URLs — pure Web Audio API
   ═══════════════════════════════════════════ */

function createWhiteNoise(audioCtx) {
  const bufferSize = 2 * audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  // Soften it with a low-pass filter for a gentle hiss
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1200;

  const gain = audioCtx.createGain();
  gain.gain.value = 0.15;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  source.start();
  return { source, gain };
}

function createBrownNoise(audioCtx) {
  const bufferSize = 2 * audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5; // Boost volume
  }
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const gain = audioCtx.createGain();
  gain.gain.value = 0.25;

  source.connect(gain);
  gain.connect(audioCtx.destination);
  source.start();
  return { source, gain };
}

function createPinkNoise(audioCtx) {
  const bufferSize = 2 * audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    data[i] *= 0.11;
    b6 = white * 0.115926;
  }
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const gain = audioCtx.createGain();
  gain.gain.value = 0.2;

  source.connect(gain);
  gain.connect(audioCtx.destination);
  source.start();
  return { source, gain };
}

const SOUNDS = [
  { id: 'none', label: 'Silence', icon: 'VolumeX', generator: null },
  { id: 'brown', label: 'Deep Hum', icon: 'CloudRain', generator: createBrownNoise },
  { id: 'pink', label: 'Soft Rain', icon: 'Waves', generator: createPinkNoise },
  { id: 'white', label: 'White Noise', icon: 'Wind', generator: createWhiteNoise },
];

const PRESETS = [
  { label: 'Focus', minutes: 25, icon: 'Brain' },
  { label: 'Short Break', minutes: 5, icon: 'Coffee' },
  { label: 'Long Break', minutes: 15, icon: 'Sun' },
  { label: 'Sprint', minutes: 10, icon: 'Zap' },
];

/* ═══════════════════════════════════════════
   FOCUS MODE COMPONENT
   ═══════════════════════════════════════════ */

function Focus() {
  const [code, setCode] = useState('// Deep work starts now.\n// No distractions. Just you and the code.\n');
  const [language, setLanguage] = useState('javascript');
  const [time, setTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [activePreset, setActivePreset] = useState(0);
  const [activeSound, setActiveSound] = useState('none');
  const [sessions, setSessions] = useState(0);
  const [volume, setVolume] = useState(0.5);

  const audioCtxRef = useRef(null);
  const audioNodeRef = useRef(null);

  // ── Timer ──
  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setTime(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsActive(false);
            setSessions(s => s + 1);
            // Auto-switch to break
            if (PRESETS[activePreset].label === 'Focus' || PRESETS[activePreset].label === 'Sprint') {
              setActivePreset(1); // Short Break
              setTime(5 * 60);
            } else {
              setActivePreset(0); // Focus
              setTime(25 * 60);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, activePreset]);

  // ── Audio cleanup on unmount ──
  useEffect(() => {
    return () => {
      if (audioNodeRef.current?.source) {
        audioNodeRef.current.source.stop();
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const toggleTimer = () => setIsActive(!isActive);
  const selectPreset = (idx) => {
    setActivePreset(idx);
    setTime(PRESETS[idx].minutes * 60);
    setIsActive(false);
  };

  const formatTime = useCallback((seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  const handleSoundChange = (sound) => {
    // Stop previous
    if (audioNodeRef.current?.source) {
      try { audioNodeRef.current.source.stop(); } catch { /* already stopped */ }
      audioNodeRef.current = null;
    }

    setActiveSound(sound.id);

    if (sound.id === 'none' || !sound.generator) {
      return;
    }

    // Create or reuse AudioContext
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const node = sound.generator(audioCtxRef.current);
    node.gain.gain.value = volume * 0.3; // Scale down
    audioNodeRef.current = node;
  };

  // Volume control
  useEffect(() => {
    if (audioNodeRef.current?.gain) {
      audioNodeRef.current.gain.gain.value = volume * 0.3;
    }
  }, [volume]);

  // Progress ring calculation
  const totalTime = PRESETS[activePreset].minutes * 60;
  const progress = ((totalTime - time) / totalTime) * 100;

  return (
    <div className="fz-root">
      <ImmersiveNav
        title="Focus Mode"
        subtitle={`${PRESETS[activePreset].label} · Session ${sessions + 1}`}
        timer={formatTime(time)}
        actions={
          <div className="fz-nav-actions">
            <button className={`fz-timer-btn ${isActive ? 'running' : ''}`} onClick={toggleTimer}>
              {isActive ? <LucideIcons.Pause size={14} /> : <LucideIcons.Play size={14} />}
              {isActive ? 'Pause' : 'Start'}
            </button>
            <button className="fz-reset-btn" onClick={() => selectPreset(activePreset)} title="Reset Timer">
              <LucideIcons.RotateCcw size={14} />
            </button>
          </div>
        }
      />

      <main className="fz-content">
        {/* Progress bar at very top of content */}
        <div className="fz-progress-bar">
          <div className="fz-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="fz-editor-container">
          <CodeEditor value={code} onChange={setCode} language={language} theme="vs-dark" />
        </div>

        {/* Floating control pill */}
        <div className="fz-floating-pill">
          {/* Presets */}
          <div className="fz-pill-group">
            {PRESETS.map((p, i) => {
              const PresetIcon = LucideIcons[p.icon];
              return (
                <button
                  key={p.label}
                  className={`fz-preset-btn ${activePreset === i ? 'active' : ''}`}
                  onClick={() => selectPreset(i)}
                  title={`${p.label} (${p.minutes}m)`}
                >
                  {PresetIcon && <PresetIcon size={13} />}
                  <span>{p.minutes}m</span>
                </button>
              );
            })}
          </div>

          <div className="fz-pill-divider" />

          {/* Sounds */}
          <div className="fz-pill-group">
            {SOUNDS.map(s => {
              const SoundIcon = LucideIcons[s.icon];
              return (
                <button
                  key={s.id}
                  className={`fz-sound-btn ${activeSound === s.id ? 'active' : ''}`}
                  onClick={() => handleSoundChange(s)}
                  title={s.label}
                >
                  {SoundIcon && <SoundIcon size={14} />}
                </button>
              );
            })}
            {activeSound !== 'none' && (
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="fz-volume-slider"
                title={`Volume: ${Math.round(volume * 100)}%`}
              />
            )}
          </div>

          <div className="fz-pill-divider" />

          {/* Language */}
          <select className="fz-lang-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="javascript">JS</option>
            <option value="python">PY</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>

          {/* Session counter */}
          {sessions > 0 && (
            <>
              <div className="fz-pill-divider" />
              <span className="fz-session-count" title="Completed sessions">
                <LucideIcons.Flame size={12} /> {sessions}
              </span>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default Focus;
