import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Recipe } from '@/lib/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'

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

export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('recipes').select('*').eq('id', id).single()
  if (!data) notFound()

  const recipe = data as Recipe
  const gradient = pick(recipe.title, GRADIENTS)
  const emoji = pick(recipe.title, FOOD_EMOJIS)

  return (
    <div className="pb-8">
      {/* Hero */}
      <div
        className="flex items-center justify-center relative"
        style={{ height: '220px', background: gradient }}
      >
        <span className="text-8xl drop-shadow-lg select-none">{emoji}</span>

        {/* Back button */}
        <Link
          href="/recipes"
          className="absolute top-4 left-4 flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold"
          style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)', color: '#fff' }}
        >
          ←
        </Link>

        {/* Time badge */}
        <div
          className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
          style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)', color: '#fff' }}
        >
          ⏱ {recipe.cook_time_minutes} min
        </div>
      </div>

      <div className="px-5 pt-5">
        {/* Title + tags */}
        <h1
          className="text-2xl font-bold leading-tight mb-1"
          style={{ fontFamily: 'var(--font-playfair)', color: '#1c1917' }}
        >
          {recipe.title}
        </h1>
        <p className="text-sm" style={{ color: '#78716c' }}>{recipe.description}</p>

        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-3">
            {recipe.tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: '#f0fdf4', color: '#1a4a2e' }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Ingredients */}
        <section className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#d4850a' }}>
            Ingredienser
          </p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(28,25,23,0.08)' }}
          >
            {recipe.ingredients?.map((ing, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-3"
                style={{
                  background: i % 2 === 0 ? '#fff' : '#faf7f2',
                  borderBottom: i < (recipe.ingredients?.length ?? 0) - 1 ? '1px solid rgba(28,25,23,0.06)' : 'none',
                }}
              >
                <span className="text-sm" style={{ color: '#1c1917' }}>{ing.name}</span>
                <span className="text-sm font-semibold" style={{ color: '#78716c' }}>
                  {ing.amount} {ing.unit}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section className="mt-6">
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
                <div
                  className="flex-1 rounded-2xl px-4 py-3"
                  style={{ background: '#fff', border: '1px solid rgba(28,25,23,0.07)' }}
                >
                  <p className="text-sm leading-relaxed" style={{ color: '#44403c' }}>
                    {step.instruction}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Back link */}
        <Link
          href="/recipes"
          className="flex items-center gap-2 mt-8 text-sm font-semibold"
          style={{ color: '#1a4a2e' }}
        >
          ← Tillbaka till recept
        </Link>
      </div>
    </div>
  )
}
