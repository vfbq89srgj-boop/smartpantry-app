<!--
  Recipe ideas – MVP step 4.
  Shows the 3 best recipes for the food that expires first.
-->
<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft, Clock, CookingPot, RotateCcw } from '@lucide/vue'
import { loadRecipes, recipeState } from '../data/recipes'
import { pantry } from '../data/pantry'

const router = useRouter()

// Right after the app starts the pantry may still be loading – wait for it,
// otherwise the screen would wrongly say "nothing needs using up".
onMounted(() => {
  if (!pantry.loading) loadRecipes()
})
watch(
  () => pantry.loading,
  (loading) => {
    if (!loading) loadRecipes()
  },
)
</script>

<template>
  <header class="bar">
    <button class="back" aria-label="Back" @click="router.back()"><ChevronLeft :size="24" /></button>
    <h1>Recipe ideas</h1>
  </header>

  <main class="page">
    <p v-if="recipeState.basedOn.length" class="intro">
      Using what expires first:
      <span v-for="name in recipeState.basedOn" :key="name" class="pill">{{ name }}</span>
    </p>

    <div v-if="recipeState.loading || (pantry.loading && !recipeState.recipes.length)" class="center">
      <div class="spinner" />
      <p>Finding recipes for your food…</p>
    </div>

    <div v-else-if="recipeState.error" class="center">
      <p>{{ recipeState.error }}</p>
      <button class="btn-primary" @click="loadRecipes"><RotateCcw :size="18" /> Try again</button>
    </div>

    <div v-else-if="!recipeState.basedOn.length" class="center">
      <p>Nothing in your pantry that needs using up. Nice!</p>
    </div>

    <div v-else class="list">
      <RouterLink v-for="r in recipeState.recipes" :key="r.id" :to="`/recipes/${r.id}`" class="card recipe">
        <img v-if="r.image" :src="r.image" alt="" class="photo" />
        <div v-else class="photo placeholder"><CookingPot :size="40" :stroke-width="1.25" /></div>
        <div class="info">
          <h2>{{ r.title }}</h2>
          <p class="rescued">Uses {{ r.usedIngredientCount }} of your items: {{ r.usedIngredients.map((i) => i.name).join(', ') }}</p>
          <p class="meta">
            <span v-if="r.recipe?.readyInMinutes"><Clock :size="13" /> {{ r.recipe.readyInMinutes }} min</span>
            <span>{{ r.missedIngredientCount ? `${r.missedIngredientCount} to buy` : 'Nothing to buy' }}</span>
          </p>
        </div>
      </RouterLink>
    </div>

    <p class="credit">Powered by <a href="https://spoonacular.com/food-api" target="_blank" rel="noopener">Spoonacular</a></p>
  </main>
</template>

<style scoped>
.bar { display: flex; align-items: center; gap: 4px; padding: 12px 16px 16px 12px; }
.bar h1 { font-size: 22px; font-weight: 600; }
.back { display: grid; place-items: center; width: 36px; height: 36px; color: var(--color-text); }
.page { padding: 0 var(--page-padding); }

.intro { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-bottom: 16px; font-size: 13px; color: var(--color-text-muted); }
.pill { padding: 3px 9px; border-radius: 999px; background: var(--color-tile); color: var(--color-primary); font-weight: 500; }

.list { display: flex; flex-direction: column; gap: 12px; }
.recipe { display: block; overflow: hidden; color: inherit; text-decoration: none; }
.photo { display: block; width: 100%; height: 160px; object-fit: cover; }
.placeholder { display: grid; place-items: center; background: var(--color-tile); color: var(--color-primary); }
.info { padding: 14px 16px 16px; }
.info h2 { font-size: 17px; font-weight: 600; }
.rescued { margin-top: 6px; font-size: 13px; color: var(--color-primary); font-weight: 500; }
.meta { display: flex; gap: 14px; margin-top: 8px; font-size: 12px; color: var(--color-text-muted); }
.meta span { display: inline-flex; align-items: center; gap: 4px; }

.center { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px 12px; text-align: center; color: var(--color-text-muted); }
.spinner { width: 40px; height: 40px; border: 4px solid var(--color-tile); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.credit { margin: 20px 0 8px; text-align: center; font-size: 12px; color: var(--color-text-muted); }
.credit a { color: var(--color-primary); }
</style>
