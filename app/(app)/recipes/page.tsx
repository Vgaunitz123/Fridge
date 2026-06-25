'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { FridgeItem, Recipe } from '@/lib/types'
import RecipeCard from '@/components/recipes/RecipeCard'
import { calcMatch, matchLabel, matchColors, type MatchResult } from '@/lib/matchRecipe'
import ToplistaSection from '@/components/recipes/ToplistaSection'
import Link from 'next/link'

const FILTERS = ['Alla', 'Snabbt', 'Vegetarisk', 'Barnvänl', 'Veganskt', 'Glutenfritt']

const PLACEHOLDER_COLORS = ['#D6CFC4', '#C8C2B6', '#D4CCBF', '#C6BFB3', '#D0C9BC']
function pickColor(title: string) {
  let h = 0; for (const c of title) h = c.charCodeAt(0) + ((h << 5) - h)
  return PLACEHOLDER_COLORS[Math.abs(h) % PLACEHOLDER_COLORS.length]
}

function isRecipeClickable(id: string | undefined) {
  if (!id) return false
  if (id.startsWith('mealdb_')) return true
  if (id.startsWith('spoonacular_') || id.startsWith('edamam_') || /^d\d+$/.test(id)) return false
  return true // UUID = own recipe
}

type FeaturedRecipe = Recipe & { imageUrl?: string }

