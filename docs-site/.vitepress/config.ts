import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'ForgeUI',
  description: 'Tokens Studio → Tailwind + CSS vars',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Tokens', link: '/tokens' },
    ],
    sidebar: [
      { text: 'Overview', items: [{ text: 'Home', link: '/' }, { text: 'Tokens', link: '/tokens' }] },
    ],
  },
})
