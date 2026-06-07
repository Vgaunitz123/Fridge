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
    if (error) {
      setError('Fel e-post eller lösenord')
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-5"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, #c8dfc8 0%, #faf7f2 60%)',
      }}
    >
      {/* Decorative blobs */}
      <div
        className="pointer-events-none fixed top-0 right-0 w-72 h-72 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #2d6a4f, transparent 70%)', filter: 'blur(40px)' }}
      />
      <div
        className="pointer-events-none fixed bottom-0 left-0 w-64 h-64 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #d4850a, transparent 70%)', filter: 'blur(50px)' }}
      />

      <div className="w-full max-w-sm relative">
        {/* Brand */}
        <div className="text-center mb-8 fade-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: '#1a4a2e' }}>
            <span className="text-3xl">🥬</span>
          </div>
          <h1 className="text-4xl font-display font-bold" style={{ color: '#1a4a2e', fontFamily: 'var(--font-playfair)' }}>
            Kylskåpet
          </h1>
          <p className="text-sm mt-1.5" style={{ color: '#78716c' }}>Slösa inte, laga smart</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-7 card-shadow fade-up fade-up-1" style={{ background: '#fff' }}>
          <h2 className="text-xl font-display font-semibold mb-6" style={{ fontFamily: 'var(--font-playfair)', color: '#1c1917' }}>
            Välkommen tillbaka
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#78716c' }}>
                E-post
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@email.se"
                required
                className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                style={{
                  background: '#faf7f2',
                  border: '1.5px solid rgba(28,25,23,0.12)',
                  color: '#1c1917',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#78716c' }}>
                Lösenord
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                style={{
                  background: '#faf7f2',
                  border: '1.5px solid rgba(28,25,23,0.12)',
                  color: '#1c1917',
                  outline: 'none',
                }}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
                style={{ background: '#fef2f2', color: '#dc2626' }}>
                <span>⚠</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-semibold tracking-wide transition-all mt-2"
              style={{
                background: loading ? '#4a7c59' : '#1a4a2e',
                color: '#faf7f2',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Loggar in…' : 'Logga in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-5 fade-up fade-up-2" style={{ color: '#78716c' }}>
          Inget konto?{' '}
          <Link href="/register" className="font-semibold" style={{ color: '#1a4a2e' }}>
            Registrera dig
          </Link>
        </p>
      </div>
    </div>
  )
}
