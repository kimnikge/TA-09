import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        hmr: {
            // Явно указываем протокол, хост и порт для WebSocket
            protocol: 'ws',
            host: 'localhost',
            port: 3000,
            // Увеличиваем тайм-аут для WebSocket соединения
            timeout: 120000
        },
        // Поддержка работы при смене сети
        watch: {
            usePolling: true
        }
    },
});
