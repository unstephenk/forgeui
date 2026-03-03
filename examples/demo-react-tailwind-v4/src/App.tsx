import React from 'react'

function setTheme(next: 'light' | 'dark') {
  document.documentElement.setAttribute('data-theme', next)
}

export function App() {
  const [theme, setThemeState] = React.useState<'light' | 'dark'>(
    (document.documentElement.getAttribute('data-theme') as any) || 'light',
  )

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setThemeState(next)
  }

  return (
    <div className="min-h-screen bg-bg-default text-fg-default p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">ForgeUI Demo</h1>
          <p className="text-fg-muted">
            Tokens Studio → CSS vars → Tailwind utilities. Current theme: <code>{theme}</code>
          </p>
        </header>

        <div className="rounded-lg border border-fg-muted/20 bg-bg-subtle p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm text-fg-muted">Button demo</div>
              <div className="text-lg">Uses token-derived colors + radii + spacing</div>
            </div>
            <button
              onClick={toggle}
              className="rounded-md bg-brand-500 px-4 py-2 text-bg-default hover:bg-brand-700"
            >
              Toggle theme
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-fg-muted">Danger color (mixed formats in tokens.json)</div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-danger-500" />
            <code className="text-sm">bg-danger-500</code>
          </div>
        </div>

        <footer className="text-xs text-fg-muted">
          Tip: check <code>forgeui/tokens.css</code> + <code>forgeui/forgeui.preset.ts</code> in repo root.
        </footer>
      </div>
    </div>
  )
}
