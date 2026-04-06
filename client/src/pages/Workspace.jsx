import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor/CodeEditor';
import OutputPanel from '../components/OutputPanel/OutputPanel';
import { streamAIChat, fetchGeneratedTests, runCode } from '../services/api';
import { useAuth } from '../context/AuthContext';
import MODES from '../modes/modeConfig';
import { LogOut, ChevronDown } from 'lucide-react';
import '../App.css';

function Workspace() {
  const [code, setCode] = useState('// Type or paste your code here...\n');
  const [language, setLanguage] = useState('javascript');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [testCases, setTestCases] = useState([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [runningTests, setRunningTests] = useState(false);
  const [activeTab, setActiveTab] = useState('testcase');

  // Mode state
  const [activeMode, setActiveMode] = useState(MODES[0]); // default: explain
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Code execution state
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [outputOpen, setOutputOpen] = useState(false);
  const [stdin, setStdin] = useState('');
  
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setModeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleModeSelect = (mode) => {
    setActiveMode(mode);
    setModeDropdownOpen(false);
    setAiResponse(''); // clear previous response on mode switch
  };

  // Unified AI action — uses the selected mode
  const handleAskAI = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setAiResponse('');

    await streamAIChat({
      code,
      language,
      mode: activeMode.key,
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
      const initializedCases = generated.map(tc => ({
        ...tc,
        status: 'pending',
        actualOutput: null
      }));
      setTestCases(initializedCases);
      setActiveTab('testcase');
    } catch (e) {
      console.error('Error fetching generated tests:', e);
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
        const runCodePayload = tc.fullExecutableCode || `${code}\n\n${tc.callCode}`;
        try {
            const res = await runCode({ code: runCodePayload, language });
            results[i].actualOutput = res.stdout.trim();
            results[i].status = res.stdout.trim() === tc.expectedOutput.trim() ? 'passed' : 'failed';
        } catch (e) {
            results[i].actualOutput = e.message;
            results[i].status = 'error';
        }
        if (i < results.length - 1) {
            await new Promise(r => setTimeout(r, 1500));
        }
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
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Apollo</h1>
          <p>Your AI Coding Coach</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#888', fontSize: '0.82rem', fontWeight: 500 }}>Welcome, {user?.username}</span>
          <button 
            onClick={logout} 
            title="Logout"
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              color: '#AAAAAA', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '50px',
              fontSize: '0.8rem',
              fontFamily: 'DM Sans, Inter, sans-serif',
              transition: 'all 0.15s',
            }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <div className="workspace">
        <div className="editor-section">
          <div className="editor-panel">
            <div className="controls">
              {/* Left: Language + Mode Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>

                {/* ── Mode Switch Dropdown ── */}
                <div className="mode-dropdown" ref={dropdownRef}>
                  <button
                    className="mode-dropdown-trigger"
                    onClick={() => setModeDropdownOpen(!modeDropdownOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${activeMode.color}35`,
                      borderRadius: '50px',
                      padding: '0.45rem 0.85rem',
                      color: activeMode.color,
                      cursor: 'pointer',
                      fontFamily: 'DM Sans, Inter, sans-serif',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span>{activeMode.icon}</span>
                    <span>{activeMode.label}</span>
                    <ChevronDown 
                      size={14} 
                      style={{ 
                        transform: modeDropdownOpen ? 'rotate(180deg)' : 'rotate(0)', 
                        transition: 'transform 0.2s' 
                      }} 
                    />
                  </button>

                  {modeDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '6px',
                        background: '#111111',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '14px',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                        zIndex: 999,
                        width: '280px',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        padding: '6px',
                      }}
                    >
                      {MODES.map((mode) => (
                        <button
                          key={mode.key}
                          onClick={() => handleModeSelect(mode)}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.6rem',
                            width: '100%',
                            padding: '0.5rem 0.6rem',
                            border: 'none',
                            borderRadius: '10px',
                            background: activeMode.key === mode.key ? `${mode.color}15` : 'transparent',
                            cursor: 'pointer',
                            textAlign: 'left',
                            color: '#fff',
                            fontFamily: 'DM Sans, Inter, sans-serif',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = `${mode.color}12`}
                          onMouseLeave={(e) => e.currentTarget.style.background = activeMode.key === mode.key ? `${mode.color}18` : 'transparent'}
                        >
                          <span style={{ fontSize: '1rem', lineHeight: '1.4' }}>{mode.icon}</span>
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: mode.color }}>
                              {mode.label}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#888', lineHeight: '1.3', marginTop: '2px' }}>
                              {mode.description}
                            </div>
                          </div>
                          {activeMode.key === mode.key && (
                            <span style={{ marginLeft: 'auto', color: mode.color, fontSize: '0.8rem', flexShrink: 0 }}>✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Action Buttons */}
              <div className="controls-right">
                <button
                  onClick={handleRun}
                  disabled={running || !code.trim()}
                  className="run-btn"
                >
                  {running ? 'Running...' : '▶ Run Code'}
                </button>
                <button
                  onClick={handleAskAI}
                  disabled={loading || !code.trim()}
                  className="explain-btn"
                  style={{ 
                    background: loading ? undefined : `linear-gradient(135deg, ${activeMode.color}, ${activeMode.color}cc)`,
                    color: '#fff',
                    border: 'none',
                  }}
                >
                  {loading ? '⏳ Thinking...' : `${activeMode.icon} ${activeMode.label}`}
                </button>
                <button
                  onClick={handleGenerateTests}
                  disabled={loadingTests || !code.trim()}
                  className="explain-btn"
                >
                  {loadingTests ? 'Generating...' : '🧪 Generate Tests'}
                </button>
              </div>
            </div>

            <div className="editor-wrapper" style={{ flex: 1, borderBottom: testCases.length > 0 ? '1px solid var(--border-color)' : 'none' }}>
              <CodeEditor
                language={language}
                value={code}
                onChange={setCode}
              />
            </div>
            
            {testCases.length > 0 && (
              <div className="test-console">
                <div className="test-tabs">
                  <button 
                    className={`test-tab ${activeTab === 'testcase' ? 'active' : ''}`}
                    onClick={() => setActiveTab('testcase')}
                  >
                    Testcases
                  </button>
                  <button 
                    className={`test-tab ${activeTab === 'testresult' ? 'active' : ''}`}
                    onClick={() => setActiveTab('testresult')}
                  >
                    Test Result
                  </button>
                  <button 
                    className="test-run-btn"
                    onClick={handleRunTests}
                    disabled={runningTests}
                  >
                    {runningTests ? 'Running...' : 'Run Test Cases'}
                  </button>
                </div>
                <div className="test-content">
                  {testCases.map((tc, index) => (
                    <div key={index} className="test-case-card">
                      <h4 className="test-case-title">Test Case {index + 1}
                         {activeTab === 'testresult' && tc.status !== 'pending' && (
                           <span className={`status-badge ${tc.status}`}>{tc.status}</span>
                         )}
                      </h4>
                      <div className="test-field">
                        <strong>Input:</strong>
                        <pre>{tc.inputs}</pre>
                      </div>
                      <div className="test-field">
                        <strong>Expected Output:</strong>
                        <pre>{tc.expectedOutput}</pre>
                      </div>
                      {activeTab === 'testresult' && tc.actualOutput !== null && (
                        <div className="test-field">
                          <strong>Your Output:</strong>
                          <pre>{tc.actualOutput || 'N/A'}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {outputOpen && (
            <OutputPanel
              output={output}
              running={running}
              onClose={() => setOutputOpen(false)}
              stdin={stdin}
              onStdinChange={setStdin}
            />
          )}
        </div>

        {/* Right: AI Response Panel */}
        <div className="chat-panel" style={{ overflowY: 'auto' }}>
          <h2 style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            color: activeMode.color,
          }}>
            <span>{activeMode.icon}</span> 
            {activeMode.label}
          </h2>
          <div className="markdown-container" style={{ marginBottom: '1rem' }}>
            {aiResponse ? (
              <ReactMarkdown>{aiResponse}</ReactMarkdown>
            ) : (
              <p className="placeholder">
                Select a mode and click <strong>{activeMode.icon} {activeMode.label}</strong> to analyze your code.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Workspace;
