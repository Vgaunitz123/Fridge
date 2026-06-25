'use client'

import { useState } from 'react'

type Props = {
  recipeId: string
  initialLikes: number
  initialUserLiked: boolean
  initialAvgRating: number | null
  initialRatingCount: number
  initialUserRating: number | null
  isLoggedIn: boolean
}

export default function RecipeInteractions({
  recipeId,
  initialLikes,
  initialUserLiked,
  initialAvgRating,
  initialRatingCount,
  initialUserRating,
  isLoggedIn,
}: Props) {
  const [liked, setLiked] = useState(initialUserLiked)
  const [likes, setLikes] = useState(initialLikes)
  const [liking, setLiking] = useState(false)

  const [userRating, setUserRating] = useState<number | null>(initialUserRating)
  const [avgRating, setAvgRating] = useState<number | null>(initialAvgRating)
  const [ratingCount, setRatingCount] = useState(initialRatingCount)
  const [hovered, setHovered] = useState<number | null>(null)

  // Comment flow
  const [pendingRating, setPendingRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function toggleLike() {
    if (!isLoggedIn || liking) return
    setLiking(true)
    const prev = liked
    setLiked(!prev)
    setLikes(l => prev ? l - 1 : l + 1)
    try {
      await fetch('/api/recipes/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId }),
      })
    } catch {
      setLiked(prev)
      setLikes(l => prev ? l + 1 : l - 1)
    }
    setLiking(false)
  }

  function selectStar(stars: number) {
    if (!isLoggedIn) return
    setPendingRating(stars)
    setSubmitted(false)
  }

  async function submitRating() {
    if (!pendingRating || submitting) return
    setSubmitting(true)

    const prevRating = userRating
    const prevAvg = avgRating
    const prevCount = ratingCount

    const newCount = prevRating ? prevCount : prevCount + 1
    const newAvg = prevRating
      ? ((prevAvg ?? 0) * prevCount - prevRating + pendingRating) / prevCount
      : ((prevAvg ?? 0) * prevCount + pendingRating) / newCount
    setUserRating(pendingRating)
    setAvgRating(newAvg)
    setRatingCount(newCount)

    try {
      await fetch('/api/recipes/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId, rating: pendingRating, comment: comment.trim() || null }),
      })
      setSubmitted(true)
      setPendingRating(null)
      setComment('')
    } catch {
      setUserRating(prevRating)
      setAvgRating(prevAvg)
      setRatingCount(prevCount)
    }
    setSubmitting(false)
  }

  const displayStars = hovered ?? pendingRating ?? userRating ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Like button */}
      <button
        onClick={toggleLike}
        disabled={!isLoggedIn || liking}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          background: liked ? '#FFF0F0' : '#fff',
          border: `1.5px solid ${liked ? 'rgba(220,38,38,0.3)' : 'rgba(0,0,0,0.1)'}`,
          borderRadius: '16px', padding: '16px 20px',
          cursor: isLoggedIn ? 'pointer' : 'default',
          width: '100%', transition: 'all 0.15s',
        }}
      >
        <svg
          width="22" height="22" viewBox="0 0 24 24"
          fill={liked ? '#dc2626' : 'none'}
          stroke={liked ? '#dc2626' : '#6B6B6B'}
          strokeWidth="2" strokeLinecap="round"
          style={{ transition: 'all 0.15s', transform: liking ? 'scale(1.3)' : 'scale(1)' }}
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: '15px', fontWeight: 700, color: liked ? '#dc2626' : '#1A1A1A', margin: 0 }}>
            {liked ? 'Du gillar detta' : 'Gilla receptet'}
          </p>
          {likes > 0 && (
            <p style={{ fontSize: '12px', color: liked ? '#dc2626' : '#9B9B9B', margin: 0, marginTop: '1px' }}>
              {likes} {likes === 1 ? 'person gillar' : 'personer gillar'} detta
            </p>
          )}
          {!isLoggedIn && (
            <p style={{ fontSize: '12px', color: '#9B9B9B', margin: 0, marginTop: '1px' }}>Logga in för att gilla</p>
          )}
        </div>
      </button>

      {/* Rating + comment */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid rgba(0,0,0,0.07)' }}>

        {/* Average */}
        {avgRating !== null && ratingCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A1A', fontFamily: 'var(--font-display)' }}>
              {avgRating.toFixed(1)}
            </span>
            <div>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1,2,3,4,5].map(s => (
                  <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill={s <= Math.round(avgRating) ? '#f59e0b' : '#E8E5DE'} stroke="none">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <p style={{ fontSize: '11px', color: '#9B9B9B', margin: 0, marginTop: '2px' }}>
                {ratingCount} {ratingCount === 1 ? 'omdöme' : 'omdömen'}
              </p>
            </div>
          </div>
        )}

        {/* Success state */}
        {submitted && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#EBF2ED', borderRadius: '12px', marginBottom: '14px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C3A2A" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#1C3A2A', margin: 0 }}>
              Tack för ditt omdöme!
            </p>
          </div>
        )}

        <p style={{ fontSize: '11px', fontWeight: 700, color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
          {userRating && !pendingRating ? 'Ditt betyg' : 'Sätt betyg'}
        </p>

        {/* Stars */}
        <div
          style={{ display: 'flex', gap: '4px', marginBottom: pendingRating ? '16px' : '0' }}
          onMouseLeave={() => setHovered(null)}
        >
          {[1,2,3,4,5].map(s => (
            <button
              key={s}
              onClick={() => selectStar(s)}
              onMouseEnter={() => isLoggedIn && setHovered(s)}
              disabled={!isLoggedIn}
              style={{
                background: 'none', border: 'none', padding: '4px 2px',
                cursor: isLoggedIn ? 'pointer' : 'default',
                transform: hovered !== null && s <= hovered ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 0.1s',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24"
                fill={s <= displayStars ? '#f59e0b' : '#E8E5DE'}
                stroke={s <= displayStars ? '#f59e0b' : '#D1CEC7'}
                strokeWidth="0.5"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </button>
          ))}
          {!isLoggedIn && (
            <span style={{ fontSize: '12px', color: '#9B9B9B', alignSelf: 'center', marginLeft: '6px' }}>
              Logga in för att betygsätta
            </span>
          )}
        </div>

        {/* Comment form — shown after selecting stars */}
        {pendingRating && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)' }} />
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A', margin: 0 }}>
              Lämna en kommentar <span style={{ fontWeight: 400, color: '#9B9B9B' }}>(valfritt)</span>
            </p>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Hur blev rätten? Tips, ändringar..."
              rows={3}
              style={{
                width: '100%', padding: '12px', borderRadius: '10px',
                border: '1.5px solid rgba(0,0,0,0.12)', background: '#FAFAF8',
                fontSize: '14px', color: '#1A1A1A', lineHeight: 1.5,
                resize: 'none', outline: 'none', fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { setPendingRating(null); setComment('') }}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  background: 'transparent', border: '1.5px solid rgba(0,0,0,0.12)',
                  fontSize: '14px', fontWeight: 600, color: '#6B6B6B', cursor: 'pointer',
                }}
              >
                Avbryt
              </button>
              <button
                onClick={submitRating}
                disabled={submitting}
                style={{
                  flex: 2, padding: '12px', borderRadius: '10px',
                  background: submitting ? '#a3b8a8' : '#1C3A2A',
                  border: 'none', fontSize: '14px', fontWeight: 700,
                  color: '#fff', cursor: submitting ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
              >
                {submitting ? (
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                    Skicka omdöme
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
