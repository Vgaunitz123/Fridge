'use client'

import { useState } from 'react'
import Link from 'next/link'

type FeedPostProps = {
  id: string
  title: string
  description: string
  emoji: string
  gradient: string
  author: string
  cookTime: number
  tags: string[]
  caption?: string
  likesCount: number
  userLiked: boolean
  recipeId?: string
  onLike?: (id: string) => void
}

function AuthorInitials({ name }: { name: string }) {
  const initials = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
      style={{ background: '#1a4a2e', color: '#faf7f2' }}
    >
      {initials}
    </div>
  )
}

export default function FeedPost({
  id, title, description, emoji, gradient, author, cookTime, tags, caption, likesCount, userLiked, recipeId, onLike,
}: FeedPostProps) {
  const [liked, setLiked] = useState(userLiked)
  const [count, setCount] = useState(likesCount)

  function handleLike() {
    setLiked(!liked)
    setCount(c => liked ? c - 1 : c + 1)
    onLike?.(id)
  }

  const titleEl = (
    <h3 className="font-bold text-base leading-snug" style={{ fontFamily: 'var(--font-display)', color: '#1c1917' }}>
      {title}
    </h3>
  )

  return (
    <div
      className="overflow-hidden hover-lift"
      style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Hero image area */}
      <div
        className="flex items-center justify-center relative"
        style={{ background: gradient, minHeight: '200px' }}
      >
        <span className="text-8xl drop-shadow-lg select-none">{emoji}</span>

        {/* Time badge */}
        <div
          className="absolute top-3.5 right-3.5 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)', color: '#fff', letterSpacing: '0.02em' }}
        >
          <span>⏱</span> {cookTime} min
        </div>

        {/* Tags overlay */}
        <div className="absolute bottom-3.5 left-3.5 flex gap-1.5 flex-wrap">
          {tags.map(tag => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)', color: '#fff' }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px 18px 18px' }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {recipeId ? <Link href={`/recipes/${recipeId}`}>{titleEl}</Link> : titleEl}
            <p className="text-sm mt-1.5 line-clamp-2" style={{ color: '#78716c', lineHeight: 1.55 }}>
              {caption || description}
            </p>
          </div>

          {/* Like button */}
          <button
            onClick={handleLike}
            className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5"
            style={{ minWidth: '2.5rem' }}
          >
            <span
              className="text-2xl transition-all duration-150"
              style={{ transform: liked ? 'scale(1.2)' : 'scale(1)', filter: liked ? 'none' : 'grayscale(0.3)' }}
            >
              {liked ? '❤️' : '🤍'}
            </span>
            <span className="text-xs font-medium" style={{ color: '#a8a29e' }}>{count}</span>
          </button>
        </div>

        {/* Author */}
        <div className="flex items-center gap-2 mt-4 pt-4"
          style={{ borderTop: '1px solid rgba(28,25,23,0.06)' }}>
          <AuthorInitials name={author} />
          <span className="text-xs font-medium" style={{ color: '#78716c' }}>{author}</span>
        </div>
      </div>
    </div>
  )
}
