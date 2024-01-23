import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// https://vitejs.dev/config/
export default defineConfig({
  root: "./src",
  build: {
    rollupOptions: {
      input: {
        index: "index.html",
        relay: "relay/index.html",
      },
    },
  },
  plugins: [preact()],
});
