import { useMemo, useState } from 'react';

export default function App() {
  const [dark, setDark] = useState(false);

  useMemo(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <div className="min-h-screen p-8 bg-bg-default text-fg-default">
      <div className="max-w-xl mx-auto space-y-4">
        <h1 className="text-2xl font-semibold">ForgeUI + Tailwind v4</h1>

        <button
          className="px-4 py-2 rounded-md bg-brand-500 text-white"
          onClick={() => setDark((v) => !v)}
        >
          Toggle {dark ? 'Light' : 'Dark'}
        </button>

        <div className="p-4 rounded-md border border-fg-default/20">
          This is using tokens from <code>tokens.json</code> → CSS variables → Tailwind preset.
        </div>
      </div>
    </div>
  );
}
