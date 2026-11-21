import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { vitePrerenderPlugin } from 'vite-prerender-plugin'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Pre-render the app to static HTML at build time for SEO
    vitePrerenderPlugin({
      renderTarget: '#root',
      prerenderScript: path.resolve(__dirname, 'src/prerender.tsx'),
      // The not-found page is not linked from anywhere; scripts/postbuild.mjs turns it into dist/404.html
      additionalPrerenderRoutes: ['/404'],
    }),
  ],

  build: {
    // three.js (~690 kB, ~176 kB gzip) is lazy-loaded on Home only, so the default 500 kB warning is expected noise.
    chunkSizeWarningLimit: 800,
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
