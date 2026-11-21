<!--
  Impact tab – AI4Green.
  Measured: usage rate (eaten vs. thrown away).
  Estimated (clearly labelled): kg, € and CO2e of thrown-away food, compared with the Austrian average.
  Plus: "These items have expired – eaten or thrown away?" to keep the numbers honest.
-->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Car, Check, Euro, Minus, Plus, Trash, Trophy, Users, Weight } from '@lucide/vue'
import PageHeader from '../components/PageHeader.vue'
import PullIndicator from '../components/PullIndicator.vue'
import { usePullToRefresh } from '../lib/pullToRefresh'
import { calculateImpact, impactState, loadImpact, periodDays, setHouseholdSize } from '../data/impact'
import { inDays, localDateString } from '../lib/date'
import { FACTORS_VERSION } from '../data/impactFactors'
import { categoryOf } from '../data/categories'
import { setStatus, type ItemStatus } from '../data/pantry'
import { ALL_TIME_DAYS } from '../api/stats'

const periods = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 365, label: 'Last year' },
  { days: ALL_TIME_DAYS, label: 'All time' },
]

onMounted(loadImpact)
const { pull, refreshing } = usePullToRefresh(loadImpact)

const impact = computed(() =>
  impactState.stats
    ? calculateImpact(impactState.stats, impactState.stats.fallbackDays ?? periodDays(), impactState.householdSize)
    : null,
)

function changePeriod(days: number) {
  impactState.days = days
  impactState.custom = null
  showCustom.value = false
  loadImpact()
}

// ----- Custom period -----
const showCustom = ref(!!impactState.custom)
const customFrom = ref(impactState.custom?.from ?? inDays(-13))
const customTo = ref(impactState.custom?.to ?? localDateString())
const today = localDateString()
const customValid = computed(() => !!customFrom.value && !!customTo.value && customFrom.value <= customTo.value && customTo.value <= today)

function applyCustom() {
  if (!customValid.value) return
  impactState.custom = { from: customFrom.value, to: customTo.value }
  loadImpact()
}

const fmtDate = (d: string) => d.split('-').reverse().join('.')

// Numbers are estimates → round them, never fake precision
// Always 2 decimals, Austrian style: 1,25
const kg = (v: number) => v.toFixed(2).replace('.', ',')
const eur = (v: number) => v.toFixed(2).replace('.', ',')
const pct = (v: number) => Math.round(v * 100)

// Ring for the usage rate
const R = 52
const CIRC = 2 * Math.PI * R
const ringOffset = computed(() => CIRC * (1 - (impact.value?.usageRate ?? 0)))

// Bar: you vs. Ø household (scale = the larger of both, at least 2 kg)
const barMax = computed(() => Math.max(2, impact.value?.yourKgPerPersonWeek ?? 0, impact.value?.avgKgPerPersonWeek ?? 0))

// Tips for the categories thrown away most
const tips: Record<string, string> = {
  bakery: 'Freeze bread in slices and toast it straight from the freezer.',
  fruit: 'Overripe fruit works great in smoothies or banana bread.',
  vegetables: 'Soft vegetables are perfect for soup or a stir-fry.',
  leafy_greens: 'Buy smaller bags – or blend leftover greens into a pesto.',
  dairy: 'Yogurt and cream are often fine after the date – look, smell, taste.',
  fresh_milk: 'Milk past its date? Check it first – it is often still good.',
  plant_based: 'Plant drinks last longer unopened – open one at a time.',
}

async function resolve(id: number, status: ItemStatus) {
  await setStatus(id, status)
  await loadImpact()
}
</script>

