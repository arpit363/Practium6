import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as LucideIcons from 'lucide-react';
import './Features.css';

/* ═══════════════════════════════════════════
   FEATURE CARDS DATA
   ═══════════════════════════════════════════ */

const WORKSPACE_MODES = [
  {
    key: 'explain',
    label: 'Code Explainer',
    icon: 'BookOpen',
    color: '#58a6ff',
    desc: 'Breaks down your code line-by-line with clear explanations for any skill level.',
  },
  {
    key: 'roast',
    label: 'Roast My Code',
    icon: 'Flame',
    color: '#f85149',
    desc: 'Brutal but constructive code critique with humor — your code will never be the same.',
  },
  {
    key: 'review',
    label: 'Code Review',
    icon: 'Search',
    color: '#4bccff',
    desc: 'Finds bugs, anti-patterns, SOLID violations, and suggests professional fixes.',
  },
  {
    key: 'complexity',
    label: 'Complexity Analyzer',
    icon: 'Timer',
    color: '#d29922',
    desc: 'Parses Big-O time and space complexity with line-by-line breakdown.',
  },
  {
    key: 'refactor',
    label: 'Refactor Studio',
    icon: 'RefreshCw',
    color: '#39d353',
    desc: 'Converts messy spaghetti code into clean, modern, production-ready implementations.',
  },
  {
    key: 'debug',
    label: 'Debug Companion',
    icon: 'Bug',
    color: '#f778ba',
    desc: 'Reads errors, finds the flawed line, and delivers step-by-step fixes.',
  },
  {
    key: 'security',
    label: 'Security Guardian',
    icon: 'Shield',
    color: '#ff7b72',
    desc: 'Scans for vulnerabilities — SQLi, XSS, CSRF — and patches them instantly.',
  },
  {
    key: 'multilingual',
    label: 'Multilingual Mode',
    icon: 'Globe',
    color: '#79c0ff',
    desc: 'Explains programming concepts in any spoken language for global accessibility.',
  },
];

const STUDY_MODES = [
  {
    key: 'dsa',
    label: 'DSA Learning',
    icon: 'BarChart3',
    color: '#3fb950',
    desc: 'Guides you from brute-force to optimal O(N) solutions with visual complexity analysis.',
  },
  {
    key: 'hint',
    label: 'Hint Assistant',
    icon: 'Lightbulb',
    color: '#f0883e',
    desc: 'Refuses to give direct answers — provides progressive logic hints to trigger self-discovery.',
  },
  {
    key: 'socratic',
    label: 'Socratic Coach',
    icon: 'Brain',
    color: '#a371f7',
    desc: 'Responds only with carefully crafted guiding questions that lead you to the answer.',
  },
  {
    key: 'persona_yoda',
    label: 'Yoda Persona',
    icon: 'Wand2',
    color: '#7ee787',
    desc: 'Teaches you the code, Yoda will. Backwards speech and ancient wisdom included.',
  },
  {
    key: 'persona_friendly',
    label: 'Friendly Buddy',
    icon: 'Heart',
    color: '#f0883e',
    desc: 'Warm, encouraging, and infinitely patient. The perfect companion for beginners.',
  },
  {
    key: 'persona_strict',
    label: 'Strict Teacher',
    icon: 'GraduationCap',
    color: '#8b949e',
    desc: 'No hand-holding. Expects excellence, precision, and clean code at all times.',
  },
];

/* ═══════════════════════════════════════════
   HELPER: Render Lucide Icon
   ═══════════════════════════════════════════ */
function Icon({ name, size = 20, color = '#fff', strokeWidth = 1.8 }) {
  const Comp = LucideIcons[name];
  if (!Comp) return null;
  return <Comp size={size} color={color} strokeWidth={strokeWidth} />;
}

/* ═══════════════════════════════════════════
   FEATURE CARD
   ═══════════════════════════════════════════ */
function FeatureCard({ mode }) {
  return (
    <div className="ft-card">
      <div className="ft-card-icon" style={{ background: `${mode.color}12`, borderColor: `${mode.color}25` }}>
        <Icon name={mode.icon} size={22} color={mode.color} />
      </div>
      <h3 className="ft-card-title" style={{ color: mode.color }}>{mode.label}</h3>
      <p className="ft-card-desc">{mode.desc}</p>
      <Link to="/workspace" className="ft-card-link" style={{ color: mode.color }}>
        Try it <span>→</span>
      </Link>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN FEATURES PAGE
   ═══════════════════════════════════════════ */
function Features() {
  const { user } = useAuth();

  return (
    <div className="ft-page">
      {/* Background aurora */}
      <div className="ft-aurora">
        <div className="ft-orb ft-orb-1" />
        <div className="ft-orb ft-orb-2" />
        <div className="ft-orb ft-orb-3" />
      </div>

      {/* Navigation */}
      <nav className="ft-nav">
        <Link to="/" className="ft-nav-logo"><em>Apollo</em></Link>
        <div className="ft-nav-right">
          <Link to="/" className="ft-nav-link">Home</Link>
          <Link to={user ? '/workspace' : '/auth'} className="ft-nav-cta">
            {user ? 'Open Workspace' : 'Get Started'} →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="ft-hero">
        <span className="ft-badge">
          <span className="ft-badge-dot" />
          14 AI Modes Available
        </span>
        <h1 className="ft-title">
          Every mode you'll{' '}
          <span className="ft-serif">ever need.</span>
        </h1>
        <p className="ft-subtitle">
          From code reviews to DSA coaching, Apollo's AI modes cover every scenario.
          Pick a mode, paste your code, and get instant, streaming feedback.
        </p>
      </header>

      {/* ───── WORKSPACE SECTION ───── */}
      <section className="ft-section">
        <div className="ft-section-header">
          <div className="ft-section-icon">
            <LucideIcons.Code2 size={20} color="#7B2FBE" />
          </div>
          <div>
            <h2 className="ft-section-title">Workspace</h2>
            <p className="ft-section-desc">Code analysis, debugging, and professional-grade tooling.</p>
          </div>
        </div>
        <div className="ft-grid">
          {WORKSPACE_MODES.map((m) => (
            <FeatureCard key={m.key} mode={m} />
          ))}
        </div>
      </section>

      {/* ───── START STUDY SECTION ───── */}
      <section className="ft-section">
        <div className="ft-section-header">
          <div className="ft-section-icon">
            <LucideIcons.GraduationCap size={20} color="#22c55e" />
          </div>
          <div>
            <h2 className="ft-section-title">Start Study</h2>
            <p className="ft-section-desc">Learning-focused modes that coach, guide, and teach you.</p>
          </div>
        </div>
        <div className="ft-grid">
          {STUDY_MODES.map((m) => (
            <FeatureCard key={m.key} mode={m} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="ft-cta">
        <h2 className="ft-cta-title">
          Ready to <span className="ft-serif">start?</span>
        </h2>
        <p className="ft-cta-desc">
          Open the workspace and experience every mode, streaming at zero latency.
        </p>
        <Link to={user ? '/workspace' : '/auth'} className="ft-cta-btn">
          {user ? 'Open Workspace' : 'Get Started Free'} →
        </Link>
      </section>

      {/* Footer */}
      <footer className="ft-footer">
        <span>Apollo · Built with React + Gemini AI</span>
        <Link to="/">Back to Home</Link>
      </footer>
    </div>
  );
}

export default Features;
