import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'ForgeUI',
  description: 'Tokens Studio → Tailwind + CSS vars',
  base: process.env.VITEPRESS_BASE ?? '/',
  appearance: true,
  themeConfig: {
    search: {
      provider: 'local',
    },
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting started', link: '/getting-started' },
      { text: 'Migration (v3 → v4)', link: '/migration-tailwind-v3-to-v4' },
      {
        text: 'Tokens',
        items: [
          { text: 'All tokens', link: '/tokens' },
          { text: 'Core', link: '/tokens-core' },
          { text: 'Components', link: '/tokens-components' },
          { text: 'Namespaces', link: '/namespaces/' },
          { text: 'Types', link: '/types/' },
        ],
      },
    ],
    sidebar: [
      {
        text: 'Overview',
        items: [
          { text: 'Home', link: '/' },
          { text: 'Getting started', link: '/getting-started' },
          { text: 'Migration (v3 → v4)', link: '/migration-tailwind-v3-to-v4' },
          { text: 'All tokens', link: '/tokens' },
          { text: 'Core tokens', link: '/tokens-core' },
          { text: 'Component tokens', link: '/tokens-components' },
          { text: 'Namespaces', link: '/namespaces/' },
          { text: 'Types', link: '/types/' },
        ],
      },
    ],
  },
})
