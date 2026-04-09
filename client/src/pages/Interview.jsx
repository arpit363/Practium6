import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import * as LucideIcons from 'lucide-react';
import CodeEditor from '../components/CodeEditor/CodeEditor';
import ImmersiveNav from '../components/ImmersiveNav';
import { streamAIChat, runCode } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Interview.css';

const PHASES = {
  SETUP: 'setup',
  CODING: 'coding',
  FOLLOWUP: 'followup',
  RESULT: 'result'
};

function Interview() {
  const [phase, setPhase] = useState(PHASES.SETUP);
  const [difficulty, setDifficulty] = useState('Medium');
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 mins
  const [problem, setProblem] = useState('');
  const [code, setCode] = useState('// Your solution here...\n');
  const [language] = useState('javascript');
  const [runCount, setRunCount] = useState(0);
  const [maxRuns] = useState(3);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const chatEndRef = useRef(null);

  const handleCompleteCoding = () => {
    setPhase(PHASES.FOLLOWUP);
    setMessages([{ 
      role: 'model', 
      content: "Thank you for the solution. I've noted it down. I have a few follow-up questions about your approach. To start: Why did you choose this specific data structure for the core logic?" 
    }]);
  };

  // Timer logic
  useEffect(() => {
    let interval = null;
    if (phase === PHASES.CODING) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            handleCompleteCoding();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [phase]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startInterview = async () => {
    setLoading(true);
    setPhase(PHASES.CODING);
    // Ask AI to generate a problem
    await streamAIChat({
      code: '// Start from scratch',
      language,
      mode: 'interview_interviewer',
      history: [{ role: 'user', content: `Start the interview. Set a ${difficulty} difficulty DSA problem.` }],
      onChunk: (chunk) => setProblem(prev => prev + chunk),
      onDone: () => setLoading(false)
    });
  };

  const handleRun = async () => {
    if (runCount >= maxRuns || phase !== PHASES.CODING) return;
    setRunning(true);
    setRunCount(prev => prev + 1);
    try {
      const res = await runCode({ code, language });
      setOutput(res);
    } catch (e) {
      setOutput({ stderr: e.message });
    }
    setRunning(false);
  };

  const handleSendFollowup = async () => {
    if (!chatInput.trim() || loading) return;
    const text = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }, { role: 'model', content: '' }]);
    setLoading(true);

    await streamAIChat({
      code,
      language,
      mode: 'interview_interviewer',
      history: messages.concat({ role: 'user', content: text }),
      onChunk: (chunk) => setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1].content += chunk;
        return updated;
      }),
      onDone: () => {
        setLoading(false);
        if (messages.length >= 4) { // End after ~3 exchanges
           setPhase(PHASES.RESULT);
           evaluatePerformance();
        }
      }
    });
  };

  const evaluatePerformance = async () => {
    setLoading(true);
    let evalText = '';
    await streamAIChat({
      code,
      language,
      mode: 'interview_evaluator',
      history: messages.map(m => ({ role: m.role, content: m.content })),
      onChunk: (chunk) => {
        evalText += chunk;
        setResult(evalText);
      },
      onDone: () => setLoading(false)
    });
  };

  const renderSetup = () => (
    <div className="iv-setup-card">
      <div className="iv-setup-header">
        <LucideIcons.ShieldCheck size={40} color="#9B40E0" />
        <h2>Standard Technical Interview</h2>
        <p>45 minutes · Full-screen · Restricted Runs</p>
      </div>
      <div className="iv-setup-body">
        <div className="iv-diff-selector">
          {['Easy', 'Medium', 'Hard'].map(d => (
            <button 
              key={d} 
              className={`iv-diff-btn ${difficulty === d ? 'active' : ''}`}
              onClick={() => setDifficulty(d)}
            >
              {d}
            </button>
          ))}
        </div>
        <p className="iv-disclaimer">Once you start, the timer cannot be paused. You get <strong>{maxRuns} execution attempts</strong>. Good luck.</p>
      </div>
      <button className="iv-start-btn" onClick={startInterview} disabled={loading}>
        {loading ? 'Initializing...' : 'Begin Interview'}
      </button>
    </div>
  );

  const renderCoding = () => (
    <div className="iv-coding-layout">
      <div className="iv-problem-panel">
        <div className="iv-panel-header">
          <LucideIcons.BookIcon size={14} />
          <span>Problem Statement</span>
        </div>
        <div className="iv-panel-body scrollable">
          <ReactMarkdown>{problem || 'Generating your challenge...'}</ReactMarkdown>
        </div>
      </div>
      <div className="iv-editor-panel">
        <div className="iv-panel-header">
          <LucideIcons.Code2 size={14} />
          <span>Solution Editor</span>
        </div>
        <div className="iv-editor-wrapper">
          <CodeEditor value={code} onChange={setCode} language={language} theme="vs-dark" />
        </div>
        <div className="iv-console-area">
          <div className="iv-console-header">
            <span>Terminal {output ? '(Result)' : ''}</span>
            <div className="iv-run-status">
              Runs used: <strong>{runCount} / {maxRuns}</strong>
            </div>
          </div>
          <div className="iv-console-body">
            {output ? (
              <pre className={output.stderr ? 'err' : ''}>{output.stdout || output.stderr}</pre>
            ) : (
              <span className="muted">Execute your solution to see results...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderFollowup = () => (
    <div className="iv-followup-layout">
      <div className="iv-chat-window">
        <div className="iv-panel-header">
          <LucideIcons.MessageSquare size={14} />
          <span>Follow-up Discussion</span>
        </div>
        <div className="iv-chat-messages scrollable">
          {messages.map((m, i) => (
            <div key={i} className={`iv-msg ${m.role}`}>
              <div className="iv-msg-avatar">
                {m.role === 'model' ? <LucideIcons.UserCheck size={14} /> : (user?.username?.[0] || 'U')}
              </div>
              <div className="iv-msg-content">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="iv-chat-input-area">
          <input 
            type="text" 
            placeholder="Type your explanation..." 
            value={chatInput} 
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendFollowup()}
          />
          <button onClick={handleSendFollowup} disabled={loading}><LucideIcons.Send size={16} /></button>
        </div>
      </div>
      <div className="iv-reference-code">
        <div className="iv-panel-header">Your Solution (Reference)</div>
        <div className="iv-ref-code-body">
          <CodeEditor value={code} onChange={() => {}} language={language} theme="vs-dark" />
        </div>
      </div>
    </div>
  );

  const renderResult = () => (
    <div className="iv-result-card">
      <div className="iv-result-header">
        <LucideIcons.Award size={48} color={result?.includes('HIRED') ? '#22c55e' : '#666'} />
        <h2>Interview Complete</h2>
        <p>Your performance has been evaluated by the Hiring Committee.</p>
      </div>
      <div className="iv-result-body scrollable">
        <ReactMarkdown>{result || 'Calculating score...'}</ReactMarkdown>
      </div>
      <button className="iv-exit-btn" onClick={() => navigate('/workspace')}>Back to Workspace</button>
    </div>
  );

  return (
    <div className="iv-root">
      <ImmersiveNav 
        title="Technical Interview" 
        subtitle={phase === PHASES.CODING ? `Phase: Coding (${difficulty})` : phase === PHASES.FOLLOWUP ? 'Phase: Follow-up' : 'Phase: Evaluation'}
        timer={phase === PHASES.CODING ? formatTime(timeLeft) : null}
        onExit={() => {
           if (window.confirm("Quitting now will mark this session as 'Incomplete'. Are you sure?")) {
              navigate('/workspace');
           }
        }}
        actions={
          phase === PHASES.CODING && (
            <div className="iv-nav-actions">
              <button className="iv-nav-run-btn" onClick={handleRun} disabled={runCount >= maxRuns || running}>
                 <LucideIcons.Play size={13} /> Run
              </button>
              <button className="iv-nav-submit-btn" onClick={handleCompleteCoding}>
                 <LucideIcons.CheckSquare size={13} /> Submit Solution
              </button>
            </div>
          )
        }
      />
      
      <main className="iv-content">
        {phase === PHASES.SETUP && renderSetup()}
        {phase === PHASES.CODING && renderCoding()}
        {phase === PHASES.FOLLOWUP && renderFollowup()}
        {phase === PHASES.RESULT && renderResult()}
      </main>
    </div>
  );
}

export default Interview;
