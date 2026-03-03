import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './custom.css'

import TokensTable from './components/TokensTable.vue'
import TokenDetail from './components/TokenDetail.vue'

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    DefaultTheme.enhanceApp?.({ app } as any)
    app.component('TokensTable', TokensTable)
    app.component('TokenDetail', TokenDetail)
  },
} satisfies Theme
