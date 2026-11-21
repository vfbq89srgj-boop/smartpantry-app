/*
  Recipe state shared by the list and the detail screen.
  MVP step 4: take the 5 items that expire first, ask for recipes,
  rank them (most expiring items used, then fewest missing) and show the top 3.
*/
import { reactive } from 'vue'
import { findRecipes, type Recipe, type RecipeIngredient } from '../api/recipes'
import { bySoonestExpiry, daysLeft } from './pantry'

export const recipeState = reactive({
  recipes: [] as Recipe[],
  basedOn: [] as string[], // names of the expiring items we searched with
  loading: false,
  error: '',
})

/** Basics everyone has at home – never shown as "missing" */
const STAPLES = ['salt', 'pepper', 'oil', 'water']
export function isStaple(ing: RecipeIngredient) {
  const name = ing.name.toLowerCase()
  return STAPLES.some((s) => name.includes(s))
}

export async function loadRecipes() {
  // The 5 items that expire first (already expired ones are skipped)
  const expiring = bySoonestExpiry.value.filter((i) => (daysLeft(i.expirationDate) ?? 0) >= 0).slice(0, 5)
  const names = expiring.map((i) => i.name)
  recipeState.basedOn = names
  if (!names.length) {
    recipeState.recipes = []
    return
  }

  recipeState.loading = true
  recipeState.error = ''
  try {
    const all = await findRecipes(names)
    recipeState.recipes = [...all]
      .sort((a, b) => b.usedIngredientCount - a.usedIngredientCount || a.missedIngredientCount - b.missedIngredientCount)
      .slice(0, 3)
  } catch (e) {
    recipeState.error = e instanceof Error ? e.message : 'Something went wrong.'
  } finally {
    recipeState.loading = false
  }
}

/** Recipe summaries from Spoonacular contain HTML – we only show plain text */
export function plainText(html: string | null | undefined): string {
  return (html ?? '').replace(/<[^>]*>/g, '').trim()
}
