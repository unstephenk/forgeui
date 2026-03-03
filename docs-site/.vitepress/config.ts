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
      {
        text: 'Tokens',
        items: [
          { text: 'All tokens', link: '/tokens' },
          { text: 'Core', link: '/tokens-core' },
          { text: 'Components', link: '/tokens-components' },
        ],
      },
    ],
    sidebar: [
      {
        text: 'Overview',
        items: [
          { text: 'Home', link: '/' },
          { text: 'All tokens', link: '/tokens' },
          { text: 'Core tokens', link: '/tokens-core' },
          { text: 'Component tokens', link: '/tokens-components' },
        ],
      },
    ],
  },
})
