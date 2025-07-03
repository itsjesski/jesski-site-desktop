import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  build: {
    // Optimize for production deployment
    target: 'es2020',
    minify: mode === 'production' ? 'esbuild' : false,
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
  },
  
  // Development server optimizations
  server: {
    port: 5173,
    host: 'localhost',
    // Ignore public/data directory to prevent hot reload on garden state changes
    watch: {
      ignored: ['**/public/data/**']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // Add custom proxy request handlers and better error logging
        // This ensures auth headers are properly forwarded
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
          
          proxy.on('error', (err, _req, res) => {
            res.writeHead(500, {
              'Content-Type': 'text/plain',
            });
            res.end('Proxy error: ' + err);
          });
        }
      },
      '/garden/ws': {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true
      }
    }
  },
  
  // Dependency optimization
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'lucide-react'],
  },
}))
