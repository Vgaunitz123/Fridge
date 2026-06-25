'use client'

import Link from 'next/link'
import { Recipe } from '@/lib/types'
import { useState } from 'react'
import type { MatchResult } from '@/lib/matchRecipe'
import { matchLabel, matchColors } from '@/lib/matchRecipe'

const PLACEHOLDER_COLORS = [
  '#D6CFC4', '#C8C2B6', '#D4CCBF', '#C6BFB3', '#D0C9BC',
]

function pick<T>(title: string, arr: T[]): T {
  let hash = 0
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash)
  return arr[Math.abs(hash) % arr.length]
}

type Props = {
  recipe: Recipe & { imageUrl?: string; image?: string }
  showLink?: boolean
  match?: MatchResult | null
}

function MatchBadge({ match }: { match: MatchResult }) {
  const { bg, text, bar } = matchColors(match.pct)
  const label = matchLabel(match)

  return (
    <div style={{
      margin: '0 14px 12px',
      borderRadius: '10px',
      background: bg,
      padding: '6px 10px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}>
      {/* Progress bar */}
      <div style={{ flex: 1, height: '4px', background: 'rgba(0,0,0,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${match.pct}%`, height: '100%', background: bar, borderRadius: '2px', transition: 'width 0.4s ease' }} />
      </div>
      {/* Pct */}
      <span style={{ fontSize: '11px', fontWeight: 700, color: text, whiteSpace: 'nowrap', flexShrink: 0 }}>
        {match.pct}%
      </span>
      {/* Label */}
      <span style={{ fontSize: '10px', color: text, opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '90px' }}>
        {label}
      </span>
    </div>
  )
}

function CardInner({ recipe, match }: { recipe: Props['recipe']; match?: MatchResult | null }) {
  const [imgError, setImgError] = useState(false)
  const explicit = recipe.image_url || (recipe as Record<string, unknown>).imageUrl as string | undefined
  const unsplash = `https://source.unsplash.com/featured/?food,${encodeURIComponent(recipe.title)}`
  const photo = imgError ? null : (explicit || unsplash)
  const placeholderColor = pick(recipe.title, PLACEHOLDER_COLORS)

  return (
    <div
      className="card-hover fade-up overflow-hidden"
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '3/2' }}>
        {photo ? (
          <img
            src={photo}
            alt={recipe.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full" style={{ background: placeholderColor }} />
        )}

        {/* Time badge */}
        <div
          className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1"
          style={{ background: '#1C3A2A', color: '#fff', borderRadius: 'var(--radius-xs)', fontSize: '11px', fontWeight: 600 }}
        >
          {recipe.cook_time_minutes} min
        </div>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="absolute bottom-2.5 left-2.5 flex gap-1 flex-wrap">
            {recipe.tags.slice(0, 2).map(tag => (
              <span
                key={tag}
                style={{
                  background: 'rgba(0,0,0,0.45)',
                  backdropFilter: 'blur(6px)',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-xs)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px 12px' }}>
        <h3
          className="leading-snug mb-1.5"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '15px', color: '#1A1A1A' }}
        >
          {recipe.title}
        </h3>
        {recipe.description && (
          <p className="line-clamp-2" style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.55 }}>
            {recipe.description}
          </p>
        )}
      </div>

      {match && <MatchBadge match={match} />}
    </div>
  )
}

export default function RecipeCard({ recipe, showLink = true, match }: Props) {
  if (showLink && recipe.id) {
    return (
      <Link href={`/recipes/${recipe.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <CardInner recipe={recipe} match={match} />
      </Link>
    )
  }
  return <CardInner recipe={recipe} match={match} />
}
