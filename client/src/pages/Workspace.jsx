import { useState, useRef, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor/CodeEditor';
import OutputPanel from '../components/OutputPanel/OutputPanel';
import { streamAIChat, fetchGeneratedTests, runCode } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { EDITOR_MODES } from '../modes/modeConfig';
import * as LucideIcons from 'lucide-react';
import '../App.css';

function ModeIcon({ name, size = 16, color, strokeWidth = 1.8 }) {
  const Icon = LucideIcons[name];
  if (!Icon) return null;
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}

function Workspace() {
  const [code, setCode] = useState('// Type or paste your code here...\n');
  const [language, setLanguage] = useState('javascript');
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState(EDITOR_MODES[0]);
  const [testCases, setTestCases] = useState([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [runningTests, setRunningTests] = useState(false);
  const [activeTab, setActiveTab] = useState('testcase');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('apollo-theme');
    return saved ? saved === 'dark' : true;
  });
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [outputOpen, setOutputOpen] = useState(false);
  const [stdin, setStdin] = useState('');

  // Resizable panel widths
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [chatWidth, setChatWidth] = useState(340);
  const dragging = useRef(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleMouseDown = useCallback((panel, e) => {
    e.preventDefault();
    dragging.current = panel;
    startX.current = e.clientX;
    startWidth.current = panel === 'sidebar' ? sidebarWidth : chatWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [sidebarWidth, chatWidth]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragging.current) return;
      const delta = e.clientX - startX.current;
      if (dragging.current === 'sidebar') {
        setSidebarWidth(Math.max(160, Math.min(400, startWidth.current + delta)));
      } else if (dragging.current === 'chat') {
        setChatWidth(Math.max(240, Math.min(600, startWidth.current - delta)));
      }
    };
    const handleMouseUp = () => {
      if (dragging.current) {
        dragging.current = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) { root.classList.remove('light-mode'); root.classList.add('dark-mode'); }
    else { root.classList.remove('dark-mode'); root.classList.add('light-mode'); }
    localStorage.setItem('apollo-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleModeSelect = (mode) => {
    setActiveMode(mode);
    setMessages([]);
    setChatInput('');
  };

  // Run the selected Type 1 mode on the code
  const handleAskAI = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setMessages([
      { role: 'user', content: `Please run ${activeMode.label} mode on my code.` },
      { role: 'model', content: '' }
    ]);
    await streamAIChat({
      code, language,
      mode: activeMode.key,
      history: [],
      onChunk: (text) => setAiResponse((prev) => prev + text),
      onError: () => setAiResponse('Error: Could not generate response.'),
    });
    setLoading(false);
  };

  const handleGenerateTests = async () => {
    if (!code.trim()) return;
    setLoadingTests(true);
    setTestCases([]);
    try {
      const generated = await fetchGeneratedTests({ code, language });
      setTestCases(generated.map(tc => ({ ...tc, status: 'pending', actualOutput: null })));
      setActiveTab('testcase');
    } catch {
      setTestCases([{ inputs: 'Error', expectedOutput: '', callCode: '', status: 'failed', actualOutput: 'Could not generate tests' }]);
    }
    setLoadingTests(false);
  };

  const handleRunTests = async () => {
    if (!testCases.length || !code.trim()) return;
    setRunningTests(true);
    const results = [...testCases];
    for (let i = 0; i < results.length; i++) {
      const tc = results[i];
      const payload = tc.fullExecutableCode || `${code}\n\n${tc.callCode}`;
      try {
        const res = await runCode({ code: payload, language });
        results[i].actualOutput = res.stdout.trim();
        results[i].status = res.stdout.trim() === tc.expectedOutput.trim() ? 'passed' : 'failed';
      } catch (e) {
        results[i].actualOutput = e.message;
        results[i].status = 'error';
      }
      if (i < results.length - 1) await new Promise(r => setTimeout(r, 1500));
    }
    setTestCases(results);
    setActiveTab('testresult');
    setRunningTests(false);
  };

  const handleRun = async () => {
    if (!code.trim()) return;
    setRunning(true);
    setOutput(null);
    setOutputOpen(true);
    try {
      const result = await runCode({ code, language, stdin });
      setOutput(result);
    } catch (error) {
      setOutput({ stdout: '', stderr: error.message, exitCode: 1 });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className={`ws-root ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* ═══════ TOP BAR ═══════ */}
      <div className="ws-topbar">
        <div className="ws-topbar-left">
          <div className="ws-topbar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <LucideIcons.Sparkles size={16} color="#9B40E0" />
            <span>Apollo</span>
          </div>
          <div className="ws-topbar-divider" />
          <select className="ws-lang-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          <div className="ws-active-mode-badge" style={{ color: activeMode.color, borderColor: `${activeMode.color}30` }}>
            <ModeIcon name={activeMode.lucideIcon} size={13} color={activeMode.color} />
            <span>{activeMode.label}</span>
          </div>
        </div>

        <div className="ws-topbar-center">
          <button onClick={handleRun} disabled={running || !code.trim()} className="ws-btn ws-btn-run">
            <LucideIcons.Play size={13} /> {running ? 'Running...' : 'Run Code'}
          </button>
          <button onClick={handleAskAI} disabled={loading || !code.trim()} className="ws-btn ws-btn-ai"
            style={{ borderColor: `${activeMode.color}30`, color: activeMode.color }}>
            <ModeIcon name={activeMode.lucideIcon} size={13} color={activeMode.color} />
            {loading ? 'Thinking...' : activeMode.label}
          </button>
          <button onClick={handleGenerateTests} disabled={loadingTests || !code.trim()} className="ws-btn ws-btn-test">
            <LucideIcons.FlaskConical size={13} /> {loadingTests ? 'Generating...' : 'Tests'}
          </button>
        </div>

        <div className="ws-topbar-right">
          <button className="ws-icon-btn" onClick={() => setDarkMode(!darkMode)} title="Toggle theme">
            {darkMode ? <LucideIcons.Moon size={15} /> : <LucideIcons.Sun size={15} />}
          </button>
          <div className="ws-topbar-divider" />
          <div className="ws-user-badge">
            <div className="ws-user-avatar">{(user?.username || 'U').charAt(0).toUpperCase()}</div>
            <div className="ws-user-info">
              <span className="ws-user-name">{user?.username || 'User'}</span>
              <span className="ws-user-email">{user?.email || ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ BODY: 3 COLUMNS ═══════ */}
      <div className="ws-body">
        {/* LEFT SIDEBAR — Only Type 1 (Editor) modes */}
        <aside className="ws-sidebar" style={{ width: sidebarWidth, minWidth: sidebarWidth }}>
          <div className="ws-sidebar-section">
            <span className="ws-section-label">WORKSPACES</span>
            <button className="ws-mode-item active" onClick={() => navigate('/workspace')}>
              <LucideIcons.Code2 size={15} color="#9B40E0" />
              <span>Code Editor</span>
            </button>
            <button className="ws-mode-item" onClick={() => navigate('/workspace/chat')}>
              <LucideIcons.MessageSquare size={15} color="#666" />
              <span>AI Coaching Chat</span>
            </button>
          </div>

          <div className="ws-sidebar-section">
            <span className="ws-section-label">IMMERSIVE</span>
            <button className="ws-mode-item" onClick={() => navigate('/interview')}>
              <LucideIcons.ShieldCheck size={15} color="#666" />
              <span>Interview Prep</span>
            </button>
            <button className="ws-mode-item" onClick={() => navigate('/focus')}>
              <LucideIcons.Target size={15} color="#666" />
              <span>Focus Session</span>
            </button>
          </div>

          <div className="ws-sidebar-section" style={{ flex: 1, overflowY: 'auto' }}>
            <span className="ws-section-label">CODE ANALYSIS</span>
            <nav className="ws-mode-list">
              {EDITOR_MODES.map((mode) => (
                <button
                  key={mode.key}
                  className={`ws-mode-item ${activeMode.key === mode.key ? 'active' : ''}`}
                  onClick={() => handleModeSelect(mode)}
                  title={mode.description}
                >
                  <ModeIcon name={mode.lucideIcon} size={15} color={activeMode.key === mode.key ? mode.color : '#666'} />
                  <span>{mode.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="ws-sidebar-bottom">
            <button className="ws-mode-item" onClick={logout}>
              <LucideIcons.LogOut size={15} color="#666" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <div className="ws-resize-handle" onMouseDown={(e) => handleMouseDown('sidebar', e)} />

        {/* CENTER EDITOR */}
        <main className="ws-main">
          <div className="ws-editor-area">
            <div className="ws-editor-panel">
              <div className="ws-editor-wrapper" style={{ borderBottom: testCases.length > 0 ? '1px solid var(--ws-border)' : 'none' }}>
                <CodeEditor language={language} value={code} onChange={setCode} theme={darkMode ? 'vs-dark' : 'light'} />
              </div>

              {testCases.length > 0 && (
                <div className="test-console">
                  <div className="test-tabs">
                    <button className={`test-tab ${activeTab === 'testcase' ? 'active' : ''}`} onClick={() => setActiveTab('testcase')}>Testcases</button>
                    <button className={`test-tab ${activeTab === 'testresult' ? 'active' : ''}`} onClick={() => setActiveTab('testresult')}>Test Result</button>
                    <button className="test-run-btn" onClick={handleRunTests} disabled={runningTests}>
                      {runningTests ? 'Running...' : 'Run Tests'}
                    </button>
                  </div>
                  <div className="test-content">
                    {testCases.map((tc, index) => (
                      <div key={index} className="test-case-card">
                        <h4 className="test-case-title">
                          Test {index + 1}
                          {activeTab === 'testresult' && tc.status !== 'pending' && (
                            <span className={`status-badge ${tc.status}`}>{tc.status}</span>
                          )}
                        </h4>
                        <div className="test-field"><strong>Input:</strong><pre>{tc.inputs}</pre></div>
                        <div className="test-field"><strong>Expected:</strong><pre>{tc.expectedOutput}</pre></div>
                        {activeTab === 'testresult' && tc.actualOutput !== null && (
                          <div className="test-field"><strong>Your Output:</strong><pre>{tc.actualOutput || 'N/A'}</pre></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {outputOpen && (
              <OutputPanel output={output} running={running} onClose={() => setOutputOpen(false)} stdin={stdin} onStdinChange={setStdin} />
            )}
          </div>
        </main>

        <div className="ws-resize-handle" onMouseDown={(e) => handleMouseDown('chat', e)} />

        {/* RIGHT PANEL — AI Result for the selected Type 1 mode */}
        <aside className="ws-chat" style={{ width: chatWidth, minWidth: chatWidth }}>
          <div className="ws-chat-header">
            <ModeIcon name={activeMode.lucideIcon} size={15} color={activeMode.color} />
            <span style={{ color: activeMode.color }}>{activeMode.label}</span>
          </div>
          <div className="ws-chat-body" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
            {messages.length > 0 ? (
              <div className="ws-chat-messages" style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '16px' }}>
                {messages.map((msg, i) => (
                   <div key={i} className={`ws-chat-msg ${msg.role === 'model' ? 'ai-msg' : 'user-msg'}`} style={{
                     alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                     background: msg.role === 'user' ? (darkMode ? '#323842' : '#e1e4e8') : 'transparent',
                     padding: msg.role === 'user' ? '10px 14px' : '0',
                     borderRadius: msg.role === 'user' ? '12px 12px 0 12px' : '0',
                     maxWidth: '90%',
                     overflowX: 'auto',
                     fontSize: '0.92rem',
                     wordBreak: 'break-word'
                   }}>
                     {msg.role === 'model' ? <ReactMarkdown>{msg.content}</ReactMarkdown> : <span style={{ color: darkMode ? '#c9d1d9' : '#24292f' }}>{msg.content}</span>}
                   </div>
                ))}
              </div>
            ) : (
              <div className="ws-chat-empty">
                <div className="ws-chat-empty-icon">
                  <ModeIcon name={activeMode.lucideIcon} size={28} color={`${activeMode.color}50`} />
                </div>
                <p>Select a mode and click <strong>{activeMode.label}</strong> to analyze your code.</p>
              </div>
            )}
          </div>
          {messages.length > 0 && (
            <div className="ws-chat-input-area" style={{ padding: '12px', borderTop: '1px solid var(--ws-border)', display: 'flex', gap: '8px', background: darkMode ? '#1e1e1e' : '#fff' }}>
              <input 
                type="text" 
                value={chatInput} 
                onChange={(e) => setChatInput(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                placeholder="Ask a follow-up question..." 
                disabled={loading}
                style={{ flex: 1, background: darkMode ? '#0d1117' : '#f6f8fa', color: darkMode ? '#c9d1d9' : '#24292f', border: '1px solid var(--ws-border)', padding: '10px 14px', borderRadius: '6px', outline: 'none' }}
              />
              <button 
                onClick={handleSendMessage} 
                disabled={loading || !chatInput.trim()} 
                className="ws-btn ws-btn-run"
                style={{ padding: '8px 12px', borderRadius: '6px' }}
              >
                <LucideIcons.Send size={15} />
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default Workspace;
