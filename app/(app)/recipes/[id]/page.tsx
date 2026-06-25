import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Recipe, FridgeItem } from '@/lib/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { mealdbLookup } from '@/lib/mealdb'
import PublishRecipeButton from '@/components/recipes/PublishRecipeButton'
import RecipeHeroImage from '@/components/recipes/RecipeHeroImage'
import RecipeInteractions from '@/components/recipes/RecipeInteractions'
import IngredientChecklist from '@/components/recipes/IngredientChecklist'
import CookingSteps from '@/components/recipes/CookingSteps'

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

  const fridgeItems: FridgeItem[] = user
    ? ((await supabase.from('fridge_items').select('*').eq('user_id', user.id)).data ?? []) as FridgeItem[]
    : []

  const fridgeMap: Record<string, boolean> = {}
  for (const item of fridgeItems) {
    const n = normalize(item.name)
    fridgeMap[n] = true
    for (const ing of recipe.ingredients ?? []) {
      const t = normalize(ing.name)
      if (n.includes(t) || t.includes(n)) fridgeMap[t] = true
    }
  }

  let likesCount = 0
  let userLiked = false
  let ratings: { rating: number }[] = []
  let userRating: number | null = null

  try {
    const { count } = await supabase.from('recipe_likes').select('user_id', { count: 'exact', head: true }).eq('recipe_id', id)
    likesCount = count ?? 0
  } catch {}

  try {
    if (user) {
      const { data } = await supabase.from('recipe_likes').select('recipe_id').eq('recipe_id', id).eq('user_id', user.id).single()
      userLiked = !!data
    }
  } catch {}

  try {
    const { data } = await supabase.from('recipe_ratings').select('rating').eq('recipe_id', id)
    ratings = (data ?? []) as { rating: number }[]
  } catch {}

  try {
    if (user) {
      const { data } = await supabase.from('recipe_ratings').select('rating').eq('recipe_id', id).eq('user_id', user.id).single()
      userRating = (data as { rating: number } | null)?.rating ?? null
    }
  } catch {}

  const avgRating = ratings.length > 0 ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : null

  const gradient = pick(recipe.title, GRADIENTS)
  const emoji = pick(recipe.title, FOOD_EMOJIS)

  return (
    <div style={{ background: '#F5F3EE', minHeight: '100vh', paddingBottom: '40px' }}>

      {/* Hero */}
      <div style={{ position: 'relative', height: '300px', background: gradient }}>
        {/* emoji shown behind the image; hidden once image loads */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '80px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' }}>{emoji}</span>
        </div>
        <RecipeHeroImage title={recipe.title} imageUrl={recipe.image_url ?? null} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 100%)' }} />

        {/* Back button */}
        <Link
          href="/recipes"
          style={{
            position: 'absolute', top: '52px', left: '16px',
            width: '38px', height: '38px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', textDecoration: 'none',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>

        {/* Title overlay */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
            {recipe.tags?.map(tag => (
              <span key={tag} style={{
                fontSize: '11px', fontWeight: 700, color: '#fff',
                background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)',
                padding: '3px 10px', borderRadius: '100px',
              }}>
                {tag}
              </span>
            ))}
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', lineHeight: 1.2, margin: 0 }}>
            {recipe.title}
          </h1>
          {recipe.description && (
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginTop: '6px', lineHeight: 1.5 }}>
              {recipe.description}
            </p>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div style={{
        display: 'flex', gap: '0',
        background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.07)',
      }}>
        <div style={{ flex: 1, padding: '14px 16px', textAlign: 'center', borderRight: '1px solid rgba(0,0,0,0.07)' }}>
          <p style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', fontFamily: 'var(--font-display)' }}>{recipe.cook_time_minutes}</p>
          <p style={{ fontSize: '10px', fontWeight: 600, color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>minuter</p>
        </div>
        <div style={{ flex: 1, padding: '14px 16px', textAlign: 'center', borderRight: '1px solid rgba(0,0,0,0.07)' }}>
          <p style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', fontFamily: 'var(--font-display)' }}>{recipe.ingredients?.length ?? 0}</p>
          <p style={{ fontSize: '10px', fontWeight: 600, color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ingredienser</p>
        </div>
        <div style={{ flex: 1, padding: '14px 16px', textAlign: 'center', borderRight: '1px solid rgba(0,0,0,0.07)' }}>
          <p style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', fontFamily: 'var(--font-display)' }}>{recipe.steps?.length ?? 0}</p>
          <p style={{ fontSize: '10px', fontWeight: 600, color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>steg</p>
        </div>
        <div style={{ flex: 1, padding: '14px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', fontFamily: 'var(--font-display)' }}>
            {avgRating ? avgRating.toFixed(1) : '—'}
          </p>
          <p style={{ fontSize: '10px', fontWeight: 600, color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>betyg</p>
        </div>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Ingredient checklist */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid rgba(0,0,0,0.07)' }}>
          <IngredientChecklist
            ingredients={recipe.ingredients ?? []}
            fridgeMap={fridgeMap}
          />
        </div>

        {/* Cooking steps */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid rgba(0,0,0,0.07)' }}>
          <CookingSteps steps={recipe.steps ?? []} />
        </div>

        {/* Likes + ratings */}
        <RecipeInteractions
          recipeId={id}
          initialLikes={likesCount}
          initialUserLiked={userLiked}
          initialAvgRating={avgRating}
          initialRatingCount={ratings.length}
          initialUserRating={userRating}
          isLoggedIn={!!user}
        />

        {/* Publish to community */}
        <PublishRecipeButton
          recipeId={id}
          title={recipe.title}
          description={recipe.description ?? null}
          imageUrl={recipe.image_url ?? null}
          tags={recipe.tags ?? []}
        />

        {recipe.source && recipe.source_url && (
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#aaa' }}>
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
