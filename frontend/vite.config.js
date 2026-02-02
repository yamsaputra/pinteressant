import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000", // <— Backend-Port hier eintragen
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
