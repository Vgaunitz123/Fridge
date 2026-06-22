'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type UserResult   = { user_id: string; username: string; bio: string; avatar_url: string | null }
type RecipeResult = { id: string; title: string; image_url: string | null; cook_time_minutes: number; tags: string[] | null }
type VideoResult  = { id: string; author_username: string; user_id: string; caption: string; thumbnail_url: string | null }

type Results = { users: UserResult[]; recipes: RecipeResult[]; videos: VideoResult[] }

type Tab = 'all' | 'users' | 'recipes' | 'videos'

const TABS: { id: Tab; label: string }[] = [
  { id: 'all',     label: 'Alla' },
  { id: 'users',   label: 'Skapare' },
  { id: 'recipes', label: 'Recept' },
  { id: 'videos',  label: 'Videor' },
]

// ─── Avatar helper ────────────────────────────────────────────────────────────

function Avatar({ username, avatarUrl, size = 40 }: { username: string; avatarUrl: string | null; size?: number }) {
  const [err, setErr] = useState(false)
  const initials = username.slice(0, 2).toUpperCase() || '?'
  if (avatarUrl && !err) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #1C3A2A, #2D5A3F)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif',
    }}>
      {initials}
    </div>
  )
}

// ─── Result cards ─────────────────────────────────────────────────────────────

