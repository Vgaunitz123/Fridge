'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { FridgeItem, Recipe } from '@/lib/types'
import RecipeCard from '@/components/recipes/RecipeCard'
import Link from 'next/link'

const FILTERS = ['Alla', 'Snabbt', 'Vegetarisk', 'Barnvänl', 'Veganskt', 'Glutenfritt']

const DEMO_RECIPES = [
  { id: 'd1', title: 'Kyckling med pesto och pasta', cook_time_minutes: 25, tags: ['Snabbt', 'Barnvänl'], description: 'Enkel vardagsrätt', emoji: '🍝', gradient: 'linear-gradient(135deg,#f59e0b,#ea580c)' },
  { id: 'd2', title: 'Kylskåpsfrittata', cook_time_minutes: 20, tags: ['Vegetarisk'], description: 'Ägg och grönsaker', emoji: '🍳', gradient: 'linear-gradient(135deg,#fde68a,#f59e0b)' },
  { id: 'd3', title: 'Halloumisallad', cook_time_minutes: 15, tags: ['Vegetarisk'], description: 'Färsk och lätt', emoji: '🥗', gradient: 'linear-gradient(135deg,#34d399,#0d9488)' },
  { id: 'd4', title: 'Laxpanna med dill', cook_time_minutes: 30, tags: ['Snabbt'], description: 'Klassisk svensk', emoji: '🐟', gradient: 'linear-gradient(135deg,#fb7185,#e11d48)' },
  { id: 'd5', title: 'Bönsoppa', cook_time_minutes: 20, tags: ['Veganskt'], description: 'Billig och mättande', emoji: '🫘', gradient: 'linear-gradient(135deg,#a3e635,#16a34a)' },
  { id: 'd6', title: 'Pannkakor', cook_time_minutes: 15, tags: ['Barnvänl', 'Snabbt'], description: 'Alltid uppskattat', emoji: '🥞', gradient: 'linear-gradient(135deg,#fbbf24,#f59e0b)' },
]

export default function RecipesPage() {
  const [activeFilter, setActiveFilter] = useState('Alla')
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState(false)
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showGenerate, setShowGenerate] = useState(false)

  const fetchFridge = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('fridge_items').select('*').order('name')
    setFridgeItems(data ?? [])
  }, [])

  useEffect(() => { fetchFridge() }, [fetchFridge])

  function toggleIngredient(name: string) {
    setSelected(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n })
  }

  async function generate() {
    if (!selected.size) return
    setGenerating(true)
    setError(null)
    const res = await fetch('/api/recipes/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients: Array.from(selected), filters: {} }),
    })
    const data = await res.json()
    if (!res.ok || data.error) setError(data.error ?? 'Något gick fel')
    else setGeneratedRecipes(data.recipes)
    setGenerating(false)
  }

  const displayRecipes = generatedRecipes.length > 0 ? null : DEMO_RECIPES.filter(r =>
    activeFilter === 'Alla' || r.tags.includes(activeFilter)
  )

  return (
    <div style={{ background: '#f5f6f4', minHeight: '100vh' }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-3 flex items-center justify-between">
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111211', fontFamily: 'var(--font-playfair)' }}>
          Recept &amp; Mat
        </h1>
        <div className="flex items-center gap-3">
          <button style={{ color: '#111211' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
          <button style={{ color: '#111211' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <span style={{ fontSize: '14px', color: '#aaa' }}>Sök på kategori / ingrediens</span>
        </div>
      </div>

      {/* Filter pills */}
      <div className="px-4 mb-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              padding: '7px 16px',
              borderRadius: '100px',
              fontSize: '13px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              background: activeFilter === f ? '#1e3a2a' : '#fff',
              color: activeFilter === f ? '#fff' : '#333',
              border: activeFilter === f ? 'none' : '1px solid rgba(0,0,0,0.08)',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* AI generate toggle */}
      <div className="px-4 mb-4">
        <button
          onClick={() => setShowGenerate(!showGenerate)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ background: '#1e3a2a', color: '#fff' }}
        >
          <span style={{ fontSize: '14px', fontWeight: 600 }}>👨‍🍳 Generera recept med dina varor</span>
          <span style={{ fontSize: '18px' }}>{showGenerate ? '−' : '+'}</span>
        </button>

        {showGenerate && (
          <div className="mt-2 rounded-xl p-4 fade-up" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b6f6b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
              Välj ingredienser
            </p>
            {fridgeItems.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#aaa' }}>
                Inga varor i kylen.{' '}
                <Link href="/fridge" style={{ color: '#1e3a2a', fontWeight: 600 }}>Lägg till →</Link>
              </p>
            ) : (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  {fridgeItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => toggleIngredient(item.name)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '100px',
                        fontSize: '13px',
                        fontWeight: 500,
                        background: selected.has(item.name) ? '#1e3a2a' : '#eeefec',
                        color: selected.has(item.name) ? '#fff' : '#333',
                        border: 'none',
                      }}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
                {error && <p style={{ fontSize: '13px', color: '#dc2626', marginBottom: '8px' }}>{error}</p>}
                <button
                  onClick={generate}
                  disabled={generating || !selected.size}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    background: generating || !selected.size ? '#999' : '#1e3a2a',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  {generating ? 'Genererar…' : `Generera recept med ${selected.size || 0} varor`}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Generated recipes */}
      {generatedRecipes.length > 0 && (
        <div className="px-4 mb-4">
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#6b6f6b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
            Genererade recept
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {generatedRecipes.map(r => <RecipeCard key={r.id ?? r.title} recipe={r} />)}
          </div>
        </div>
      )}

      {/* Browse recipes */}
      {displayRecipes && (
        <div className="px-4 pb-28">
          {/* Featured - first item large */}
          {displayRecipes[0] && (
            <div
              className="mb-3 rounded-2xl overflow-hidden hover-lift"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              <div className="flex items-center justify-center relative" style={{ height: '160px', background: displayRecipes[0].gradient }}>
                <span style={{ fontSize: '72px' }}>{displayRecipes[0].emoji}</span>
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)' }}>
                  <span style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>⏱ {displayRecipes[0].cook_time_minutes} min</span>
                </div>
                <div className="absolute bottom-3 left-3 flex gap-1.5">
                  {displayRecipes[0].tags.map(t => (
                    <span key={t} style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)', color: '#fff' }}>{t}</span>
                  ))}
                </div>
              </div>
              <div style={{ padding: '14px 16px', background: '#fff' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111211', fontFamily: 'var(--font-playfair)' }}>
                  {displayRecipes[0].title}
                </h3>
                <p style={{ fontSize: '13px', color: '#6b6f6b', marginTop: '2px' }}>{displayRecipes[0].description}</p>
              </div>
            </div>
          )}

          {/* Rest in grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {displayRecipes.slice(1).map(r => (
              <div key={r.id} className="rounded-2xl overflow-hidden hover-lift" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                <div className="flex items-center justify-center relative" style={{ height: '100px', background: r.gradient }}>
                  <span style={{ fontSize: '44px' }}>{r.emoji}</span>
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)' }}>
                    <span style={{ fontSize: '10px', color: '#fff', fontWeight: 600 }}>⏱ {r.cook_time_minutes}m</span>
                  </div>
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111211', lineHeight: 1.3 }}>{r.title}</h3>
                  <p style={{ fontSize: '11px', color: '#6b6f6b', marginTop: '2px' }}>{r.description}</p>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {r.tags.slice(0, 2).map(t => (
                      <span key={t} style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '10px', fontWeight: 600, background: '#e8f0e9', color: '#1e3a2a' }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
