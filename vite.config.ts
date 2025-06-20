import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    // Optimize for production deployment
    target: 'es2020',
    minify: 'terser',
    sourcemap: mode === 'development',
    
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['zustand', 'lucide-react'],
        },
      },
    },
    
    // Build performance optimizations
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,
    
    // Terser options for better compression
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
      },
    },
  },
  
  // Development server optimizations
  server: {
    hmr: {
      overlay: false,
    },
  },
  
  // Dependency optimization
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'lucide-react'],
  },
}))
