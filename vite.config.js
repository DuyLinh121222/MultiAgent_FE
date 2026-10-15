import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Dev server chạy ở http://localhost:5173
// Mọi request /api và /uploads được proxy sang BE Spring Boot nên không lo CORS.
// Địa chỉ BE lấy từ VITE_BE_URL trong file .env (mặc định http://localhost:8089).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const beUrl = env.VITE_BE_URL || 'http://localhost:8089'
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': beUrl,
        '/uploads': beUrl,
      },
    },
  }
})
