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
    if (error) { setError(error.message); setLoading(false) }
    else if (data.session) { router.push('/fridge'); router.refresh() }
    else { setRegistered(true); setLoading(false) }
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

  if (registered) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--surface)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-5" style={{ background: '#e8f0e9' }}>📬</div>
        <h2 className="text-xl font-semibold mb-2 text-center" style={{ color: '#111211' }}>Kolla din e-post!</h2>
        <p className="text-sm text-center mb-6" style={{ color: '#6b6f6b' }}>
          Bekräftelse skickat till <strong style={{ color: '#111211' }}>{email}</strong>
        </p>
        <Link href="/login" className="text-sm font-semibold" style={{ color: '#1e3a2a' }}>← Tillbaka till inloggning</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--surface)' }}>
      {/* Hero */}
      <div className="relative overflow-hidden flex items-end justify-center" style={{ height: '35vh', background: 'linear-gradient(180deg,#EBE6DB 0%,#D8D0C4 100%)' }}>
        <div className="w-full h-full flex flex-col justify-between p-4 pb-0">
          <div className="flex justify-around items-end pb-1" style={{ borderBottom: '2px solid rgba(160,148,132,0.4)' }}>
            <div className="text-5xl">🥛</div><div className="text-4xl">🧀</div><div className="text-4xl">🥚</div><div className="text-4xl">🍳</div>
          </div>
          <div className="flex justify-around items-end pb-1" style={{ borderBottom: '2px solid rgba(160,148,132,0.4)' }}>
            <div className="text-5xl">🥩</div><div className="text-4xl">🥦</div><div className="text-4xl">🍎</div><div className="text-5xl">🐟</div>
          </div>
          <div className="flex justify-around items-center py-2">
            <div className="text-4xl">🧂</div><div className="text-3xl">🫙</div><div className="text-4xl">🫐</div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16" style={{ background: 'linear-gradient(to top,#F5F3EE,transparent)' }} />
      </div>

      <div className="text-center py-5">
        <h1 className="text-xl font-bold tracking-widest uppercase" style={{ color: '#111211', letterSpacing: '0.12em' }}>RECEPT-APPEN</h1>
      </div>

      <div className="flex-1 px-6 pb-8">
        <div className="rounded-2xl p-6" style={{ background: '#f5f6f4' }}>
          <h2 className="text-xl font-semibold mb-5" style={{ color: '#111211' }}>Registrera dig</h2>
          <form onSubmit={handleRegister} className="space-y-3">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Användarnamn" required style={inputStyle} />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Lösenord (minst 6 tecken)" minLength={6} required style={inputStyle} />
            {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '14px', borderRadius: '10px', background: loading ? '#444' : '#111211', color: '#fff', fontSize: '15px', fontWeight: 600, marginTop: '4px' }}>
              {loading ? 'Skapar konto…' : 'Skapa konto'}
            </button>
          </form>
          <div className="text-center mt-4">
            <Link href="/login" className="text-sm" style={{ color: '#6b6f6b' }}>Har du redan ett konto? Logga in</Link>
          </div>
        </div>
        <div className="mt-4">
          <button onClick={() => router.push('/login')}
            style={{ width: '100%', padding: '14px', borderRadius: '10px', background: '#1e3a2a', color: '#fff', fontSize: '15px', fontWeight: 600 }}>
            Gå med oss
          </button>
        </div>
      </div>
    </div>
  )
}
