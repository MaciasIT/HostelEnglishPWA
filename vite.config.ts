import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/HostelEnglishPWA/", // Necesario para despliegue en GitHub Pages
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "script",
      devOptions: {
        enabled: true,
      },
      includeAssets: ["favicon.ico", "icons/icono.png", "icons/pwa-192x192.png", "icons/pwa-512x512.png"],
      manifest: {
        name: "HostelEnglish PWA",
        short_name: "HostelEnglish",
        description: "Aplicación para aprender inglés para hostelería",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
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
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json,webmanifest}"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: { port: 5173 },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
});
