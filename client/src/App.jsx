import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import CodeEditor from './components/CodeEditor/CodeEditor';
import './App.css';

function App() {
  const [code, setCode] = useState('// Type or paste your code here...\n');
  const [language, setLanguage] = useState('javascript');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExplain = async () => {
    if (!code.trim()) return;
    
    setLoading(true);
    setExplanation(''); // Clear previous explanation

    try {
      // Connect to our streaming backend
      const response = await fetch('http://localhost:5000/api/ai/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, language }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch explanation');
      }

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          
          // The server sends SSE formatted chunks like: "data: {\"text\":\"Hello\"}\n\n"
          // We need to parse them
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              
              if (dataStr === '[DONE]') {
                done = true;
                break;
              }

              if (dataStr) {
                try {
                  const dataObj = JSON.parse(dataStr);
                  // Append the new text token to our existing explanation state
                  setExplanation((prev) => prev + dataObj.text);
                } catch (e) {
                  console.error('Error parsing stream chunk', dataStr);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setExplanation('Error: Could not generate explanation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Apollo 🚀</h1>
        <p>Your AI Coding Coach - Code Explainer Mode</p>
      </header>

      <div className="workspace">
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
            <button 
              onClick={handleExplain} 
              disabled={loading || !code.trim()}
              className="explain-btn"
            >
              {loading ? 'Thinking...' : 'Explain Code'}
            </button>
          </div>
          
          <div className="editor-wrapper">
            <CodeEditor
              language={language}
              value={code}
              onChange={setCode}
            />
          </div>
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

export default App;
