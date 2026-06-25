'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Recipe } from '@/lib/types'
import RecipeCard from '@/components/recipes/RecipeCard'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LikedRecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('recipe_likes')
        .select('recipes(*)')
        .eq('user_id', user.id)

      const liked = (data ?? [])
        .map((row: Record<string, unknown>) => row.recipes as Recipe)
        .filter(Boolean)
      setRecipes(liked)
      setLoading(false)
    }
    load()
  }, [router])

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '52px 16px 20px' }}>
        <Link
          href="/profile"
          style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface)', boxShadow: 'var(--shadow-xs)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#1A1A1A', flexShrink: 0, fontSize: '16px', fontWeight: 700 }}
        >
          ←
        </Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: '#1A1A1A' }}>
          Gillade recept
        </h1>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #E8E5DE', borderTopColor: '#1C3A2A', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : recipes.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '80px', gap: '10px', padding: '80px 32px 0' }}>
          <span style={{ fontSize: '40px', lineHeight: 1 }}>❤️</span>
          <p style={{ fontSize: '18px', fontFamily: 'var(--font-display)', color: '#1A1A1A', fontWeight: 500, marginTop: '8px' }}>
            Inga gillade recept
          </p>
          <p style={{ fontSize: '13px', color: '#9B9B9B', textAlign: 'center', lineHeight: 1.55 }}>
            Tryck på hjärtat på ett recept för att spara det här.
          </p>
          <Link
            href="/recipes"
            style={{ marginTop: '12px', padding: '12px 24px', borderRadius: 'var(--radius-sm)', background: '#1C3A2A', color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}
          >
            Utforska recept
          </Link>
        </div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          <p style={{ fontSize: '12px', color: '#9B9B9B', marginBottom: '14px', fontWeight: 500 }}>
            {recipes.length} {recipes.length === 1 ? 'recept' : 'recept'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="stagger">
            {recipes.map(r => (
              <div key={r.id} className="fade-up">
                <RecipeCard recipe={r} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
