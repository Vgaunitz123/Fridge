import type { Recipe, Ingredient, RecipeStep } from './types'

const MEALDB = 'https://www.themealdb.com/api/json/v1/1'

export const CAT_SWEDISH: Record<string, string> = {
  Beef: 'Nötkött', Chicken: 'Kyckling', Dessert: 'Dessert',
  Lamb: 'Lamm', Pasta: 'Pasta', Pork: 'Fläsk',
  Seafood: 'Fisk & Skaldjur', Starter: 'Förrätt', Vegan: 'Veganskt',
  Vegetarian: 'Vegetarisk', Breakfast: 'Frukost', Side: 'Tillbehör',
  Miscellaneous: 'Övrigt', Goat: 'Getkött',
}

export const CAT_TIME: Record<string, number> = {
  Breakfast: 15, Starter: 20, Side: 20, Seafood: 22, Pasta: 25,
  Vegetarian: 25, Vegan: 25, Dessert: 35, Chicken: 30, Pork: 35,
  Beef: 45, Lamb: 50,
}

const CAT_FILTER_TAGS: Record<string, string[]> = {
  Vegetarian: ['Vegetarisk'],
  Vegan: ['Veganskt', 'Vegetarisk'],
  Breakfast: ['Snabbt'],
  Starter: ['Snabbt'],
  Side: ['Snabbt'],
  Seafood: ['Glutenfritt'],
}

type MealFull = Record<string, string | null>

export function mealFullToRecipe(m: MealFull): Recipe {
  const cat = m.strCategory ?? 'Miscellaneous'
  const swedishCat = CAT_SWEDISH[cat] ?? cat

  const ingredients: Ingredient[] = []
  for (let i = 1; i <= 20; i++) {
    const name = m[`strIngredient${i}`]?.trim()
    if (!name) continue
    ingredients.push({ name, amount: m[`strMeasure${i}`]?.trim() ?? '', unit: '' })
  }

  const steps: RecipeStep[] = (m.strInstructions ?? '')
    .split(/\r?\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 15)
    .map((instruction, idx) => ({ step: idx + 1, instruction }))

  const extraTags = CAT_FILTER_TAGS[cat] ?? []
  const tags = [
    swedishCat,
    ...(m.strArea && m.strArea !== 'Unknown' ? [m.strArea] : []),
    ...(m.strTags ? m.strTags.split(',').map(t => t.trim()).filter(Boolean) : []),
    ...extraTags,
  ]

  const description = m.strInstructions
    ? m.strInstructions.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 130) + '…'
    : null

  return {
    id: `mealdb_${m.idMeal}`,
    title: m.strMeal ?? '',
    description,
    ingredients,
    steps,
    image_url: m.strMealThumb ?? null,
    cook_time_minutes: CAT_TIME[cat] ?? 30,
    tags: [...new Set(tags)],
    created_by: 'themealdb',
    created_at: new Date().toISOString(),
    source: 'TheMealDB',
    source_url: `https://www.themealdb.com/meal/${m.idMeal}`,
  }
}

export function mealMinimalToRecipe(
  m: { idMeal: string; strMeal: string; strMealThumb: string },
  category: string
): Recipe {
  const swedishCat = CAT_SWEDISH[category] ?? category
  const extraTags = CAT_FILTER_TAGS[category] ?? []
  return {
    id: `mealdb_${m.idMeal}`,
    title: m.strMeal,
    description: null,
    ingredients: [],
    steps: [],
    image_url: m.strMealThumb,
    cook_time_minutes: CAT_TIME[category] ?? 30,
    tags: [...new Set([swedishCat, ...extraTags])],
    created_by: 'themealdb',
    created_at: new Date().toISOString(),
    source: 'TheMealDB',
    source_url: `https://www.themealdb.com/meal/${m.idMeal}`,
  }
}

export async function mealdbLookup(mealId: string): Promise<Recipe | null> {
  const res = await fetch(`${MEALDB}/lookup.php?i=${mealId}`, { next: { revalidate: 3600 } })
  if (!res.ok) return null
  const data = await res.json()
  const m = data.meals?.[0]
  return m ? mealFullToRecipe(m) : null
}

export async function mealdbSearch(query: string): Promise<Recipe[]> {
  try {
    const res = await fetch(`${MEALDB}/search.php?s=${encodeURIComponent(query)}`,
      { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    return (data.meals ?? []).map((m: MealFull) => mealFullToRecipe(m))
  } catch { return [] }
}

export async function mealdbCategory(category: string, limit: number): Promise<Recipe[]> {
  try {
    const res = await fetch(`${MEALDB}/filter.php?c=${encodeURIComponent(category)}`,
      { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    return ((data.meals ?? []) as { idMeal: string; strMeal: string; strMealThumb: string }[])
      .slice(0, limit)
      .map(m => mealMinimalToRecipe(m, category))
  } catch { return [] }
}
