import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// https://vitejs.dev/config/
export default defineConfig({
  root: "./src",
  build: {
    rollupOptions: {
      input: {
        index: "src/index.html",
        relay: "src/relay/index.html",
      },
    },
  },
  plugins: [preact()],
});
