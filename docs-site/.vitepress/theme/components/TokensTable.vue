<template>
  <div>
    <div class="tok-toolbar">
      <a v-if="ns !== ''" href="tokens">All</a>
      <strong v-else>All</strong>
      <a v-if="ns !== 'core'" href="tokens-core">Core</a>
      <strong v-else>Core</strong>
      <a v-if="ns !== 'components'" href="tokens-components">Components</a>
      <strong v-else>Components</strong>

      <input ref="searchEl" class="tok-input" v-model="q" placeholder="Search…" />
    </div>

    <div v-if="loading">Loading…</div>
    <div v-else-if="error" class="tok-error"><code>{{ error }}</code></div>

    <div v-else>
      <p class="tok-hint"><small>Keyboard: <code>/</code> focus search, <code>j</code>/<code>k</code> move, <code>Enter</code> open, <code>Esc</code> clear.</small></p>

      <div v-if="ns === ''" class="tok-chips">
        <a
          v-for="n in namespaces"
          :key="n"
          class="tok-chip"
          :class="{ active: n === nsFilter }"
          href="#"
          @click.prevent="toggleNs(n)"
        >
          {{ n }}
        </a>
      </div>

      <table>
        <thead>
          <tr>
            <th>Token</th>
            <th>Type</th>
            <th>CSS Var</th>
            <th v-for="t in themeList" :key="t">{{ t }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(t, idx) in filtered" :key="t.token" :class="{ 'tok-row-selected': idx === selected }">
            <td>
              <a :href="`token?token=${encodeURIComponent(String(t.token))}`"><code>{{ t.token }}</code></a>
            </td>
            <td><span class="tok-badge">{{ t.type }}</span></td>
            <td>
              <span class="tok-cell">
                <code>{{ t.cssVar }}</code>
                <button class="tok-copy" @click="copy(t.cssVar)">Copy</button>
              </span>
            </td>
            <td v-for="th in themeList" :key="th">
              <span class="tok-cell">
                <code>{{ (t.themes || {})[th] ?? '' }}</code>
                <button class="tok-copy" @click="copy((t.themes || {})[th] ?? '')">Copy</button>
              </span>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td :colspan="3 + themeList.length"><em>No matches.</em></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'

type Entry = { token: string; type: string; cssVar: string; themes?: Record<string, any> }

const props = defineProps<{ ns?: '' | 'core' | 'components'; type?: string }>()
const ns = props.ns ?? ''
const typeFilter = computed(() => (props.type ? String(props.type) : ''))

const loading = ref(true)
const error = ref('')
const q = ref('')
const searchEl = ref<HTMLInputElement | null>(null)
const nsFilter = ref('')
const data = ref<{ tokens: Entry[] } | null>(null)
const selected = ref(0)

const themeList = computed(() => {
  const set = new Set<string>()
  for (const t of data.value?.tokens ?? []) for (const k of Object.keys(t.themes ?? {})) set.add(k)
  return Array.from(set)
})

const namespaces = computed(() => {
  const set = new Set<string>()
  for (const t of data.value?.tokens ?? []) set.add(String(t.token).split('.')[0] || 'other')
  return Array.from(set).sort()
})

const filtered = computed(() => {
  const tokens = (data.value?.tokens ?? []).filter((t) => {
    const n = String(t.token).split('.')[0] || 'other'
    if (ns && n !== ns) return false
    if (!ns && nsFilter.value && n !== nsFilter.value) return false
    if (typeFilter.value && String(t.type) !== typeFilter.value) return false

    const qq = q.value.trim().toLowerCase()
    if (!qq) return true
    const hay = [t.token, t.type, t.cssVar, ...Object.values(t.themes ?? {})].join(' ').toLowerCase()
    return hay.includes(qq)
  })
  // keep selected index in range
  if (selected.value >= tokens.length) selected.value = Math.max(0, tokens.length - 1)
  return tokens
})

function toggleNs(n: string) {
  nsFilter.value = nsFilter.value === n ? '' : n
}

async function copy(text: any) {
  try {
    await navigator.clipboard.writeText(String(text))
  } catch {
    // ignore
  }
}

function focusSearch() {
  searchEl.value?.focus()
}

function onKeyDown(e: KeyboardEvent) {
  const isTyping = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement

  // Press '/' to focus search (like GitHub)
  if (e.key === '/' && !isTyping) {
    e.preventDefault()
    focusSearch()
    return
  }

  // Escape clears search + namespace filter
  if (e.key === 'Escape' && !isTyping) {
    if (q.value) q.value = ''
    if (nsFilter.value) nsFilter.value = ''
    return
  }

  // j/k navigation over filtered rows
  if (!isTyping && (e.key === 'j' || e.key === 'k')) {
    e.preventDefault()
    const max = Math.max(0, filtered.value.length - 1)
    if (e.key === 'j') selected.value = Math.min(max, selected.value + 1)
    if (e.key === 'k') selected.value = Math.max(0, selected.value - 1)
    return
  }

  // Enter opens token detail
  if (!isTyping && e.key === 'Enter') {
    const row = filtered.value[selected.value]
    if (row?.token) {
      window.location.href = `token?token=${encodeURIComponent(String(row.token))}`
    }
  }
}

onMounted(async () => {
  window.addEventListener('keydown', onKeyDown)

  // Support deep links like `/tokens?q=core.color.primary` from token detail.
  try {
    const u = new URL(location.href)
    const initialQ = u.searchParams.get('q') || u.searchParams.get('token') || u.searchParams.get('t') || ''
    if (initialQ) q.value = initialQ
  } catch {
    // ignore
  }

  try {
    const res = await fetch(withBase('/tokens.index.json'))
    data.value = await res.json()
  } catch (e: any) {
    error.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>