<template>
  <PageHeader mark title="Impact" subtitle="What happens to the food you buy" />

  <main class="page">
    <PullIndicator :pull="pull" :refreshing="refreshing" />
    <div class="chips" role="group" aria-label="Period">
      <button v-for="p in periods" :key="p.days" class="chip" :class="{ active: !impactState.custom && !showCustom && impactState.days === p.days }" @click="changePeriod(p.days)">
        {{ p.label }}
      </button>
      <button class="chip" :class="{ active: showCustom || impactState.custom }" @click="showCustom = true">
        {{ impactState.custom ? `${fmtDate(impactState.custom.from)} – ${fmtDate(impactState.custom.to)}` : 'Custom' }}
      </button>
    </div>

    <!-- Custom period -->
    <form v-if="showCustom" class="card custom" @submit.prevent="applyCustom">
      <label>From <input v-model="customFrom" type="date" :max="today" /></label>
      <label>To <input v-model="customTo" type="date" :max="today" /></label>
      <button class="apply" type="submit" :disabled="!customValid">Show</button>
    </form>

    <p v-if="impactState.loading && !impact" class="card note">Calculating your impact…</p>
    <p v-else-if="impactState.error" class="card note error">{{ impactState.error }}</p>

    <template v-else-if="impact">
      <p v-if="impactState.stats?.fallbackDays" class="fallback">
        This period is not available yet – showing the last {{ impactState.stats.fallbackDays }} days.
      </p>
      <!-- 1. Usage rate (measured) -->
      <section class="card hero">
        <svg viewBox="0 0 128 128" class="ring" aria-hidden="true">
          <circle cx="64" cy="64" :r="R" class="ring-bg" />
          <circle v-if="impact.usageRate !== null" cx="64" cy="64" :r="R" class="ring-fg" :stroke-dasharray="CIRC" :stroke-dashoffset="ringOffset" />
        </svg>
        <div class="ring-text">
          <template v-if="impact.usageRate !== null">
            <p class="big">{{ pct(impact.usageRate) }} %</p>
            <p class="small">eaten</p>
          </template>
          <p v-else class="small">No data yet</p>
        </div>
        <div class="hero-copy">
          <h2>Usage rate</h2>
          <p v-if="impact.finished">You ate <strong>{{ impact.eaten }}</strong> of <strong>{{ impact.finished }}</strong> finished items and threw away {{ impact.wasted }}.</p>
          <p v-else>Mark items as “Eaten” or “Thrown away” in your pantry to see your rate.</p>
        </div>
      </section>

      <!-- 2. Expired items – keep the numbers honest -->
      <section v-if="impact.expired.length" class="card expired">
        <h2>{{ impact.expired.length }} item{{ impact.expired.length > 1 ? 's have' : ' has' }} expired – eaten or thrown away?</h2>
        <p class="muted">Tell us what happened, so your impact stays accurate.</p>
        <ul>
          <li v-for="i in impact.expired.slice(0, 5)" :key="i.id">
            <span class="icon-tile"><component :is="categoryOf(i.category).icon" :size="18" :stroke-width="1.75" /></span>
            <span class="name">{{ i.name }}</span>
            <button class="mini eaten" :aria-label="`${i.name} eaten`" @click="resolve(i.id, 'eaten')"><Check :size="16" /></button>
            <button class="mini thrown" :aria-label="`${i.name} thrown away`" @click="resolve(i.id, 'thrown_away')"><Trash :size="16" /></button>
          </li>
        </ul>
        <RouterLink v-if="impact.expired.length > 5" to="/pantry" class="link">See all in your pantry</RouterLink>
      </section>

      <!-- 3. You vs. the Austrian average (gamification) -->
      <section class="card versus">
        <div class="versus-head">
          <h2><Trophy :size="18" /> Beat the average</h2>
          <div class="household" aria-label="People in your household">
            <Users :size="15" />
            <button aria-label="Fewer people" @click="setHouseholdSize(impactState.householdSize - 1)"><Minus :size="14" /></button>
            <span>{{ impactState.householdSize }}</span>
            <button aria-label="More people" @click="setHouseholdSize(impactState.householdSize + 1)"><Plus :size="14" /></button>
          </div>
        </div>
        <div class="bars">
          <div class="bar-row">
            <span class="bar-label">You</span>
            <div class="bar"><div class="fill you" :class="{ over: !impact.belowAverage }" :style="{ width: `${(impact.yourKgPerPersonWeek / barMax) * 100}%` }" /></div>
            <span class="bar-val">{{ kg(impact.yourKgPerPersonWeek) }} kg</span>
          </div>
          <div class="bar-row">
            <span class="bar-label">Ø Austria</span>
            <div class="bar"><div class="fill avg" :style="{ width: `${(impact.avgKgPerPersonWeek / barMax) * 100}%` }" /></div>
            <span class="bar-val">{{ kg(impact.avgKgPerPersonWeek) }} kg</span>
          </div>
        </div>
        <p class="verdict" :class="{ good: impact.belowAverage }">
          <template v-if="impact.belowAverage">Great – you throw away less than the average household. Keep it up! 🌱</template>
          <template v-else>You’re above the average this period – use the “Use these first” list and recipe ideas to catch up.</template>
        </p>
        <p class="muted small-print">Food thrown away per person and week, estimated. Ø = 69 kg per person and year (Austria 2024).</p>
      </section>

      <!-- 4. Thrown away: kg, money, CO2e (estimated) -->
      <section class="tiles">
        <div class="tile weight">
          <span class="tile-icon"><Weight :size="20" :stroke-width="2" /></span>
          <p class="tile-val">{{ kg(impact.wastedKg) }} kg</p>
          <p class="tile-label">food thrown away</p>
        </div>
        <div class="tile money">
          <span class="tile-icon"><Euro :size="20" :stroke-width="2" /></span>
          <p class="tile-val">{{ eur(impact.moneyLost) }} €</p>
          <p class="tile-label">money in the bin</p>
        </div>
        <div class="tile co2 wide">
          <span class="tile-icon"><Car :size="20" :stroke-width="2" /></span>
          <p class="tile-val">{{ kg(impact.co2Min) }}–{{ kg(impact.co2Max) }} kg CO₂e</p>
          <p class="tile-label">wasted with that food – about {{ Math.round(impact.carKm) }} km by car</p>
        </div>
      </section>

      <!-- 5. Most wasted + tip -->
      <section v-if="impact.topWasted.length" class="card top">
        <h2>Thrown away most</h2>
        <ul>
          <li v-for="[cat, n] in impact.topWasted" :key="cat">
            <span class="icon-tile"><component :is="categoryOf(cat).icon" :size="18" :stroke-width="1.75" /></span>
            <div>
              <p class="name">{{ categoryOf(cat).label }} <span class="muted">· {{ n }}×</span></p>
              <p v-if="tips[cat]" class="muted">{{ tips[cat] }}</p>
            </div>
          </li>
        </ul>
      </section>

      <!-- How we calculate (transparency, EU rules against vague green claims) -->
      <details class="card how">
        <summary>How we calculate</summary>
        <p><strong>Measured:</strong> what you mark as eaten or thrown away. The usage rate uses only these numbers.</p>
        <p><strong>Estimated:</strong> weight and price come from your receipt when available, otherwise from typical package sizes and Austrian prices per category. CO₂e uses factors per kg food from ifeu 2020 (German Environment Agency) and Umweltbundesamt Austria, shown as a range. Car km: 107 g CO₂/km (average new car, EU 2024).</p>
        <p><strong>Not included:</strong> shopping trips, cooking, disposal. Self-reported data usually under-counts waste.</p>
        <p class="muted">Factors {{ FACTORS_VERSION }}</p>
      </details>
    </template>
  </main>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 12px; padding: 0 var(--page-padding); }
