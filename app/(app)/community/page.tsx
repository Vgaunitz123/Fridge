'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { sv } from 'date-fns/locale'
import Link from 'next/link'

function isVideoUrl(url: string | null): boolean {
  if (!url) return false
  return url.includes('tiktok.com') || url.includes('/videos/') || /\.(mp4|mov|webm)(\?|$)/i.test(url)
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Post = {
  id: string
  user_id: string
  image_url: string | null
  caption: string
  tags: string[]
  created_at: string
  likes_count: number
  user_liked: boolean
  author_email: string | null
}

// ─── Demo posts shown when DB is empty ───────────────────────────────────────

const DEMO: Post[] = [
  { id: 'd1', user_id: '', image_url: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&h=400&fit=crop',
    caption: 'Hemgjord svamprisotto på fredagskvällen 🍄 Tog nästan en timme men var helt värt det.', tags: ['Vegetarisk'],
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(), likes_count: 38, user_liked: false, author_email: 'anna@example.com' },
  { id: 'd2', user_id: '', image_url: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=600&h=400&fit=crop',
    caption: 'Pasta alla norma med aubergine och ricotta. Enkelt och gott!', tags: ['Snabbt'],
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(), likes_count: 21, user_liked: false, author_email: 'erik@example.com' },
  { id: 'd3', user_id: '', image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop',
    caption: 'Sommarens bästa sallad — halloumi, vattenmelon och mynta. Topp!', tags: ['Vegetarisk', 'Sommar'],
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(), likes_count: 64, user_liked: false, author_email: 'sara@example.com' },
  { id: 'd4', user_id: '', image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&h=400&fit=crop',
    caption: 'Lax med dillkräm och färskpotatis. Klart på 25 minuter.', tags: ['Snabbt', 'Glutenfritt'],
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(), likes_count: 17, user_liked: false, author_email: 'johan@example.com' },
  { id: 'd5', user_id: '', image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&h=400&fit=crop',
    caption: 'Tomatsoppa från grunden med basilikaolja. Värmande och underbar.', tags: ['Veganskt'],
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(), likes_count: 29, user_liked: false, author_email: 'maja@example.com' },
]

const TAG_OPTIONS = ['Snabbt', 'Vegetarisk', 'Veganskt', 'Glutenfritt', 'Barnvänl', 'Sommmat', 'Budget']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function avatar(email: string | null) {
  return (email?.[0] ?? '?').toUpperCase()
}

function timeAgo(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: sv })
}

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({
  post, onLike, featured = false,
}: {
  post: Post; onLike: (id: string, liked: boolean) => void; featured?: boolean
}) {
  const [imgErr, setImgErr] = useState(false)
  const isVideo = isVideoUrl(post.image_url)

  const mediaEl = (
    <div className="relative overflow-hidden" style={{ aspectRatio: featured ? '16/9' : '3/2' }}>
      {post.image_url && !imgErr ? (
        <img
          src={post.image_url}
          alt={post.caption}
          onError={() => setImgErr(true)}
          className="w-full h-full object-cover"
          style={isVideo ? { filter: 'brightness(0.6)' } : undefined}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center"
          style={{ background: isVideo ? '#111' : 'linear-gradient(135deg, #E8E5DE 0%, #D4CCBF 100%)' }}>
          {isVideo
            ? <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 2l-4 5-4-5"/></svg>
            : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          }
        </div>
      )}

      {/* Play button overlay for videos */}
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)',
            border: '1.5px solid rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><polygon points="5,3 19,12 5,21"/></svg>
          </div>
        </div>
      )}

      {/* Tags bottom-left */}
      {post.tags.length > 0 && (
        <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap">
          {post.tags.slice(0, 2).map(t => (
            <span key={t} style={{
              background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
              color: '#fff', fontSize: '10px', fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '2px 7px', borderRadius: '3px',
            }}>{t}</span>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div
      className="card-hover fade-up overflow-hidden"
      style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.06)' }}
    >
      {/* Video posts → link to video feed; image posts → just the card */}
      {isVideo
        ? <Link href="/community/videos" style={{ display: 'block', textDecoration: 'none' }}>{mediaEl}</Link>
        : mediaEl
      }

      {/* Body */}
      <div style={{ padding: '12px 14px 10px' }}>
        {/* Author row */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: '#1C3A2A', color: '#fff', fontSize: '10px' }}>
            {avatar(post.author_email)}
          </div>
          <span style={{ fontSize: '12px', color: '#6B6B6B', fontWeight: 500 }}>
            {post.author_email?.split('@')[0] ?? 'Anonym'}
          </span>
          <span style={{ fontSize: '11px', color: '#B0B0B0', marginLeft: 'auto' }}>{timeAgo(post.created_at)}</span>
        </div>

        {/* Caption */}
        <p
          className={featured ? '' : 'line-clamp-2'}
          style={{ fontSize: '13px', color: '#1A1A1A', lineHeight: 1.5 }}
        >
          {post.caption}
        </p>

        {/* Like */}
        <div className="flex items-center justify-end mt-2.5">
          <button
            onClick={() => onLike(post.id, post.user_liked)}
            className="pressable flex items-center gap-1.5"
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24"
              fill={post.user_liked ? '#e11d48' : 'none'}
              stroke={post.user_liked ? '#e11d48' : '#B0B0B0'}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: 'all 140ms' }}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span style={{ fontSize: '12px', color: post.user_liked ? '#e11d48' : '#B0B0B0', fontWeight: 600 }}>
              {post.likes_count}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── New post drawer ──────────────────────────────────────────────────────────

type DrawerTab = 'image' | 'video'

function NewPostDrawer({
  open, onClose, onSubmit,
}: {
  open: boolean; onClose: () => void
  onSubmit: (mediaUrl: string, caption: string, tags: string[]) => Promise<void>
}) {
  const [tab, setTab] = useState<DrawerTab>('image')
  const [imageUrl, setImageUrl] = useState('')
  const [tiktokUrl, setTiktokUrl] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [caption, setCaption] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 300)
    else { setImageUrl(''); setTiktokUrl(''); setVideoFile(null); setCaption(''); setSelectedTags([]); setUploadProgress('') }
  }, [open])

  async function uploadVideo(file: File): Promise<string | null> {
    setUploading(true)
    setUploadProgress('Laddar upp video…')
    const fd = new FormData()
    fd.append('video', file)
    const res = await fetch('/api/community/upload', { method: 'POST', body: fd })
    setUploading(false)
    if (!res.ok) {
      const d = await res.json()
      setUploadProgress(`Fel: ${d.error}`)
      return null
    }
    const { url } = await res.json()
    setUploadProgress('Video uppladdad!')
    return url
  }

  async function submit() {
    if (!caption.trim()) return
    setSaving(true)

    let mediaUrl = ''
    if (tab === 'image') {
      mediaUrl = imageUrl.trim()
    } else if (tab === 'video') {
      if (videoFile) {
        const url = await uploadVideo(videoFile)
        if (!url) { setSaving(false); return }
        mediaUrl = url
      } else if (tiktokUrl.trim()) {
        mediaUrl = tiktokUrl.trim()
      }
    }

    await onSubmit(mediaUrl, caption.trim(), selectedTags)
    setSaving(false)
  }

  function toggleTag(t: string) {
    setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={onClose} />

      <div className="relative scale-in" style={{ background: '#FAFAF8', borderRadius: '20px 20px 0 0', maxHeight: '94vh', overflowY: 'auto' }}>
        <div className="flex justify-center pt-3 pb-2">
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(0,0,0,0.12)' }} />
        </div>

        <div className="px-5 pb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 500, color: '#1A1A1A' }}>
              Dela med communityn
            </h2>
            <button onClick={onClose} style={{ color: '#6B6B6B', fontSize: '20px', lineHeight: 1 }}>✕</button>
          </div>

          {/* Image / Video tab toggle */}
          <div className="flex p-1 mb-5" style={{ background: '#E8E5DE', borderRadius: '10px' }}>
            {(['image', 'video'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className="flex-1 py-2 text-sm font-semibold"
                style={{
                  borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: tab === t ? '#fff' : 'transparent',
                  color: tab === t ? '#1A1A1A' : '#6B6B6B',
                  boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s',
                }}>
                {t === 'image' ? '🖼 Bild' : '🎬 Video'}
              </button>
            ))}
          </div>

          {/* IMAGE tab */}
          {tab === 'image' && (
            <div className="mb-4">
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
                Bildlänk (URL)
              </label>
              <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://…"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff', fontSize: '14px', color: '#1A1A1A', boxSizing: 'border-box' }} />
              {imageUrl && (
                <div className="mt-2 overflow-hidden" style={{ borderRadius: '8px', aspectRatio: '3/2' }}>
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
              )}
            </div>
          )}

          {/* VIDEO tab */}
          {tab === 'video' && (
            <div className="mb-4 space-y-4">
              {/* TikTok URL */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
                  Klistra in TikTok-länk
                </label>
                <input type="url" value={tiktokUrl} onChange={e => setTiktokUrl(e.target.value)}
                  placeholder="https://www.tiktok.com/@ditt_konto/video/…"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff', fontSize: '13px', color: '#1A1A1A', boxSizing: 'border-box' }} />
                <p style={{ fontSize: '11px', color: '#9B9B9B', marginTop: '4px' }}>
                  Öppna TikTok → din video → Dela → Kopiera länk
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.1)' }} />
                <span style={{ fontSize: '11px', color: '#9B9B9B', fontWeight: 600 }}>ELLER</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.1)' }} />
              </div>

              {/* File upload */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
                  Ladda upp videofil (max 100 MB)
                </label>
                <label
                  className="pressable"
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                    padding: '20px', borderRadius: '12px', cursor: 'pointer',
                    border: '2px dashed rgba(0,0,0,0.15)', background: videoFile ? '#f0fdf4' : '#fafaf8',
                  }}
                >
                  <input type="file" accept="video/mp4,video/quicktime,video/webm,video/*" className="hidden"
                    onChange={e => setVideoFile(e.target.files?.[0] ?? null)} />
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={videoFile ? '#1C3A2A' : '#aaa'} strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: videoFile ? '#1C3A2A' : '#6B6B6B' }}>
                    {videoFile ? videoFile.name : 'Välj MP4 / MOV / WebM'}
                  </span>
                  {videoFile && (
                    <span style={{ fontSize: '11px', color: '#9B9B9B' }}>
                      {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  )}
                </label>
                {uploadProgress && (
                  <p style={{ fontSize: '12px', marginTop: '6px', color: uploadProgress.startsWith('Fel') ? '#dc2626' : '#1C3A2A' }}>
                    {uploadProgress}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Caption */}
          <div className="mb-4">
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
              Text *
            </label>
            <textarea ref={textareaRef} value={caption} onChange={e => setCaption(e.target.value)}
              placeholder="Vad lagade du? Dela receptet, tipset eller känslan…"
              rows={3}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff', fontSize: '14px', color: '#1A1A1A', resize: 'none', lineHeight: 1.55, boxSizing: 'border-box' }} />
          </div>

          {/* Tags */}
          <div className="mb-5">
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>
              Taggar
            </label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map(t => (
                <button key={t} onClick={() => toggleTag(t)} className="pressable"
                  style={{
                    padding: '5px 13px', borderRadius: '100px', fontSize: '13px', fontWeight: 500,
                    background: selectedTags.includes(t) ? '#1C3A2A' : 'transparent',
                    color: selectedTags.includes(t) ? '#fff' : '#1A1A1A',
                    border: `1.5px solid ${selectedTags.includes(t) ? '#1C3A2A' : 'rgba(0,0,0,0.18)'}`,
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button onClick={submit} disabled={saving || uploading || !caption.trim()} className="pressable w-full py-3.5 rounded-xl text-sm font-semibold"
            style={{ background: saving || uploading || !caption.trim() ? '#a3b8a8' : '#1C3A2A', color: '#fff' }}>
            {saving || uploading ? 'Publicerar…' : 'Publicera inlägg'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const FILTERS = ['Allt', 'Snabbt', 'Vegetarisk', 'Veganskt', 'Glutenfritt']

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)
  const [filter, setFilter] = useState('Allt')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const fetchPosts = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id ?? null)

    const { data, error } = await supabase
      .from('social_posts')
      .select('*, post_likes(user_id)')
      .order('created_at', { ascending: false })
      .limit(40)

    if (error || !data || data.length === 0) {
      setPosts(DEMO)
      setIsDemo(true)
    } else {
      const mapped: Post[] = data.map((p: {
        id: string; user_id: string; image_url: string | null; caption: string;
        tags: string[] | null; created_at: string; user_email: string | null;
        post_likes: { user_id: string }[]
      }) => ({
        id: p.id,
        user_id: p.user_id,
        image_url: p.image_url,
        caption: p.caption,
        tags: p.tags ?? [],
        created_at: p.created_at,
        likes_count: p.post_likes?.length ?? 0,
        user_liked: user ? p.post_likes?.some(l => l.user_id === user.id) : false,
        author_email: p.user_email,
      }))
      setPosts(mapped)
      setIsDemo(false)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  async function handleLike(postId: string, currentlyLiked: boolean) {
    if (isDemo) {
      setPosts(prev => prev.map(p => p.id === postId
        ? { ...p, user_liked: !currentlyLiked, likes_count: p.likes_count + (currentlyLiked ? -1 : 1) }
        : p
      ))
      return
    }
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

  async function handleNewPost(imageUrl: string, caption: string, tags: string[]) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Try with tags + user_email; fall back without them if columns don't exist yet
    let data: Record<string, unknown> | null = null
    let error: unknown = null
    const full = await supabase
      .from('social_posts')
      .insert({ user_id: user.id, image_url: imageUrl || null, caption, tags, user_email: user.email })
      .select().single()
    if (full.error) {
      // Fallback: insert without extra columns (migration not yet applied)
      const basic = await supabase
        .from('social_posts')
        .insert({ user_id: user.id, image_url: imageUrl || null, caption })
        .select().single()
      data = basic.data as Record<string, unknown> | null
      error = basic.error
    } else {
      data = full.data as Record<string, unknown> | null
      error = full.error
    }

    if (!error && data) {
      const newPost: Post = {
        id: data.id,
        user_id: user.id,
        image_url: imageUrl || null,
        caption,
        tags,
        created_at: data.created_at,
        likes_count: 0,
        user_liked: false,
        author_email: user.email ?? null,
      }
      setPosts(prev => [newPost, ...prev])
      setIsDemo(false)
    }
    setDrawerOpen(false)
  }

  const displayed = filter === 'Allt'
    ? posts
    : posts.filter(p => p.tags.includes(filter))

  return (
    <div style={{ background: '#F5F3EE', minHeight: '100vh' }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-3 flex items-center justify-between">
        <h1 style={{ fontSize: '26px', fontWeight: 500, color: '#1A1A1A', fontFamily: 'Georgia, serif' }}>
          Community
        </h1>
        <button
          onClick={() => setDrawerOpen(true)}
          className="pressable flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: '#1C3A2A', color: '#fff' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Dela
        </button>
      </div>

      {/* Filter pills */}
      <div className="px-4 mb-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="pressable"
            style={{
              padding: '6px 15px', borderRadius: '100px', fontSize: '13px', fontWeight: 500,
              whiteSpace: 'nowrap', flexShrink: 0,
              background: filter === f ? '#1C3A2A' : 'transparent',
              color: filter === f ? '#fff' : '#1A1A1A',
              border: `1.5px solid ${filter === f ? '#1C3A2A' : 'rgba(0,0,0,0.18)'}`,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Demo notice */}
      {isDemo && !loading && (
        <div className="mx-4 mb-4 px-4 py-2.5 rounded-xl flex items-center gap-2"
          style={{ background: '#f0f9ff', border: '1px solid rgba(3,105,161,0.18)' }}>
          <span style={{ fontSize: '14px' }}>✨</span>
          <p style={{ fontSize: '12px', color: '#0369a1' }}>
            Exempelinlägg — bli den första att dela på riktigt!
          </p>
        </div>
      )}

      {/* Feed */}
      <div className="px-4 pb-28">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#1C3A2A' }} />
            <p style={{ fontSize: '13px', color: '#6B6B6B' }}>Laddar inlägg…</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div style={{ fontSize: '48px', opacity: 0.3 }}>🍽</div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A', fontFamily: 'Georgia, serif' }}>
              Inga inlägg här än
            </p>
            <p style={{ fontSize: '13px', color: '#6B6B6B', textAlign: 'center' }}>
              Var den första att dela!
            </p>
            <button
              onClick={() => setDrawerOpen(true)}
              className="pressable mt-2 px-6 py-3 rounded-xl text-sm font-semibold"
              style={{ background: '#1C3A2A', color: '#fff' }}
            >
              Dela ett inlägg
            </button>
          </div>
        ) : (
          <>
            {/* Featured — first post full-width */}
            {displayed[0] && (
              <div className="mb-3">
                <PostCard post={displayed[0]} onLike={handleLike} featured />
              </div>
            )}

            {/* Staggered 2-col grid */}
            <div className="stagger" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {displayed.slice(1).map(post => (
                <PostCard key={post.id} post={post} onLike={handleLike} />
              ))}
            </div>
          </>
        )}
      </div>

      <NewPostDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleNewPost}
      />
    </div>
  )
}
