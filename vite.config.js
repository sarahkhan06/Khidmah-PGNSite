import { defineConfig } from "vite";

// Multi-page build so GitHub Pages (dist/) includes every HTML page.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: "index.html",
        about: "about.html",
        contact: "contact.html",
        events: "events.html",
        "executive-board": "executive-board.html",
        portal: "portal.html",
      },
    },
  },
});

