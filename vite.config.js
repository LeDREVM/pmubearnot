import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // En dev local, redirige /api vers la fonction Netlify simulée
      "/api/pmu-proxy": {
        target: "https://offline.turfinfo.api.pmu.fr/rest/client/7/programme",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pmu-proxy/, ""),
      },
    },
  },
});
