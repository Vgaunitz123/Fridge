'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { FridgeItem, Recipe } from '@/lib/types'
import RecipeCard from '@/components/recipes/RecipeCard'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

const DIETARY_OPTIONS = [
  { value: 'all', label: 'Alla' },
  { value: 'Vegetariskt', label: '🌿 Vegetariskt' },
  { value: 'Veganskt', label: '🌱 Veganskt' },
  { value: 'Barnvänligt', label: '👶 Barnvänligt' },
  { value: 'Glutenfritt', label: '🌾 Glutenfritt' },
]

const TIME_OPTIONS = [
  { value: '', label: 'Valfri tid' },
  { value: '20', label: 'Max 20 min' },
  { value: '30', label: 'Max 30 min' },
  { value: '45', label: 'Max 45 min' },
]

export default function RecipesPage() {
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [dietary, setDietary] = useState('all')
  const [maxTime, setMaxTime] = useState('')
  const [generating, setGenerating] = useState(false)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loadingFridge, setLoadingFridge] = useState(true)

  const fetchFridge = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('fridge_items').select('*').order('name')
    setFridgeItems(data ?? [])
    setLoadingFridge(false)
  }, [])

  useEffect(() => { fetchFridge() }, [fetchFridge])

  function toggleIngredient(name: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  function selectAll() { setSelected(new Set(fridgeItems.map(i => i.name))) }

  async function generate() {
    if (selected.size === 0) return
    setGenerating(true)
    setError(null)
    setRecipes([])
    const res = await fetch('/api/recipes/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients: Array.from(selected), filters: { maxTime: maxTime || null, dietary: dietary === 'all' ? null : dietary } }),
    })
    const data = await res.json()
    if (!res.ok || data.error) setError(data.error ?? 'Något gick fel')
    else setRecipes(data.recipes)
    setGenerating(false)
  }

  return (
    <div>
      {/* Header */}
      <div className="px-5 pt-8 pb-5">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#d4850a' }}>
          AI-driven matlagning
        </p>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-playfair)', color: '#1c1917' }}>
          Receptmotorn
        </h1>
        <p className="text-sm mt-1" style={{ color: '#78716c' }}>
          Välj ingredienser — vi skapar recept från vad du har
        </p>
      </div>

      <div className="px-4 space-y-4 pb-4">
        {loadingFridge ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-4xl animate-pulse mb-3">👨‍🍳</div>
            <p className="text-sm" style={{ color: '#a8a29e' }}>Laddar kylskåpet…</p>
          </div>
        ) : fridgeItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-5"
              style={{ background: '#f0fdf4' }}
            >
              🧊
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-playfair)', color: '#1c1917' }}>
              Kylskåpet är tomt
            </h2>
            <p className="text-sm mb-4" style={{ color: '#78716c' }}>
              Lägg till ingredienser för att generera recept
            </p>
            <div className="flex gap-2">
              <Link
                href="/fridge"
                className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: '#1a4a2e', color: '#faf7f2' }}
              >
                + Lägg till
              </Link>
              <Link
                href="/scan"
                className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: '#f0ebe0', color: '#44403c' }}
              >
                📷 Scanna
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Ingredient selector */}
            <div
              className="rounded-2xl p-4"
              style={{ background: '#fff', border: '1px solid rgba(28,25,23,0.08)', boxShadow: '0 1px 3px rgba(28,25,23,0.05)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#78716c' }}>
                  Mina ingredienser
                </p>
                <button
                  onClick={selectAll}
                  className="text-xs font-semibold"
                  style={{ color: '#1a4a2e' }}
                >
                  Välj alla
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {fridgeItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleIngredient(item.name)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all"
                    style={{
                      background: selected.has(item.name) ? '#f0fdf4' : '#faf7f2',
                      border: `1.5px solid ${selected.has(item.name) ? 'rgba(26,74,46,0.3)' : 'rgba(28,25,23,0.06)'}`,
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                      style={{
                        background: selected.has(item.name) ? '#1a4a2e' : 'rgba(28,25,23,0.08)',
                        color: '#fff',
                        fontSize: '9px',
                      }}
                    >
                      {selected.has(item.name) ? '✓' : ''}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: '#1c1917' }}>{item.name}</p>
                      <p className="text-xs" style={{ color: '#a8a29e' }}>{item.quantity} {item.unit}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-2">
              <Select value={dietary} onValueChange={v => v && setDietary(v)}>
                <SelectTrigger
                  className="rounded-xl h-11"
                  style={{ background: '#fff', border: '1.5px solid rgba(28,25,23,0.1)' }}
                >
                  <SelectValue placeholder="Kost" />
                </SelectTrigger>
                <SelectContent>
                  {DIETARY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={maxTime} onValueChange={v => setMaxTime(v ?? '')}>
                <SelectTrigger
                  className="rounded-xl h-11"
                  style={{ background: '#fff', border: '1.5px solid rgba(28,25,23,0.1)' }}
                >
                  <SelectValue placeholder="Tid" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Generate button */}
            <button
              onClick={generate}
              disabled={generating || selected.size === 0}
              className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: generating || selected.size === 0 ? '#a3b8a8' : '#1a4a2e',
                color: '#faf7f2',
                cursor: generating || selected.size === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {generating
                ? <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Genererar recept…
                  </span>
                : selected.size === 0
                  ? 'Välj minst en ingrediens'
                  : `👨‍🍳 Generera med ${selected.size} ingredienser`
              }
            </button>

            {/* Error */}
            {error && (
              <div
                className="px-4 py-3 rounded-2xl text-sm"
                style={{ background: '#fff7ed', color: '#92400e', border: '1px solid rgba(217,119,6,0.2)' }}
              >
                {error}
              </div>
            )}

            {/* Generating state */}
            {generating && (
              <div className="text-center py-10">
                <div className="text-5xl mb-3 animate-bounce">👨‍🍳</div>
                <p className="text-sm font-semibold" style={{ color: '#1c1917' }}>Kocken lagar recept…</p>
                <p className="text-xs mt-1" style={{ color: '#a8a29e' }}>Det tar ca 10 sekunder</p>
              </div>
            )}

            {/* Recipes */}
            {recipes.length > 0 && (
              <div className="fade-up">
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#78716c' }}>
                  {recipes.length} recept föreslagna
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {recipes.map(recipe => (
                    <RecipeCard key={recipe.id ?? recipe.title} recipe={recipe} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
