# Token

This page renders a single token from `tokens.index.json`.

<div id="app">
  <p>Loading…</p>
</div>

<script type="module">
  const el = document.querySelector('#app');

  function esc(s) {
    return String(s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(String(text));
      return true;
    } catch {
      return false;
    }
  }

  function getTokenParam() {
    const u = new URL(location.href);
    return u.searchParams.get('token') || u.searchParams.get('t') || '';
  }

  function renderNotFound(token) {
    el.innerHTML = `
      <p><strong>Not found.</strong> No token named <code>${esc(token)}</code> in <code>tokens.index.json</code>.</p>
      <p><a href="tokens">← Back to Tokens</a></p>
    `;
  }

  function renderToken(entry) {
    const token = entry.token;
    const parts = String(token).split('.');
    const ns = parts[0] || 'other';
    const crumbs = parts.slice(1);

    const themeRows = Object.entries(entry.themes ?? {})
      .map(([name, value]) => {
        return `
          <tr>
            <td><code>${esc(name)}</code></td>
            <td>
              <div class="tok-cell">
                <code>${esc(value)}</code>
                <button class="tok-copy" data-copy="${esc(value)}">Copy</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    el.innerHTML = `
      <style>
        .tok-card { border: 1px solid var(--vp-c-divider); border-radius: 12px; padding: 14px; }
        .tok-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .tok-badge { font-size: 11px; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--vp-c-divider); opacity: 0.9; }
        .tok-cell { display: inline-flex; gap: 8px; align-items: center; }
        .tok-copy { font-size: 12px; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--vp-c-divider); background: transparent; cursor: pointer; }
        .tok-copy:hover { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }
        .tok-meta { opacity: 0.85; }
      </style>

      <p><a href="tokens">← Back to Tokens</a></p>

      <div class="tok-card">
        <div class="tok-row">
          <span class="tok-badge">${esc(ns)}</span>
          <h1 style="margin: 0; font-size: 20px;"><code>${esc(token)}</code></h1>
          <button class="tok-copy" data-copy="${esc(token)}">Copy token</button>
        </div>
        ${crumbs.length ? `<p class="tok-meta"><small>Path: ${esc(crumbs.join(' / '))}</small></p>` : ''}

        <p class="tok-meta"><small>Type: <code>${esc(entry.type)}</code></small></p>

        <div class="tok-row">
          <span class="tok-meta"><small>CSS var:</small></span>
          <code>${esc(entry.cssVar)}</code>
          <button class="tok-copy" data-copy="${esc(entry.cssVar)}">Copy CSS var</button>
        </div>

        <h2 style="margin-top: 16px;">Theme values</h2>
        <table>
          <thead>
            <tr>
              <th>Theme</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            ${themeRows || '<tr><td colspan="2"><em>No theme values.</em></td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    el.querySelectorAll('button.tok-copy').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const text = btn.getAttribute('data-copy') ?? '';
        const ok = await copy(text);
        const prev = btn.textContent;
        btn.textContent = ok ? 'Copied' : 'Copy failed';
        setTimeout(() => (btn.textContent = prev), 900);
      });
    });
  }

  async function main() {
    const token = getTokenParam();
    if (!token) {
      el.innerHTML = `<p>Missing <code>?token=...</code> query param.</p><p><a href="tokens">← Back to Tokens</a></p>`;
      return;
    }

    const res = await fetch('tokens.index.json');
    const data = await res.json();
    const entry = (data.tokens ?? []).find((t) => String(t.token) === String(token));
    if (!entry) return renderNotFound(token);

    renderToken(entry);
  }

  main().catch((err) => {
    el.innerHTML = `<pre>${esc(err?.stack ?? err)}</pre>`;
  });
</script>
