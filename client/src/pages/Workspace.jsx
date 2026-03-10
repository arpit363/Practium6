import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import CodeEditor from '../components/CodeEditor/CodeEditor';
import OutputPanel from '../components/OutputPanel/OutputPanel';
import { streamExplainCode, runCode } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';
import '../App.css';

function Workspace() {
  const [code, setCode] = useState('// Type or paste your code here...\n');
  const [language, setLanguage] = useState('javascript');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);

  // Code execution state
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [outputOpen, setOutputOpen] = useState(false);
  
  const { logout, user } = useAuth();

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
          <h1>Apollo 🚀</h1>
          <p>Your AI Coding Coach - Workspace</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                  {running ? '⏳ Running...' : '▶ Run Code'}
                </button>
                <button
                  onClick={handleExplain}
                  disabled={loading || !code.trim()}
                  className="explain-btn"
                >
                  {loading ? 'Thinking...' : 'Explain Code'}
                </button>
              </div>
            </div>

            <div className="editor-wrapper">
              <CodeEditor
                language={language}
                value={code}
                onChange={setCode}
              />
            </div>
          </div>

          {outputOpen && (
            <OutputPanel
              output={output}
              running={running}
              onClose={() => setOutputOpen(false)}
            />
          )}
        </div>

        <div className="chat-panel">
          <h2>Explanation</h2>
          <div className="markdown-container">
            {explanation ? (
              <ReactMarkdown>{explanation}</ReactMarkdown>
            ) : (
              <p className="placeholder">Ask Apollo to explain your code.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Workspace;
