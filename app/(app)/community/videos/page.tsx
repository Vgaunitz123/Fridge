'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { sv } from 'date-fns/locale'

type VideoPost = {
  id: string
  image_url: string
  thumbnail_url: string | null
  caption: string
  tags: string[]
  created_at: string
  likes_count: number
  user_liked: boolean
  author_email: string | null
  author_id: string | null
}

function extractTikTokId(url: string): string | null {
  const m = url.match(/\/video\/(\d+)/)
  return m?.[1] ?? null
}

function isTikTokUrl(url: string) {
  return url.includes('tiktok.com')
}

// ─── Single video card (full-screen) ─────────────────────────────────────────

function VideoSlide({
  post, active, onLike, currentUserId,
}: {
  post: VideoPost; active: boolean
  onLike: (id: string, liked: boolean) => void
  currentUserId: string | null
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const tiktokId = isTikTokUrl(post.image_url) ? extractTikTokId(post.image_url) : null

  useEffect(() => {
    if (!videoRef.current) return
    if (active) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.pause()
    }
  }, [active])

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100svh',
        flexShrink: 0,
        background: '#000',
        scrollSnapAlign: 'start',
        overflow: 'hidden',
      }}
    >
      {/* Video */}
      {tiktokId ? (
        <iframe
          src={`https://www.tiktok.com/embed/v2/${tiktokId}`}
          style={{ width: '100%', height: '100%', border: 'none' }}
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      ) : (
        <video
          ref={videoRef}
          src={post.image_url}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loop
          playsInline
          onClick={() => {
            if (videoRef.current?.paused) videoRef.current.play()
            else videoRef.current?.pause()
          }}
        />
      )}

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 45%, transparent 70%)',
      }} />

      {/* Back button */}
      <Link
        href="/community"
        style={{
          position: 'absolute', top: '52px', left: '16px',
          width: '36px', height: '36px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(8px)',
          color: '#fff', textDecoration: 'none', fontSize: '16px', fontWeight: 700,
        }}
      >
        ←
      </Link>

      {/* Bottom meta */}
      <div style={{ position: 'absolute', bottom: '100px', left: '16px', right: '72px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Link
            href={post.author_id ? `/profile/${post.author_id}` : '/community'}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
          >
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: '#1C3A2A', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700, flexShrink: 0,
              border: '1.5px solid rgba(255,255,255,0.3)',
            }}>
              {(post.author_email?.[0] ?? '?').toUpperCase()}
            </div>
            <div>
              <p style={{ color: '#fff', fontSize: '13px', fontWeight: 700, lineHeight: 1.2 }}>
                {post.author_email?.split('@')[0] ?? 'Anonym'}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px' }}>
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: sv })}
              </p>
            </div>
          </Link>
        </div>

        <p style={{ color: '#fff', fontSize: '14px', lineHeight: 1.5 }}>{post.caption}</p>

        {post.tags.length > 0 && (
          <div style={{ marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {post.tags.map(t => (
              <span key={t} style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>#{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Right actions */}
      <div style={{
        position: 'absolute', bottom: '110px', right: '14px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
      }}>
        <button
          onClick={() => currentUserId && onLike(post.id, post.user_liked)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 140ms',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24"
              fill={post.user_liked ? '#e11d48' : 'none'}
              stroke={post.user_liked ? '#e11d48' : '#fff'} strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <span style={{ color: '#fff', fontSize: '11px', fontWeight: 600 }}>{post.likes_count}</span>
        </button>
      </div>

      {/* Scroll hint on first slide */}
      {active && (
        <div style={{
          position: 'absolute', bottom: '72px', left: '50%', transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.4)', fontSize: '11px', textAlign: 'center',
          animation: 'fadeUp 1s ease both 1.5s',
        }}>
          Skrolla för nästa video ↓
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VideosPage() {
  const [posts, setPosts] = useState<VideoPost[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchVideos = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id ?? null)

    // Fetch posts where image_url looks like a video (tiktok or storage/videos path)
    const { data } = await supabase
      .from('social_posts')
      .select('*, post_likes(user_id)')
      .order('created_at', { ascending: false })

    const videos = (data ?? []).filter((p: { image_url: string | null }) =>
      p.image_url && isVideoUrl(p.image_url)
    )

    setPosts(videos.map((p: {
      id: string; user_id: string; image_url: string; thumbnail_url: string | null; caption: string;
      tags: string[] | null; created_at: string; user_email: string | null;
      post_likes: { user_id: string }[]
    }) => ({
      id: p.id,
      image_url: p.image_url,
      thumbnail_url: p.thumbnail_url ?? null,
      caption: p.caption,
      tags: p.tags ?? [],
      created_at: p.created_at,
      likes_count: p.post_likes?.length ?? 0,
      user_liked: user ? p.post_likes?.some(l => l.user_id === user.id) : false,
      author_email: p.user_email,
      author_id: p.user_id ?? null,
    })))
    setLoading(false)
  }, [])

  useEffect(() => { fetchVideos() }, [fetchVideos])

  // Snap-scroll intersection observer
  useEffect(() => {
    const container = containerRef.current
    if (!container || posts.length === 0) return
    const children = Array.from(container.children) as HTMLElement[]
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const idx = children.indexOf(e.target as HTMLElement)
          if (idx >= 0) setActiveIndex(idx)
        }
      })
    }, { root: container, threshold: 0.6 })
    children.forEach(c => io.observe(c))
    return () => io.disconnect()
  }, [posts])

  async function handleLike(postId: string, currentlyLiked: boolean) {
    if (!currentUserId) return
    const supabase = createClient()
    if (currentlyLiked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', currentUserId)
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: currentUserId })
    }
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, user_liked: !currentlyLiked, likes_count: p.likes_count + (currentlyLiked ? -1 : 1) }
      : p
    ))
  }

  if (loading) {
    return (
      <div style={{ background: '#000', minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #333', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div style={{ background: '#000', minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <Link href="/community" style={{ position: 'absolute', top: '52px', left: '16px', color: '#fff', fontSize: '20px' }}>←</Link>
        <p style={{ color: '#fff', fontSize: '18px', fontFamily: 'var(--font-display)' }}>Inga videos ännu</p>
        <p style={{ color: '#666', fontSize: '13px' }}>Dela en video från community-flödet</p>
        <Link href="/community" style={{ marginTop: '8px', padding: '12px 24px', borderRadius: '12px', background: '#1C3A2A', color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
          Dela en video
        </Link>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        background: '#000',
        scrollbarWidth: 'none',
      }}
      className="no-scrollbar"
    >
      {posts.map((post, i) => (
        <VideoSlide
          key={post.id}
          post={post}
          active={i === activeIndex}
          onLike={handleLike}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  )
}

function isVideoUrl(url: string): boolean {
  return (
    url.includes('tiktok.com') ||
    url.includes('/videos/') ||
    /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(url)
  )
}
