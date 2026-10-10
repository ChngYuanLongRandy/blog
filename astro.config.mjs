import { unified } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import AutoImport from "astro-auto-import";
import gtm from "astro-gtm-lite";
import { defineConfig, fontProviders, sharpImageService } from "astro/config";
import config from "./src/config/config.json";
import theme from "./src/config/theme.json";

// @astrojs/vercel's runtime entrypoint imports constants from its index.js,
// which also imports `rolldown` (only used at build time, for Edge
// Middleware bundling, which this site doesn't use). Vite 8 keeps that unused
// import as a bare `import "rolldown"` at the top of the deployed function,
// so the real package loads at startup and crashes on Vercel with "Cannot
// find native binding". Resolving it to an empty stub removes it from the
// bundle. Build-only, so dev and the adapter's own build-time code (which
// runs in plain Node, not through Vite) are unaffected.
const stubRolldownInBundle = {
  name: "stub-rolldown-in-bundle",
  apply: "build",
  enforce: "pre",
  resolveId(id) {
    if (id === "rolldown") return "\0rolldown-stub";
  },
  load(id) {
    if (id === "\0rolldown-stub") {
      return 'export const rolldown = () => { throw new Error("rolldown is not available at runtime"); };';
    }
  },
};

// Helper to parse font string format: "FontName:wght@400;500;600;700"
function parseFontString(fontStr) {
  const [name, weightPart] = fontStr.split(":");
  let weights = [400]; // default weight

  if (weightPart) {
    // Extract weights from wght@400;500;600 format
    const weightMatch = weightPart.match(/wght@?([\d;]+)/);
    if (weightMatch) {
      weights = weightMatch[1].split(";").map((w) => parseInt(w, 10));
    }
  }

  // remove + from font name and add space
  const cleanName = name.replace(/\+/g, " ");
  return { name: cleanName, weights };
}

// Build fonts configuration from theme.json
const fontsConfig = Object.entries(theme.fonts.font_family)
  .filter(([key]) => !key.includes("_type")) // Filter out type entries
  .map(([key, fontStr]) => {
    const { name, weights } = parseFontString(fontStr);
    const typeKey = `${key}_type`;
    const fallback = theme.fonts.font_family[typeKey] || "sans-serif";

    return {
      name,
      cssVariable: `--font-${key}`,
      provider: fontProviders.google(),
      weights,
      display: "swap",
      fallbacks: [fallback],
    };
  });

// https://astro.build/config
export default defineConfig({
  site: config.site.base_url ? config.site.base_url : "http://examplesite.com",
  base: config.site.base_path ? config.site.base_path : "/",
  trailingSlash: config.site.trailing_slash ? "always" : "never",
  image: { service: sharpImageService() },
  vite: { plugins: [tailwindcss(), stubRolldownInBundle] },
  fonts: fontsConfig,
  // Site stays statically pre-rendered; the adapter just enables the one
  // on-demand route (src/pages/api/contact.ts, which sets prerender=false)
  // to run as a Vercel serverless function.
  adapter: vercel(),
  integrations: [
    react(),
    sitemap(),
    AutoImport({
      imports: [
        "@/shortcodes/Button",
        "@/shortcodes/Accordion",
        "@/shortcodes/Notice",
        "@/shortcodes/Video",
        "@/shortcodes/Youtube",
        "@/shortcodes/Tabs",
        "@/shortcodes/Tab",
      ],
    }),
    mdx(),
    gtm({
      enable: config.google_tag_manager.enable,
      id: config.google_tag_manager.gtm_id,
      devMode: true,
    }),
  ],
  markdown: {
    processor: unified(),
    shikiConfig: { theme: "one-dark-pro", wrap: true },
  },
});
