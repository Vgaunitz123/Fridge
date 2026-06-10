'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { sv } from 'date-fns/locale'

type ProfilePost = {
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

function timeAgo(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: sv })
}

// ─── Post detail sheet ────────────────────────────────────────────────────────

function PostSheet({ post, username, onClose }: { post: ProfilePost; username: string; onClose: () => void }) {
  const isVideo = isVideoUrl(post.image_url)
  const displayImg = isVideo ? post.thumbnail_url : post.image_url

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }} onClick={onClose} />
      <div className="relative" style={{ background: '#FAFAF8', borderRadius: '20px 20px 0 0', maxHeight: '88vh', overflowY: 'auto' }}>
        <div className="flex justify-center pt-3 pb-1">
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(0,0,0,0.12)' }} />
        </div>

        {/* Media */}
        {displayImg ? (
          <div style={{ aspectRatio: '3/2', overflow: 'hidden', position: 'relative' }}>
            <img src={displayImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {isVideo && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)' }}>
                <Link href="/community/videos" onClick={onClose} style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)',
                  border: '1.5px solid rgba(255,255,255,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><polygon points="5,3 19,12 5,21"/></svg>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div style={{ aspectRatio: '3/2', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5"><polygon points="5,3 19,12 5,21"/></svg>
          </div>
        )}

        <div style={{ padding: '14px 16px 40px' }}>
          {/* Author row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1C3A2A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
              {username[0]?.toUpperCase()}
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>{username}</span>
            <span style={{ fontSize: '11px', color: '#B0B0B0', marginLeft: 'auto' }}>{timeAgo(post.created_at)}</span>
          </div>

          {/* Caption */}
          <p style={{ fontSize: '14px', color: '#1A1A1A', lineHeight: 1.55, marginBottom: '10px' }}>{post.caption}</p>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
              {post.tags.map(t => (
                <span key={t} style={{ fontSize: '12px', color: '#1C3A2A', background: '#EBF2ED', padding: '3px 9px', borderRadius: '100px', fontWeight: 500 }}>
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Likes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#e11d48" stroke="none">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span style={{ fontSize: '12px', color: '#6B6B6B', fontWeight: 600 }}>{post.likes_count} gillar</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const [posts, setPosts] = useState<ProfilePost[]>([])
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [isOwn, setIsOwn] = useState(false)
  const [selectedPost, setSelectedPost] = useState<ProfilePost | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setIsOwn(user?.id === userId)

      const { data } = await supabase
        .from('social_posts')
        .select('*, post_likes(user_id)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      const mapped: ProfilePost[] = (data ?? []).map((p: {
        id: string; image_url: string | null; thumbnail_url: string | null;
        caption: string; tags: string[] | null; created_at: string;
        user_email: string | null; post_likes: { user_id: string }[]
      }) => {
        if (!username && p.user_email) setUsername(p.user_email.split('@')[0])
        return {
          id: p.id,
          image_url: p.image_url,
          thumbnail_url: p.thumbnail_url ?? null,
          caption: p.caption,
          tags: p.tags ?? [],
          created_at: p.created_at,
          likes_count: p.post_likes?.length ?? 0,
        }
      })

      setPosts(mapped)
      setLoading(false)
    }
    load()
  }, [userId])

  const totalLikes = posts.reduce((s, p) => s + p.likes_count, 0)
  const displayName = username || userId.slice(0, 8)

  return (
    <div style={{ background: '#F5F3EE', minHeight: '100vh', paddingBottom: '100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '52px 16px 16px' }}>
        <Link href="/community" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#1A1A1A', fontSize: '16px', fontWeight: 700, flexShrink: 0 }}>
          ←
        </Link>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 500, color: '#1A1A1A', flex: 1 }}>
          {isOwn ? 'Min profil' : 'Profil'}
        </h1>
        {isOwn && (
          <Link href="/profile" style={{ fontSize: '13px', fontWeight: 600, color: '#1C3A2A', textDecoration: 'none', padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #1C3A2A' }}>
            Redigera
          </Link>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #E8E5DE', borderTopColor: '#1C3A2A', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* Profile card */}
          <div style={{ margin: '0 16px 20px', padding: '24px 20px', background: '#fff', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            {/* Avatar */}
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: '#1C3A2A', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', fontWeight: 700, margin: '0 auto 12px',
              fontFamily: 'Georgia, serif',
            }}>
              {displayName[0]?.toUpperCase() ?? '?'}
            </div>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', marginBottom: '4px', fontFamily: 'Georgia, serif' }}>
              @{displayName}
            </p>
            {isOwn && (
              <p style={{ fontSize: '12px', color: '#9B9B9B', marginBottom: '16px' }}>Det här är din profil</p>
            )}

            {/* Stats */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: isOwn ? '0' : '16px' }}>
              <div>
                <p style={{ fontSize: '22px', fontWeight: 700, color: '#1C3A2A', fontFamily: 'Georgia, serif', lineHeight: 1.1 }}>{posts.length}</p>
                <p style={{ fontSize: '11px', color: '#9B9B9B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px' }}>inlägg</p>
              </div>
              <div style={{ width: '1px', background: 'rgba(0,0,0,0.08)' }} />
              <div>
                <p style={{ fontSize: '22px', fontWeight: 700, color: '#1C3A2A', fontFamily: 'Georgia, serif', lineHeight: 1.1 }}>{totalLikes}</p>
                <p style={{ fontSize: '11px', color: '#9B9B9B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px' }}>gillar</p>
              </div>
            </div>
          </div>

          {/* Post grid */}
          {posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: '#9B9B9B' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.4 }}>🍽</div>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#6B6B6B', marginBottom: '4px' }}>Inga inlägg ännu</p>
              {isOwn && <p style={{ fontSize: '13px' }}>Dela ditt första inlägg från community-sidan</p>}
            </div>
          ) : (
            <div style={{ padding: '0 16px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
                Inlägg
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px' }}>
                {posts.map(post => {
                  const isVideo = isVideoUrl(post.image_url)
                  const thumb = isVideo ? post.thumbnail_url : post.image_url
                  return (
                    <button
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      style={{ aspectRatio: '1', borderRadius: '4px', overflow: 'hidden', position: 'relative', background: '#111', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      {thumb ? (
                        <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        </div>
                      )}
                      {/* Video indicator */}
                      {isVideo && (
                        <div style={{ position: 'absolute', top: '5px', right: '5px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.85)"><polygon points="5,3 19,12 5,21"/></svg>
                        </div>
                      )}
                      {/* Like count on hover area */}
                      <div style={{ position: 'absolute', bottom: '4px', left: '5px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>{post.likes_count}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Post detail sheet */}
      {selectedPost && (
        <PostSheet
          post={selectedPost}
          username={displayName}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  )
}
