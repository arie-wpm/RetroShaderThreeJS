import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
    base: '/RetroShaderThreeJS/',
    plugins: [glsl()],
    resolve: {
        alias: {
            '@': '/src',
        },
    },
});