h2 { font-size: 16px; font-weight: 600; }
.muted { color: var(--color-text-muted); font-size: 13px; }
.note { padding: 18px; font-size: 14px; color: var(--color-text-muted); }
.note.error { color: var(--fresh-red-text); }

.fallback { padding: 10px 14px; border-radius: var(--radius-md); background: var(--fresh-amber-bg); color: var(--fresh-amber-text); font-size: 13px; font-weight: 500; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: -8px; }
.custom { display: grid; grid-template-columns: 1fr 1fr auto; align-items: end; gap: 10px; padding: 12px 14px; }
.custom label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; font-weight: 500; color: var(--color-text-muted); }
.custom input { height: 40px; padding: 0 8px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-surface); color: var(--color-text); font: inherit; font-size: 15px; -webkit-appearance: none; appearance: none; }
.apply { height: 40px; padding: 0 16px; border-radius: var(--radius-sm); background: var(--color-primary); color: var(--color-on-primary); font-size: 14px; font-weight: 600; }
.apply:disabled { opacity: 0.45; }
@media (max-width: 380px) { .custom { grid-template-columns: 1fr 1fr; } .apply { grid-column: 1 / -1; } }
.chip { padding: 7px 14px; border: 1px solid var(--color-border); border-radius: 999px; background: var(--color-surface); color: var(--color-text-muted); font-size: 13px; font-weight: 500; }
.chip.active { border-color: var(--color-primary); background: var(--color-primary); color: var(--color-on-primary); }

/* Usage rate */
.hero { position: relative; display: grid; grid-template-columns: 112px 1fr; align-items: center; gap: 16px; padding: 18px; }
.ring { width: 112px; height: 112px; transform: rotate(-90deg); }
.ring-bg { fill: none; stroke: var(--color-tile); stroke-width: 12; }
.ring-fg { fill: none; stroke: var(--color-primary); stroke-width: 12; stroke-linecap: round; transition: stroke-dashoffset 0.8s ease; }
.ring-text { position: absolute; left: 18px; top: 50%; width: 112px; transform: translateY(-50%); text-align: center; }
.big { font-size: 26px; font-weight: 700; line-height: 1; }
.small { font-size: 12px; color: var(--color-text-muted); }
.hero-copy p { margin-top: 4px; font-size: 14px; color: var(--color-text-muted); }
.hero-copy strong { color: var(--color-text); }