function FeaturedMatchBadge({ match }: { match: MatchResult }) {
  const { bg, text, bar } = matchColors(match.pct)
  const label = matchLabel(match)
  return (
    <div style={{ margin: '0 16px 14px', borderRadius: '8px', background: bg, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '4px', background: 'rgba(0,0,0,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${match.pct}%`, height: '100%', background: bar, borderRadius: '2px' }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: 700, color: text, whiteSpace: 'nowrap', flexShrink: 0 }}>{match.pct}%</span>
      <span style={{ fontSize: '11px', color: text, opacity: 0.85 }}>{label}</span>
    </div>
  )
}

function FeaturedCard({ recipe, match }: { recipe: FeaturedRecipe; match?: MatchResult | null }) {
  const [err, setErr] = useState(false)
  const imageUrl = recipe.image_url ?? recipe.imageUrl
  const photo = !err && imageUrl
  const isClickable = isRecipeClickable(recipe.id)
  const inner = (
      <div className="card-hover fade-up overflow-hidden" style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.08)' }}>
        <div className="relative overflow-hidden" style={{ height: '200px' }}>
          {photo
            ? <img src={imageUrl} alt={recipe.title} onError={() => setErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', background: pickColor(recipe.title) }} />
          }
          <div className="absolute top-3 right-3 px-2 py-1 text-xs font-semibold" style={{ background: '#1C3A2A', color: '#fff', borderRadius: '4px', fontSize: '11px' }}>
            {recipe.cook_time_minutes} min
          </div>
          <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
            {recipe.tags.slice(0, 2).map(t => (
              <span key={t} style={{ padding: '2px 8px', fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(6px)', color: '#fff', borderRadius: '3px' }}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{ padding: '14px 16px 10px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '17px', color: '#1A1A1A', marginBottom: '4px' }}>{recipe.title}</h3>
          <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.5 }}>{recipe.description}</p>
        </div>
        {match && <FeaturedMatchBadge match={match} />}
      </div>
  )
  return isClickable
    ? <Link href={`/recipes/${recipe.id}`} style={{ display: 'block', textDecoration: 'none', marginBottom: '12px' }}>{inner}</Link>
    : <div style={{ marginBottom: '12px' }}>{inner}</div>
}

const UNS = 'https://images.unsplash.com/photo-'
const DEMO_RECIPES = [
  { id: 'd1',  title: 'Kyckling med pesto och pasta',     cook_time_minutes: 25, tags: ['Snabbt', 'Barnvänl'],        description: 'Saftig kyckling, grön pesto och al dente pasta',           imageUrl: UNS+'1555949258-eb67b1ef0ceb?w=600&h=400&fit=crop&auto=format' },
  { id: 'd2',  title: 'Kylskåpsfrittata',                 cook_time_minutes: 20, tags: ['Vegetarisk', 'Snabbt'],      description: 'Ägg och grönsaker från veckan i en',                       imageUrl: UNS+'1490645935967-10de6ba17061?w=600&h=400&fit=crop&auto=format' },
  { id: 'd3',  title: 'Pannkakor med jordgubbar',         cook_time_minutes: 15, tags: ['Barnvänl', 'Snabbt'],        description: 'Tunna pannkakor med grädde och färska bär',                 imageUrl: UNS+'1567620905732-2d1ec7ab7445?w=600&h=400&fit=crop&auto=format' },
  { id: 'd4',  title: 'Äggröra med smoked salmon',        cook_time_minutes: 10, tags: ['Snabbt', 'Glutenfritt'],     description: 'Krämig äggröra på rostbröd med rökig lax',                  imageUrl: UNS+'1519708227418-c8fd9a32b7a2?w=600&h=400&fit=crop&auto=format' },
  { id: 'd5',  title: 'Avokadotoast med fetaost',         cook_time_minutes: 10, tags: ['Vegetarisk', 'Snabbt'],      description: 'Krämig avokado, smulig fetaost och chiliflingor',            imageUrl: UNS+'1603046891724-52e79e69cd8b?w=600&h=400&fit=crop&auto=format' },
  { id: 'd6',  title: 'Halloumisallad med quinoa',        cook_time_minutes: 20, tags: ['Vegetarisk', 'Glutenfritt'], description: 'Grillad halloumi, quinoa och färska grönsaker',              imageUrl: UNS+'1512621776951-a57141f2eefd?w=600&h=400&fit=crop&auto=format' },
  { id: 'd7',  title: 'Tomatsoppa med basilika',          cook_time_minutes: 25, tags: ['Vegetarisk', 'Veganskt'],    description: 'Len tomatsoppa smaksatt med färsk basilika',                 imageUrl: UNS+'1547592166-23ac45744acd?w=600&h=400&fit=crop&auto=format' },
  { id: 'd8',  title: 'Svamprisotto',                     cook_time_minutes: 35, tags: ['Vegetarisk'],                description: 'Krämig risotto med blandade skogsvampar och parmesan',      imageUrl: UNS+'1476124369491-e7addf5db371?w=600&h=400&fit=crop&auto=format' },
  { id: 'd9',  title: 'Veganska tacos med jackfruit',     cook_time_minutes: 30, tags: ['Veganskt'],                  description: 'Smakrik jackfruit som pulled pork, med avokadomousse',       imageUrl: UNS+'1551504734-5da7e163f67d?w=600&h=400&fit=crop&auto=format' },
  { id: 'd10', title: 'Laxpanna med dill och potatis',    cook_time_minutes: 30, tags: ['Snabbt', 'Glutenfritt'],     description: 'Stekt lax med dillsmör och kokt färskpotatis',              imageUrl: UNS+'1467003909585-2f8a72700288?w=600&h=400&fit=crop&auto=format' },
  { id: 'd11', title: 'Köttbullar med gräddsås',          cook_time_minutes: 40, tags: ['Barnvänl'],                  description: 'Svenska köttbullar med pressad potatis och lingon',          imageUrl: UNS+'1529042410759-befb1204b468?w=600&h=400&fit=crop&auto=format' },
  { id: 'd12', title: 'Kycklingwok med nudlar',           cook_time_minutes: 20, tags: ['Snabbt'],                    description: 'Asiatisk wok med kyckling, grönsaker och oystersås',        imageUrl: UNS+'1603073163308-9654c3fb70b5?w=600&h=400&fit=crop&auto=format' },
  { id: 'd13', title: 'Biff med bearnaisesås',            cook_time_minutes: 25, tags: ['Glutenfritt'],               description: 'Perfekt stekt biff med hemgjord bearnaise och pommes',       imageUrl: UNS+'1558030006-450675393462?w=600&h=400&fit=crop&auto=format' },
  { id: 'd14', title: 'Bönsoppa med rostat bröd',         cook_time_minutes: 20, tags: ['Veganskt'],                  description: 'Mustig bönsoppa med tomater, spiskummin och lime',           imageUrl: UNS+'1547592180-85f173990554?w=600&h=400&fit=crop&auto=format' },
  { id: 'd15', title: 'Linssoppa med kokosmjölk',         cook_time_minutes: 30, tags: ['Veganskt'],                  description: 'Röda linser, kokosmjölk och ingefära — mättande och god',   imageUrl: UNS+'1476122102823-c3e4a1ef0de4?w=600&h=400&fit=crop&auto=format' },
  { id: 'd16', title: 'Ugnsbakad blomkål med tahini',     cook_time_minutes: 35, tags: ['Veganskt', 'Vegetarisk'],    description: 'Hel blomkål i ugn med tahinisås och granatäpple',            imageUrl: UNS+'1568605117036-5fe5e7bab0b7?w=600&h=400&fit=crop&auto=format' },
  { id: 'd17', title: 'Makaronigratäng',                  cook_time_minutes: 35, tags: ['Barnvänl'],                  description: 'Klassisk gratäng med makaroner, falukorv och ost',           imageUrl: UNS+'1543362906-acfc16c67564?w=600&h=400&fit=crop&auto=format' },
  { id: 'd18', title: 'Pizzabullar',                      cook_time_minutes: 40, tags: ['Barnvänl'],                  description: 'Mjuka bullor fyllda med tomatsås, skinka och mozzarella',   imageUrl: UNS+'1513104890138-7c749659a591?w=600&h=400&fit=crop&auto=format' },
]

export default function RecipesPage() {
  const [activeFilter, setActiveFilter] = useState('Alla')
  const [searchQuery, setSearchQuery] = useState('')
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState(false)
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showGenerate, setShowGenerate] = useState(false)
  const [externalRecipes, setExternalRecipes] = useState<Recipe[] | null>(null)
  const [externalLoading, setExternalLoading] = useState(true)
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([])
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const fetchFridge = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('fridge_items').select('*').order('name')
    setFridgeItems(data ?? [])
  }, [])

  const fetchMyRecipes = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('recipes')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
    setMyRecipes((data ?? []) as Recipe[])
  }, [])

  const fetchExternal = useCallback(async (q = '') => {
    setExternalLoading(true)
    try {
      const res = await fetch(`/api/recipes/external${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      const data = await res.json()
      // Only replace results if we got actual hits — keeps browse cache for Swedish local filtering
      if (data.recipes && (!q || data.recipes.length > 0)) {
        setExternalRecipes(data.recipes)
      }
    } catch {
      // keep previous results as fallback
    } finally {
      setExternalLoading(false)
    }
  }, [])

  useEffect(() => { fetchFridge(); fetchExternal(); fetchMyRecipes() }, [fetchFridge, fetchExternal, fetchMyRecipes])

  // Merge duplicates by name (case-insensitive), sum quantities
  const uniqueItems = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; unit: string }>()
    for (const item of fridgeItems) {
      const key = item.name.toLowerCase().trim()
      const existing = map.get(key)
      if (existing) {
        map.set(key, { ...existing, quantity: existing.quantity + item.quantity })
      } else {
        map.set(key, { name: item.name, quantity: item.quantity, unit: item.unit })
      }
    }
    return Array.from(map.values())
  }, [fridgeItems])

  function toggleIngredient(name: string) {
    setSelected(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n })
  }

  // Only compute match when user has fridge items
  function getMatch(r: Recipe): MatchResult | null {
    if (fridgeItems.length === 0) return null
    return calcMatch(r, fridgeItems)
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
    if (!res.ok || data.error) {
      setError(data.error ?? 'Något gick fel')
    } else {
      const sorted = (data.recipes as Recipe[]).slice().sort((a, b) => {
        const ma = calcMatch(a, fridgeItems)
        const mb = calcMatch(b, fridgeItems)
        return (mb?.pct ?? 0) - (ma?.pct ?? 0)
      })
      setGeneratedRecipes(sorted)
    }
    setGenerating(false)
  }

  const isSearching = searchQuery.trim().length > 0

  // Use external recipes if loaded, else fall back to DEMO_RECIPES
  const baseRecipes = (externalRecipes ?? DEMO_RECIPES).map(r => ({
    ...r,
    ingredients: (r as Recipe).ingredients ?? [],
    steps: (r as Recipe).steps ?? [],
    created_by: (r as Recipe).created_by ?? null,
    created_at: (r as Recipe).created_at ?? '',
  })) as Recipe[]

  const matchesQuery = (r: { title: string; description?: string | null; tags: string[] }) => {
    const q = searchQuery.toLowerCase()
    return r.title.toLowerCase().includes(q) ||
      (r.description ?? '').toLowerCase().includes(q) ||
      r.tags.some(t => t.toLowerCase().includes(q))
  }

  // Own recipes matching the search query (shown inline when searching)
  const myRecipesFiltered = isSearching ? myRecipes.filter(matchesQuery) : myRecipes

  const displayRecipes = generatedRecipes.length > 0 ? null : (() => {
    const external = baseRecipes.filter(r => {
      if (isSearching) return matchesQuery(r)
      return activeFilter === 'Alla' || r.tags.includes(activeFilter)
    })

    let list: Recipe[]
    if (isSearching) {
      const ownIds = new Set(myRecipesFiltered.map(r => r.id))
      list = [...myRecipesFiltered, ...external.filter(r => !ownIds.has(r.id))]
    } else {
      list = external
    }

    // Sort by match percentage when user has fridge items — null (no ingredient data) goes last
    if (fridgeItems.length > 0) {
      list = list.slice().sort((a, b) => {
        const ma = calcMatch(a, fridgeItems)
        const mb = calcMatch(b, fridgeItems)
        return (mb?.pct ?? -1) - (ma?.pct ?? -1)
      })
    }

    return list
  })()

  return (
    <div style={{ background: '#F5F3EE', minHeight: '100vh' }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-3 flex items-center justify-between">
        <h1 style={{ fontSize: '26px', fontWeight: 500, color: '#1A1A1A', fontFamily: 'var(--font-display)' }}>
          Recept &amp; Mat
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href="/recipes/new"
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '7px 13px', borderRadius: '8px',
              background: '#1C3A2A', color: '#fff',
              fontSize: '13px', fontWeight: 600, textDecoration: 'none',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Lägg till
          </Link>
          <button
            onClick={() => searchInputRef.current?.focus()}
            style={{ color: '#1A1A1A' }}
          >
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
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => {
              const q = e.target.value
              setSearchQuery(q)
              if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
              searchTimeoutRef.current = setTimeout(() => {
                fetchExternal(q)
              }, 500)
            }}
            placeholder="Sök recept från hela världen…"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              color: '#111211',
              fontFamily: 'var(--font-dm-sans)',
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ color: '#aaa', fontSize: '16px', lineHeight: 1 }}>✕</button>
          )}
        </div>
      </div>

      {/* Filter pills */}
      <div className="px-4 mb-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="pressable"
            style={{
              padding: '6px 15px',
              borderRadius: '100px',
              fontSize: '13px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              background: activeFilter === f ? '#1C3A2A' : 'transparent',
              color: activeFilter === f ? '#fff' : '#1A1A1A',
              border: `1.5px solid ${activeFilter === f ? '#1C3A2A' : 'rgba(0,0,0,0.18)'}`,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Topplista */}
      <ToplistaSection />

      {/* AI generate toggle */}
      <div className="px-4 mb-4">
        <button
          onClick={() => setShowGenerate(!showGenerate)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ background: '#1C3A2A', color: '#fff' }}
        >
          <span style={{ fontSize: '14px', fontWeight: 600 }}>👨‍🍳 Generera recept med dina varor</span>
          <span style={{ fontSize: '18px' }}>{showGenerate ? '−' : '+'}</span>
        </button>

        {showGenerate && (
          <div className="mt-2 rounded-xl p-4 fade-up" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)' }}>
            <div className="flex items-center justify-between mb-2.5">
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b6f6b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Välj ingredienser
              </p>
              {uniqueItems.length > 0 && (
                <button
                  onClick={() => {
                    const allNames = uniqueItems.map(i => i.name)
                    const allSelected = allNames.every(n => selected.has(n))
                    if (allSelected) {
                      setSelected(new Set())
                    } else {
                      setSelected(new Set(allNames))
                    }
                  }}
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#1C3A2A',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 0',
                  }}
                >
                  {uniqueItems.every(i => selected.has(i.name)) ? 'Avmarkera alla' : 'Alla varor'}
                </button>
              )}
            </div>
            {fridgeItems.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#aaa' }}>
                Inga varor i kylen.{' '}
                <Link href="/fridge" style={{ color: '#1C3A2A', fontWeight: 600 }}>Lägg till →</Link>
              </p>
            ) : (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  {uniqueItems.map(item => {
                    const isSelected = selected.has(item.name)
                    return (
                      <button
                        key={item.name}
                        onClick={() => toggleIngredient(item.name)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '100px',
                          fontSize: '13px',
                          fontWeight: 500,
                          background: isSelected ? '#1C3A2A' : '#eeefec',
                          color: isSelected ? '#fff' : '#333',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        {item.name}
                        <span style={{ opacity: 0.65, fontSize: '11px' }}>
                          {item.quantity} {item.unit}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {error && <p style={{ fontSize: '13px', color: '#dc2626', marginBottom: '8px' }}>{error}</p>}
                <button
                  onClick={generate}
                  disabled={generating || !selected.size}
                  className="pressable"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    background: generating || !selected.size ? '#999' : '#1C3A2A',
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

      {/* My recipes — hidden when searching (they appear inline in results) */}
      {myRecipes.length > 0 && !isSearching && (
        <div className="px-4 mb-5">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#6b6f6b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Mina recept
            </p>
            <Link href="/recipes/new" style={{ fontSize: '12px', fontWeight: 600, color: '#1C3A2A', textDecoration: 'none' }}>
              + Nytt recept
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {myRecipes.map(r => <RecipeCard key={r.id} recipe={r} match={getMatch(r)} />)}
          </div>
        </div>
      )}

      {/* Generated recipes */}
      {generatedRecipes.length > 0 && (
        <div className="px-4 mb-4">
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#6b6f6b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
            Genererade recept
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {generatedRecipes.map(r => <RecipeCard key={r.id ?? r.title} recipe={r} match={getMatch(r)} />)}
          </div>
        </div>
      )}

      {/* Source info / loading indicator */}
      {externalLoading && !externalRecipes && (
        <div className="px-4 mb-3 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#1C3A2A' }} />
          <p style={{ fontSize: '12px', color: '#6B6B6B' }}>Hämtar recept från TheMealDB…</p>
        </div>
      )}
      {!externalLoading && externalRecipes && (
        <div className="px-4 mb-2 flex items-center gap-1.5">
          <span style={{ fontSize: '10px', color: '#9B9B9B' }}>
            {externalRecipes.length} recept från TheMealDB
            {process.env.NEXT_PUBLIC_HAS_SPOONACULAR ? ', Spoonacular' : ''}
            {process.env.NEXT_PUBLIC_HAS_EDAMAM ? ', Edamam' : ''}
          </span>
        </div>
      )}

      {/* Browse recipes */}
      {displayRecipes && displayRecipes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#111211', marginBottom: '4px' }}>Inga recept hittades</p>
          <p style={{ fontSize: '13px', color: '#6b6f6b', textAlign: 'center' }}>
            Prova ett annat sökord eller ändra filtret
          </p>
          <button
            onClick={() => { setSearchQuery(''); setActiveFilter('Alla') }}
            style={{ marginTop: '14px', padding: '10px 20px', borderRadius: '10px', background: '#1C3A2A', color: '#fff', fontSize: '13px', fontWeight: 600 }}
          >
            Rensa sökning
          </button>
        </div>
      )}

      {displayRecipes && displayRecipes.length > 0 && (
        <div className="px-4 pb-28">
          {!externalLoading && !externalRecipes && (
            <p style={{ fontSize: '11px', color: '#9B9B9B', marginBottom: '10px', textAlign: 'center' }}>
              Inspiration — klicka på dina egna recept ovan för att laga
            </p>
          )}

          {/* Featured — first card full-width with taller photo */}
          {displayRecipes[0] && (
            <FeaturedCard recipe={displayRecipes[0] as FeaturedRecipe} match={getMatch(displayRecipes[0])} />
          )}

          {/* Grid — staggered entry */}
          <div className="stagger" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {displayRecipes.slice(1).map(r => (
              <RecipeCard key={r.id} recipe={r as never} showLink={isRecipeClickable(r.id)} match={getMatch(r)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
