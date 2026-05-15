import { renderToString } from 'react-dom/server';
import React from 'react';
import App from '../app/App';

export async function prerender() {
  const html = renderToString(
    React.createElement(React.StrictMode, null,
      React.createElement(App)
    )
  );

  return { html };
}
