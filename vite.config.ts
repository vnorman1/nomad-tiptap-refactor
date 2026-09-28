import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, './src'),
        },
    },
    server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: true,
        // Force polling to ensure file changes are detected
        watch: {
            usePolling: true,
        },
        hmr: {
            // Explicit port for WebSocket to match the server port
            port: 3000,
            // The path must NOT include the base path - Vite handles this internally
            // But we need clientPort to ensure the browser connects to the right port
            clientPort: 3000,
            // Explicit path to avoid conflicts
            path: '/ws',
        },
    },
});

