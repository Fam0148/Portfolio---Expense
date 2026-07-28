import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api/tradingview': {
        target: 'https://scanner.tradingview.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tradingview/, ''),
      },
      '/api/tickertape': {
        target: 'https://api.tickertape.in',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tickertape/, ''),
      },
    },
  },
})
