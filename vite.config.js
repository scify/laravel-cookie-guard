import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    build: {
        outDir: path.resolve(__dirname, 'public'),
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'resources/js/scripts.js'),
            },
            output: {
                entryFileNames: 'scripts.js',
                assetFileNames: 'styles.css',
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources'),
        },
    },
});
