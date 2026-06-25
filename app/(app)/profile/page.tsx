'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Stats = { fridgeItems: number; likedRecipes: number; posts: number; createdRecipes: number }

const SETTINGS = [
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>, label: 'Notifikationer', sub: 'Påminnelser om utgångsdatum' },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>, label: 'Kostpreferenser', sub: 'Vegetariskt, glutenfritt m.m.' },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, label: 'Föredragen butik', sub: 'Välj din närmaste butik' },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, label: 'Sekretess & Data', sub: 'Hantera dina uppgifter' },
]

export default function ProfilePage() {
  const [email, setEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats>({ fridgeItems: 0, likedRecipes: 0, posts: 0, createdRecipes: 0 })
  const [loading, setLoading] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarErr, setAvatarErr] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [bio, setBio] = useState('')
  const [editingBio, setEditingBio] = useState(false)
  const [savingBio, setSavingBio] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setEmail(user.email ?? null)
      setUserId(user.id)
      const avatarFromMeta = (user.user_metadata?.avatar_url as string) ?? null
      setAvatarUrl(avatarFromMeta)

      // Upsert user_profiles so this user appears in search
      const username = user.email?.split('@')[0] ?? ''
      const { data: profileRow } = await supabase
        .from('user_profiles')
        .upsert({ user_id: user.id, username, avatar_url: avatarFromMeta }, { onConflict: 'user_id' })
        .select('bio')
        .single()
      setBio(profileRow?.bio ?? '')

      const [{ count: fridgeCount }, { count: createdCount }, { count: likedCount }, { count: postCount }] = await Promise.all([
        supabase.from('fridge_items').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('recipes').select('*', { count: 'exact', head: true }).eq('created_by', user.id),
        supabase.from('recipe_likes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('social_posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ])
      setStats({ fridgeItems: fridgeCount ?? 0, createdRecipes: createdCount ?? 0, likedRecipes: likedCount ?? 0, posts: postCount ?? 0 })
      setLoading(false)
    }
    load()
  }, [router])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setUploading(true)
    setUploadError(null)
    const fd = new FormData()
    fd.append('avatar', file)
    const res = await fetch('/api/profile/avatar', { method: 'POST', body: fd }).catch(() => null)
    setUploading(false)
    e.target.value = ''
    if (!res) { setUploadError('Kunde inte nå servern'); return }
    let json: { error?: string; url?: string } = {}
    try { json = await res.json() } catch { /* non-JSON response */ }
    if (res.ok) {
      setAvatarErr(false)
      // Append timestamp to bust the browser cache for the same storage path
      setAvatarUrl(json.url + `?t=${Date.now()}`)
    } else {
      setUploadError(json.error ?? `Fel ${res.status}`)
    }
  }

  async function saveBio() {
    if (!userId) return
    setSavingBio(true)
    const supabase = createClient()
    await supabase.from('user_profiles').update({ bio }).eq('user_id', userId)
    setEditingBio(false)
    setSavingBio(false)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const username = email?.split('@')[0] ?? ''
  const initials = username.slice(0, 2).toUpperCase() || '?'

  return (
    <div style={{ background: '#F5F3EE', minHeight: '100vh', paddingBottom: '100px' }}>

      {/* Header */}
      <div style={{ padding: '56px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: '#1A1A1A' }}>
          Profil
        </h1>
        {userId && (
          <Link href={`/profile/${userId}`} style={{ fontSize: '12px', color: '#6B6B6B', textDecoration: 'none', fontWeight: 500 }}>
            Offentlig vy →
          </Link>
        )}
      </div>

      {/* Avatar card */}
      <div style={{ margin: '20px 16px 16px', background: 'var(--surface)', borderRadius: '20px', padding: '28px 20px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {/* Avatar with upload overlay */}
        <div style={{ position: 'relative', width: '88px', height: '88px', margin: '0 auto 14px' }}>
          <div style={{ width: '88px', height: '88px', borderRadius: '50%', overflow: 'hidden', background: '#E8E5DE' }}>
            {avatarUrl && !avatarErr ? (
              <img
                src={avatarUrl!}
                alt={username}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={() => setAvatarErr(true)}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1C3A2A, #2D5A3F)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>
                {loading ? '' : initials}
              </div>
            )}
          </div>

          {/* Camera button */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: '28px', height: '28px', borderRadius: '50%',
              background: uploading ? '#a3b8a8' : '#1C3A2A',
              border: '2.5px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }}
          >
            {uploading ? (
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="hidden" onChange={handleAvatarUpload} />
        </div>

        {uploadError && (
          <p style={{ fontSize: '12px', color: '#dc2626', marginBottom: '8px', marginTop: '-4px' }}>{uploadError}</p>
        )}

        {!loading && (
          <>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', fontFamily: 'var(--font-display)', marginBottom: '3px' }}>
              @{username}
            </p>
            <p style={{ fontSize: '13px', color: '#9B9B9B', marginBottom: '12px' }}>{email}</p>

            {/* Bio */}
            {editingBio ? (
              <div style={{ width: '100%' }}>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Berätta om dig själv…"
                  rows={3}
                  maxLength={200}
                  autoFocus
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #1C3A2A', background: 'var(--surface)', fontSize: '13px', color: '#1A1A1A', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: '8px' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setEditingBio(false)} style={{ flex: 1, padding: '8px', borderRadius: '10px', border: '1.5px solid rgba(0,0,0,0.1)', background: 'transparent', fontSize: '13px', fontWeight: 600, color: '#6B6B6B', cursor: 'pointer' }}>Avbryt</button>
                  <button onClick={saveBio} disabled={savingBio} style={{ flex: 1, padding: '8px', borderRadius: '10px', border: 'none', background: '#1C3A2A', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: savingBio ? 'not-allowed' : 'pointer' }}>
                    {savingBio ? 'Sparar…' : 'Spara'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setEditingBio(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'center', width: '100%' }}>
                {bio
                  ? <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.5, marginBottom: '2px' }}>{bio}</p>
                  : <p style={{ fontSize: '13px', color: '#C0C0C0', fontStyle: 'italic' }}>Lägg till bio…</p>
                }
              </button>
            )}
          </>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px' }}>
          <div style={{ width: '26px', height: '26px', borderRadius: '50%', border: '2px solid #E8E5DE', borderTopColor: '#1C3A2A', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div style={{ padding: '0 16px' }}>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            {[
              { value: stats.fridgeItems,    label: 'Varor i kylen',   color: '#1C3A2A', bg: '#EBF2ED', href: '/fridge',                 icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="4" y="2" width="16" height="20" rx="3"/><line x1="4" y1="9" x2="20" y2="9"/><line x1="8" y1="5.5" x2="8" y2="7.5" strokeLinecap="round"/><line x1="8" y1="12.5" x2="8" y2="16.5" strokeLinecap="round"/></svg> },
              { value: stats.likedRecipes,   label: 'Gillade recept',  color: '#e11d48', bg: '#fff1f2', href: '/profile/liked-recipes',   icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
              { value: stats.posts,          label: 'Mina inlägg',     color: '#1C3A2A', bg: '#EBF2ED', href: '/profile/my-posts',        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
              { value: stats.createdRecipes, label: 'Skapade recept',  color: '#b45309', bg: '#fff7ed', href: '/profile/my-recipes',      icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6z"/><line x1="6" y1="17" x2="18" y2="17"/></svg> },
            ].map(s => (
              <Link key={s.label} href={s.href} style={{ textDecoration: 'none', display: 'block' }} className="pressable">
                <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '18px 16px 14px', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                    {s.icon}
                  </div>
                  <p style={{ fontSize: '26px', fontWeight: 700, color: s.color, fontFamily: 'var(--font-display)', lineHeight: 1, marginBottom: '3px' }}>{s.value}</p>
                  <p style={{ fontSize: '11px', color: '#9B9B9B', fontWeight: 600 }}>{s.label}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Settings */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '14px 16px 8px' }}>
              Inställningar
            </p>
            {SETTINGS.map((item, i) => (
              <button key={item.label} className="pressable" style={{ padding: '13px 16px', background: 'transparent', borderTop: i > 0 ? '1px solid rgba(0,0,0,0.05)' : 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EBF2ED', color: '#1C3A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', marginBottom: '1px' }}>{item.label}</p>
                  <p style={{ fontSize: '12px', color: '#9B9B9B' }}>{item.sub}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8C8C8" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            ))}
          </div>

          {/* Logout */}
          <button onClick={handleLogout} className="pressable" style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--surface)', color: '#dc2626', border: '1.5px solid rgba(220,38,38,0.15)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logga ut
          </button>

          <p style={{ textAlign: 'center', fontSize: '11px', color: '#C8C8C8', paddingBottom: '8px' }}>
            Kylskåpet v1.0 · Slösa inte, laga smart
          </p>
        </div>
      )}
    </div>
  )
}
