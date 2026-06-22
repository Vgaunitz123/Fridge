import type { Recipe, FridgeItem } from './types'

export type MatchResult = {
  pct: number
  missing: string[]
  matched: number
  total: number
}

export function calcMatch(recipe: Recipe, fridgeItems: FridgeItem[]): MatchResult | null {
  const ingredients = recipe.ingredients ?? []
  if (ingredients.length === 0) return null

  const fridgeNorm = fridgeItems.map(i => i.name.toLowerCase().trim())

  let matched = 0
  const missing: string[] = []

  for (const ing of ingredients) {
    const n = ing.name.toLowerCase().trim()
    // Match if fridge item contains the ingredient name or vice versa
    const found = fridgeNorm.some(f => f.includes(n) || n.includes(f))
    if (found) matched++
    else missing.push(ing.name)
  }

  return {
    pct: Math.round((matched / ingredients.length) * 100),
    missing,
    matched,
    total: ingredients.length,
  }
}

export function matchLabel(m: MatchResult): string {
  if (m.pct === 100) return '✓ Allt i kylen'
  const top = m.missing.slice(0, 2).join(', ')
  const extra = m.missing.length > 2 ? ` +${m.missing.length - 2} till` : ''
  return `saknar ${top}${extra}`
}

export function matchColors(pct: number): { bg: string; text: string; bar: string } {
  if (pct === 100) return { bg: '#EBF2ED', text: '#1C3A2A', bar: '#1C3A2A' }
  if (pct >= 70)   return { bg: '#EBF2ED', text: '#1C3A2A', bar: '#4a9e6e' }
  if (pct >= 40)   return { bg: '#FFF8E6', text: '#7a4f00', bar: '#d97706' }
  return            { bg: '#F5F3EE',  text: '#6B6B6B', bar: '#C8C4BC' }
}
