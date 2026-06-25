'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Recipe } from '@/lib/types'

type TopRecipe = { recipe: Recipe; likes: number }

const RANK_COLORS = ['#F5C518', '#A8A9AD', '#CD7F32']
const RANK_LABELS = ['🥇', '🥈', '🥉']

const PLACEHOLDER_COLORS = ['#D6CFC4', '#C8C2B6', '#D4CCBF', '#C6BFB3', '#D0C9BC']
function pickColor(title: string) {
  let h = 0; for (const c of title) h = c.charCodeAt(0) + ((h << 5) - h)
  return PLACEHOLDER_COLORS[Math.abs(h) % PLACEHOLDER_COLORS.length]
}

function isClickable(id: string) {
  if (id.startsWith('mealdb_')) return true
  if (id.startsWith('spoonacular_') || id.startsWith('edamam_') || /^d\d+$/.test(id)) return false
  return true
}

function TopCard({ entry, rank }: { entry: TopRecipe; rank: number }) {
  const { recipe, likes } = entry
  const [imgErr, setImgErr] = useState(false)
  const photo = !imgErr && recipe.image_url
  const clickable = isClickable(recipe.id)

  const inner = (
    <div style={{
      width: '140px',
      flexShrink: 0,
      background: '#fff',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: rank === 0
        ? '0 2px 12px rgba(245,197,24,0.25), 0 1px 4px rgba(0,0,0,0.08)'
        : '0 1px 4px rgba(0,0,0,0.07)',
      border: rank === 0 ? '1.5px solid rgba(245,197,24,0.4)' : '1px solid rgba(0,0,0,0.06)',
    }}>
      {/* Image */}
      <div style={{ position: 'relative', height: '100px', background: pickColor(recipe.title) }}>
        {photo && (
          <img
            src={recipe.image_url!}
            alt={recipe.title}
            onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}

        {/* Rank badge */}
        <div style={{
          position: 'absolute', top: '6px', left: '6px',
          width: '24px', height: '24px', borderRadius: '50%',
          background: RANK_COLORS[rank] ?? 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: rank < 3 ? '13px' : '10px',
          fontWeight: 700, color: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        }}>
          {rank < 3 ? RANK_LABELS[rank] : `#${rank + 1}`}
        </div>

        {/* Like count */}
        <div style={{
          position: 'absolute', bottom: '6px', right: '6px',
          display: 'flex', alignItems: 'center', gap: '3px',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          borderRadius: '100px', padding: '2px 7px',
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#ff6b6b" stroke="none">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>{likes}</span>
        </div>
      </div>

      {/* Title */}
      <div style={{ padding: '8px 8px 10px' }}>
        <p style={{
          fontSize: '12px', fontWeight: 600, color: '#1A1A1A',
          lineHeight: 1.35, fontFamily: 'var(--font-display)',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {recipe.title}
        </p>
        <p style={{ fontSize: '10px', color: '#9B9B9B', marginTop: '3px' }}>
          {recipe.cook_time_minutes} min
        </p>
      </div>
    </div>
  )

  if (clickable) {
    return (
      <Link href={`/recipes/${recipe.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        {inner}
      </Link>
    )
  }
  return inner
}

export default function ToplistaSection() {
  const [entries, setEntries] = useState<TopRecipe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/recipes/top')
      .then(r => r.json())
      .then(d => setEntries(d.recipes ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (!loading && entries.length === 0) return null

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: '10px' }}>
        <p style={{ fontSize: '12px', fontWeight: 700, color: '#6b6f6b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Topplista
        </p>
        <span style={{ fontSize: '12px' }}>❤️</span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', gap: '8px', padding: '0 16px', overflowX: 'hidden' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ width: '140px', height: '156px', flexShrink: 0, background: '#E8E5DE', borderRadius: '12px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px', padding: '0 16px 4px', overflowX: 'auto' }} className="no-scrollbar">
          {entries.map((entry, i) => (
            <TopCard key={entry.recipe.id} entry={entry} rank={i} />
          ))}
        </div>
      )}
    </div>
  )
}
