'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Ingredient, FridgeItem } from '@/lib/types'
import type { FFmpeg } from '@ffmpeg/ffmpeg'

type Video = {
  id: string
  user_id: string
  author_username: string
  video_url: string
  thumbnail_url: string | null
  caption: string
  recipe_id: string | null
  created_at: string
  likes_count: number
  user_liked: boolean
}

// Extract first frame from a video file as a JPEG blob
async function extractFrame(file: File): Promise<Blob | null> {
  return new Promise(resolve => {
    const vid = document.createElement('video')
    vid.muted = true
    vid.playsInline = true
    const url = URL.createObjectURL(file)
    vid.src = url
    const cleanup = () => URL.revokeObjectURL(url)

    vid.addEventListener('loadeddata', () => { vid.currentTime = 0.5 }, { once: true })
    vid.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = vid.videoWidth || 480
        canvas.height = vid.videoHeight || 854
        canvas.getContext('2d')?.drawImage(vid, 0, 0, canvas.width, canvas.height)
        cleanup()
        canvas.toBlob(b => resolve(b), 'image/jpeg', 0.75)
      } catch { cleanup(); resolve(null) }
    }, { once: true })
    vid.addEventListener('error', () => { cleanup(); resolve(null) }, { once: true })
    vid.load()
  })
}

// ─── IngredientSheet ──────────────────────────────────────────────────────────

