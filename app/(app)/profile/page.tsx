'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Stats = { fridgeItems: number; recipes: number }

export default function ProfilePage() {
  const [email, setEmail] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats>({ fridgeItems: 0, recipes: 0 })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setEmail(user.email ?? null)

      const [{ count: fridgeCount }, { count: recipeCount }] = await Promise.all([
        supabase.from('fridge_items').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('recipes').select('*', { count: 'exact', head: true }).eq('created_by', user.id),
      ])
      setStats({ fridgeItems: fridgeCount ?? 0, recipes: recipeCount ?? 0 })
      setLoading(false)
    }
    load()
  }, [router])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = email
    ? email.split('@')[0].slice(0, 2).toUpperCase()
    : '?'

  return (
    <div>
      <div className="px-5 pt-8 pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#d4850a' }}>Mitt konto</p>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-playfair)', color: '#1c1917' }}>Profil</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="text-5xl animate-pulse">👤</div>
        </div>
      ) : (
        <div className="px-4 space-y-4">
          {/* Avatar + name */}
          <div className="flex items-center gap-4 p-5 rounded-2xl"
            style={{ background: '#fff', border: '1px solid rgba(28,25,23,0.07)', boxShadow: '0 1px 3px rgba(28,25,23,0.05)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
              style={{ background: '#1a4a2e', color: '#faf7f2' }}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-base" style={{ fontFamily: 'var(--font-playfair)', color: '#1c1917' }}>
                {email?.split('@')[0]}
              </p>
              <p className="text-sm truncate" style={{ color: '#78716c' }}>{email}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4 text-center" style={{ background: '#f0fdf4', border: '1px solid rgba(26,74,46,0.1)' }}>
              <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-playfair)', color: '#1a4a2e' }}>{stats.fridgeItems}</p>
              <p className="text-xs font-semibold uppercase tracking-widest mt-1" style={{ color: '#4a7c5a' }}>varor i kylen</p>
            </div>
            <div className="rounded-2xl p-4 text-center" style={{ background: '#fff7ed', border: '1px solid rgba(212,133,10,0.1)' }}>
              <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-playfair)', color: '#d4850a' }}>{stats.recipes}</p>
              <p className="text-xs font-semibold uppercase tracking-widest mt-1" style={{ color: '#b45309' }}>sparade recept</p>
            </div>
          </div>

          {/* Settings list */}
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(28,25,23,0.07)' }}>
            {[
              { icon: '🔔', label: 'Notifikationer', sub: 'Påminnelser om utgångsdatum' },
              { icon: '🌿', label: 'Kostpreferenser', sub: 'Vegetariskt, glutenfritt m.m.' },
              { icon: '🏪', label: 'Föredragen butik', sub: 'ICA Maxi Häggvik' },
              { icon: '🔒', label: 'Sekretess & Data', sub: 'Hantera dina uppgifter' },
            ].map((item, i, arr) => (
              <button key={item.label}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
                style={{ background: '#fff', borderBottom: i < arr.length - 1 ? '1px solid rgba(28,25,23,0.06)' : 'none' }}
              >
                <span className="text-xl w-8 flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: '#1c1917' }}>{item.label}</p>
                  <p className="text-xs" style={{ color: '#a8a29e' }}>{item.sub}</p>
                </div>
                <span style={{ color: '#c4bfb8' }}>›</span>
              </button>
            ))}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-98"
            style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid rgba(220,38,38,0.12)' }}
          >
            Logga ut
          </button>

          <p className="text-center text-xs pb-2" style={{ color: '#c4bfb8' }}>Kylskåpet v1.0 — Slösa inte, laga smart</p>
        </div>
      )}
    </div>
  )
}
