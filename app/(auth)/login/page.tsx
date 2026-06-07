'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Fel e-post eller lösenord'); setLoading(false) }
    else { router.push('/fridge'); router.refresh() }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '10px',
    background: '#eeefec',
    border: '1px solid transparent',
    color: '#111211',
    fontSize: '15px',
    fontFamily: 'var(--font-dm-sans)',
    outline: 'none',
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#ffffff' }}>
      {/* Fridge hero illustration */}
      <div
        className="relative overflow-hidden flex items-end justify-center"
        style={{ height: '42vh', background: 'linear-gradient(180deg, #e8edf0 0%, #d4dde2 100%)' }}
      >
        {/* Fridge interior mockup */}
        <div className="w-full h-full flex flex-col justify-between p-4 pb-0">
          {/* Top shelf */}
          <div className="flex justify-around items-end pb-1" style={{ borderBottom: '2px solid rgba(200,220,230,0.6)' }}>
            <div className="text-5xl">🥛</div>
            <div className="text-4xl">🧀</div>
            <div className="text-4xl">🥚</div>
            <div className="text-4xl">🍳</div>
          </div>
          {/* Mid shelf */}
          <div className="flex justify-around items-end pb-1" style={{ borderBottom: '2px solid rgba(200,220,230,0.6)' }}>
            <div className="text-5xl">🥩</div>
            <div className="text-4xl">🥦</div>
            <div className="text-4xl">🍎</div>
            <div className="text-5xl">🐟</div>
          </div>
          {/* Bottom */}
          <div className="flex justify-around items-center py-2">
            <div className="text-4xl">🧂</div>
            <div className="text-3xl">🫙</div>
            <div className="text-4xl">🫐</div>
          </div>
        </div>
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16"
          style={{ background: 'linear-gradient(to top, #fff, transparent)' }} />
      </div>

      {/* App name */}
      <div className="text-center py-5">
        <h1
          className="text-xl font-bold tracking-widest uppercase"
          style={{ color: '#111211', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.12em' }}
        >
          RECEPT-APPEN
        </h1>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 pb-8">
        <div className="rounded-2xl p-6" style={{ background: '#f5f6f4' }}>
          <h2 className="text-xl font-semibold mb-5" style={{ color: '#111211' }}>Logga In</h2>

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Användarnamn"
              required
              style={inputStyle}
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Lösenord"
              required
              style={inputStyle}
            />

            {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                background: loading ? '#444' : '#111211',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 600,
                fontFamily: 'var(--font-dm-sans)',
                marginTop: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Loggar in…' : 'Logga In'}
            </button>
          </form>

          <div className="text-center mt-4">
            <Link href="/register" className="text-sm" style={{ color: '#6b6f6b' }}>
              Registrera dig
            </Link>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-4">
          <button
            onClick={() => router.push('/register')}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '10px',
              background: '#1e3a2a',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            Gå med oss
          </button>
        </div>
      </div>
    </div>
  )
}
