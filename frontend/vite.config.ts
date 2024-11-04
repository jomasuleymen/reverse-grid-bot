import fs from 'fs';
import { fileURLToPath } from 'url';

import React from '@vitejs/plugin-react-swc';
import dotenv from 'dotenv';
import type { ConfigEnv } from 'vite';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';

/**
 * https://vitejs.dev/config/
 */
const baseConfig = {
  plugins: [React({ jsxImportSource: '@emotion/react' }), checker({ typescript: true })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
}

export default ({ mode, command }: ConfigEnv) => {
  const { VITE_APP_NODE_ENV, VITE_APP_TITLE } = dotenv.parse(fs.readFileSync(`.env.${mode}`))

  console.log('\x1b[33m%s\x1b[0m', `🏭--NODE ENV (VITE_APP_NODE_ENV): ${VITE_APP_NODE_ENV}`)
  console.log('\x1b[36m%s\x1b[0m', `🏠--APP TITLE (VITE_APP_TITLE): ${VITE_APP_TITLE}`)

  if (command === 'serve') {
    return defineConfig({ ...baseConfig })
  } else {
    return defineConfig({ ...baseConfig })
  }
}
