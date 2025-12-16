import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 로컬 개발 환경에서 /api/proxy로 시작하는 요청을 원격 백엔드로 프록시
      '/api/proxy': {
        target: 'http://34.64.63.71:80', // nginx가 포트 80에서 실행 중
        changeOrigin: false, // changeOrigin을 false로 설정
        secure: false, // HTTPS 검증 비활성화 (HTTP 백엔드용)
        timeout: 30000, // 30초 타임아웃
        ws: false, // WebSocket 비활성화
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying request:', req.method, req.url, '->', proxyReq.path);
          });
        },
        rewrite: (path) => {
          // /api/proxy/market/... -> /api/market/...
          const rewritten = path.replace(/^\/api\/proxy/, '/api');
          console.log('Rewriting path:', path, '->', rewritten);
          return rewritten;
        },
      },
    },
  },
})
