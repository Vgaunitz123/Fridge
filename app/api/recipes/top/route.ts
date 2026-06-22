import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { mealdbLookup } from '@/lib/mealdb'
import type { Recipe } from '@/lib/types'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  // Fetch all likes — count per recipe_id in JS
  const { data: likes } = await supabase
    .from('recipe_likes')
    .select('recipe_id')

  if (!likes || likes.length === 0) {
    return NextResponse.json({ recipes: [] })
  }

  // Count
  const counts = new Map<string, number>()
  for (const { recipe_id } of likes) {
    counts.set(recipe_id, (counts.get(recipe_id) ?? 0) + 1)
  }

  // Top 8 sorted by likes
  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  const dbIds    = top.filter(([id]) => !id.startsWith('mealdb_')).map(([id]) => id)
  const mealIds  = top.filter(([id]) =>  id.startsWith('mealdb_')).map(([id]) => id)

  // Fetch DB recipes
  const dbMap = new Map<string, Recipe>()
  if (dbIds.length > 0) {
    const { data: dbRecipes } = await supabase
      .from('recipes')
      .select('*')
      .in('id', dbIds)
    for (const r of dbRecipes ?? []) dbMap.set(r.id, r as Recipe)
  }

  // Fetch MealDB recipes (parallel, ignore failures)
  const mealMap = new Map<string, Recipe>()
  await Promise.allSettled(
    mealIds.map(async id => {
      const r = await mealdbLookup(id.replace('mealdb_', ''))
      if (r) mealMap.set(id, r)
    })
  )

  // Assemble in rank order
  const result = top.flatMap(([id, likeCount]) => {
    const recipe = dbMap.get(id) ?? mealMap.get(id)
    if (!recipe) return []
    return [{ recipe, likes: likeCount }]
  })

  return NextResponse.json({ recipes: result })
}
