import { NextRequest, NextResponse } from 'next/server'
import type { Recipe } from '@/lib/types'
import { mealdbSearch, mealdbCategory } from '@/lib/mealdb'

// ── Spoonacular ───────────────────────────────────────────────────────────────
async function spoonacularSearch(query: string, limit = 12): Promise<Recipe[]> {
  const key = process.env.SPOONACULAR_API_KEY
  if (!key) return []
  const url = `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(query)}&number=${limit}&addRecipeInformation=true&apiKey=${key}`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) return []
  const data = await res.json()

  type SpoonResult = {
    id: number; title: string; image: string; readyInMinutes: number;
    diets: string[]; summary: string;
    extendedIngredients?: { name: string; amount: number; unit: string }[]
    analyzedInstructions?: { steps: { number: number; step: string }[] }[]
  }

  return (data.results ?? []).map((r: SpoonResult): Recipe => ({
    id: `spoonacular_${r.id}`,
    title: r.title,
    description: r.summary ? r.summary.replace(/<[^>]+>/g, '').slice(0, 130) + '…' : null,
    ingredients: (r.extendedIngredients ?? []).map(i => ({
      name: i.name, amount: String(i.amount), unit: i.unit,
    })),
    steps: (r.analyzedInstructions?.[0]?.steps ?? []).map(s => ({
      step: s.number, instruction: s.step,
    })),
    image_url: r.image,
    cook_time_minutes: r.readyInMinutes,
    tags: (r.diets ?? []).map((d: string) => d.charAt(0).toUpperCase() + d.slice(1)),
    created_by: 'spoonacular',
    created_at: new Date().toISOString(),
    source: 'Spoonacular',
    source_url: `https://spoonacular.com/recipes/${r.title.toLowerCase().replace(/\s+/g, '-')}-${r.id}`,
  }))
}

// ── Edamam ────────────────────────────────────────────────────────────────────
async function edamamSearch(query: string, limit = 12): Promise<Recipe[]> {
  const appId = process.env.EDAMAM_APP_ID
  const appKey = process.env.EDAMAM_APP_KEY
  if (!appId || !appKey) return []
  const url = `https://api.edamam.com/api/recipes/v2?type=public&q=${encodeURIComponent(query)}&app_id=${appId}&app_key=${appKey}`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) return []
  const data = await res.json()

  type EdamamHit = { recipe: {
    uri: string; label: string; image: string; totalTime: number;
    dietLabels: string[]; healthLabels: string[];
    ingredientLines: string[]; url: string;
  }}

  return (data.hits ?? []).slice(0, limit).map((hit: EdamamHit): Recipe => {
    const r = hit.recipe
    const id = r.uri.split('#recipe_')[1] ?? r.uri
    return {
      id: `edamam_${id}`,
      title: r.label,
      description: null,
      ingredients: r.ingredientLines.map(l => ({ name: l, amount: '', unit: '' })),
      steps: [],
      image_url: r.image,
      cook_time_minutes: r.totalTime || 30,
      tags: [...(r.dietLabels ?? []), ...(r.healthLabels ?? [])].slice(0, 5),
      created_by: 'edamam',
      created_at: new Date().toISOString(),
      source: 'Edamam',
      source_url: r.url,
    }
  })
}

// ── Browse categories (initial load — fast, minimal data) ─────────────────────
const BROWSE_CATS = ['Chicken', 'Beef', 'Seafood', 'Vegetarian', 'Pasta', 'Dessert']

async function mealdbBrowse(): Promise<Recipe[]> {
  const results = await Promise.allSettled(
    BROWSE_CATS.map(cat => mealdbCategory(cat, 5))
  )
  return results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim() ?? ''

  const configuredSources = {
    mealdb: true,
    spoonacular: !!process.env.SPOONACULAR_API_KEY,
    edamam: !!(process.env.EDAMAM_APP_ID && process.env.EDAMAM_APP_KEY),
  }

  try {
    let recipes: Recipe[]

    if (!query) {
      const [mealdb, spoon, edamam] = await Promise.allSettled([
        mealdbBrowse(),
        spoonacularSearch('popular dinner', 8),
        edamamSearch('chicken dinner', 8),
      ])
      recipes = [
        ...(mealdb.status === 'fulfilled' ? mealdb.value : []),
        ...(spoon.status === 'fulfilled' ? spoon.value : []),
        ...(edamam.status === 'fulfilled' ? edamam.value : []),
      ]
    } else {
      const [mealdb, spoon, edamam] = await Promise.allSettled([
        mealdbSearch(query),
        spoonacularSearch(query),
        edamamSearch(query),
      ])
      recipes = [
        ...(mealdb.status === 'fulfilled' ? mealdb.value : []),
        ...(spoon.status === 'fulfilled' ? spoon.value : []),
        ...(edamam.status === 'fulfilled' ? edamam.value : []),
      ]
    }

    // Deduplicate by id
    const seen = new Set<string>()
    const unique = recipes.filter(r => {
      if (seen.has(r.id)) return false
      seen.add(r.id)
      return true
    })

    return NextResponse.json({ recipes: unique, sources: configuredSources })
  } catch (err) {
    console.error('External recipes error:', err)
    return NextResponse.json({ error: 'Kunde inte hämta recept' }, { status: 500 })
  }
}
