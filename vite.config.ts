import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  // Override Nitro preset from the default "cloudflare-module" to "node-server".
  // This makes Nitro emit dist/server/index.mjs — a self-contained Node.js HTTP
  // server that calls listen() and stays alive, instead of exporting a fetch()
  // handler for Edge/Cloudflare Workers (which exits immediately when run with node).
  nitro: {
    preset: "node-server",
  },
});
