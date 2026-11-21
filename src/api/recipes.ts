/*
  Recipe ideas – MVP step 4, using Benny's endpoint
  POST /api/v1/Recipes/findByIngredients  (body: [{ "name": "tomatoes" }, …])
  Response: list of RecipeDto (see Smart-Pantry/items/RecipeDto.cs).

  Spoonacular free plan = 50 points per day, so results are cached on the phone
  and reused until the ingredients change.
*/
import { apiConfigured, apiFetch } from './client'

export interface RecipeIngredient {
  id: number
  name: string
  amount: number
  unit: string
  original?: string | null
}

export interface RecipeDetails {
  summary?: string | null
  servings?: number | null
  readyInMinutes?: number | null
  sourceUrl?: string | null
  spoonacularSourceUrl?: string | null
  extendedIngredients: RecipeIngredient[]
  analyzedInstructions: { name: string; steps: { number: number; step: string }[] }[]
}

export interface Recipe {
  id: number
  title: string
  image?: string | null
  likes: number
  usedIngredientCount: number
  missedIngredientCount: number
  usedIngredients: RecipeIngredient[]
  missedIngredients: RecipeIngredient[]
  recipe?: RecipeDetails | null
}

const CACHE_KEY = 'pantrix.recipeCache'

export async function findRecipes(ingredientNames: string[]): Promise<Recipe[]> {
  const cacheKey = [...ingredientNames].map((n) => n.toLowerCase()).sort().join('|')

  // Same ingredients as last time → reuse (costs 0 Spoonacular points)
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null')
    if (cached?.key === cacheKey) return cached.recipes as Recipe[]
  } catch {
    // no cache
  }

  const recipes = apiConfigured ? await fetchFromBackend(ingredientNames) : await demoRecipes()

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ key: cacheKey, recipes }))
  } catch {
    // storage full or not available
  }
  return recipes
}

async function fetchFromBackend(names: string[]): Promise<Recipe[]> {
  let res: Response
  try {
    res = await apiFetch('/api/v1/Recipes/findByIngredients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(names.map((name) => ({ name }))),
    })
  } catch {
    throw new Error('No connection to the server.')
  }
  if (res.ok) return (await res.json()) as Recipe[]
  if (res.status === 401) throw new Error('Your login has expired. Please sign in again.')
  if (res.status === 502) throw new Error('No new recipe ideas right now (daily limit reached?). Try again later.')
  throw new Error('The recipe service is not available right now.')
}

// ---------- Demo data ----------
async function demoRecipes(): Promise<Recipe[]> {
  await new Promise((r) => setTimeout(r, 1000))
  const ing = (id: number, name: string, amount: number, unit: string): RecipeIngredient => ({ id, name, amount, unit, original: `${amount} ${unit} ${name}`.trim() })
  return [
    {
      id: 101, title: 'Creamy Spinach & Tomato Pasta', likes: 312, usedIngredientCount: 3, missedIngredientCount: 1,
      usedIngredients: [ing(1, 'baby spinach', 100, 'g'), ing(2, 'milk', 200, 'ml'), ing(3, 'tomatoes', 3, '')],
      missedIngredients: [ing(4, 'parmesan', 40, 'g')],
      recipe: {
        servings: 2, readyInMinutes: 20,
        summary: 'A quick weeknight pasta that uses up spinach and milk before they go off.',
        extendedIngredients: [ing(5, 'pasta', 200, 'g'), ing(1, 'baby spinach', 100, 'g'), ing(2, 'milk', 200, 'ml'), ing(3, 'tomatoes', 3, ''), ing(4, 'parmesan', 40, 'g'), ing(6, 'salt', 1, 'pinch')],
        analyzedInstructions: [{ name: '', steps: [
          { number: 1, step: 'Cook the pasta in salted water until al dente.' },
          { number: 2, step: 'Chop the tomatoes and warm them in a pan for 3 minutes.' },
          { number: 3, step: 'Add the milk and spinach and let it wilt.' },
          { number: 4, step: 'Mix with the pasta and top with parmesan.' },
        ] }],
      },
    },
    {
      id: 102, title: 'Beef & Tomato Skillet', likes: 205, usedIngredientCount: 2, missedIngredientCount: 2,
      usedIngredients: [ing(7, 'minced beef', 400, 'g'), ing(3, 'tomatoes', 4, '')],
      missedIngredients: [ing(8, 'onion', 1, ''), ing(9, 'garlic', 2, 'cloves')],
      recipe: {
        servings: 3, readyInMinutes: 25,
        summary: 'A one-pan dinner for the minced beef that expires tomorrow.',
        extendedIngredients: [ing(7, 'minced beef', 400, 'g'), ing(3, 'tomatoes', 4, ''), ing(8, 'onion', 1, ''), ing(9, 'garlic', 2, 'cloves'), ing(10, 'olive oil', 1, 'tbsp')],
        analyzedInstructions: [{ name: '', steps: [
          { number: 1, step: 'Dice the onion and garlic and fry them in oil.' },
          { number: 2, step: 'Add the minced beef and brown it well.' },
          { number: 3, step: 'Add the chopped tomatoes and simmer for 10 minutes.' },
        ] }],
      },
    },
    {
      id: 103, title: 'Greek Yogurt Breakfast Bowl', likes: 98, usedIngredientCount: 1, missedIngredientCount: 1,
      usedIngredients: [ing(11, 'greek yogurt', 1, 'cup')],
      missedIngredients: [ing(12, 'honey', 1, 'tbsp')],
      recipe: {
        servings: 1, readyInMinutes: 5,
        summary: 'Five minutes, no cooking – perfect for yogurt that needs eating.',
        extendedIngredients: [ing(11, 'greek yogurt', 1, 'cup'), ing(13, 'apple', 1, ''), ing(12, 'honey', 1, 'tbsp')],
        analyzedInstructions: [{ name: '', steps: [
          { number: 1, step: 'Slice the apple.' },
          { number: 2, step: 'Top the yogurt with apple and a drizzle of honey.' },
        ] }],
      },
    },
  ]
}
