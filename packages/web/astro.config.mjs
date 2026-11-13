import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'

// Repo must be named <user>.github.io so the site is served from the domain root.
export default defineConfig({
  site: 'https://tanvir-005.github.io',
  trailingSlash: 'always',
  integrations: [sitemap()],
  build: { inlineStylesheets: 'auto' }
})
