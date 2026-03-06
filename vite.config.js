import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
                        // Group React, Ant Design, and ALL their low-level dependencies (rc-*, etc.)
                        // into a single 'vendor-core' chunk to avoid circular dependencies and context issues.
                        if (
                            id.includes('react') ||
                            id.includes('antd') ||
                            id.includes('@ant-design') ||
                            id.includes('rc-') ||
                            id.includes('scroll-into-view-if-needed') ||
                            id.includes('compute-scroll-into-view') ||
                            id.includes('copy-to-clipboard') ||
                            id.includes('framer-motion') ||
                            id.includes('@tanstack/react-query') ||
                            id.includes('scheduler')
                        ) {
                            return 'vendor-core';
                        }

                        // Backend and utilities
                        if (id.includes('@supabase') || id.includes('axios') || id.includes('lodash') || id.includes('dayjs') || id.includes('qs')) {
                            return 'vendor-backend';
                        }

                        // Group charts and large visualization libs
                        if (id.includes('recharts') || id.includes('apexcharts') || id.includes('react-apexcharts') || id.includes('d3-')) {
                            return 'vendor-charts';
                        }

                        // Remaining dependencies go to default vendor chunk
                        return 'vendor';
                    }
                }
            }
        },
        chunkSizeWarningLimit: 1000, // Warn for chunks > 1MB
        sourcemap: false, // Disable sourcemaps in production for smaller bundle
    }
})
