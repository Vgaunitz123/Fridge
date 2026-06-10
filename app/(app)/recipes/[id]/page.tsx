import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Recipe, FridgeItem } from '@/lib/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ShoppingList from '@/components/recipes/ShoppingList'
import { mealdbLookup } from '@/lib/mealdb'

const GRADIENTS = [
  'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
  'linear-gradient(135deg, #34d399 0%, #0d9488 100%)',
  'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)',
  'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
  'linear-gradient(135deg, #fde68a 0%, #f59e0b 100%)',
]
const FOOD_EMOJIS = ['🍝', '🥘', '🫕', '🥗', '🍲', '🫔']

function pick(title: string, arr: string[]) {
  let hash = 0
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash)
  return arr[Math.abs(hash) % arr.length]
}

function normalize(s: string) {
  return s.toLowerCase().trim()
}

function hasIngredient(fridgeItems: FridgeItem[], ingredientName: string): boolean {
  const target = normalize(ingredientName)
  return fridgeItems.some(item => {
    const n = normalize(item.name)
    return n.includes(target) || target.includes(n)
  })
}

export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  let recipe: Recipe | null = null

  if (id.startsWith('mealdb_')) {
    recipe = await mealdbLookup(id.replace('mealdb_', ''))
  } else {
    const { data } = await supabase.from('recipes').select('*').eq('id', id).single()
    recipe = data as Recipe | null
  }

  if (!recipe) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: fridgeData } = user
    ? await supabase.from('fridge_items').select('*').eq('user_id', user.id)
    : { data: [] as FridgeItem[] }

  const fridgeItems: FridgeItem[] = fridgeData ?? []

  const haveIngredients: string[] = []
  const missingIngredients: string[] = []

  for (const ing of recipe.ingredients ?? []) {
    if (hasIngredient(fridgeItems, ing.name)) {
      haveIngredients.push(ing.name)
    } else {
      missingIngredients.push(ing.name)
    }
  }

  const gradient = pick(recipe.title, GRADIENTS)
  const emoji = pick(recipe.title, FOOD_EMOJIS)

  return (
    <div className="pb-10">
      {/* Hero */}
      <div className="flex items-center justify-center relative overflow-hidden" style={{ height: '260px', background: gradient }}>
        {recipe.image_url
          ? <img src={recipe.image_url} alt={recipe.title} className="absolute inset-0 w-full h-full object-cover" />
          : <span className="text-8xl drop-shadow-lg select-none">{emoji}</span>
        }
        {recipe.image_url && <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.28)' }} />}

        <Link
          href="/recipes"
          className="absolute top-4 left-4 flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold"
          style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)', color: '#fff' }}
        >
          ←
        </Link>

        <div
          className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
          style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)', color: '#fff' }}
        >
          ⏱ {recipe.cook_time_minutes} min
        </div>

        {/* Missing badge */}
        {missingIngredients.length > 0 && (
          <div
            className="absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(220,38,38,0.85)', backdropFilter: 'blur(8px)', color: '#fff' }}
          >
            Saknar {missingIngredients.length} vara{missingIngredients.length !== 1 ? 'r' : ''}
          </div>
        )}
      </div>

      <div className="px-5 pt-5 space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold leading-tight mb-1" style={{ fontFamily: 'var(--font-playfair)', color: '#1c1917' }}>
            {recipe.title}
          </h1>
          <p className="text-sm" style={{ color: '#78716c' }}>{recipe.description}</p>
          {recipe.tags?.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-3">
              {recipe.tags.map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#f0fdf4', color: '#1a4a2e' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Fridge check + Shopping list */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#d4850a' }}>
            Vad behöver du?
          </p>
          <ShoppingList missing={missingIngredients} have={haveIngredients} />
        </div>

        {/* Full ingredient list */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#d4850a' }}>
            Alla ingredienser
          </p>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(28,25,23,0.08)' }}>
            {recipe.ingredients?.map((ing, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-3"
                style={{
                  background: i % 2 === 0 ? '#fff' : '#faf7f2',
                  borderBottom: i < (recipe.ingredients?.length ?? 0) - 1 ? '1px solid rgba(28,25,23,0.06)' : 'none',
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: hasIngredient(fridgeItems, ing.name) ? '#16a34a' : '#dc2626' }}
                  />
                  <span className="text-sm" style={{ color: '#1c1917' }}>{ing.name}</span>
                </div>
                <span className="text-sm font-semibold" style={{ color: '#78716c' }}>
                  {ing.amount} {ing.unit}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#d4850a' }}>
            Tillagning
          </p>
          <div className="space-y-4">
            {recipe.steps?.map(step => (
              <div key={step.step} className="flex gap-4">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5"
                  style={{ background: '#1a4a2e', color: '#faf7f2' }}
                >
                  {step.step}
                </div>
                <div className="flex-1 rounded-2xl px-4 py-3" style={{ background: '#fff', border: '1px solid rgba(28,25,23,0.07)' }}>
                  <p className="text-sm leading-relaxed" style={{ color: '#44403c' }}>{step.instruction}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Link href="/recipes" className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#1a4a2e' }}>
          ← Tillbaka till recept
        </Link>

        {recipe.source && recipe.source_url && (
          <p style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
            Källa:{' '}
            <a href={recipe.source_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1a4a2e' }}>
              {recipe.source}
            </a>
          </p>
        )}
      </div>
    </div>
  )
}
