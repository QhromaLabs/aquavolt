import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        open: true,
        proxy: {
            // Proxy Futurise API requests
            '/futurise-api': {
                target: 'https://47.90.150.122:4680',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/futurise-api/, ''),
                secure: false, // Accept self-signed certificates
                configure: (proxy, options) => {
                    proxy.on('error', (err, req, res) => {
                        console.log('Proxy error:', err);
                    });
                    proxy.on('proxyReq', (proxyReq, req, res) => {
                        console.log('Proxying:', req.method, req.url);
                    });
                }
            }
        }
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        // Group React and core UI libraries together to prevent context/singleton issues
                        if (
                            id.includes('react') ||
                            id.includes('react-dom') ||
                            id.includes('react-router-dom') ||
                            id.includes('antd') ||
                            id.includes('@ant-design') ||
                            id.includes('framer-motion') ||
                            id.includes('@tanstack/react-query')
                        ) {
                            return 'vendor-ui-core';
                        }

                        if (id.includes('recharts')) {
                            return 'vendor-charts';
                        }
                        if (id.includes('supabase')) {
                            return 'vendor-backend';
                        }
                        return 'vendor';
                    }
                }
            }
        },
        chunkSizeWarningLimit: 1000, // Warn for chunks > 1MB
        sourcemap: false, // Disable sourcemaps in production for smaller bundle
    }
})
