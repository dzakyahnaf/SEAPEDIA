import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Saat dev, request /api diteruskan ke backend FastAPI lokal
    // sehingga frontend tidak perlu memikirkan CORS.
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
});
