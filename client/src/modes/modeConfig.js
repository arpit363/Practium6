/**
 * Apollo — AI Mode Configuration
 * Each mode defines a unique AI persona/behavior injected as a system prompt.
 * The `key` is sent to the backend to select the prompt.
 */

const MODES = [
  {
    key: 'explain',
    label: 'Code Explainer',
    icon: '📖',
    color: '#58a6ff',
    description: 'Breaks down your code line-by-line for any level.',
  },
  {
    key: 'socratic',
    label: 'Socratic Coach',
    icon: '🧠',
    color: '#a371f7',
    description: 'Responds only with guiding questions to trigger self-discovery.',
  },
  {
    key: 'hint',
    label: 'Hint-First Assistant',
    icon: '💡',
    color: '#f0883e',
    description: 'Refuses direct answers — gives logic hints instead.',
  },
  {
    key: 'dsa',
    label: 'DSA Learning',
    icon: '📊',
    color: '#3fb950',
    description: 'Analyzes time complexity and guides from brute-force to O(N).',
  },
  {
    key: 'roast',
    label: 'Roast My Code',
    icon: '🔥',
    color: '#f85149',
    description: 'Brutal but constructive code critique with humor.',
  },
  {
    key: 'review',
    label: 'Code Review',
    icon: '🔍',
    color: '#4bccff',
    description: 'Finds bugs, anti-patterns, and SOLID violations.',
  },
  {
    key: 'complexity',
    label: 'Complexity Analyzer',
    icon: '⏱️',
    color: '#d29922',
    description: 'Parses Big-O time and space complexity of your code.',
  },
  {
    key: 'refactor',
    label: 'Refactor Studio',
    icon: '♻️',
    color: '#39d353',
    description: 'Converts messy code into clean, modern implementations.',
  },
  {
    key: 'debug',
    label: 'Debug Companion',
    icon: '🐛',
    color: '#f778ba',
    description: 'Reads errors, finds the flawed line, and fixes it.',
  },
  {
    key: 'security',
    label: 'Security Guardian',
    icon: '🛡️',
    color: '#ff7b72',
    description: 'Scans for vulnerabilities: SQLi, XSS, and patches them.',
  },
  {
    key: 'multilingual',
    label: 'Multilingual Mode',
    icon: '🌍',
    color: '#79c0ff',
    description: 'Explains programming concepts in any spoken language.',
  },
  {
    key: 'persona_yoda',
    label: 'Yoda Persona',
    icon: '🧙',
    color: '#7ee787',
    description: 'Teaches you the code, Yoda will. Backwards speech included.',
  },
  {
    key: 'persona_strict',
    label: 'Strict Teacher',
    icon: '👨‍🏫',
    color: '#8b949e',
    description: 'No hand-holding. Expects excellence and precision.',
  },
  {
    key: 'persona_friendly',
    label: 'Friendly Buddy',
    icon: '😊',
    color: '#f0883e',
    description: 'Warm, encouraging, patient. Great for beginners.',
  },
];

export default MODES;
