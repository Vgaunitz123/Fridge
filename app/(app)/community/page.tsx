'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { sv } from 'date-fns/locale'
import Link from 'next/link'

type SearchUser    = { id: string; username: string; avatar_url: string | null }
type SearchRecipe  = { id: string; title: string; image_url: string | null }
type SearchVideo   = { id: string; caption: string; thumbnail_url: string | null; author_username: string }
type SearchResults = { users: SearchUser[]; recipes: SearchRecipe[]; videos: SearchVideo[] }

function isVideoUrl(url: string | null): boolean {
  if (!url) return false
  return url.includes('tiktok.com') || url.includes('/videos/') || /\.(mp4|mov|webm)(\?|$)/i.test(url)
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Post = {
  id: string
  user_id: string
  image_url: string | null
  thumbnail_url: string | null
  caption: string
  tags: string[]
  created_at: string
  likes_count: number
  user_liked: boolean
  author_email: string | null
}

// ─── Demo posts shown when DB is empty ───────────────────────────────────────

const DEMO: Post[] = [
  { id: 'd1', user_id: '', image_url: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&h=400&fit=crop', thumbnail_url: null,
    caption: 'Hemgjord svamprisotto på fredagskvällen 🍄 Tog nästan en timme men var helt värt det.', tags: ['Vegetarisk'],
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(), likes_count: 38, user_liked: false, author_email: 'anna@example.com' },
  { id: 'd2', user_id: '', image_url: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=600&h=400&fit=crop', thumbnail_url: null,
    caption: 'Pasta alla norma med aubergine och ricotta. Enkelt och gott!', tags: ['Snabbt'],
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(), likes_count: 21, user_liked: false, author_email: 'erik@example.com' },
  { id: 'd3', user_id: '', image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop', thumbnail_url: null,
    caption: 'Sommarens bästa sallad — halloumi, vattenmelon och mynta. Topp!', tags: ['Vegetarisk', 'Sommar'],
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(), likes_count: 64, user_liked: false, author_email: 'sara@example.com' },
  { id: 'd4', user_id: '', image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&h=400&fit=crop', thumbnail_url: null,
    caption: 'Lax med dillkräm och färskpotatis. Klart på 25 minuter.', tags: ['Snabbt', 'Glutenfritt'],
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(), likes_count: 17, user_liked: false, author_email: 'johan@example.com' },
  { id: 'd5', user_id: '', image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&h=400&fit=crop', thumbnail_url: null,
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
  // For videos: prefer thumbnail_url; for images: use image_url directly
  const displayImg = isVideo ? (post.thumbnail_url ?? null) : post.image_url

  const mediaEl = (
    <div className="relative overflow-hidden" style={{ aspectRatio: featured ? '16/9' : '3/2' }}>
      {displayImg && !imgErr ? (
        <img
          src={displayImg}
          alt={post.caption}
          onError={() => setImgErr(true)}
          className="w-full h-full object-cover"
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
          {post.user_id ? (
            <Link href={`/profile/${post.user_id}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', minWidth: 0 }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: '#1C3A2A', color: '#fff', fontSize: '10px' }}>
                {avatar(post.author_email)}
              </div>
              <span style={{ fontSize: '12px', color: '#1A1A1A', fontWeight: 600 }}>
                {post.author_email?.split('@')[0] ?? 'Anonym'}
              </span>
            </Link>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: '#1C3A2A', color: '#fff', fontSize: '10px' }}>
                {avatar(post.author_email)}
              </div>
              <span style={{ fontSize: '12px', color: '#6B6B6B', fontWeight: 500 }}>
                {post.author_email?.split('@')[0] ?? 'Anonym'}
              </span>
            </div>
          )}
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

// Extracts a JPEG frame blob from a video File client-side
async function extractFrame(file: File): Promise<Blob | null> {
  return new Promise(resolve => {
    const video = document.createElement('video')
    const objUrl = URL.createObjectURL(file)
    video.src = objUrl
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'

    const doCapture = () => {
      const w = Math.min(video.videoWidth || 640, 640)
      const h = video.videoHeight ? Math.round(w * video.videoHeight / video.videoWidth) : 360
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { URL.revokeObjectURL(objUrl); resolve(null); return }
      ctx.drawImage(video, 0, 0, w, h)
      canvas.toBlob(blob => { URL.revokeObjectURL(objUrl); resolve(blob) }, 'image/jpeg', 0.85)
    }

    video.addEventListener('loadeddata', () => {
      video.currentTime = Math.min(0.5, (video.duration || 1) * 0.1)
    }, { once: true })
    video.addEventListener('seeked', doCapture, { once: true })
    video.addEventListener('error', () => { URL.revokeObjectURL(objUrl); resolve(null) }, { once: true })
    video.load()
  })
}

function NewPostDrawer({
  open, onClose, onSubmit,
}: {
  open: boolean; onClose: () => void
  onSubmit: (mediaUrl: string, thumbnailUrl: string | null, caption: string, tags: string[]) => Promise<void>
}) {
  const [tab, setTab] = useState<DrawerTab>('image')
  const [imageUrl, setImageUrl] = useState('')
  const [tiktokUrl, setTiktokUrl] = useState('')
  const [tiktokThumbUrl, setTiktokThumbUrl] = useState<string | null>(null)
  const [fetchingTiktokThumb, setFetchingTiktokThumb] = useState(false)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbBlob, setThumbBlob] = useState<Blob | null>(null)
  const [thumbPreview, setThumbPreview] = useState<string | null>(null)
  const [extractingThumb, setExtractingThumb] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const [caption, setCaption] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const thumbPreviewRef = useRef<string | null>(null)
  const tiktokThumbTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const imageFileInputRef = useRef<HTMLInputElement>(null)

  // Auto-extract frame when video file changes
  useEffect(() => {
    if (!videoFile) { setThumbBlob(null); setThumbPreview(null); return }
    setExtractingThumb(true)
    extractFrame(videoFile).then(blob => {
      setExtractingThumb(false)
      if (!blob) return
      setThumbBlob(blob)
      if (thumbPreviewRef.current) URL.revokeObjectURL(thumbPreviewRef.current)
      const prev = URL.createObjectURL(blob)
      thumbPreviewRef.current = prev
      setThumbPreview(prev)
    })
  }, [videoFile])

  // Fetch TikTok oEmbed thumbnail when URL is pasted
  useEffect(() => {
    if (tiktokThumbTimerRef.current) clearTimeout(tiktokThumbTimerRef.current)
    if (!tiktokUrl.includes('tiktok.com')) { setTiktokThumbUrl(null); return }
    setFetchingTiktokThumb(true)
    tiktokThumbTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/community/tiktok-thumb?url=${encodeURIComponent(tiktokUrl)}`)
        const { thumbnailUrl } = await res.json()
        setTiktokThumbUrl(thumbnailUrl ?? null)
      } catch { setTiktokThumbUrl(null) }
      setFetchingTiktokThumb(false)
    }, 600)
  }, [tiktokUrl])

  // Cleanup preview URL
  useEffect(() => () => { if (thumbPreviewRef.current) URL.revokeObjectURL(thumbPreviewRef.current) }, [])

  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 300)
    else {
      setImageUrl(''); setTiktokUrl(''); setTiktokThumbUrl(null)
      setVideoFile(null); setThumbBlob(null); setUploadProgress('')
      setCaption(''); setSelectedTags([])
      if (thumbPreviewRef.current) { URL.revokeObjectURL(thumbPreviewRef.current); thumbPreviewRef.current = null }
      setThumbPreview(null)
      if (imageFileInputRef.current) imageFileInputRef.current.value = ''
    }
  }, [open])

  function handleCustomThumb(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setThumbBlob(file)
    if (thumbPreviewRef.current) URL.revokeObjectURL(thumbPreviewRef.current)
    const prev = URL.createObjectURL(file)
    thumbPreviewRef.current = prev
    setThumbPreview(prev)
  }

  async function handleImageFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageUploading(true)
    try {
      const supabase = createClient()
      const ext = file.type === 'image/png' ? 'png' : 'jpg'
      const { data: { user } } = await supabase.auth.getUser()
      const path = `community/${user?.id ?? 'anon'}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('images').upload(path, file, { upsert: true, contentType: file.type })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path)
      setImageUrl(publicUrl)
    } catch (err) {
      console.error('Image upload failed', err)
    }
    setImageUploading(false)
  }

  async function uploadVideo(file: File, thumb: Blob | null): Promise<{ videoUrl: string | null; thumbnailUrl: string | null }> {
    setUploading(true)
    setUploadProgress('Laddar upp video…')
    const fd = new FormData()
    fd.append('video', file)
    if (thumb) fd.append('thumbnail', thumb, 'thumb.jpg')
    const res = await fetch('/api/community/upload', { method: 'POST', body: fd })
    setUploading(false)
    if (!res.ok) {
      const d = await res.json()
      setUploadProgress(`Fel: ${d.error}`)
      return { videoUrl: null, thumbnailUrl: null }
    }
    const { url, thumbnailUrl } = await res.json()
    setUploadProgress('Uppladdad!')
    return { videoUrl: url, thumbnailUrl: thumbnailUrl ?? null }
  }

  async function submit() {
    if (!caption.trim()) return
    setSaving(true)

    let mediaUrl = ''
    let thumbUrl: string | null = null

    if (tab === 'image') {
      mediaUrl = imageUrl.trim()
    } else if (tab === 'video') {
      if (videoFile) {
        const { videoUrl, thumbnailUrl } = await uploadVideo(videoFile, thumbBlob)
        if (!videoUrl) { setSaving(false); return }
        mediaUrl = videoUrl
        thumbUrl = thumbnailUrl
      } else if (tiktokUrl.trim()) {
        mediaUrl = tiktokUrl.trim()
        thumbUrl = tiktokThumbUrl
      }
    }

    await onSubmit(mediaUrl, thumbUrl, caption.trim(), selectedTags)
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
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageFileUpload}
              />
              {imageUploading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', border: '2px dashed rgba(0,0,0,0.12)', borderRadius: '12px', padding: '32px', background: '#FAFAF8' }}>
                  <div style={{ width: '20px', height: '20px', border: '2px solid #1C3A2A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  <span style={{ fontSize: '14px', color: '#6B6B6B' }}>Laddar upp…</span>
                </div>
              ) : imageUrl ? (
                <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '3/2' }}>
                  <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    onClick={() => { setImageUrl(''); if (imageFileInputRef.current) imageFileInputRef.current.value = '' }}
                    style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >✕</button>
                  <button
                    onClick={() => imageFileInputRef.current?.click()}
                    style={{ position: 'absolute', bottom: '8px', right: '8px', padding: '5px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >Byt foto</button>
                </div>
              ) : (
                <button
                  onClick={() => imageFileInputRef.current?.click()}
                  style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '2px dashed rgba(0,0,0,0.15)', borderRadius: '12px', padding: '32px 16px', background: '#FAFAF8', cursor: 'pointer' }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9B9B9B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>Välj foto</span>
                  <span style={{ fontSize: '12px', color: '#9B9B9B' }}>JPG, PNG · max 10 MB</span>
                </button>
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
                {/* TikTok thumbnail preview */}
                {(fetchingTiktokThumb || tiktokThumbUrl) && (
                  <div className="mt-2">
                    {fetchingTiktokThumb ? (
                      <div style={{ height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0ee', borderRadius: '8px' }}>
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #ccc', borderTopColor: '#1C3A2A', animation: 'spin 0.8s linear infinite' }} />
                      </div>
                    ) : tiktokThumbUrl ? (
                      <div style={{ borderRadius: '8px', overflow: 'hidden', aspectRatio: '9/16', maxWidth: '120px' }}>
                        <img src={tiktokThumbUrl} alt="TikTok thumbnail" className="w-full h-full object-cover" />
                      </div>
                    ) : null}
                  </div>
                )}
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
                <label className="pressable" style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  padding: '20px', borderRadius: '12px', cursor: 'pointer',
                  border: '2px dashed rgba(0,0,0,0.15)', background: videoFile ? '#f0fdf4' : '#fafaf8',
                }}>
                  <input type="file" accept="video/mp4,video/quicktime,video/webm,video/*" className="hidden"
                    onChange={e => setVideoFile(e.target.files?.[0] ?? null)} />
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={videoFile ? '#1C3A2A' : '#aaa'} strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: videoFile ? '#1C3A2A' : '#6B6B6B' }}>
                    {videoFile ? videoFile.name : 'Välj MP4 / MOV / WebM'}
                  </span>
                  {videoFile && <span style={{ fontSize: '11px', color: '#9B9B9B' }}>{(videoFile.size / 1024 / 1024).toFixed(1)} MB</span>}
                </label>
                {uploadProgress && (
                  <p style={{ fontSize: '12px', marginTop: '6px', color: uploadProgress.startsWith('Fel') ? '#dc2626' : '#1C3A2A' }}>
                    {uploadProgress}
                  </p>
                )}
              </div>

              {/* Thumbnail section — shown when a video file is selected */}
              {videoFile && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Thumbnail
                    </label>
                    <label className="pressable" style={{ fontSize: '11px', fontWeight: 600, color: '#1C3A2A', cursor: 'pointer', padding: '3px 8px', borderRadius: '6px', border: '1.5px solid #1C3A2A' }}>
                      <input type="file" accept="image/*" className="hidden" onChange={handleCustomThumb} />
                      Byt bild
                    </label>
                  </div>

                  {extractingThumb ? (
                    <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0ee', borderRadius: '10px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #ccc', borderTopColor: '#1C3A2A', animation: 'spin 0.8s linear infinite' }} />
                    </div>
                  ) : thumbPreview ? (
                    <div style={{ borderRadius: '10px', overflow: 'hidden', aspectRatio: '16/9' }}>
                      <img src={thumbPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div style={{ height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#f0f0ee', borderRadius: '10px' }}>
                      <span style={{ fontSize: '20px' }}>🖼</span>
                      <span style={{ fontSize: '11px', color: '#9B9B9B' }}>Ingen thumbnail hittades</span>
                    </div>
                  )}
                </div>
              )}
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
  const [actionSheetOpen, setActionSheetOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    if (query.length < 2) { setSearchResults(null); setSearching(false); return }
    setSearching(true)
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const json = await res.json()
        setSearchResults(json)
      } catch { setSearchResults(null) }
      setSearching(false)
    }, 300)
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
  }, [query])

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
        id: string; user_id: string; image_url: string | null; thumbnail_url: string | null;
        caption: string; tags: string[] | null; created_at: string; user_email: string | null;
        post_likes: { user_id: string }[]
      }) => ({
        id: p.id,
        user_id: p.user_id,
        image_url: p.image_url,
        thumbnail_url: p.thumbnail_url ?? null,
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

  async function handleNewPost(imageUrl: string, thumbnailUrl: string | null, caption: string, tags: string[]) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let data: Record<string, unknown> | null = null
    let error: unknown = null
    const full = await supabase
      .from('social_posts')
      .insert({ user_id: user.id, image_url: imageUrl || null, thumbnail_url: thumbnailUrl, caption, tags, user_email: user.email })
      .select().single()
    if (full.error) {
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
        id: data.id as string,
        user_id: user.id,
        image_url: imageUrl || null,
        thumbnail_url: thumbnailUrl,
        caption,
        tags,
        created_at: data.created_at as string,
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
          onClick={() => setActionSheetOpen(true)}
          className="pressable flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: '#1C3A2A', color: '#fff' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Dela
        </button>
      </div>

      {/* Search bar */}
      <div className="px-4 mb-3">
        <div style={{ position: 'relative' }}>
          <svg
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9B9B9B" strokeWidth="2" strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7.5"/><line x1="16.5" y1="16.5" x2="21" y2="21"/>
          </svg>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Sök skapare, recept, videor…"
            style={{
              width: '100%', padding: '10px 36px 10px 36px', borderRadius: '12px',
              border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff',
              fontSize: '14px', color: '#1A1A1A', boxSizing: 'border-box', fontFamily: 'inherit',
              outline: 'none',
            }}
          />
          {query.length > 0 && (
            <button
              onClick={() => setQuery('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9B9B9B', fontSize: '16px', lineHeight: 1, padding: '2px' }}
            >✕</button>
          )}
        </div>
      </div>

      {/* Filter pills — hidden while searching */}
      {!query && (
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
      )}

      {/* ── Search results ── */}
      {query.length >= 2 && (
        <div className="px-4 pb-28">
          {searching ? (
            <div className="flex items-center justify-center py-10 gap-2">
              <div className="w-5 h-5 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#1C3A2A' }} />
              <span style={{ fontSize: '13px', color: '#6B6B6B' }}>Söker…</span>
            </div>
          ) : searchResults && (searchResults.users.length + searchResults.recipes.length + searchResults.videos.length) === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-2">
              <span style={{ fontSize: '36px', opacity: 0.3 }}>🔍</span>
              <p style={{ fontSize: '14px', color: '#6B6B6B' }}>Inga resultat för "{query}"</p>
            </div>
          ) : searchResults ? (
            <div className="flex flex-col gap-5">
              {/* Users */}
              {searchResults.users.length > 0 && (
                <section>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Skapare</p>
                  <div className="flex flex-col gap-2">
                    {searchResults.users.map(u => (
                      <Link key={u.id} href={`/profile/${u.id}`} style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fff', borderRadius: '12px', padding: '10px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#1C3A2A', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt={u.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{u.username[0]?.toUpperCase()}</span>
                            )}
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>@{u.username}</span>
                          <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C0C0C0" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Recipes */}
              {searchResults.recipes.length > 0 && (
                <section>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Recept</p>
                  <div className="flex flex-col gap-2">
                    {searchResults.recipes.map(r => (
                      <Link key={r.id} href={`/recipes/${r.id}`} style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fff', borderRadius: '12px', padding: '10px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#E8E5DE', flexShrink: 0, overflow: 'hidden' }}>
                            {r.image_url ? (
                              <img src={r.image_url} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🍽</div>
                            )}
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: 500, color: '#1A1A1A', flex: 1 }}>{r.title}</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C0C0C0" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Videos */}
              {searchResults.videos.length > 0 && (
                <section>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Videor</p>
                  <div className="flex flex-col gap-2">
                    {searchResults.videos.map(v => (
                      <Link key={v.id} href="/inspiration" style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fff', borderRadius: '12px', padding: '10px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#111', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {v.thumbnail_url ? (
                              <img src={v.thumbnail_url} alt={v.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '13px', color: '#9B9B9B', marginBottom: '1px' }}>@{v.author_username}</p>
                            <p style={{ fontSize: '14px', fontWeight: 500, color: '#1A1A1A', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{v.caption || 'Video'}</p>
                          </div>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C0C0C0" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* ── Normal feed (hidden while search is active) ── */}
      {!query && <>

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

      </>}

      <NewPostDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleNewPost}
      />

      {/* Action sheet — Dela vs Videoeditor */}
      {actionSheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} onClick={() => setActionSheetOpen(false)} />
          <div className="relative" style={{ background: '#FAFAF8', borderRadius: '20px 20px 0 0', padding: '8px 16px 40px' }}>
            <div className="flex justify-center py-3">
              <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(0,0,0,0.12)' }} />
            </div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px', paddingLeft: '4px' }}>
              Vad vill du göra?
            </p>

            {/* Option 1 — quick post */}
            <button
              onClick={() => { setActionSheetOpen(false); setDrawerOpen(true) }}
              className="pressable w-full flex items-center gap-14px text-left mb-3"
              style={{ background: '#fff', border: '1.5px solid rgba(0,0,0,0.07)', borderRadius: '14px', padding: '14px 16px', cursor: 'pointer' }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#EBF2ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: '14px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C3A2A" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A', marginBottom: '2px' }}>Dela bild eller video</p>
                <p style={{ fontSize: '12px', color: '#6B6B6B' }}>Lägg upp ett inlägg direkt</p>
              </div>
              <svg style={{ marginLeft: 'auto' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C0C0C0" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>

            {/* Option 2 — editor */}
            <Link
              href="/community/create"
              onClick={() => setActionSheetOpen(false)}
              className="pressable w-full flex items-center text-left"
              style={{ background: '#fff', border: '1.5px solid rgba(0,0,0,0.07)', borderRadius: '14px', padding: '14px 16px', cursor: 'pointer', textDecoration: 'none', display: 'flex' }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#EBF2ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: '14px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C3A2A" strokeWidth="1.8" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
              </div>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A', marginBottom: '2px' }}>Skapa med videoeditor</p>
                <p style={{ fontSize: '12px', color: '#6B6B6B' }}>Klipp, lägg ihop & lägg till musik</p>
              </div>
              <svg style={{ marginLeft: 'auto' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C0C0C0" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
