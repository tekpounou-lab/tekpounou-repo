import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Set initial theme
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const theme = savedTheme || (prefersDark ? 'dark' : 'light');

if (theme === 'dark') {
  document.documentElement.classList.add('dark');
}

// Set CSS custom properties for toast styling
document.documentElement.style.setProperty(
  '--toast-bg',
  theme === 'dark' ? '#374151' : '#ffffff'
);
document.documentElement.style.setProperty(
  '--toast-color',
  theme === 'dark' ? '#f9fafb' : '#111827'
);
document.documentElement.style.setProperty(
  '--toast-border',
  theme === 'dark' ? '#4b5563' : '#e5e7eb'
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);