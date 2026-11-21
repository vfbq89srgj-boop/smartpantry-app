<!--
  One recipe: ingredients (what you have / what's missing) and the steps.
  "Add missing to shopping list" – MVP step 4, source = recipe.
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Check, ChevronLeft, Clock, CookingPot, ShoppingCart, Users } from '@lucide/vue'
import { isStaple, plainText, recipeState } from '../data/recipes'
import { addToList } from '../data/shoppingList'

const route = useRoute()
const router = useRouter()

const recipe = computed(() => recipeState.recipes.find((r) => r.id === Number(route.params.id)))
const missing = computed(() => recipe.value?.missedIngredients.filter((i) => !isStaple(i)) ?? [])
const usedIds = computed(() => new Set(recipe.value?.usedIngredients.map((i) => i.id)))
const steps = computed(() => recipe.value?.recipe?.analyzedInstructions.flatMap((block) => block.steps) ?? [])

const added = ref(false)
function addMissing() {
  missing.value.forEach((i) => addToList(i.name, 'recipe'))
  added.value = true
}
</script>

<template>
  <header class="bar">
    <button class="back" aria-label="Back" @click="router.back()"><ChevronLeft :size="24" /></button>
  </header>

  <main v-if="recipe" class="page">
    <img v-if="recipe.image" :src="recipe.image" alt="" class="photo" />
    <div v-else class="photo placeholder"><CookingPot :size="48" :stroke-width="1.25" /></div>

    <h1>{{ recipe.title }}</h1>
    <p class="meta">
      <span v-if="recipe.recipe?.readyInMinutes"><Clock :size="14" /> {{ recipe.recipe.readyInMinutes }} min</span>
      <span v-if="recipe.recipe?.servings"><Users :size="14" /> {{ recipe.recipe.servings }} servings</span>
    </p>
    <p v-if="recipe.recipe?.summary" class="summary">{{ plainText(recipe.recipe.summary).split('. ').slice(0, 2).join('. ') }}</p>

    <section>
      <h2>Ingredients</h2>
      <ul class="card ingredients">
        <li v-for="ing in recipe.recipe?.extendedIngredients ?? []" :key="ing.id + ing.name" :class="{ have: usedIds.has(ing.id) }">
          <span class="dot" />
          <span>{{ ing.original || ing.name }}</span>
          <span v-if="usedIds.has(ing.id)" class="tag">In your pantry</span>
        </li>
      </ul>
      <button v-if="missing.length" class="btn-secondary" :disabled="added" @click="addMissing">
        <component :is="added ? Check : ShoppingCart" :size="18" />
        {{ added ? 'Added to shopping list' : `Add ${missing.length} missing to shopping list` }}
      </button>
    </section>

    <section v-if="steps.length">
      <h2>Steps</h2>
      <ol class="steps">
        <li v-for="s in steps" :key="s.number"><span class="num">{{ s.number }}</span>{{ s.step }}</li>
      </ol>
    </section>

    <p class="credit">
      Recipe by <a :href="recipe.recipe?.sourceUrl || recipe.recipe?.spoonacularSourceUrl || 'https://spoonacular.com'" target="_blank" rel="noopener">Spoonacular</a>
    </p>
  </main>

  <main v-else class="page"><p class="summary">Recipe not found. Go back and load the ideas again.</p></main>
</template>

<style scoped>
.bar { padding: 12px 12px 8px; }
.back { display: grid; place-items: center; width: 36px; height: 36px; color: var(--color-text); }
.page { padding: 0 var(--page-padding) 16px; }

.photo { display: block; width: 100%; height: 200px; object-fit: cover; border-radius: var(--radius-lg); }
.placeholder { display: grid; place-items: center; background: var(--color-tile); color: var(--color-primary); }
h1 { margin-top: 16px; font-size: 24px; font-weight: 600; line-height: 1.25; }
.meta { display: flex; gap: 16px; margin-top: 8px; font-size: 13px; color: var(--color-text-muted); }
.meta span { display: inline-flex; align-items: center; gap: 5px; }
.summary { margin-top: 12px; font-size: 14px; color: var(--color-text-muted); }

h2 { margin: 24px 0 10px; font-size: 18px; font-weight: 600; }
.ingredients { margin: 0; padding: 6px 16px; list-style: none; }
.ingredients li { display: flex; align-items: center; gap: 10px; padding: 9px 0; font-size: 14px; }
.ingredients li + li { border-top: 1px solid var(--color-border); }
.dot { width: 8px; height: 8px; flex-shrink: 0; border-radius: 50%; background: var(--color-border); }
.have .dot { background: var(--color-primary); }
.tag { margin-left: auto; padding: 2px 7px; border-radius: var(--radius-xs); background: var(--color-tile); color: var(--color-primary); font-size: 11px; font-weight: 500; white-space: nowrap; }

.btn-secondary {
  display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 46px; margin-top: 12px;
  border-radius: var(--radius-md); background: var(--color-tile); color: var(--color-primary); font-size: 14px; font-weight: 600;
}
.btn-secondary:disabled { opacity: 0.7; }

.steps { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 12px; }
.steps li { display: flex; gap: 12px; font-size: 15px; }
.num { display: grid; place-items: center; width: 26px; height: 26px; flex-shrink: 0; border-radius: 50%; background: var(--color-primary); color: var(--color-on-primary); font-size: 13px; font-weight: 600; }

.credit { margin-top: 24px; text-align: center; font-size: 12px; color: var(--color-text-muted); }
.credit a { color: var(--color-primary); }
</style>
