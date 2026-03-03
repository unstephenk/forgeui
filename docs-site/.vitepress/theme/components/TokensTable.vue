<template>
  <div>
    <div class="tok-toolbar">
      <a v-if="ns !== ''" href="tokens">All</a>
      <strong v-else>All</strong>
      <a v-if="ns !== 'core'" href="tokens-core">Core</a>
      <strong v-else>Core</strong>
      <a v-if="ns !== 'components'" href="tokens-components">Components</a>
      <strong v-else>Components</strong>

      <input class="tok-input" v-model="q" placeholder="Search…" />
    </div>

    <div v-if="loading">Loading…</div>
    <div v-else-if="error" class="tok-error"><code>{{ error }}</code></div>

    <div v-else>
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
          <tr v-for="t in filtered" :key="t.token">
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
import { computed, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'

type Entry = { token: string; type: string; cssVar: string; themes?: Record<string, any> }

const props = defineProps<{ ns?: '' | 'core' | 'components' }>()
const ns = props.ns ?? ''

const loading = ref(true)
const error = ref('')
const q = ref('')
const nsFilter = ref('')
const data = ref<{ tokens: Entry[] } | null>(null)

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
    const qq = q.value.trim().toLowerCase()
    if (!qq) return true
    const hay = [t.token, t.type, t.cssVar, ...Object.values(t.themes ?? {})].join(' ').toLowerCase()
    return hay.includes(qq)
  })
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

onMounted(async () => {
  try {
    const res = await fetch(withBase('/tokens.index.json'))
    data.value = await res.json()
  } catch (e: any) {
    error.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
})
</script>
