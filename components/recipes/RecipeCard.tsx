'use client'

import Link from 'next/link'
import { Recipe } from '@/lib/types'
import { useState } from 'react'

// Neutral warm placeholder when no photo — no emoji, no orange
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
}

function CardInner({ recipe }: { recipe: Props['recipe'] }) {
  const [imgError, setImgError] = useState(false)
  const photo = (!imgError && (recipe.image_url || (recipe as Record<string, unknown>).imageUrl)) as string | null
  const placeholderColor = pick(recipe.title, PLACEHOLDER_COLORS)

  return (
    <div
      className="card-hover fade-up overflow-hidden"
      style={{
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* Hero — 3:2 ratio, real photo or neutral placeholder */}
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

        {/* Time badge — top right, green */}
        <div
          className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 text-xs font-semibold"
          style={{
            background: '#1C3A2A',
            color: '#fff',
            borderRadius: '4px',
            fontSize: '11px',
            letterSpacing: '0.02em',
          }}
        >
          {recipe.cook_time_minutes} min
        </div>

        {/* Tags — bottom left on image */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap">
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
                  padding: '2px 7px',
                  borderRadius: '3px',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3
          className="leading-snug mb-1"
          style={{
            fontFamily: 'Georgia, serif',
            fontWeight: 500,
            fontSize: '14px',
            color: '#1A1A1A',
          }}
        >
          {recipe.title}
        </h3>
        {recipe.description && (
          <p
            className="line-clamp-2"
            style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.5 }}
          >
            {recipe.description}
          </p>
        )}
      </div>
    </div>
  )
}

export default function RecipeCard({ recipe, showLink = true }: Props) {
  if (showLink && recipe.id) {
    return (
      <Link href={`/recipes/${recipe.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <CardInner recipe={recipe} />
      </Link>
    )
  }
  return <CardInner recipe={recipe} />
}
