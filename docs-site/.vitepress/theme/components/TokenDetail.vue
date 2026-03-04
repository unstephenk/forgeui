<template>
  <div>
    <p><a href="tokens">← Back to Tokens</a></p>

    <div v-if="loading">Loading…</div>
    <div v-else-if="error" class="tok-error"><code>{{ error }}</code></div>

    <div v-else-if="entry" class="tok-card">
      <div class="tok-row">
        <span class="tok-badge">{{ ns }}</span>
        <h1 style="margin: 0; font-size: 20px;"><code>{{ entry.token }}</code></h1>
        <button class="tok-copy" @click="copy(entry.token)">Copy token</button>
        <button class="tok-copy" @click="copy(copyPath)">Copy path</button>
        <a class="tok-copy" :href="viewInTableHref">View in table</a>
        <button class="tok-copy" @click="copyJson(entry)">Copy JSON</button>
      </div>

      <p class="tok-meta"><small>Type: <code>{{ entry.type }}</code></small></p>

      <div class="tok-row">
        <span class="tok-meta"><small>CSS var:</small></span>
        <code>{{ entry.cssVar }}</code>
        <button class="tok-copy" @click="copy(entry.cssVar)">Copy CSS var</button>
      </div>

      <h2 style="margin-top: 16px;">Theme values</h2>
      <table>
        <thead>
          <tr><th>Theme</th><th>Value</th></tr>
        </thead>
        <tbody>
          <tr v-for="(value, name) in (entry.themes || {})" :key="name">
            <td><code>{{ name }}</code></td>
            <td>
              <span class="tok-cell">
                <code>{{ value }}</code>
                <button class="tok-copy" @click="copy(value)">Copy</button>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else>
      <p><strong>Not found.</strong></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'

type Entry = { token: string; type: string; cssVar: string; themes?: Record<string, any> }

const loading = ref(true)
const error = ref('')
const entry = ref<Entry | null>(null)

const tokenParam = computed(() => {
  const u = new URL(location.href)
  return u.searchParams.get('token') || u.searchParams.get('t') || ''
})

const ns = computed(() => String(entry.value?.token ?? '').split('.')[0] || 'other')

const copyPath = computed(() => {
  const t = entry.value?.token
  if (!t) return ''
  return `${withBase('/token')}?token=${encodeURIComponent(String(t))}`
})

const viewInTableHref = computed(() => {
  const t = entry.value?.token
  if (!t) return withBase('/tokens')
  // `TokensTable` supports reading `?q=` on mount.
  return `${withBase('/tokens')}?q=${encodeURIComponent(String(t))}`
})

async function copy(text: any) {
  try {
    await navigator.clipboard.writeText(String(text))
  } catch {
    // ignore
  }
}

async function copyJson(v: any) {
  try {
    // Stable + readable. (No need for a dependency here.)
    await navigator.clipboard.writeText(JSON.stringify(v, null, 2))
  } catch {
    // ignore
  }
}

onMounted(async () => {
  try {
    if (!tokenParam.value) {
      error.value = 'Missing ?token=...'
      return
    }
    const res = await fetch(withBase('/tokens.index.json'))
    const data = await res.json()
    entry.value = (data.tokens ?? []).find((t: any) => String(t.token) === String(tokenParam.value)) || null
    if (!entry.value) error.value = `Not found: ${tokenParam.value}`
  } catch (e: any) {
    error.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
})
</script>
