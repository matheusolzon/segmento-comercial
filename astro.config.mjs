// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

// Demo em domínio nosso. DNS do cliente só depois do sim.
const SITE = "https://segmento-comercial.vercel.app";

export default defineConfig({
  site: SITE,
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
  build: { inlineStylesheets: "auto" },
});
