/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    },
    historyApiFallback: true  // Vite使用spa插件或在开发服务器中处理SPA路由
  },
  // 使用下面的配置来处理SPA路由
  appType: 'spa', // 告诉Vite这是一个单页应用
  // Vitest 配置：使用 jsdom 模拟浏览器环境
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['src/**/*.{test,spec}.{js,mjs,ts}', 'tests/**/*.{test,spec}.{js,mjs,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,vue}'],
      exclude: [
        'src/**/*.{test,spec}.{js,mjs,ts}',
        'src/main.js',
        'src/**/main.js',
        'src/router/**'
      ]
    }
  }
})
