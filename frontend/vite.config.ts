import { fileURLToPath } from 'url'

import React from '@vitejs/plugin-react-swc'
import type { ConfigEnv, UserConfig } from 'vite'
import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'
import viteCompression from 'vite-plugin-compression'

const baseConfig: UserConfig = {
  plugins: [
    React({ jsxImportSource: '@emotion/react' }),
    checker({ typescript: true }),
    viteCompression({
      algorithm: 'gzip',
      deleteOriginFile: false,
      compressionOptions: {
        level: 5,
      },
      verbose: false,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    emptyOutDir: true,
    outDir: 'dist',
  },

  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler', // or "modern", "legacy"
      },
    },
  },
}

export default ({ mode, command }: ConfigEnv) => {
  if (command === 'serve') {
    return defineConfig({ ...baseConfig })
  } else {
    return defineConfig({ ...baseConfig })
  }
}
