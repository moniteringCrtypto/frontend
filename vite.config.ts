import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 로컬 개발 환경에서 /api/proxy로 시작하는 요청을 원격 백엔드로 프록시
      '/api/proxy': {
        target: 'http://34.64.63.71:8080',
        changeOrigin: true,
        rewrite: (path) => {
          // /api/proxy/market/... -> /api/market/...
          return path.replace(/^\/api\/proxy/, '/api')
        },
      },
    },
  },
})
