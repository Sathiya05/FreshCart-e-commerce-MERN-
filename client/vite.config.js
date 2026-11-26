import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxy = {
    '/api': {
      target: env.VITE_API_PROXY_TARGET || 'http://localhost:5000',
      changeOrigin: true,
    },
  }

  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          // Keep the app entry small so first paint is not blocked by the
          // icon set and Redux runtime.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined
            if (id.includes('lucide-react')) return 'icons'
            if (
              id.includes('react-dom') ||
              id.includes('react-router') ||
              /[\\/]react[\\/]/.test(id)
            ) {
              return 'react-vendor'
            }
            if (
              id.includes('@reduxjs/toolkit') ||
              id.includes('react-redux') ||
              id.includes('/redux/')
            ) {
              return 'redux'
            }
            return undefined
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: apiProxy,
    },
    preview: {
      port: 4173,
      proxy: apiProxy,
    },
  }
})
