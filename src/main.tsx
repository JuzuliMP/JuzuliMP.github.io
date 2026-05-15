import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../app/App';
import '../styles/index.css';

const rootElement = document.getElementById('root')!;

// Use hydrateRoot if pre-rendered HTML exists (production build),
// otherwise use createRoot for development
if (rootElement.hasChildNodes()) {
  ReactDOM.hydrateRoot(
    rootElement,
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
