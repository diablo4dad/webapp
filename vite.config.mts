import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const FIREBASE_PROJECT_ID = "d4log-bfc60";
const FIREBASE_FUNCTIONS_EMULATOR_ORIGIN = "http://127.0.0.1:5001";
const FIREBASE_FUNCTIONS_REGION = "us-central1";

function rewriteFunction(functionName: string) {
  return (path: string) =>
    path.replace(
      /^\/api\/[^?]+/,
      `/${FIREBASE_PROJECT_ID}/${FIREBASE_FUNCTIONS_REGION}/${functionName}`,
    );
}

export default defineConfig(({ mode }) => ({
  build: {
    outDir: "build",
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      mode === "production" ? "production" : "development",
    ),
  },
  plugins: [react()],
  server: {
    proxy: {
      "/api/catalog/collectionNodes.bundle": {
        changeOrigin: true,
        rewrite: rewriteFunction("catalogCollectionNodesBundle"),
        target: FIREBASE_FUNCTIONS_EMULATOR_ORIGIN,
      },
      "/api/catalog/items.bundle": {
        changeOrigin: true,
        rewrite: rewriteFunction("catalogItemsBundle"),
        target: FIREBASE_FUNCTIONS_EMULATOR_ORIGIN,
      },
      "/api/catalog/item-icon": {
        changeOrigin: true,
        rewrite: rewriteFunction("catalogItemIconUpload"),
        target: FIREBASE_FUNCTIONS_EMULATOR_ORIGIN,
      },
      "/api/database/item-import": {
        changeOrigin: true,
        rewrite: rewriteFunction("databaseItemImport"),
        target: FIREBASE_FUNCTIONS_EMULATOR_ORIGIN,
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.ts",
  },
}));
