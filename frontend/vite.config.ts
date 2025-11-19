import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
	plugins: [solidPlugin()],
	server: {
		port: 3000,
		host: true,
		proxy: {
			'/api': {
				target: process.env.VITE_API_URL || 'http://localhost:3001',
				changeOrigin: true,
			},
		},
	},
	build: {
		target: 'esnext',
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ['solid-js', '@solidjs/router'],
					icons: ['solid-icons/bs'],
				},
			},
		},
		chunkSizeWarningLimit: 1000,
	},
});