function IngredientSheet({ recipeId, userId, onClose }: {
  recipeId: string
  userId: string | null
  onClose: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [fridgeNorm, setFridgeNorm] = useState<string[]>([])
  const [adding, setAdding] = useState<Set<string>>(new Set())
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [recipeTitle, setRecipeTitle] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: recipe } = await supabase
        .from('recipes')
        .select('title, ingredients')
        .eq('id', recipeId)
        .single()
      if (recipe) {
        setRecipeTitle(recipe.title)
        setIngredients(recipe.ingredients ?? [])
      }
      if (userId) {
        const { data: fridge } = await supabase
          .from('fridge_items')
          .select('name')
          .eq('user_id', userId)
        setFridgeNorm((fridge ?? []).map((i: { name: string }) => i.name.toLowerCase().trim()))
      }
      setLoading(false)
    }
    load()
  }, [recipeId, userId])

  function inFridge(name: string) {
    const n = name.toLowerCase().trim()
    return fridgeNorm.some(f => f.includes(n) || n.includes(f))
  }

  const missing = ingredients.filter(i => !inFridge(i.name))

  async function addToList(items: Ingredient[]) {
    if (!userId || items.length === 0) return
    const names = items.map(i => i.name)
    setAdding(new Set(names))
    const supabase = createClient()
    const rows = items.map(i => ({
      user_id: userId,
      name: i.name,
      quantity: parseFloat(i.amount) || 1,
      unit: i.unit || 'st',
      recipe_id: recipeId,
    }))
    await supabase.from('shopping_list').insert(rows)
    setAdded(prev => new Set([...prev, ...names]))
    setAdding(new Set())
  }

  const allAdded = missing.length > 0 && missing.every(i => added.has(i.name))

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: '#FAFAF8', borderRadius: '20px 20px 0 0', maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px', flexShrink: 0 }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(0,0,0,0.12)' }} />
        </div>
        <div style={{ padding: '4px 20px 10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '19px', fontWeight: 500, color: '#1A1A1A', marginBottom: '2px' }}>Ingredienser</h2>
              {recipeTitle ? <p style={{ fontSize: '12px', color: '#9B9B9B' }}>{recipeTitle}</p> : null}
            </div>
            <button onClick={onClose} style={{ color: '#6B6B6B', fontSize: '20px', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: '4px', marginTop: '2px' }}>✕</button>
          </div>
        </div>

        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
            <div style={{ width: '26px', height: '26px', border: '2px solid rgba(0,0,0,0.1)', borderTopColor: '#1C3A2A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
              {ingredients.map(ing => {
                const have = inFridge(ing.name)
                const isAdded = added.has(ing.name)
                const isAdding = adding.has(ing.name)
                return (
                  <div key={ing.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {have ? (
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      ) : (
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(0,0,0,0.05)', flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: '14px', color: have ? '#15803d' : '#1A1A1A', fontWeight: have ? 500 : 400 }}>{ing.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '13px', color: '#9B9B9B' }}>{ing.amount} {ing.unit}</span>
                      {!have && userId && (
                        <button
                          onClick={() => addToList([ing])}
                          disabled={isAdded || isAdding}
                          style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            background: isAdded ? '#d1fae5' : '#1C3A2A',
                            border: 'none', cursor: isAdded ? 'default' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}
                        >
                          {isAdded ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
              {ingredients.length === 0 && (
                <p style={{ textAlign: 'center', color: '#9B9B9B', fontSize: '14px', padding: '24px 0' }}>Inga ingredienser hittades</p>
              )}
            </div>

            {userId && missing.length > 0 && (
              <div style={{ padding: '14px 20px 34px', flexShrink: 0, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                <button
                  onClick={() => addToList(missing.filter(i => !added.has(i.name)))}
                  disabled={allAdded}
                  style={{
                    width: '100%', padding: '13px', borderRadius: '12px',
                    background: allAdded ? '#d1fae5' : '#1C3A2A',
                    color: allAdded ? '#15803d' : '#fff',
                    fontSize: '14px', fontWeight: 700,
                    border: 'none', cursor: allAdded ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                >
                  {allAdded ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Lagt till i inköpslistan!
                    </>
                  ) : `Lägg till alla saknade (${missing.filter(i => !added.has(i.name)).length})`}
                </button>
              </div>
            )}
            {!userId && ingredients.length > 0 && (
              <div style={{ padding: '14px 20px 34px', flexShrink: 0, borderTop: '1px solid rgba(0,0,0,0.07)', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: '#9B9B9B' }}>Logga in för att lägga till i inköpslistan</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── VideoCard ────────────────────────────────────────────────────────────────

function VideoCard({
  video, isLoggedIn, userId, onLikeToggle,
}: {
  video: Video
  isLoggedIn: boolean
  userId: string | null
  onLikeToggle: (id: string, liked: boolean, count: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)
  const [liking, setLiking] = useState(false)
  const [showIngredients, setShowIngredients] = useState(false)

  // Auto-play when ≥60% visible, pause otherwise
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoRef.current?.play().catch(() => {})
        } else {
          videoRef.current?.pause()
        }
      },
      { threshold: 0.6 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  async function toggleLike() {
    if (!isLoggedIn || liking) return
    setLiking(true)
    // Optimistic update
    const optimisticLiked = !video.user_liked
    const optimisticCount = video.likes_count + (optimisticLiked ? 1 : -1)
    onLikeToggle(video.id, optimisticLiked, optimisticCount)
    try {
      const res = await fetch(`/api/videos/${video.id}/like`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) onLikeToggle(video.id, data.liked, data.count)
      else onLikeToggle(video.id, video.user_liked, video.likes_count)
    } catch {
      onLikeToggle(video.id, video.user_liked, video.likes_count)
    }
    setLiking(false)
  }

  return (
    <div
      ref={containerRef}
      style={{
        height: '100dvh',
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        position: 'relative',
        background: '#111',
        flexShrink: 0,
      }}
    >
      {/* Video — tap to toggle mute */}
      <video
        ref={videoRef}
        src={video.video_url}
        poster={video.thumbnail_url ?? undefined}
        muted={muted}
        loop
        playsInline
        onClick={() => setMuted(m => !m)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', display: 'block' }}
      />

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 25%, transparent 55%, rgba(0,0,0,0.75) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Right-side actions */}
      <div style={{
        position: 'absolute', right: '12px', bottom: '112px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px',
      }}>
        {/* Cart button — only when video is linked to a recipe */}
        {video.recipe_id && (
          <button
            onClick={() => setShowIngredients(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <div style={{
              width: '46px', height: '46px', borderRadius: '50%',
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            </div>
          </button>
        )}

        {/* Like button */}
        <button
          onClick={toggleLike}
          style={{ background: 'none', border: 'none', cursor: isLoggedIn ? 'pointer' : 'default', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}
        >
          <div style={{
            width: '46px', height: '46px', borderRadius: '50%',
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: liking ? 'scale(1.2)' : 'scale(1)',
            transition: 'transform 0.15s',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24"
              fill={video.user_liked ? '#ff4757' : 'none'}
              stroke={video.user_liked ? '#ff4757' : '#fff'}
              strokeWidth="1.8">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
            {video.likes_count}
          </span>
        </button>

        {/* Mute toggle */}
        <button
          onClick={() => setMuted(m => !m)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <div style={{
            width: '46px', height: '46px', borderRadius: '50%',
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {muted ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            )}
          </div>
        </button>
      </div>

      {/* Bottom info (above nav bar) */}
      <div style={{
        position: 'absolute', bottom: '108px', left: '14px', right: '72px',
        pointerEvents: 'none',
      }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '4px', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
          @{video.author_username}
        </p>
        {video.caption ? (
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', lineHeight: 1.45, textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
            {video.caption}
          </p>
        ) : null}
      </div>

      {/* Tap-to-unmute hint on first render */}
      {muted && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
          opacity: 0,
          animation: 'fadeIn 0.3s ease forwards, fadeOut 1.5s ease 1s forwards',
        }}>
          <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
          </div>
          <span style={{ fontSize: '12px', color: '#fff', fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
            Tryck för ljud
          </span>
        </div>
      )}

      {/* Ingredient sheet */}
      {showIngredients && video.recipe_id && (
        <IngredientSheet
          recipeId={video.recipe_id}
          userId={userId}
          onClose={() => setShowIngredients(false)}
        />
      )}
    </div>
  )
}

// ─── VideoTrimmer ─────────────────────────────────────────────────────────────

const FFMPEG_CORE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'

async function loadFFmpeg(): Promise<FFmpeg> {
  const { FFmpeg: FFmpegClass } = await import('@ffmpeg/ffmpeg')
  const { toBlobURL } = await import('@ffmpeg/util')
  const ffmpeg = new FFmpegClass()
  await ffmpeg.load({
    coreURL:   await toBlobURL(`${FFMPEG_CORE_URL}/ffmpeg-core.js`,   'text/javascript'),
    wasmURL:   await toBlobURL(`${FFMPEG_CORE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
  })
  return ffmpeg
}

function VideoTrimmer({ file, onDone, onCancel }: {
  file: File
  onDone: (processed: File) => void
  onCancel: () => void
}) {
  const previewRef = useRef<HTMLVideoElement>(null)
  const [duration, setDuration] = useState(0)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)
  const [overlayText, setOverlayText] = useState('')
  const [processing, setProcessing] = useState(false)
  const [loadProgress, setLoadProgress] = useState('')
  const objectUrl = useRef<string>(URL.createObjectURL(file))

  // Keep preview in sync with trim range
  useEffect(() => {
    const vid = previewRef.current
    if (!vid) return
    vid.src = objectUrl.current
    const onMeta = () => {
      setDuration(vid.duration)
      setTrimEnd(vid.duration)
      vid.currentTime = trimStart
    }
    vid.addEventListener('loadedmetadata', onMeta, { once: true })
    return () => { vid.removeEventListener('loadedmetadata', onMeta) }
  }, [])

  useEffect(() => {
    if (previewRef.current) previewRef.current.currentTime = trimStart
  }, [trimStart])

  useEffect(() => {
    return () => URL.revokeObjectURL(objectUrl.current)
  }, [])

  function fmt(s: number) {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  async function handleProcess() {
    setProcessing(true)
    try {
      setLoadProgress('Laddar ffmpeg…')
      const ffmpeg = await loadFFmpeg()

      const { fetchFile } = await import('@ffmpeg/util')
      const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4'
      const inputName  = `input.${ext}`
      const outputName = `output.mp4`

      setLoadProgress('Läser video…')
      await ffmpeg.writeFile(inputName, await fetchFile(file))

      const args = [
        '-i', inputName,
        '-ss', String(trimStart),
        '-to', String(trimEnd),
      ]

      if (overlayText.trim()) {
        const safeText = overlayText.trim().replace(/'/g, "\\'").replace(/:/g, '\\:')
        args.push(
          '-vf',
          `drawtext=text='${safeText}':fontsize=40:fontcolor=white:borderw=2:bordercolor=black:x=(w-text_w)/2:y=h-th-80`,
        )
      } else {
        args.push('-c', 'copy')
      }

      args.push(outputName)

      setLoadProgress('Bearbetar video…')
      await ffmpeg.exec(args)

      const data = await ffmpeg.readFile(outputName)
      // Copy into a plain ArrayBuffer so Blob accepts it (ffmpeg returns ArrayBufferLike)
      const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: 'video/mp4' })
      const processedFile = new File([blob], outputName, { type: 'video/mp4' })
      onDone(processedFile)
    } catch (err) {
      setLoadProgress(`Fel: ${err instanceof Error ? err.message : 'Okänt fel'}`)
      setProcessing(false)
    }
  }

  const trimDuration = Math.max(0, trimEnd - trimStart)

  return (
    <div style={{ padding: '0 0 8px' }}>
      {/* Preview */}
      <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#000', aspectRatio: '9/16', maxHeight: '36vh', marginBottom: '16px' }}>
        <video
          ref={previewRef}
          muted playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {overlayText.trim() && (
          <div style={{
            position: 'absolute', bottom: '80px', left: 0, right: 0,
            textAlign: 'center', pointerEvents: 'none',
            fontSize: '18px', fontWeight: 700, color: '#fff',
            textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            padding: '0 16px',
          }}>
            {overlayText}
          </div>
        )}
      </div>

      {/* Trim sliders */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Klipp</span>
          <span style={{ fontSize: '12px', color: '#9B9B9B' }}>{fmt(trimStart)} – {fmt(trimEnd)} ({fmt(trimDuration)})</span>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '11px', color: '#9B9B9B', display: 'block', marginBottom: '3px' }}>Start: {fmt(trimStart)}</label>
          <input
            type="range" min={0} max={duration} step={0.1}
            value={trimStart}
            onChange={e => {
              const v = parseFloat(e.target.value)
              setTrimStart(Math.min(v, trimEnd - 0.5))
            }}
            style={{ width: '100%', accentColor: '#1C3A2A' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '11px', color: '#9B9B9B', display: 'block', marginBottom: '3px' }}>Slut: {fmt(trimEnd)}</label>
          <input
            type="range" min={0} max={duration} step={0.1}
            value={trimEnd}
            onChange={e => {
              const v = parseFloat(e.target.value)
              setTrimEnd(Math.max(v, trimStart + 0.5))
            }}
            style={{ width: '100%', accentColor: '#1C3A2A' }}
          />
        </div>
      </div>

      {/* Text overlay */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
          Textöverlägg (valfritt)
        </label>
        <input
          type="text"
          value={overlayText}
          onChange={e => setOverlayText(e.target.value)}
          placeholder="Skriv text som bränns in i videon…"
          maxLength={80}
          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff', fontSize: '14px', color: '#1A1A1A', boxSizing: 'border-box', fontFamily: 'inherit' }}
        />
      </div>

      {loadProgress && (
        <p style={{ fontSize: '13px', color: loadProgress.startsWith('Fel') ? '#dc2626' : '#6B6B6B', marginBottom: '12px' }}>
          {loadProgress}
        </p>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={onCancel}
          disabled={processing}
          style={{ flex: 1, padding: '13px', borderRadius: '12px', background: '#F0EDE8', color: '#1A1A1A', fontSize: '14px', fontWeight: 600, border: 'none', cursor: processing ? 'not-allowed' : 'pointer' }}
        >
          Avbryt
        </button>
        <button
          onClick={handleProcess}
          disabled={processing}
          style={{
            flex: 2, padding: '13px', borderRadius: '12px',
            background: processing ? '#C5C5BE' : '#1C3A2A',
            color: '#fff', fontSize: '14px', fontWeight: 700,
            border: 'none', cursor: processing ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          {processing ? (
            <>
              <div style={{ width: '15px', height: '15px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
              {loadProgress || 'Bearbetar…'}
            </>
          ) : 'Bearbeta video'}
        </button>
      </div>
    </div>
  )
}

// ─── UploadDrawer ─────────────────────────────────────────────────────────────

function UploadDrawer({ open, onClose, onUploaded }: {
  open: boolean
  onClose: () => void
  onUploaded: (video: Video) => void
}) {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [rawFile, setRawFile] = useState<File | null>(null)  // before trimmer
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const [userRecipes, setUserRecipes] = useState<Array<{ id: string; title: string }>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      setVideoFile(null)
      setRawFile(null)
      setCaption('')
      setProgress('')
      setSelectedRecipeId(null)
      if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
      if (fileInputRef.current) fileInputRef.current.value = ''
    } else {
      // Fetch user's own recipes for linking
      async function loadRecipes() {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('recipes')
          .select('id, title')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false })
          .limit(20)
        if (data) setUserRecipes(data)
      }
      loadRecipes()
    }
  }, [open])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 50 * 1024 * 1024) { setProgress('Filen är för stor (max 50 MB)'); return }
    setProgress('')
    setVideoFile(null)
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
    setRawFile(file)  // show trimmer first
  }

  function handleTrimDone(processed: File) {
    setRawFile(null)
    setVideoFile(processed)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(processed))
  }

  function handleTrimCancel() {
    setRawFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleUpload() {
    if (!videoFile || uploading) return
    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Ej inloggad')

      // Extract thumbnail
      setProgress('Förbereder miniatyrbild…')
      const thumbBlob = await extractFrame(videoFile)

      // Upload video to storage
      setProgress('Laddar upp video…')
      const ts = Date.now()
      const ext = videoFile.name.split('.').pop()?.toLowerCase() || 'mp4'
      const videoPath = `inspiration/${user.id}/${ts}.${ext}`
      const { error: vidErr } = await supabase.storage
        .from('videos')
        .upload(videoPath, videoFile, { upsert: true, contentType: videoFile.type })
      if (vidErr) throw vidErr
      const videoUrl = supabase.storage.from('videos').getPublicUrl(videoPath).data.publicUrl

      // Upload thumbnail if we got one
      let thumbnailUrl: string | null = null
      if (thumbBlob) {
        setProgress('Laddar upp miniatyrbild…')
        const thumbPath = `inspiration/${user.id}/${ts}_thumb.jpg`
        const { error: thumbErr } = await supabase.storage
          .from('images')
          .upload(thumbPath, thumbBlob, { upsert: true, contentType: 'image/jpeg' })
        if (!thumbErr) {
          thumbnailUrl = supabase.storage.from('images').getPublicUrl(thumbPath).data.publicUrl
        }
      }

      // Save record
      setProgress('Sparar…')
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl, thumbnailUrl, caption: caption.trim(), recipeId: selectedRecipeId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      onUploaded(data.video)
      onClose()
    } catch (err) {
      setProgress(`Fel: ${err instanceof Error ? err.message : 'Okänt fel'}`)
    }
    setUploading(false)
  }

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={!uploading ? onClose : undefined} />
      <div style={{ position: 'relative', background: '#FAFAF8', borderRadius: '20px 20px 0 0', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(0,0,0,0.12)' }} />
        </div>

        <div style={{ padding: '8px 20px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 500, color: '#1A1A1A' }}>
              Dela video
            </h2>
            {!uploading && (
              <button onClick={onClose} style={{ color: '#6B6B6B', fontSize: '20px', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>✕</button>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,video/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {/* Step 1: no file yet */}
          {!rawFile && !videoFile && (
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: '10px',
                border: '2px dashed rgba(0,0,0,0.15)', borderRadius: '14px',
                padding: '40px 16px', background: '#F0EDE8', cursor: 'pointer', marginBottom: '16px',
              }}
            >
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#1C3A2A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2"/>
                </svg>
              </div>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A' }}>Välj eller spela in video</span>
              <span style={{ fontSize: '12px', color: '#9B9B9B' }}>MP4, MOV, WebM · max 50 MB</span>
            </button>
          )}

          {/* Step 2: trimmer */}
          {rawFile && !videoFile && (
            <VideoTrimmer
              file={rawFile}
              onDone={handleTrimDone}
              onCancel={handleTrimCancel}
            />
          )}

          {/* Step 3: preview after processing */}
          {videoFile && (
            <div style={{ position: 'relative', marginBottom: '16px', borderRadius: '14px', overflow: 'hidden', background: '#000', aspectRatio: '9/16', maxHeight: '40vh' }}>
              <video
                src={previewUrl ?? undefined}
                muted loop playsInline autoPlay
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {!uploading && (
                <>
                  <button
                    onClick={() => { setVideoFile(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >✕</button>
                  <button
                    onClick={() => { setVideoFile(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setRawFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    style={{ position: 'absolute', bottom: '8px', right: '8px', padding: '5px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >Byt video</button>
                </>
              )}
            </div>
          )}

          {/* Caption + recipe + submit — only shown after trimmer step */}
          {videoFile && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
                  Bildtext
                </label>
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Beskriv din video…"
                  rows={3}
                  maxLength={300}
                  disabled={uploading}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff', fontSize: '14px', color: '#1A1A1A', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              {userRecipes.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>
                    Länka till recept (valfritt)
                  </label>
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    <button
                      onClick={() => setSelectedRecipeId(null)}
                      style={{
                        flexShrink: 0, padding: '6px 14px', borderRadius: '100px',
                        border: `1.5px solid ${selectedRecipeId === null ? '#1C3A2A' : 'rgba(0,0,0,0.12)'}`,
                        background: selectedRecipeId === null ? '#1C3A2A' : '#fff',
                        color: selectedRecipeId === null ? '#fff' : '#6B6B6B',
                        fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                      }}
                    >Ingen</button>
                    {userRecipes.map(r => (
                      <button
                        key={r.id}
                        onClick={() => setSelectedRecipeId(r.id)}
                        style={{
                          flexShrink: 0, padding: '6px 14px', borderRadius: '100px',
                          border: `1.5px solid ${selectedRecipeId === r.id ? '#1C3A2A' : 'rgba(0,0,0,0.12)'}`,
                          background: selectedRecipeId === r.id ? '#1C3A2A' : '#fff',
                          color: selectedRecipeId === r.id ? '#fff' : '#1A1A1A',
                          fontSize: '13px', fontWeight: selectedRecipeId === r.id ? 600 : 400,
                          cursor: 'pointer', whiteSpace: 'nowrap',
                        }}
                      >{r.title}</button>
                    ))}
                  </div>
                </div>
              )}

              {progress && (
                <p style={{ fontSize: '13px', color: progress.startsWith('Fel') ? '#dc2626' : '#6B6B6B', marginBottom: '12px' }}>
                  {progress}
                </p>
              )}

              <button
                onClick={handleUpload}
                disabled={uploading}
                style={{
                  width: '100%', padding: '14px', borderRadius: '12px',
                  background: uploading ? '#C5C5BE' : '#1C3A2A',
                  color: '#fff', fontSize: '15px', fontWeight: 700,
                  border: 'none', cursor: uploading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'background 0.15s',
                }}
              >
                {uploading ? (
                  <>
                    <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                    {progress || 'Laddar upp…'}
                  </>
                ) : 'Publicera'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InspirationPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [setupRequired, setSetupRequired] = useState(false)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
      setUserId(user?.id ?? null)
      const res = await fetch('/api/videos')
      const json = await res.json()
      if (json.setupRequired) setSetupRequired(true)
      else setVideos(json.videos ?? [])
      setLoading(false)
    }
    init()
  }, [])

  function handleLikeToggle(id: string, liked: boolean, count: number) {
    setVideos(vs => vs.map(v => v.id === id ? { ...v, user_liked: liked, likes_count: count } : v))
  }

  function handleUploaded(video: Video) {
    setVideos(vs => [video, ...vs])
  }

  return (
    <div style={{ background: '#000', minHeight: '100dvh', position: 'relative' }}>

      {/* Fixed header overlaying the feed */}
      <div style={{
        position: 'fixed', top: 0,
        left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '448px',
        zIndex: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '52px 16px 14px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)',
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', pointerEvents: 'auto' }}>
          <Link href="/fridge" style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)',
            border: '1.5px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            textDecoration: 'none', flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </Link>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 500, color: '#fff' }}>
            Inspiration
          </h1>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          style={{
            pointerEvents: 'auto',
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)',
            border: '1.5px solid rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      {/* Feed states */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
          <div style={{ width: '32px', height: '32px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>

      ) : setupRequired ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', padding: '24px', textAlign: 'center', gap: '14px' }}>
          <span style={{ fontSize: '52px' }}>🎬</span>
          <p style={{ color: '#fff', fontSize: '18px', fontWeight: 700, fontFamily: 'Georgia, serif' }}>Konfiguration krävs</p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: 1.6 }}>
            Kör <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>supabase/migrations/005_videos.sql</code> i Supabase-dashboardens SQL-editor.
          </p>
        </div>

      ) : videos.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', padding: '24px', textAlign: 'center', gap: '14px' }}>
          <span style={{ fontSize: '52px' }}>🎬</span>
          <p style={{ color: '#fff', fontSize: '18px', fontWeight: 700, fontFamily: 'Georgia, serif' }}>Inga videos än</p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Var den första att dela matinspiration!</p>
          <button
            onClick={() => setUploadOpen(true)}
            style={{ marginTop: '8px', padding: '13px 28px', borderRadius: '100px', background: '#fff', color: '#1A1A1A', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
          >
            Ladda upp video
          </button>
        </div>

      ) : (
        <div
          className="no-scrollbar"
          style={{
            height: '100dvh',
            overflowY: 'scroll',
            scrollSnapType: 'y mandatory',
            WebkitOverflowScrolling: 'touch',
          } as React.CSSProperties}
        >
          {videos.map(v => (
            <VideoCard
              key={v.id}
              video={v}
              isLoggedIn={isLoggedIn}
              userId={userId}
              onLikeToggle={handleLikeToggle}
            />
          ))}
        </div>
      )}

      <UploadDrawer
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={handleUploaded}
      />
    </div>
  )
}
