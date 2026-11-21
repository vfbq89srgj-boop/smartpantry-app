<!--
  Home screen – layout based on the Figma frame "Pantrix · Home".
  Everything shown here is calculated from the pantry data (src/data/pantry.ts).
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Camera, ChevronRight, ClipboardList, CookingPot, ScanText } from '@lucide/vue'
import PageHeader from '../components/PageHeader.vue'
import ItemRow from '../components/ItemRow.vue'
import { bySoonestExpiry, inStock, pantry } from '../data/pantry'
import { session, signOut } from '../data/auth'
import { openEntries } from '../data/shoppingList'
import { apiConfigured } from '../api/client'

const router = useRouter()

// The 3 items that expire first – "Use these first"
const useFirst = computed(() => bySoonestExpiry.value.slice(0, 3))
</script>

<template>
  <PageHeader title="Pantrix" subtitle="Waste less. Eat better." />

  <main class="page">
    <!-- Receipt scanner hero card -->
    <section class="hero">
      <div class="hero-top">
        <h2>Shop. Scan. Stock.</h2>
        <ScanText :size="40" :stroke-width="1.5" class="hero-icon" />
      </div>
      <p class="hero-text">Scan a receipt and our AI adds your groceries – with expiry dates – in one go.</p>
      <button class="scan-btn" @click="router.push('/scan')">
        <Camera :size="20" :stroke-width="1.75" />
        Scan receipt
      </button>
    </section>

    <!-- Two small stat tiles -->
    <section class="stats">
      <RouterLink to="/pantry" class="stat">
        <p class="stat-main"><strong>{{ inStock.length }}</strong> Pantry items</p>
        <p class="stat-sub">All in one place</p>
      </RouterLink>
      <RouterLink to="/shopping-list" class="stat">
        <p class="stat-main"><strong>{{ openEntries.length }}</strong> On the list</p>
        <p class="stat-sub">Ready for the next shop</p>
      </RouterLink>
    </section>

    <!-- Items that expire soonest -->
    <section>
      <div class="section-head">
        <h2>Use these first</h2>
        <RouterLink to="/pantry" class="link">View pantry</RouterLink>
      </div>
      <p v-if="pantry.error" class="note error">{{ pantry.error }}</p>
      <p v-else-if="pantry.loading" class="note">Loading your pantry…</p>
      <p v-else-if="!useFirst.length" class="note">Your pantry is empty – scan your first receipt.</p>
      <div v-else class="card list">
        <ItemRow v-for="item in useFirst" :key="item.id" :item="item" />
      </div>
    </section>

    <!-- Shortcut to the shopping list -->
    <RouterLink to="/shopping-list" class="shortcut">
      <ClipboardList :size="22" :stroke-width="1.75" />
      <div class="shortcut-text">
        <p class="shortcut-title">Your shopping list</p>
        <p class="shortcut-sub">Only buy what you really need.</p>
      </div>
      <ChevronRight :size="18" />
    </RouterLink>

    <button class="btn-primary" @click="router.push('/recipes')">
      <CookingPot :size="20" :stroke-width="1.75" />
      Recipe ideas
    </button>

    <p class="account">
      <template v-if="session">Signed in as {{ session.user.email }} · <button @click="signOut">Sign out</button></template>
      <template v-else-if="!apiConfigured">Demo mode – sample data</template>
    </p>
  </main>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: var(--gap);
  padding: 0 var(--page-padding);
}

/* Hero card */
.hero {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 12px;
  padding: 22px;
  border-radius: var(--radius-xl);
  background: var(--color-primary);
  color: var(--color-on-primary);
}
.hero-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.hero h2 { font-size: 23px; font-weight: 600; }
.hero-icon { color: var(--color-accent); flex-shrink: 0; }
.hero-text { font-size: 14px; color: var(--color-on-primary-muted); }
.scan-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 13px;
  border-radius: var(--radius-md);
  background: var(--color-accent);
  color: var(--color-text);
  font-size: 15px;
  font-weight: 600;
}
.scan-btn:active { opacity: 0.85; }

/* Stat tiles */
.stats { display: grid; grid-template-columns: 1fr 1fr; gap: var(--gap); }
.stat {
  padding: 14px 12px 14px 16px;
  border-radius: 16px;
  background: var(--color-tile);
  color: var(--color-text);
  text-decoration: none;
}
.stat-main { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; }
.stat-main strong { font-size: 26px; font-weight: 600; }
.stat-sub { margin-top: 4px; font-size: 11px; color: var(--color-text-muted); }

/* "Use these first" */
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 4px 0 12px;
}
.section-head h2 { font-size: 19px; font-weight: 600; }
.link { font-size: 13px; font-weight: 600; color: var(--color-primary); text-decoration: none; }
.list { padding: 0 14px; }
.list > * + * { border-top: 1px solid var(--color-border); }

/* Shopping list shortcut */
.shortcut {
  display: flex;
  align-items: center;
  gap: var(--gap);
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  text-decoration: none;
}
.shortcut-text { flex: 1; }
.shortcut-title { font-size: 13px; font-weight: 600; }
.shortcut-sub { font-size: 11px; color: var(--color-text-muted); }

.note { padding: 18px; border-radius: var(--radius-lg); background: var(--color-surface); font-size: 14px; color: var(--color-text-muted); }
.note.error { color: var(--fresh-red-text); }

.account { margin: 4px 0 8px; text-align: center; font-size: 12px; color: var(--color-text-muted); }
.account button { color: var(--color-primary); font-weight: 600; font-size: 12px; }
</style>
