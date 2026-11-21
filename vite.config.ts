import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  // Relative paths so the built app also works inside the iOS wrapper (Capacitor)
  base: "./",
});
