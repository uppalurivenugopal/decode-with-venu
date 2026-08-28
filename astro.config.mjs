// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.decodewithvenu.com',
  redirects: {
    '/resources': '/thought-leadership'
  },
  vite: {
    plugins: [tailwindcss()]
  }
});