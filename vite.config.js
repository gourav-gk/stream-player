import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.js"),
      name: "StreamPlayer",
      fileName: (format) => `hls-stream-player.${format}.js`,
      formats: ["es", "cjs", "umd"],
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "style.css") return "react-player.css";
          return assetInfo.name;
        },
      },
    },
    cssCodeSplit: false, // ✅ bundles CSS into one file
    outDir: "dist", // ensure output goes to dist
    emptyOutDir: true,
  },
});
