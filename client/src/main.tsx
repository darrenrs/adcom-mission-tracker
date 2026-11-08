import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/oswald/600.css';
import { App } from './App';
import './styles.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Missing #root element');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
