'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

type Props = {
  recipeId: string
  title: string
  description: string | null
  imageUrl: string | null
  tags: string[]
}

export default function PublishRecipeButton({ title, description, imageUrl, tags }: Props) {
  const [open, setOpen] = useState(false)
  const [caption, setCaption] = useState(`${title}${description ? ` — ${description}` : ''}`)
  const [publishing, setPublishing] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function publish() {
    setPublishing(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Du måste vara inloggad'); setPublishing(false); return }

    const { error: err } = await supabase.from('social_posts').insert({
      user_id: user.id,
      user_email: user.email,
      image_url: imageUrl ?? '',
      thumbnail_url: null,
      caption: caption.trim(),
      tags,
    })

    setPublishing(false)
    if (err) { setError(err.message); return }
    setDone(true)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          width: '100%', padding: '14px', borderRadius: '14px',
          background: '#1C3A2A', color: '#fff',
          fontSize: '15px', fontWeight: 700, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <polyline points="16 6 12 2 8 6"/>
          <line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
        Dela i community
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          {/* Backdrop */}
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
            onClick={() => { if (!publishing) setOpen(false) }}
          />

          {/* Sheet */}
          <div style={{
            position: 'relative', background: '#FAFAF8',
            borderRadius: '24px 24px 0 0', padding: '0 0 40px',
            maxHeight: '80vh', overflowY: 'auto',
          }}>
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'rgba(0,0,0,0.1)' }} />
            </div>

            <div style={{ padding: '12px 20px 0' }}>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 600, color: '#1A1A1A', marginBottom: '16px' }}>
                Dela i community
              </h3>

              {done ? (
                <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#EBF2ED', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1C3A2A" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p style={{ fontSize: '17px', fontWeight: 700, color: '#1A1A1A', fontFamily: 'Georgia, serif', marginBottom: '6px' }}>
                    Publicerat!
                  </p>
                  <p style={{ fontSize: '13px', color: '#9B9B9B', marginBottom: '24px' }}>
                    Receptet syns nu i community-flödet
                  </p>
                  <Link
                    href="/community"
                    onClick={() => setOpen(false)}
                    style={{
                      display: 'inline-block', padding: '12px 28px', borderRadius: '12px',
                      background: '#1C3A2A', color: '#fff',
                      fontSize: '14px', fontWeight: 700, textDecoration: 'none',
                    }}
                  >
                    Gå till community →
                  </Link>
                </div>
              ) : (
                <>
                  {/* Preview image */}
                  {imageUrl && (
                    <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', aspectRatio: '16/9' }}>
                      <img src={imageUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}

                  {/* Caption */}
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '6px' }}>
                    Bildtext
                  </label>
                  <textarea
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%', padding: '12px', borderRadius: '12px',
                      border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff',
                      fontSize: '14px', color: '#1A1A1A', lineHeight: 1.5,
                      resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                  />

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px', marginBottom: '16px' }}>
                      {tags.map(t => (
                        <span key={t} style={{ fontSize: '12px', color: '#1C3A2A', background: '#EBF2ED', padding: '4px 10px', borderRadius: '100px', fontWeight: 600 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {error && (
                    <p style={{ fontSize: '13px', color: '#dc2626', marginBottom: '10px' }}>{error}</p>
                  )}

                  <button
                    onClick={publish}
                    disabled={publishing || !caption.trim()}
                    style={{
                      width: '100%', padding: '14px', borderRadius: '14px', marginTop: '4px',
                      background: publishing || !caption.trim() ? '#a3b8a8' : '#1C3A2A',
                      color: '#fff', fontSize: '15px', fontWeight: 700,
                      border: 'none', cursor: publishing ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}
                  >
                    {publishing ? (
                      <>
                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
                        Publicerar…
                      </>
                    ) : 'Publicera'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
