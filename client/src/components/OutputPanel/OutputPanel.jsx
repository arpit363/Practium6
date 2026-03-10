import './OutputPanel.css';

function OutputPanel({ output, running, onClose }) {
  return (
    <div className="output-panel">
      <div className="output-header">
        <span>⬤ Output</span>
        <button className="output-close" onClick={onClose}>✕</button>
      </div>
      <div className="output-content">
        {running ? (
          <p className="output-running">Executing your code...</p>
        ) : output ? (
          <>
            {output.stdout && <pre className="output-stdout">{output.stdout}</pre>}
            {output.stderr && <pre className="output-stderr">{output.stderr}</pre>}
            {!output.stdout && !output.stderr && (
              <p className="output-empty">
                Program finished with no output (exit code: {output.exitCode})
              </p>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

export default OutputPanel;
