'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { sv } from 'date-fns/locale'

type UserProfile = {
  username: string
  bio: string
  avatar_url: string | null
}

type ProfilePost = {
  id: string
  image_url: string | null
  thumbnail_url: string | null
  caption: string
  tags: string[]
  created_at: string
  likes_count: number
}

type ProfileVideo = {
  id: string
  video_url: string
  thumbnail_url: string | null
  caption: string
  created_at: string
  likes_count: number
}

function isVideoUrl(url: string | null): boolean {
  if (!url) return false
  return url.includes('tiktok.com') || url.includes('/videos/') || /\.(mp4|mov|webm)(\?|$)/i.test(url)
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ username, avatarUrl, size }: { username: string; avatarUrl: string | null; size: number }) {
  const [err, setErr] = useState(false)
  const initials = username.slice(0, 2).toUpperCase() || '?'
  if (avatarUrl && !err) {
    return (
      <img src={avatarUrl} alt={username} onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #1C3A2A, #2D5A3F)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.3, fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif',
    }}>
      {initials}
    </div>
  )
}

// ─── Post detail sheet ────────────────────────────────────────────────────────

function PostSheet({ post, username, onClose }: { post: ProfilePost; username: string; onClose: () => void }) {
  const isVideo = isVideoUrl(post.image_url)
  const displayImg = isVideo ? post.thumbnail_url : post.image_url

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }} onClick={onClose} />
      <div className="relative" style={{ background: '#FAFAF8', borderRadius: '24px 24px 0 0', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex justify-center pt-3 pb-0">
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'rgba(0,0,0,0.1)' }} />
        </div>
        <div style={{ margin: '12px 16px 0', borderRadius: '16px', overflow: 'hidden', position: 'relative', aspectRatio: '4/3', background: '#0a0a0a' }}>
          {displayImg
            ? <img src={displayImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5"><polygon points="5,3 19,12 5,21"/></svg></div>
          }
          {isVideo && (
            <Link href="/inspiration" onClick={onClose} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', textDecoration: 'none' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><polygon points="5,3 19,12 5,21"/></svg>
              </div>
            </Link>
          )}
        </div>
        <div style={{ padding: '16px 20px 48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1C3A2A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
              {username[0]?.toUpperCase() ?? '?'}
            </div>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A' }}>@{username}</span>
            <span style={{ fontSize: '12px', color: '#B0B0B0', marginLeft: 'auto' }}>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: sv })}</span>
          </div>
          <p style={{ fontSize: '15px', color: '#1A1A1A', lineHeight: 1.6, marginBottom: '14px' }}>{post.caption}</p>
          {post.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {post.tags.map(t => <span key={t} style={{ fontSize: '12px', color: '#1C3A2A', background: '#EBF2ED', padding: '4px 10px', borderRadius: '100px', fontWeight: 600 }}>{t}</span>)}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#e11d48"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
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

  const [profile, setProfile]           = useState<UserProfile | null>(null)
  const [posts, setPosts]               = useState<ProfilePost[]>([])
  const [videos, setVideos]             = useState<ProfileVideo[]>([])
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isFollowing, setIsFollowing]   = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [loading, setLoading]           = useState(true)
  const [isOwn, setIsOwn]               = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [tab, setTab]                   = useState<'posts' | 'videos'>('posts')
  const [selectedPost, setSelectedPost] = useState<ProfilePost | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id ?? null)
      setIsOwn(user?.id === userId)

      const [profileRes, postsRes, videosRes, followersRes, followingRes, isFollowingRes] = await Promise.all([
        supabase.from('user_profiles').select('username, bio, avatar_url').eq('user_id', userId).single(),
        supabase.from('social_posts').select('*, post_likes(user_id)').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('videos').select('id, video_url, thumbnail_url, caption, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('followed_id', userId),
        supabase.from('follows').select('followed_id', { count: 'exact', head: true }).eq('follower_id', userId),
        user
          ? supabase.from('follows').select('follower_id').eq('follower_id', user.id).eq('followed_id', userId).single()
          : Promise.resolve({ data: null }),
      ])

      // Profile — fall back to username from posts if no user_profile row
      let resolvedUsername = profileRes.data?.username ?? ''
      if (!resolvedUsername) {
        const firstPost = (postsRes.data ?? [])[0] as { user_email?: string | null } | undefined
        resolvedUsername = firstPost?.user_email?.split('@')[0] ?? userId.slice(0, 8)
      }
      setProfile({
        username: resolvedUsername,
        bio: profileRes.data?.bio ?? '',
        avatar_url: profileRes.data?.avatar_url ?? null,
      })

      // Posts
      const mapped: ProfilePost[] = (postsRes.data ?? []).map((p: {
        id: string; image_url: string | null; thumbnail_url: string | null;
        caption: string; tags: string[] | null; created_at: string;
        post_likes: { user_id: string }[]
      }) => ({
        id: p.id, image_url: p.image_url, thumbnail_url: p.thumbnail_url ?? null,
        caption: p.caption, tags: p.tags ?? [], created_at: p.created_at,
        likes_count: p.post_likes?.length ?? 0,
      }))
      setPosts(mapped)

      // Inspiration videos
      const videoLikesRes = await supabase.from('video_likes').select('video_id').in(
        'video_id', (videosRes.data ?? []).map((v: { id: string }) => v.id)
      )
      const likeCounts = new Map<string, number>()
      for (const l of videoLikesRes.data ?? []) {
        likeCounts.set(l.video_id, (likeCounts.get(l.video_id) ?? 0) + 1)
      }
      setVideos((videosRes.data ?? []).map((v: { id: string; video_url: string; thumbnail_url: string | null; caption: string; created_at: string }) => ({
        ...v, likes_count: likeCounts.get(v.id) ?? 0,
      })))

      setFollowerCount(followersRes.count ?? 0)
      setFollowingCount(followingRes.count ?? 0)
      setIsFollowing(!!isFollowingRes.data)
      setLoading(false)
    }
    load()
  }, [userId])

  async function toggleFollow() {
    if (!currentUserId || followLoading) return
    setFollowLoading(true)
    const newFollowing = !isFollowing
    setIsFollowing(newFollowing)
    setFollowerCount(c => c + (newFollowing ? 1 : -1))
    try {
      const res = await fetch(`/api/follows/${userId}`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) { setIsFollowing(data.following); setFollowerCount(data.followerCount) }
      else { setIsFollowing(!newFollowing); setFollowerCount(c => c + (newFollowing ? -1 : 1)) }
    } catch {
      setIsFollowing(!newFollowing); setFollowerCount(c => c + (newFollowing ? -1 : 1))
    }
    setFollowLoading(false)
  }

  const displayName = profile?.username ?? userId.slice(0, 8)
  const totalPostLikes = posts.reduce((s, p) => s + p.likes_count, 0)

  return (
    <div style={{ background: '#F5F3EE', minHeight: '100vh', paddingBottom: '100px' }}>

      {/* Header */}
      <div style={{ padding: '52px 16px 0', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <Link href="/search" style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#1A1A1A', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 500, color: '#1A1A1A', flex: 1 }}>Profil</h1>
        {isOwn && (
          <Link href="/profile" style={{ fontSize: '12px', color: '#1C3A2A', fontWeight: 600, textDecoration: 'none' }}>
            Redigera →
          </Link>
        )}
      </div>

      {/* Profile card */}
      <div style={{ margin: '0 16px 14px', background: '#fff', borderRadius: '20px', padding: '24px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <Avatar username={displayName} avatarUrl={profile?.avatar_url ?? null} size={72} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', fontFamily: 'Georgia, serif', marginBottom: '2px' }}>
              @{displayName}
            </h2>
            {profile?.bio && (
              <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.5, marginBottom: '10px' }}>{profile.bio}</p>
            )}
            {/* Follow counts */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <span style={{ fontSize: '13px', color: '#1A1A1A' }}>
                <strong>{followerCount}</strong> <span style={{ color: '#9B9B9B' }}>följare</span>
              </span>
              <span style={{ fontSize: '13px', color: '#1A1A1A' }}>
                <strong>{followingCount}</strong> <span style={{ color: '#9B9B9B' }}>följer</span>
              </span>
            </div>
          </div>
        </div>

        {/* Follow button */}
        {!isOwn && currentUserId && (
          <button
            onClick={toggleFollow}
            disabled={followLoading}
            style={{
              width: '100%', marginTop: '16px', padding: '10px',
              borderRadius: '12px', fontSize: '14px', fontWeight: 700,
              background: isFollowing ? 'transparent' : '#1C3A2A',
              color: isFollowing ? '#1C3A2A' : '#fff',
              border: isFollowing ? '1.5px solid #1C3A2A' : '1.5px solid transparent',
              cursor: followLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {isFollowing ? 'Följer ✓' : 'Följ'}
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #E8E5DE', borderTopColor: '#1C3A2A', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ margin: '0 16px 14px', background: '#fff', borderRadius: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex' }}>
            {[
              { value: posts.length,    label: 'Inlägg' },
              { value: videos.length,   label: 'Videor' },
              { value: totalPostLikes,  label: 'Gillar' },
            ].map((s, i, arr) => (
              <div key={s.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 8px', borderRight: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                <span style={{ fontSize: '22px', fontWeight: 700, color: '#1C3A2A', fontFamily: 'Georgia, serif', lineHeight: 1 }}>{s.value}</span>
                <span style={{ fontSize: '10px', color: '#9B9B9B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '4px' }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Tab switcher */}
          {(posts.length > 0 || videos.length > 0) && (
            <div style={{ margin: '0 16px 14px', display: 'flex', background: '#E8E5DE', borderRadius: '10px', padding: '3px' }}>
              {(['posts', 'videos'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#1A1A1A' : '#6B6B6B', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
                  {t === 'posts' ? `Inlägg (${posts.length})` : `Videor (${videos.length})`}
                </button>
              ))}
            </div>
          )}

          {/* Posts grid */}
          {tab === 'posts' && (
            posts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A', fontFamily: 'Georgia, serif', marginBottom: '6px' }}>Inga inlägg än</p>
                <p style={{ fontSize: '13px', color: '#9B9B9B' }}>{isOwn ? 'Dela ditt första inlägg från community-sidan' : `${displayName} har inte delat något än`}</p>
                {isOwn && <Link href="/community" style={{ display: 'inline-block', marginTop: '14px', padding: '10px 24px', borderRadius: '12px', background: '#1C3A2A', color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Gå till community</Link>}
              </div>
            ) : (
              <div style={{ padding: '0 16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', borderRadius: '12px', overflow: 'hidden' }}>
                  {posts.map((post, i) => {
                    const isVid = isVideoUrl(post.image_url)
                    const thumb = isVid ? post.thumbnail_url : post.image_url
                    return (
                      <button key={post.id} onClick={() => setSelectedPost(post)} className="pressable" style={{ aspectRatio: '1', position: 'relative', background: '#111', border: 'none', cursor: 'pointer', padding: 0, overflow: 'hidden' }}>
                        {thumb ? <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <div style={{ width: '100%', height: '100%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)', pointerEvents: 'none' }} />
                        {isVid && <div style={{ position: 'absolute', top: '6px', right: '6px', width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="10" height="10" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)"><polygon points="5,3 19,12 5,21"/></svg></div>}
                        <div style={{ position: 'absolute', bottom: '5px', left: '6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>{post.likes_count}</span>
                        </div>
                        {i === 0 && <div style={{ position: 'absolute', top: '6px', left: '6px', fontSize: '9px', fontWeight: 700, color: '#fff', background: '#1C3A2A', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>Ny</div>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          )}

          {/* Videos grid */}
          {tab === 'videos' && (
            videos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A', fontFamily: 'Georgia, serif', marginBottom: '6px' }}>Inga videor än</p>
                <p style={{ fontSize: '13px', color: '#9B9B9B' }}>{isOwn ? 'Dela din första video från Film-fliken' : `${displayName} har inte delat några videor`}</p>
                {isOwn && <Link href="/inspiration" style={{ display: 'inline-block', marginTop: '14px', padding: '10px 24px', borderRadius: '12px', background: '#1C3A2A', color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Gå till Film</Link>}
              </div>
            ) : (
              <div style={{ padding: '0 16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', borderRadius: '12px', overflow: 'hidden' }}>
                  {videos.map(v => (
                    <Link key={v.id} href="/inspiration" style={{ aspectRatio: '9/16', display: 'block', position: 'relative', background: '#111', overflow: 'hidden' }}>
                      {v.thumbnail_url ? <img src={v.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg></div>}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 40%)', pointerEvents: 'none' }} />
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><polygon points="5,3 19,12 5,21"/></svg>
                      </div>
                      <div style={{ position: 'absolute', bottom: '5px', left: '6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>{v.likes_count}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          )}
        </>
      )}

      {selectedPost && (
        <PostSheet post={selectedPost} username={displayName} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  )
}
