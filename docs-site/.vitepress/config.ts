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
      {
        text: 'Tokens',
        items: [
          { text: 'All tokens', link: '/tokens' },
          { text: 'Core', link: '/tokens-core' },
          { text: 'Components', link: '/tokens-components' },
          { text: 'Namespaces', link: '/namespaces/' },
        ],
      },
    ],
    sidebar: [
      {
        text: 'Overview',
        items: [
          { text: 'Home', link: '/' },
          { text: 'Getting started', link: '/getting-started' },
          { text: 'All tokens', link: '/tokens' },
          { text: 'Core tokens', link: '/tokens-core' },
          { text: 'Component tokens', link: '/tokens-components' },
          { text: 'Namespaces', link: '/namespaces/' },
        ],
      },
    ],
  },
})
