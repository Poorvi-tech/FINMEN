import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "https://finmen.onrender.com/", // ✅ Backend server
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