/* Expired check */
.expired { padding: 16px; border: 1.5px solid var(--fresh-amber-text); background: var(--fresh-amber-bg); }
.expired h2 { color: var(--fresh-amber-text); }
.expired ul, .top ul { margin: 10px 0 0; padding: 0; list-style: none; }
.expired li, .top li { display: flex; align-items: center; gap: 10px; padding: 7px 0; }
.icon-tile { display: grid; place-items: center; width: 34px; height: 34px; flex-shrink: 0; border-radius: var(--radius-sm); background: var(--color-surface); color: var(--color-primary); }
.top .icon-tile { background: var(--color-surface-soft); }
.name { flex: 1; font-size: 14px; font-weight: 600; }
.mini { display: grid; place-items: center; width: 40px; height: 36px; border-radius: var(--radius-sm); }
.mini.eaten { background: var(--color-primary); color: var(--color-on-primary); }
.mini.thrown { background: var(--fresh-red-bg); color: var(--fresh-red-text); }
.link { display: inline-block; margin-top: 6px; font-size: 13px; font-weight: 600; color: var(--color-primary); }

/* Versus */
.versus { padding: 16px; }
.versus-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.versus-head h2 { display: flex; align-items: center; gap: 6px; }
.household { display: flex; align-items: center; gap: 6px; padding: 3px 6px; border: 1px solid var(--color-border); border-radius: 999px; font-size: 13px; font-weight: 600; color: var(--color-text-muted); }
.household button { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: var(--color-tile); color: var(--color-primary); }
.bars { display: flex; flex-direction: column; gap: 10px; margin: 14px 0 10px; }
.bar-row { display: grid; grid-template-columns: 72px 1fr 58px; align-items: center; gap: 10px; font-size: 13px; }
.bar { height: 12px; border-radius: 6px; background: var(--color-surface-soft); overflow: hidden; }
.fill { height: 100%; border-radius: 6px; transition: width 0.8s ease; }
.fill.you { background: var(--color-primary); }
.fill.you.over { background: var(--fresh-amber-text); }
.fill.avg { background: #b8c2b4; }
.bar-val { text-align: right; font-weight: 600; white-space: nowrap; }
.verdict { font-size: 14px; font-weight: 500; color: var(--fresh-amber-text); }
.verdict.good { color: var(--color-primary); }
.small-print { margin-top: 6px; font-size: 11px; }

/* Tiles */
/* Coloured tiles: sage = weight, amber = money, dark green = CO2e */
.tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.tile { padding: 16px; border-radius: var(--radius-lg); }
.tile.wide { grid-column: 1 / -1; display: grid; grid-template-columns: auto 1fr; column-gap: 14px; align-items: center; }
.tile.wide .tile-icon { grid-row: span 2; margin: 0; }
.tile-icon { display: grid; place-items: center; width: 40px; height: 40px; margin-bottom: 10px; border-radius: 12px; }
.tile-val { font-size: 22px; font-weight: 700; line-height: 1.2; white-space: nowrap; }
.tile-label { margin-top: 2px; font-size: 12px; }

.tile.weight { background: var(--color-tile); color: var(--color-text); }
.tile.weight .tile-icon { background: var(--color-primary); color: var(--color-on-primary); }
.tile.weight .tile-label { color: var(--color-text-muted); }

.tile.money { background: var(--fresh-amber-bg); color: var(--fresh-amber-text); }
.tile.money .tile-icon { background: var(--fresh-amber-text); color: var(--fresh-amber-bg); }

.tile.co2 { background: var(--color-primary); color: var(--color-on-primary); }
.tile.co2 .tile-icon { background: var(--color-accent); color: var(--color-primary); }
.tile.co2 .tile-label { color: var(--color-on-primary-muted); }
.tile.co2 .tile-val { white-space: normal; }

.top { padding: 16px; }
.top .name { font-size: 14px; }

.how { padding: 14px 16px; font-size: 13px; color: var(--color-text-muted); }
.how summary { cursor: pointer; font-size: 14px; font-weight: 600; color: var(--color-primary); }
.how p { margin-top: 8px; }
.how strong { color: var(--color-text); }
.how { margin-bottom: 8px; }

@media (prefers-reduced-motion: reduce) { .ring-fg, .fill { transition: none; } }
</style>
