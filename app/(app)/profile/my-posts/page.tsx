'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { sv } from 'date-fns/locale'

type Post = {
  id: string
  image_url: string | null
  thumbnail_url: string | null
  caption: string
  tags: string[]
  created_at: string
  likes_count: number
}

function isVideoUrl(url: string | null): boolean {
  if (!url) return false
  return url.includes('tiktok.com') || url.includes('/videos/') || /\.(mp4|mov|webm)(\?|$)/i.test(url)
}

function PostTile({ post }: { post: Post }) {
  const [imgErr, setImgErr] = useState(false)
  const isVideo = isVideoUrl(post.image_url)
  const thumb = isVideo ? post.thumbnail_url : post.image_url

  return (
    <div
      className="fade-up overflow-hidden"
      style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', aspectRatio: '3/2', overflow: 'hidden' }}>
        {thumb && !imgErr ? (
          <img
            src={thumb}
            alt={post.caption}
            onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isVideo ? '#111' : 'linear-gradient(135deg, #E8E5DE 0%, #D4CCBF 100%)' }}
          >
            {isVideo
              ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
              : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            }
          </div>
        )}

        {/* Video badge */}
        {isVideo && (
          <div style={{ position: 'absolute', top: '6px', left: '6px', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="#fff"><polygon points="5,3 19,12 5,21"/></svg>
          </div>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div style={{ position: 'absolute', bottom: '6px', left: '6px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {post.tags.slice(0, 1).map(t => (
              <span key={t} style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', color: '#fff', fontSize: '9px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: 'var(--radius-xs)' }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '10px 12px 12px' }}>
        <p
          className="line-clamp-2"
          style={{ fontSize: '12px', color: '#1A1A1A', lineHeight: 1.5, marginBottom: '6px' }}
        >
          {post.caption}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '10px', color: '#9B9B9B' }}>
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: sv })}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#e11d48" stroke="none">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span style={{ fontSize: '10px', color: '#9B9B9B', fontWeight: 600 }}>{post.likes_count}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MyPostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('social_posts')
        .select('id, image_url, thumbnail_url, caption, tags, created_at, post_likes(user_id)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setPosts(
        (data ?? []).map((p: {
          id: string; image_url: string | null; thumbnail_url: string | null; caption: string;
          tags: string[] | null; created_at: string; post_likes: { user_id: string }[]
        }) => ({
          id: p.id,
          image_url: p.image_url,
          thumbnail_url: p.thumbnail_url ?? null,
          caption: p.caption,
          tags: p.tags ?? [],
          created_at: p.created_at,
          likes_count: p.post_likes?.length ?? 0,
        }))
      )
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
          Mina inlägg
        </h1>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #E8E5DE', borderTopColor: '#1C3A2A', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : posts.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 32px 0', gap: '10px' }}>
          <span style={{ fontSize: '40px', lineHeight: 1 }}>📸</span>
          <p style={{ fontSize: '18px', fontFamily: 'var(--font-display)', color: '#1A1A1A', fontWeight: 500, marginTop: '8px' }}>
            Inga inlägg än
          </p>
          <p style={{ fontSize: '13px', color: '#9B9B9B', textAlign: 'center', lineHeight: 1.55 }}>
            Dela bilder och videos i community-flödet.
          </p>
          <Link
            href="/community"
            style={{ marginTop: '12px', padding: '12px 24px', borderRadius: 'var(--radius-sm)', background: '#1C3A2A', color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}
          >
            Gå till Community
          </Link>
        </div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          <p style={{ fontSize: '12px', color: '#9B9B9B', marginBottom: '14px', fontWeight: 500 }}>
            {posts.length} {posts.length === 1 ? 'inlägg' : 'inlägg'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="stagger">
            {posts.map(p => <PostTile key={p.id} post={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}
