import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor/CodeEditor';
import OutputPanel from '../components/OutputPanel/OutputPanel';
import { streamExplainCode, streamAnalyzeComplexity, fetchGeneratedTests, runCode } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';
import '../App.css';

function Workspace() {
  const [code, setCode] = useState('// Type or paste your code here...\n');
  const [language, setLanguage] = useState('javascript');
  const [explanation, setExplanation] = useState('');
  const [complexity, setComplexity] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingComplexity, setLoadingComplexity] = useState(false);
  const [testCases, setTestCases] = useState([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [runningTests, setRunningTests] = useState(false);
  const [activeTab, setActiveTab] = useState('testcase'); // 'testcase' | 'testresult'

  // Code execution state
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [outputOpen, setOutputOpen] = useState(false);
  
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleExplain = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setExplanation('');

    await streamExplainCode({
      code,
      language,
      onChunk: (text) => setExplanation((prev) => prev + text),
      onError: () => setExplanation('Error: Could not generate explanation.'),
    });

    setLoading(false);
  };

  const handleAnalyzeComplexity = async () => {
    if (!code.trim()) return;

    setLoadingComplexity(true);
    setComplexity('');

    await streamAnalyzeComplexity({
      code,
      language,
      onChunk: (text) => setComplexity((prev) => prev + text),
      onError: () => setComplexity('Error: Could not generate complexity analysis.'),
    });

    setLoadingComplexity(false);
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
        // Stagger requests to avoid rate-limiting on Judge0's public API
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
      const result = await runCode({ code, language });
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
          <p>Your AI Coding Coach - Workspace</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/roast')} 
            style={{ background: 'linear-gradient(45deg, #ff4b4b, #ff8f00)', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            🔥 Roast Mode
          </button>
          <span>Welcome, {user?.username}</span>
          <button 
            onClick={logout} 
            title="Logout"
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--accent-primary, #646cff)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </header>

      <div className="workspace">
        <div className="editor-section">
          <div className="editor-panel">
            <div className="controls">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
              <div className="controls-right">
                <button
                  onClick={handleRun}
                  disabled={running || !code.trim()}
                  className="run-btn"
                >
                  {running ? 'Running...' : 'Run Code'}
                </button>
                <button
                  onClick={handleExplain}
                  disabled={loading || !code.trim()}
                  className="explain-btn"
                >
                  {loading ? 'Thinking...' : 'Explain Code'}
                </button>
                <button
                  onClick={handleAnalyzeComplexity}
                  disabled={loadingComplexity || !code.trim()}
                  className="explain-btn"
                  style={{ marginLeft: '10px' }}
                >
                  {loadingComplexity ? 'Analyzing...' : 'Analyze Complexity'}
                </button>
                <button
                  onClick={handleGenerateTests}
                  disabled={loadingTests || !code.trim()}
                  className="explain-btn"
                  style={{ marginLeft: '10px' }}
                >
                  {loadingTests ? 'Generating...' : 'Generate Tests'}
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
            />
          )}
        </div>

        <div className="chat-panel" style={{ overflowY: 'auto' }}>
          <h2>Explanation</h2>
          <div className="markdown-container" style={{ marginBottom: '1rem' }}>
            {explanation ? (
              <ReactMarkdown>{explanation}</ReactMarkdown>
            ) : (
              <p className="placeholder">Ask Apollo to explain your code.</p>
            )}
          </div>
          
          <h2>Complexity Analysis</h2>
          <div className="markdown-container" style={{ marginBottom: '1rem' }}>
            {complexity ? (
              <ReactMarkdown>{complexity}</ReactMarkdown>
            ) : (
              <p className="placeholder">Ask Apollo to analyze the time and space complexity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Workspace;
