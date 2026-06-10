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

// ─── Post detail sheet ────────────────────────────────────────────────────────

function PostSheet({ post, username, onClose }: {
  post: ProfilePost; username: string; onClose: () => void
}) {
  const isVideo = isVideoUrl(post.image_url)
  const displayImg = isVideo ? post.thumbnail_url : post.image_url

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />
      <div
        className="relative"
        style={{
          background: '#FAFAF8',
          borderRadius: '24px 24px 0 0',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-0">
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'rgba(0,0,0,0.1)' }} />
        </div>

        {/* Media */}
        <div style={{ margin: '12px 16px 0', borderRadius: '16px', overflow: 'hidden', position: 'relative', aspectRatio: '4/3', background: '#0a0a0a' }}>
          {displayImg ? (
            <img src={displayImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5"><polygon points="5,3 19,12 5,21"/></svg>
            </div>
          )}
          {isVideo && (
            <Link
              href="/community/videos"
              onClick={onClose}
              style={{
                position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.3)', textDecoration: 'none',
              }}
            >
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(255,255,255,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><polygon points="5,3 19,12 5,21"/></svg>
              </div>
            </Link>
          )}
        </div>

        <div style={{ padding: '16px 20px 48px' }}>
          {/* Author + time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: '#1C3A2A', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700, flexShrink: 0,
            }}>
              {username[0]?.toUpperCase() ?? '?'}
            </div>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A' }}>@{username}</span>
            <span style={{ fontSize: '12px', color: '#B0B0B0', marginLeft: 'auto' }}>
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: sv })}
            </span>
          </div>

          {/* Caption */}
          <p style={{ fontSize: '15px', color: '#1A1A1A', lineHeight: 1.6, marginBottom: '14px' }}>
            {post.caption}
          </p>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {post.tags.map(t => (
                <span key={t} style={{
                  fontSize: '12px', color: '#1C3A2A', background: '#EBF2ED',
                  padding: '4px 10px', borderRadius: '100px', fontWeight: 600,
                }}>
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Likes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#e11d48">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A' }}>{post.likes_count}</span>
            <span style={{ fontSize: '13px', color: '#9B9B9B' }}>gillar</span>
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

      let resolvedName = ''
      const mapped: ProfilePost[] = (data ?? []).map((p: {
        id: string; image_url: string | null; thumbnail_url: string | null;
        caption: string; tags: string[] | null; created_at: string;
        user_email: string | null; post_likes: { user_id: string }[]
      }) => {
        if (!resolvedName && p.user_email) resolvedName = p.user_email.split('@')[0]
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
      if (resolvedName) setUsername(resolvedName)
      setPosts(mapped)
      setLoading(false)
    }
    load()
  }, [userId])

  const totalLikes = posts.reduce((s, p) => s + p.likes_count, 0)
  const videoCount = posts.filter(p => isVideoUrl(p.image_url)).length
  const displayName = username || userId.slice(0, 8)
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div style={{ background: '#F5F3EE', minHeight: '100vh', paddingBottom: '100px' }}>

      {/* Floating back button */}
      <div style={{ position: 'absolute', top: '52px', left: '16px', zIndex: 10 }}>
        <Link
          href="/community"
          style={{
            width: '38px', height: '38px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            textDecoration: 'none', color: '#1A1A1A', fontSize: '16px', fontWeight: 700,
          }}
        >
          ←
        </Link>
      </div>

      {/* Hero banner */}
      <div style={{
        height: '160px',
        background: 'linear-gradient(160deg, #1C3A2A 0%, #2D5A3F 60%, #3D7A55 100%)',
        position: 'relative',
      }}>
        {/* Subtle texture dots */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.06,
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />
      </div>

      {/* Avatar — overlaps hero */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '-48px', paddingBottom: '20px' }}>
        <div style={{
          width: '96px', height: '96px', borderRadius: '50%',
          background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 4px #F5F3EE, 0 4px 20px rgba(0,0,0,0.15)',
          flexShrink: 0,
        }}>
          <div style={{
            width: '88px', height: '88px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #1C3A2A, #2D5A3F)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', fontWeight: 700, color: '#fff',
            fontFamily: 'Georgia, serif',
          }}>
            {initials}
          </div>
        </div>

        <h1 style={{
          marginTop: '12px', marginBottom: '2px',
          fontSize: '22px', fontWeight: 700, color: '#1A1A1A',
          fontFamily: 'Georgia, serif',
        }}>
          @{displayName}
        </h1>

        {isOwn && (
          <Link
            href="/profile"
            style={{
              fontSize: '12px', color: '#1C3A2A', fontWeight: 600,
              textDecoration: 'none', marginTop: '6px',
              padding: '5px 14px', borderRadius: '100px',
              border: '1.5px solid rgba(28,58,42,0.3)',
              background: 'transparent',
            }}
          >
            Redigera profil
          </Link>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #E8E5DE', borderTopColor: '#1C3A2A', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* Stats bar */}
          <div style={{ margin: '0 16px 24px', background: '#fff', borderRadius: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            {[
              { value: posts.length, label: 'Inlägg' },
              { value: totalLikes, label: 'Gillar' },
              { value: videoCount, label: 'Videos' },
            ].map((stat, i, arr) => (
              <div
                key={stat.label}
                style={{
                  display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
                  width: `${100 / arr.length}%`,
                  padding: '16px 8px',
                  borderRight: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                  verticalAlign: 'top',
                }}
              >
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#1C3A2A', fontFamily: 'Georgia, serif', lineHeight: 1 }}>
                  {stat.value}
                </span>
                <span style={{ fontSize: '11px', color: '#9B9B9B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '4px' }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Post grid */}
          {posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#E8E5DE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9B9B9B" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#1A1A1A', fontFamily: 'Georgia, serif', marginBottom: '6px' }}>
                Inga inlägg än
              </p>
              <p style={{ fontSize: '13px', color: '#9B9B9B', lineHeight: 1.5 }}>
                {isOwn ? 'Dela ditt första inlägg från community-sidan' : `${displayName} har inte delat något än`}
              </p>
              {isOwn && (
                <Link href="/community" style={{ display: 'inline-block', marginTop: '16px', padding: '10px 24px', borderRadius: '12px', background: '#1C3A2A', color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
                  Gå till community
                </Link>
              )}
            </div>
          ) : (
            <div style={{ padding: '0 16px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                Inlägg
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', borderRadius: '12px', overflow: 'hidden' }}>
                {posts.map((post, i) => {
                  const isVideo = isVideoUrl(post.image_url)
                  const thumb = isVideo ? post.thumbnail_url : post.image_url
                  const isFirst = i === 0
                  return (
                    <button
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className="pressable"
                      style={{
                        aspectRatio: '1',
                        borderRadius: '0',
                        overflow: 'hidden',
                        position: 'relative',
                        background: '#111',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        outline: 'none',
                      }}
                    >
                      {thumb ? (
                        <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.2s' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        </div>
                      )}

                      {/* Dark overlay on hover (desktop) */}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)', pointerEvents: 'none' }} />

                      {/* Video badge */}
                      {isVideo && (
                        <div style={{
                          position: 'absolute', top: '6px', right: '6px',
                          width: '22px', height: '22px', borderRadius: '6px',
                          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)"><polygon points="5,3 19,12 5,21"/></svg>
                        </div>
                      )}

                      {/* Likes */}
                      <div style={{ position: 'absolute', bottom: '5px', left: '6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.9)', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>{post.likes_count}</span>
                      </div>

                      {/* "Senaste" badge on first post */}
                      {isFirst && (
                        <div style={{
                          position: 'absolute', top: '6px', left: '6px',
                          fontSize: '9px', fontWeight: 700, color: '#fff',
                          background: '#1C3A2A', padding: '2px 6px', borderRadius: '4px',
                          textTransform: 'uppercase', letterSpacing: '0.04em',
                        }}>
                          Ny
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

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