function UserCard({ user, currentUserId }: { user: UserResult; currentUserId: string | null }) {
  const [following, setFollowing] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  async function toggleFollow(e: React.MouseEvent) {
    e.preventDefault()
    if (!currentUserId || loading) return
    setLoading(true)
    const res = await fetch(`/api/follows/${user.user_id}`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) setFollowing(data.following)
    setLoading(false)
  }

  const isOwn = currentUserId === user.user_id

  return (
    <Link href={`/profile/${user.user_id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#fff', borderRadius: '14px', marginBottom: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Avatar username={user.username} avatarUrl={user.avatar_url} size={46} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', marginBottom: '2px' }}>@{user.username}</p>
          {user.bio && (
            <p style={{ fontSize: '12px', color: '#6B6B6B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.bio}
            </p>
          )}
        </div>
        {currentUserId && !isOwn && (
          <button
            onClick={toggleFollow}
            disabled={loading}
            style={{
              padding: '6px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: 700,
              border: following === false ? '1.5px solid #1C3A2A' : '1.5px solid transparent',
              background: following === false ? 'transparent' : '#1C3A2A',
              color: following === false ? '#1C3A2A' : '#fff',
              cursor: loading ? 'not-allowed' : 'pointer', flexShrink: 0,
              transition: 'all 0.15s',
            }}
          >
            {following === false ? 'Följer' : 'Följ'}
          </button>
        )}
      </div>
    </Link>
  )
}

function RecipeCard({ recipe }: { recipe: RecipeResult }) {
  const href = recipe.id.startsWith('mealdb_') || /^[0-9a-f-]{36}$/.test(recipe.id)
    ? `/recipes/${recipe.id}` : null
  const inner = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', background: '#fff', borderRadius: '14px', marginBottom: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ width: '52px', height: '52px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: '#E8E5DE' }}>
        {recipe.image_url
          ? <img src={recipe.image_url} alt={recipe.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🍽</div>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {recipe.title}
        </p>
        <p style={{ fontSize: '12px', color: '#9B9B9B' }}>{recipe.cook_time_minutes} min</p>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8C8C8" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
    </div>
  )
  return href ? <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link> : inner
}

function VideoCard({ video }: { video: VideoResult }) {
  return (
    <Link href={`/profile/${video.user_id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', background: '#fff', borderRadius: '14px', marginBottom: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: '#111', position: 'relative' }}>
          {video.thumbnail_url
            ? <img src={video.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg></div>
          }
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><polygon points="5,3 19,12 5,21"/></svg>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A', marginBottom: '2px' }}>@{video.author_username}</p>
          {video.caption && (
            <p style={{ fontSize: '12px', color: '#6B6B6B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {video.caption}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

// ─── Discover section (shown when no search query) ─────────────────────────

function DiscoverSection({ currentUserId }: { currentUserId: string | null }) {
  const [creators, setCreators] = useState<(UserResult & { follower_count: number })[]>([])
  const [videos, setVideos] = useState<VideoResult[]>([])

  useEffect(() => {
    const supabase = createClient()
    // Top creators: user_profiles with most followers
    Promise.all([
      supabase.from('user_profiles').select('user_id, username, bio, avatar_url').limit(6),
      supabase.from('videos').select('id, author_username, user_id, caption, thumbnail_url').order('created_at', { ascending: false }).limit(6),
    ]).then(([p, v]) => {
      setCreators((p.data ?? []).map(u => ({ ...u, follower_count: 0 })))
      setVideos(v.data ?? [])
    })
  }, [])

  if (creators.length === 0 && videos.length === 0) return null

  return (
    <div style={{ padding: '0 16px' }}>
      {creators.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
            Skapare
          </p>
          {creators.map(u => <UserCard key={u.user_id} user={u} currentUserId={currentUserId} />)}
        </div>
      )}
      {videos.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
            Senaste videor
          </p>
          {videos.map(v => <VideoCard key={v.id} video={v} />)}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [results, setResults] = useState<Results>({ users: [], recipes: [], videos: [] })
  const [searching, setSearching] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id ?? null))
    // Focus input on mount
    setTimeout(() => inputRef.current?.focus(), 200)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim() || query.trim().length < 2) { setResults({ users: [], recipes: [], videos: [] }); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        const data = await res.json()
        setResults({ users: data.users ?? [], recipes: data.recipes ?? [], videos: data.videos ?? [] })
      } catch {}
      setSearching(false)
    }, 300)
  }, [query])

  const hasQuery = query.trim().length >= 2
  const totalResults = results.users.length + results.recipes.length + results.videos.length

  const showUsers   = (tab === 'all' || tab === 'users')   && results.users.length > 0
  const showRecipes = (tab === 'all' || tab === 'recipes') && results.recipes.length > 0
  const showVideos  = (tab === 'all' || tab === 'videos')  && results.videos.length > 0

  return (
    <div style={{ background: '#F5F3EE', minHeight: '100vh', paddingBottom: '100px' }}>

      {/* Header */}
      <div style={{ padding: '52px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 500, color: '#1A1A1A', flex: 1 }}>
            Sök
          </h1>
          <Link href="/inspiration" style={{ fontSize: '12px', color: '#1C3A2A', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
            Film
          </Link>
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', marginBottom: '14px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9B9B9B" strokeWidth="2" strokeLinecap="round"
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Sök skapare, recept, videor…"
            style={{
              width: '100%', padding: '11px 14px 11px 40px',
              borderRadius: '12px', border: '1.5px solid rgba(0,0,0,0.09)',
              background: '#fff', fontSize: '15px', color: '#1A1A1A',
              boxSizing: 'border-box', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9B9B9B', fontSize: '16px', lineHeight: 1, padding: '4px' }}
            >✕</button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto' }} className="no-scrollbar">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '7px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: tab === t.id ? 700 : 500,
                background: tab === t.id ? '#1C3A2A' : '#fff',
                color: tab === t.id ? '#fff' : '#6B6B6B',
                border: '1.5px solid',
                borderColor: tab === t.id ? '#1C3A2A' : 'rgba(0,0,0,0.08)',
                cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {!hasQuery ? (
        <DiscoverSection currentUserId={currentUserId} />
      ) : searching ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '48px' }}>
          <div style={{ width: '26px', height: '26px', borderRadius: '50%', border: '2px solid #E8E5DE', borderTopColor: '#1C3A2A', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : totalResults === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#1A1A1A', fontFamily: 'Georgia, serif', marginBottom: '6px' }}>
            Inga resultat för &ldquo;{query}&rdquo;
          </p>
          <p style={{ fontSize: '13px', color: '#9B9B9B' }}>Försök med ett annat sökord</p>
        </div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          {showUsers && (
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                Skapare
              </p>
              {results.users.map(u => <UserCard key={u.user_id} user={u} currentUserId={currentUserId} />)}
            </div>
          )}
          {showRecipes && (
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                Recept
              </p>
              {results.recipes.map(r => <RecipeCard key={r.id} recipe={r} />)}
            </div>
          )}
          {showVideos && (
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                Videor
              </p>
              {results.videos.map(v => <VideoCard key={v.id} video={v} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
