import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/HostelEnglishPWA/", // Necesario para despliegue en GitHub Pages
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "script",
      devOptions: {
        enabled: true,
      },
      includeAssets: [
        "favicon.ico",
        "icons/icono.png",
        "icons/pwa-192x192.png",
        "icons/pwa-512x512.png",
      ],
      manifest: {
        id: "/HostelEnglishPWA/",
        name: "HostelEnglish PWA",
        short_name: "HostelEnglish",
        description: "Aplicación para aprender inglés para hostelería",
        theme_color: "#2c3e50",
        background_color: "#2c3e50",
        display: "standalone",
        orientation: "portrait",
        scope: "/HostelEnglishPWA/",
        start_url: "/HostelEnglishPWA/",
        icons: [
          {
            src: "icons/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icons/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json,webmanifest}"],
        // Los workers on-device (Whisper/Transformers.js y WebLLM) embeben sus
        // runtimes y superan el límite por defecto de 2 MiB. Se amplía para
        // poderlos pre-cachear y que el ASR/LLM funcionen offline.
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\/data\/.*\.json$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "hostel-json-data",
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 7 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:mp3|webm|opus)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "hostel-audio",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|svg|ico|jpg|jpeg|webp)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "hostel-images",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Pesos y runtimes de los modelos on-device (Whisper/Transformers.js,
            // WebLLM). Descargados de los CDNs oficiales; se cachean CacheFirst
            // para que el ASR/LLM funcionen offline tras la primera descarga.
            urlPattern: /https:\/\/(huggingface\.co|cdn\.jsdelivr\.net|cjs\.dev|unpkg\.com)\/.*\.(?:onnx|wasm|json|bin|model|tiktoken)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "hostel-ai-models",
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  // WebLLM (@mlc-ai/web-llm) y Transformers.js (@huggingface/transformers) no
  // deben pre-bundearse en dev: cargan WASM y pesos dinámicamente. Excluirlos
  // evita errores de resolución en dev y build.
  optimizeDeps: {
    exclude: ["@mlc-ai/web-llm", "@huggingface/transformers"],
  },
  build: {
    chunkSizeWarningLimit: 6000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    },
  },
});
