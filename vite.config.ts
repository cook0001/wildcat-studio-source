import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// @ts-expect-error type error without @types/node package
import process from "node:process";
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,

  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },

  // Production Build Protection: aggressive mangling, stripped sourcemaps & dropped console logs
  build: {
    sourcemap: false, // Never expose source code maps
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // Drop all console.log/info/debug
        drop_debugger: true, // Drop all debugger statements
        passes: 2, // Multi-pass dead code elimination and variable compression
        pure_funcs: ["console.log", "console.info", "console.debug", "console.warn"],
      },
      mangle: {
        toplevel: true, // Obfuscate and mangle top-level variable and function names
      },
      format: {
        comments: false, // Strip all comments, license blocks, and file headers
      },
    },
    chunkSizeWarningLimit: 2000,
  },
}));
