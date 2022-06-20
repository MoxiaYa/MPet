import { defineConfig } from "vite";
const path = require("path");
import vue from "@vitejs/plugin-vue";
export default defineConfig({
  plugins: [vue()],
  root: path.join(__dirname, "page/pages/"),
  base: "./",
  publicDir: path.join(__dirname, "public"),
  build: {
    rollupOptions: {
      input: {
        home: path.join(__dirname, "page/pages/home.html"),
        sys: path.join(__dirname, "page/pages/sys.html"),
        pre: path.join(__dirname, "page/pages/pre.html"),
      },
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
    outDir: path.join(__dirname, "client/renderer"),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "page"),
      "@components": path.resolve(__dirname, "page/components"),
      "@assets": path.resolve(__dirname, "page/assets"),
    },
  },
  pluginOptions: {
    "style-resources-loader": {
      preProcessor: "less",
      patterns: [path.resolve(__dirname, "page/assets/css/style.less")],
    },
  },
});
