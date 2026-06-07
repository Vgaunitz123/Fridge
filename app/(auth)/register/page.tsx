'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const router = useRouter()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (data.session) {
      router.push('/')
      router.refresh()
    } else {
      setRegistered(true)
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-5"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, #c8dfc8 0%, #faf7f2 60%)',
      }}
    >
      <div
        className="pointer-events-none fixed top-0 right-0 w-72 h-72 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #2d6a4f, transparent 70%)', filter: 'blur(40px)' }}
      />
      <div
        className="pointer-events-none fixed bottom-0 left-0 w-64 h-64 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #d4850a, transparent 70%)', filter: 'blur(50px)' }}
      />

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8 fade-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: '#1a4a2e' }}>
            <span className="text-3xl">🥬</span>
          </div>
          <h1 className="text-4xl font-bold" style={{ color: '#1a4a2e', fontFamily: 'var(--font-playfair)' }}>
            Kylskåpet
          </h1>
          <p className="text-sm mt-1.5" style={{ color: '#78716c' }}>Slösa inte, laga smart</p>
        </div>

        {registered ? (
          <div className="rounded-3xl p-8 card-shadow text-center fade-up" style={{ background: '#fff' }}>
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl"
              style={{ background: '#f0fdf4' }}>
              📬
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-playfair)', color: '#1c1917' }}>
              Kolla din e-post!
            </h2>
            <p className="text-sm" style={{ color: '#78716c' }}>
              Vi har skickat en bekräftelse till <strong style={{ color: '#1c1917' }}>{email}</strong>.
              Klicka på länken i mailet för att aktivera ditt konto.
            </p>
            <Link href="/login" className="inline-block mt-5 text-sm font-semibold"
              style={{ color: '#1a4a2e' }}>
              ← Tillbaka till inloggning
            </Link>
          </div>
        ) : (
          <>
            <div className="rounded-3xl p-7 card-shadow fade-up fade-up-1" style={{ background: '#fff' }}>
              <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'var(--font-playfair)', color: '#1c1917' }}>
                Skapa ett konto
              </h2>

              <form onSubmit={handleRegister} className="space-y-4">
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
                    style={{ background: '#faf7f2', border: '1.5px solid rgba(28,25,23,0.12)', color: '#1c1917', outline: 'none' }}
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
                    placeholder="Minst 6 tecken"
                    minLength={6}
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                    style={{ background: '#faf7f2', border: '1.5px solid rgba(28,25,23,0.12)', color: '#1c1917', outline: 'none' }}
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
                  style={{ background: loading ? '#4a7c59' : '#1a4a2e', color: '#faf7f2', cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  {loading ? 'Skapar konto…' : 'Skapa konto'}
                </button>
              </form>
            </div>

            <p className="text-center text-sm mt-5 fade-up fade-up-2" style={{ color: '#78716c' }}>
              Har du redan ett konto?{' '}
              <Link href="/login" className="font-semibold" style={{ color: '#1a4a2e' }}>
                Logga in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
