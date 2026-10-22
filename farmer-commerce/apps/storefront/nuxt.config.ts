import { existsSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

const localFile = fileURLToPath(
  new URL("./.medusa-storefront.json", import.meta.url)
)
const local = existsSync(localFile)
  ? JSON.parse(readFileSync(localFile, "utf8"))
  : {}

export default defineNuxtConfig({
  compatibilityDate: "2026-10-21",
  devtools: { enabled: false },
  css: ["~/assets/main.css"],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  runtimeConfig: {
    medusaUrl: "http://localhost:9000",
    medusaPublishableKey: local.publishable_key || "",
    medusaRegionId: local.region_id || "",
    public: { storeName: "Ūkio krautuvė" }
  },
  app: {
    head: {
      htmlAttrs: { lang: "lt" },
      title: "Ūkio krautuvė — kasdienai iš gamtos",
      meta: [
        {
          name: "description",
          content:
            "Atraskite lietuviškus produktus savo stalui. Daržovės, pieno produktai, duona ir kitos gėrybės vienoje vietoje."
        }
      ]
    }
  }
})
