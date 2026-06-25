'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

type Clip = {
  id: string
  file: File
  duration: number
  trimStart: number
  trimEnd: number
  objectUrl: string
  thumbnail: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9) }

function fmt(s: number) {
  if (isNaN(s) || s === Infinity) return '0s'
  if (s < 60) return `${s.toFixed(1)}s`
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(0).padStart(2, '0')}`
}

async function loadClipMeta(file: File): Promise<{ duration: number; thumbnail: string | null }> {
  return new Promise(resolve => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    video.src = url
    video.muted = true
    video.preload = 'metadata'
    video.addEventListener('loadeddata', () => {
      video.currentTime = Math.min(0.5, (video.duration || 1) * 0.1)
    }, { once: true })
    video.addEventListener('seeked', () => {
      const c = document.createElement('canvas')
      c.width = 160; c.height = 90
      c.getContext('2d')?.drawImage(video, 0, 0, 160, 90)
      URL.revokeObjectURL(url)
      resolve({ duration: video.duration, thumbnail: c.toDataURL('image/jpeg', 0.75) })
    }, { once: true })
    video.addEventListener('error', () => { URL.revokeObjectURL(url); resolve({ duration: 0, thumbnail: null }) }, { once: true })
    video.load()
  })
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ClipCard({
  clip, selected, index, total,
  onSelect, onRemove, onMove,
}: {
  clip: Clip; selected: boolean; index: number; total: number
  onSelect: () => void; onRemove: () => void; onMove: (dir: -1 | 1) => void
}) {
  const trimmedDur = clip.trimEnd - clip.trimStart
  return (
    <div
      onClick={onSelect}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 14px', borderRadius: '12px', cursor: 'pointer',
        background: selected ? '#EBF2ED' : '#fff',
        border: `1.5px solid ${selected ? '#1C3A2A' : 'rgba(0,0,0,0.07)'}`,
        transition: 'all 0.15s',
        marginBottom: '8px',
      }}
    >
      {/* Thumbnail */}
      <div style={{ width: '64px', height: '36px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, background: '#111' }}>
        {clip.thumbnail
          ? <img src={clip.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5"><polygon points="5,3 19,12 5,21"/></svg>
            </div>
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A', marginBottom: '2px' }}>
          Klipp {index + 1}
        </p>
        <p style={{ fontSize: '11px', color: '#6B6B6B' }}>
          {fmt(trimmedDur)}
          {(clip.trimStart > 0 || clip.trimEnd < clip.duration) && (
            <span style={{ color: '#9B9B9B' }}> (orig {fmt(clip.duration)})</span>
          )}
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
        {index > 0 && (
          <button onClick={() => onMove(-1)} style={iconBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
          </button>
        )}
        {index < total - 1 && (
          <button onClick={() => onMove(1)} style={iconBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        )}
        <button onClick={onRemove} style={{ ...iconBtn, color: '#dc2626' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  )
}

const iconBtn: React.CSSProperties = {
  width: '28px', height: '28px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)',
  background: '#f5f5f3', display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', flexShrink: 0,
}

function TrimControls({ clip, onChange }: { clip: Clip; onChange: (start: number, end: number) => void }) {
  const dur = clip.duration
  if (dur <= 0) return null
  return (
    <div style={{ padding: '14px', background: '#EBF2ED', borderRadius: '12px', marginTop: '4px' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: '#1C3A2A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
        Klipp {fmt(clip.trimStart)} – {fmt(clip.trimEnd)} ({fmt(clip.trimEnd - clip.trimStart)})
      </p>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '11px', color: '#6B6B6B', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
          Start — {fmt(clip.trimStart)}
        </label>
        <input
          type="range" min={0} max={clip.trimEnd - 0.1} step={0.1}
          value={clip.trimStart}
          onChange={e => onChange(parseFloat(e.target.value), clip.trimEnd)}
          style={{ width: '100%', accentColor: '#1C3A2A' }}
        />
      </div>

      <div>
        <label style={{ fontSize: '11px', color: '#6B6B6B', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
          Slut — {fmt(clip.trimEnd)}
        </label>
        <input
          type="range" min={clip.trimStart + 0.1} max={dur} step={0.1}
          value={clip.trimEnd}
          onChange={e => onChange(clip.trimStart, parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: '#1C3A2A' }}
        />
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CreateVideoPage() {
  const [clips, setClips] = useState<Clip[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [musicFile, setMusicFile] = useState<File | null>(null)
  const [musicVol, setMusicVol] = useState(0.8)
  const [tab, setTab] = useState<'clips' | 'music'>('clips')
  const [rendering, setRendering] = useState(false)
  const [renderProgress, setRenderProgress] = useState(0)
  const [renderPhase, setRenderPhase] = useState('')
  const [renderedUrl, setRenderedUrl] = useState<string | null>(null)
  const [renderedBlob, setRenderedBlob] = useState<Blob | null>(null)
  const [caption, setCaption] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [done, setDone] = useState(false)
  const previewRef = useRef<HTMLVideoElement>(null)
  const renderedRef = useRef<HTMLVideoElement>(null)
  const renderedUrlRef = useRef<string | null>(null)

  const selected = clips.find(c => c.id === selectedId) ?? null
  const totalDur = clips.reduce((s, c) => s + (c.trimEnd - c.trimStart), 0)

  // Update preview player when selected clip changes
  useEffect(() => {
    const v = previewRef.current
    if (!v || !selected) return
    v.src = selected.objectUrl
    v.currentTime = selected.trimStart
  }, [selected?.id, selected?.objectUrl])

  // Enforce trim bounds during preview playback
  useEffect(() => {
    const v = previewRef.current
    if (!v || !selected) return
    const onTime = () => {
      if (v.currentTime >= selected.trimEnd) { v.pause(); v.currentTime = selected.trimStart }
    }
    v.addEventListener('timeupdate', onTime)
    return () => v.removeEventListener('timeupdate', onTime)
  }, [selected?.id, selected?.trimStart, selected?.trimEnd])

  async function addFiles(files: FileList | null) {
    if (!files) return
    for (const file of Array.from(files)) {
      const meta = await loadClipMeta(file)
      const clip: Clip = {
        id: uid(), file,
        duration: meta.duration,
        trimStart: 0,
        trimEnd: meta.duration,
        objectUrl: URL.createObjectURL(file),
        thumbnail: meta.thumbnail,
      }
      setClips(prev => {
        if (prev.length === 0) setSelectedId(clip.id)
        return [...prev, clip]
      })
    }
  }

  function updateTrim(id: string, start: number, end: number) {
    setClips(prev => prev.map(c => c.id === id ? { ...c, trimStart: start, trimEnd: end } : c))
  }

  function removeClip(id: string) {
    setClips(prev => {
      const next = prev.filter(c => c.id !== id)
      if (selectedId === id) setSelectedId(next[0]?.id ?? null)
      return next
    })
  }

  function moveClip(id: string, dir: -1 | 1) {
    setClips(prev => {
      const idx = prev.findIndex(c => c.id === id)
      if (idx < 0) return prev
      const next = [...prev]
      const swap = idx + dir
      if (swap < 0 || swap >= next.length) return prev
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next
    })
  }

  async function render() {
    if (clips.length === 0) return
    setRendering(true)
    setRenderProgress(0)
    setRenderedUrl(null)
    setRenderedBlob(null)

    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const { fetchFile, toBlobURL } = await import('@ffmpeg/util')

      const ff = new FFmpeg()
      ff.on('progress', ({ progress }: { progress: number }) => {
        setRenderProgress(20 + Math.round(progress * 70))
      })

      setRenderPhase('Laddar videomotor…')
      setRenderProgress(5)
      await ff.load({
        coreURL: await toBlobURL(
          'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
          'text/javascript',
        ),
        wasmURL: await toBlobURL(
          'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
          'application/wasm',
        ),
      })
      setRenderProgress(15)

      // Trim each clip
      setRenderPhase(`Klipper ${clips.length} klipp…`)
      const trimmed: string[] = []
      for (let i = 0; i < clips.length; i++) {
        const c = clips[i]
        await ff.writeFile(`in${i}.mp4`, await fetchFile(c.file))
        await ff.exec([
          '-ss', c.trimStart.toFixed(3),
          '-t', (c.trimEnd - c.trimStart).toFixed(3),
          '-i', `in${i}.mp4`,
          '-c', 'copy',
          `t${i}.mp4`,
        ])
        trimmed.push(`t${i}.mp4`)
      }

      // Concatenate
      setRenderPhase('Sammanfogar klipp…')
      let videoFile: string
      if (trimmed.length === 1) {
        videoFile = trimmed[0]
      } else {
        const list = trimmed.map(f => `file '${f}'`).join('\n')
        await ff.writeFile('list.txt', new TextEncoder().encode(list))
        await ff.exec(['-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', 'joined.mp4'])
        videoFile = 'joined.mp4'
      }

      // Add music
      if (musicFile) {
        setRenderPhase('Lägger till musik…')
        await ff.writeFile('music', await fetchFile(musicFile))
        await ff.exec([
          '-i', videoFile,
          '-i', 'music',
          '-c:v', 'copy',
          '-filter_complex', `[1:a]volume=${musicVol}[mus];[0:a][mus]amix=inputs=2:duration=shortest[aout]`,
          '-map', '0:v',
          '-map', '[aout]',
          '-c:a', 'aac',
          '-shortest',
          'final.mp4',
        ])
        videoFile = 'final.mp4'
      }

      setRenderPhase('Slutför…')
      const data = await ff.readFile(videoFile) as Uint8Array
      const blob = new Blob([data], { type: 'video/mp4' })

      if (renderedUrlRef.current) URL.revokeObjectURL(renderedUrlRef.current)
      const url = URL.createObjectURL(blob)
      renderedUrlRef.current = url
      setRenderedBlob(blob)
      setRenderedUrl(url)
      setRenderProgress(100)
      setRenderPhase('Klar!')
    } catch (err) {
      console.error(err)
      setRenderPhase('Något gick fel. Kontrollera konsolen.')
      setRenderProgress(0)
    } finally {
      setRendering(false)
    }
  }

  async function publish() {
    if (!renderedBlob) return
    setPublishing(true)

    const videoFile = new File([renderedBlob], `video_${Date.now()}.mp4`, { type: 'video/mp4' })
    const fd = new FormData()
    fd.append('video', videoFile)
    // Extract thumbnail from rendered video
    try {
      const meta = await loadClipMeta(videoFile)
      if (meta.thumbnail) {
        const res = await fetch(meta.thumbnail)
        const thumbBlob = await res.blob()
        fd.append('thumbnail', thumbBlob, 'thumb.jpg')
      }
    } catch { /* ignore */ }

    const uploadRes = await fetch('/api/community/upload', { method: 'POST', body: fd })
    if (!uploadRes.ok) { setPublishing(false); return }
    const { url: videoUrl, thumbnailUrl } = await uploadRes.json()

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setPublishing(false); return }

    await supabase.from('social_posts').insert({
      user_id: user.id,
      image_url: videoUrl,
      thumbnail_url: thumbnailUrl,
      caption: caption.trim() || 'Ny video',
      tags: [],
      user_email: user.email,
    })

    setPublishing(false)
    setDone(true)
    setTimeout(() => { window.location.href = '/community' }, 1200)
  }

  // ─── JSX ──────────────────────────────────────────────────────────────────

  if (done) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '12px' }}>
        <div style={{ fontSize: '48px' }}>✓</div>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: '#1C3A2A' }}>Publicerad!</p>
        <p style={{ fontSize: '13px', color: '#6B6B6B' }}>Skickar till flödet…</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F3EE', paddingBottom: '100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '52px 16px 12px', background: '#F5F3EE' }}>
        <Link href="/community" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#1A1A1A', fontSize: '16px', fontWeight: 700, flexShrink: 0 }}>
          ←
        </Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: '#1A1A1A', flex: 1 }}>
          Videoeditor
        </h1>
        {/* Quick upload link */}
        <Link href="/community" style={{ fontSize: '12px', fontWeight: 600, color: '#1C3A2A', textDecoration: 'none', padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #1C3A2A' }}>
          Ladda upp direkt
        </Link>
      </div>

      {/* Preview player */}
      <div style={{ margin: '0 16px 16px', borderRadius: '14px', overflow: 'hidden', background: '#000', aspectRatio: '16/9', position: 'relative' }}>
        {renderedUrl ? (
          <video ref={renderedRef} src={renderedUrl} controls playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : selected ? (
          <>
            <video ref={previewRef} src={selected.objectUrl} playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onLoadedData={e => { const v = e.currentTarget; v.currentTime = selected.trimStart }} />
            <div style={{ position: 'absolute', bottom: '10px', left: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => {
                  const v = previewRef.current
                  if (!v) return
                  if (v.paused) { v.currentTime = selected.trimStart; v.play() } else v.pause()
                }}
                style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><polygon points="5,3 19,12 5,21"/></svg>
              </button>
              <div style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px' }}>
                <div style={{ height: '100%', background: '#fff', borderRadius: '2px', width: `${((selected.trimEnd - selected.trimStart) / (selected.duration || 1)) * 100}%` }} />
              </div>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 600 }}>
                {fmt(selected.trimEnd - selected.trimStart)}
              </span>
            </div>
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5"><polygon points="5,3 19,12 5,21"/></svg>
            <p style={{ color: '#666', fontSize: '13px' }}>Lägg till klipp nedan</p>
          </div>
        )}
      </div>

      {/* Rendered badge */}
      {renderedUrl && (
        <div style={{ margin: '0 16px 12px', padding: '10px 14px', borderRadius: '10px', background: '#f0fdf4', border: '1px solid rgba(28,58,42,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1C3A2A" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <p style={{ fontSize: '13px', color: '#1C3A2A', fontWeight: 600 }}>Video renderad — förhandsgranska ovan</p>
        </div>
      )}

      <div style={{ padding: '0 16px' }}>

        {/* Tab bar */}
        {!renderedUrl && (
          <div className="flex p-1 mb-4" style={{ background: '#E8E5DE', borderRadius: '10px' }}>
            {(['clips', 'music'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className="flex-1 py-2 text-sm font-semibold"
                style={{ borderRadius: '8px', border: 'none', cursor: 'pointer', background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#1A1A1A' : '#6B6B6B', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
                {t === 'clips' ? `Klipp${clips.length > 0 ? ` (${clips.length})` : ''}` : `Musik${musicFile ? ' ✓' : ''}`}
              </button>
            ))}
          </div>
        )}

        {/* CLIPS tab */}
        {tab === 'clips' && !renderedUrl && (
          <div>
            {/* Add clips button */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '12px', background: '#fff', border: '2px dashed rgba(28,58,42,0.25)', cursor: 'pointer', marginBottom: '12px' }}>
              <input type="file" accept="video/*" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1C3A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>Lägg till videoklipp</p>
                <p style={{ fontSize: '11px', color: '#6B6B6B' }}>MP4, MOV eller WebM — välj flera</p>
              </div>
            </label>

            {/* Clip list */}
            {clips.map((clip, i) => (
              <div key={clip.id}>
                <ClipCard
                  clip={clip} selected={selectedId === clip.id}
                  index={i} total={clips.length}
                  onSelect={() => setSelectedId(clip.id)}
                  onRemove={() => removeClip(clip.id)}
                  onMove={dir => moveClip(clip.id, dir)}
                />
                {selectedId === clip.id && (
                  <TrimControls clip={clip} onChange={(s, e) => updateTrim(clip.id, s, e)} />
                )}
              </div>
            ))}

            {clips.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#9B9B9B', fontSize: '13px' }}>
                Inga klipp ännu
              </div>
            )}

            {clips.length > 0 && (
              <div style={{ marginTop: '8px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#6B6B6B' }}>{clips.length} klipp</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#1C3A2A' }}>Totalt: {fmt(totalDur)}</span>
              </div>
            )}
          </div>
        )}

        {/* MUSIC tab */}
        {tab === 'music' && !renderedUrl && (
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderRadius: '12px', background: '#fff', border: `2px dashed ${musicFile ? '#1C3A2A' : 'rgba(0,0,0,0.12)'}`, cursor: 'pointer', marginBottom: '12px' }}>
              <input type="file" accept="audio/*" className="hidden" onChange={e => setMusicFile(e.target.files?.[0] ?? null)} />
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: musicFile ? '#1C3A2A' : '#E8E5DE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={musicFile ? '#fff' : '#6B6B6B'} strokeWidth="1.8"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>{musicFile ? musicFile.name : 'Välj ljudfil'}</p>
                <p style={{ fontSize: '11px', color: '#6B6B6B' }}>{musicFile ? 'Tryck för att byta' : 'MP3, AAC eller WAV'}</p>
              </div>
              {musicFile && (
                <button style={{ marginLeft: 'auto', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                  onClick={e => { e.preventDefault(); e.stopPropagation(); setMusicFile(null) }}>✕</button>
              )}
            </label>

            {musicFile && (
              <div style={{ padding: '14px', background: '#fff', borderRadius: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>
                  Musikvolym — {Math.round(musicVol * 100)}%
                </label>
                <input type="range" min={0} max={1} step={0.05} value={musicVol}
                  onChange={e => setMusicVol(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#1C3A2A' }} />
                <p style={{ fontSize: '11px', color: '#9B9B9B', marginTop: '6px' }}>
                  Musiken mixas med originalljudet från klippen
                </p>
              </div>
            )}
          </div>
        )}

        {/* Publish panel — shown after render */}
        {renderedUrl && (
          <div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
                Bildtext
              </label>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Berätta om videon…"
                rows={3}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff', fontSize: '14px', color: '#1A1A1A', resize: 'none', lineHeight: 1.55, boxSizing: 'border-box' }}
              />
            </div>

            <button onClick={() => { setRenderedUrl(null); setRenderedBlob(null) }}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid rgba(0,0,0,0.12)', background: 'transparent', fontSize: '14px', color: '#6B6B6B', fontWeight: 600, cursor: 'pointer', marginBottom: '8px' }}>
              Redigera om
            </button>
          </div>
        )}
      </div>

      {/* Render progress */}
      {rendering && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px 32px', width: '280px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: '#1A1A1A', marginBottom: '6px' }}>
              Renderar video
            </p>
            <p style={{ fontSize: '12px', color: '#6B6B6B', marginBottom: '20px' }}>{renderPhase}</p>
            <div style={{ height: '6px', background: '#E8E5DE', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{ height: '100%', background: '#1C3A2A', borderRadius: '3px', width: `${renderProgress}%`, transition: 'width 0.3s' }} />
            </div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#1C3A2A' }}>{renderProgress}%</p>
            <p style={{ fontSize: '11px', color: '#9B9B9B', marginTop: '8px' }}>Håll sidan öppen — detta kan ta några minuter</p>
          </div>
        </div>
      )}

      {/* Sticky bottom bar */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '448px', padding: '12px 16px 28px', background: 'rgba(245,243,238,0.96)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        {renderedUrl ? (
          <button onClick={publish} disabled={publishing}
            style={{ width: '100%', padding: '14px', borderRadius: '14px', background: publishing ? '#a3b8a8' : '#1C3A2A', color: '#fff', fontSize: '15px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            {publishing ? 'Publicerar…' : 'Publicera i flödet →'}
          </button>
        ) : (
          <button onClick={render} disabled={clips.length === 0 || rendering}
            style={{ width: '100%', padding: '14px', borderRadius: '14px', background: clips.length === 0 ? '#a3b8a8' : '#1C3A2A', color: '#fff', fontSize: '15px', fontWeight: 700, border: 'none', cursor: clips.length === 0 ? 'default' : 'pointer' }}>
            {`Rendera${clips.length > 0 ? ` (${clips.length} klipp · ${fmt(totalDur)})` : ''} →`}
          </button>
        )}
      </div>

    </div>
  )
}
