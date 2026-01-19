import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
//import basicSsl from '@vitejs/plugin-basic-ssl';
// https://vitejs.dev/config/

import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
    plugins: [react(),
        visualizer({
            filename: './bundle-stats.html', // Output file name
            open: false,
            gzipSize: true,
            brotliSize: true,
          }),
        {
            name: 'inject-cf-analytics',
            transformIndexHtml(html, ctx) {
                if (ctx.server) return html;
                return html.replace(
                    '</head>',
                    `<script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "0c8db43c79a643afa3263a7ddcd7da31"}'></script></head>`
                );
            }
        }
    ],   
     
    resolve: {
        alias: {
          // Force React resolution to the host's node_modules
        'react': path.resolve(__dirname, './node_modules/react'),
        'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
        'react-router-dom': path.resolve(__dirname, './node_modules/react-router-dom'),
        'react-admin': path.resolve(__dirname, './node_modules/react-admin'),
        'ra-ui-materialui': path.resolve(__dirname, './node_modules/ra-ui-materialui'),
        'ra-core': path.resolve(__dirname, './node_modules/ra-core'),
        '@mui/material': path.resolve(__dirname, './node_modules/@mui/material'),
        '@tiptap/extension-color': path.resolve(__dirname, './node_modules/@tiptap/extension-color'),
        '@tiptap/extension-highlight': path.resolve(__dirname, './node_modules/@tiptap/extension-highlight'),
        '@tiptap/extension-link': path.resolve(__dirname, './node_modules/@tiptap/extension-link'),
        '@tiptap/extension-text-style': path.resolve(__dirname, './node_modules/@tiptap/extension-text-style'),
        '@tiptap/react': path.resolve(__dirname, './node_modules/@tiptap/react'),
        'tiptap-extension-resize-image': path.resolve(__dirname, './node_modules/tiptap-extension-resize-image'),
        '@tiptap/suggestion': path.resolve(__dirname, './node_modules/@tiptap/suggestion'),
        '@tiptap/starter-kit': path.resolve(__dirname, './node_modules/@tiptap/starter-kit'),
        '@tiptap/extension-text-align': path.resolve(__dirname, './node_modules/@tiptap/extension-text-align'),
        '@tiptap/extension-underline': path.resolve(__dirname, './node_modules/@tiptap/extension-underline'),
        '@tiptap/core': path.resolve(__dirname, './node_modules/@tiptap/core'),
        '@tiptap/extension-bubble-menu': path.resolve(__dirname, './node_modules/@tiptap/extension-bubble-menu'),
        'ra-input-rich-text': path.resolve(__dirname, './node_modules/ra-input-rich-text'),
        'tippy.js': path.resolve(__dirname, './node_modules/tippy.js'),
        'react-player': path.resolve(__dirname, './node_modules/react-player'),          
        'compromise': path.resolve(__dirname, './node_modules/compromise'),
        'fuzzysort': path.resolve(__dirname, './node_modules/fuzzysort'),
        'jszip': path.resolve(__dirname, './node_modules/jszip'),
        'ramda': path.resolve(__dirname, './node_modules/ramda'),
        'papaparse': path.resolve(__dirname, './node_modules/papaparse'),
        'react-cropper': path.resolve(__dirname, './node_modules/react-cropper'),
        'cropperjs': path.resolve(__dirname, './node_modules/cropperjs'),
        'react-hook-form': path.resolve(__dirname, './node_modules/react-hook-form'),
        '@mui/x-charts': path.resolve(__dirname, './node_modules/@mui/x-charts'),
        '@mui/x-charts/BarChart': path.resolve(__dirname, './node_modules/@mui/x-charts/BarChart'),
        '@mui/x-charts/PieChart': path.resolve(__dirname, './node_modules/@mui/x-charts/PieChart'),
        '@mui/x-charts/LineChart': path.resolve(__dirname, './node_modules/@mui/x-charts/LineChart'),
        '@mui/x-charts/ScatterChart': path.resolve(__dirname, './node_modules/@mui/x-charts/ScatterChart'),
        '@mui/x-charts/Gauge': path.resolve(__dirname, './node_modules/@mui/x-charts/Gauge'),
        'date-fns': path.resolve(__dirname, './node_modules/date-fns'),
        'inflection': path.resolve(__dirname, './node_modules/inflection'),
        // Node.js polyfills for docx-templates
        'stream': path.resolve(__dirname, './node_modules/stream-browserify'),
        'buffer': path.resolve(__dirname, './node_modules/buffer'),
        'events': path.resolve(__dirname, './node_modules/events'),
        'util': path.resolve(__dirname, './node_modules/util'),
        },
        // Optional but recommended: Explicitly deduplicate
        dedupe: ['react', 'react-dom','react-router-dom', 'react-admin', 'ra-ui-materialui', 'ra-core', '@mui/material'],
    },
    define: {
        'process.env': {},
        global: 'globalThis',
    },
    optimizeDeps: {
        include: ['stream-browserify', 'buffer', 'events', 'util'],
    },
    server: {
        host: true,
    },
    base: './',
});
