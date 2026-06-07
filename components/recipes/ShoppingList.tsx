'use client'

import { useState } from 'react'

type Props = {
  missing: string[]
  have: string[]
}

export default function ShoppingList({ missing, have }: Props) {
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [ordered, setOrdered] = useState(false)
  const [showOrder, setShowOrder] = useState(false)

  function toggle(i: number) {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  if (missing.length === 0 && have.length > 0) {
    return (
      <div
        className="rounded-2xl p-5 flex items-center gap-3"
        style={{ background: '#f0fdf4', border: '1px solid rgba(26,74,46,0.15)' }}
      >
        <span className="text-3xl">🎉</span>
        <div>
          <p className="font-bold text-sm" style={{ color: '#1a4a2e' }}>Du har allt!</p>
          <p className="text-xs mt-0.5" style={{ color: '#4a7c5a' }}>Alla ingredienser finns i ditt kylskåp. Dags att laga!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* What you have */}
      {have.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#16a34a' }}>
            Du har ({have.length})
          </p>
          <div className="space-y-1.5">
            {have.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                style={{ background: '#f0fdf4', border: '1px solid rgba(22,163,74,0.15)' }}
              >
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                  style={{ background: '#16a34a', color: '#fff' }}>
                  ✓
                </div>
                <span className="text-sm" style={{ color: '#14532d' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What you're missing */}
      {missing.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#dc2626' }}>
            Saknar ({missing.length})
          </p>
          <div className="space-y-1.5">
            {missing.map((item, i) => (
              <button
                key={i}
                onClick={() => toggle(i)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all"
                style={{
                  background: checked.has(i) ? '#f0fdf4' : '#fff5f5',
                  border: `1px solid ${checked.has(i) ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.12)'}`,
                }}
              >
                <div
                  className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs transition-all"
                  style={{
                    background: checked.has(i) ? '#16a34a' : 'rgba(220,38,38,0.1)',
                    color: checked.has(i) ? '#fff' : '#dc2626',
                    border: checked.has(i) ? 'none' : '1.5px solid rgba(220,38,38,0.3)',
                  }}
                >
                  {checked.has(i) ? '✓' : ''}
                </div>
                <span
                  className="text-sm flex-1"
                  style={{
                    color: checked.has(i) ? '#16a34a' : '#7f1d1d',
                    textDecoration: checked.has(i) ? 'line-through' : 'none',
                  }}
                >
                  {item}
                </span>
                <span className="text-xs" style={{ color: '#a8a29e' }}>köp</span>
              </button>
            ))}
          </div>

          {/* Order button */}
          {!ordered ? (
            <button
              onClick={() => setShowOrder(true)}
              className="w-full mt-4 py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-98"
              style={{ background: '#1a4a2e', color: '#faf7f2' }}
            >
              🛒 Beställ saknade varor
            </button>
          ) : (
            <div
              className="mt-4 px-4 py-4 rounded-2xl flex items-center gap-3"
              style={{ background: '#f0fdf4', border: '1px solid rgba(26,74,46,0.15)' }}
            >
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-sm" style={{ color: '#1a4a2e' }}>Beställning lagd!</p>
                <p className="text-xs mt-0.5" style={{ color: '#4a7c5a' }}>Varorna levereras inom 1–2 timmar.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order modal */}
      {showOrder && !ordered && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowOrder(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl p-6"
            style={{ background: '#fff' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: '#e7e5e4' }} />

            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-playfair)', color: '#1c1917' }}>
              Beställ varor
            </h2>
            <p className="text-sm mb-5" style={{ color: '#78716c' }}>
              {missing.length} saknade varor läggs i din varukorg
            </p>

            <div className="space-y-1.5 mb-5">
              {missing.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm" style={{ color: '#1c1917' }}>
                  <span>•</span> {item}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => { setOrdered(true); setShowOrder(false) }}
                className="w-full py-3.5 rounded-xl text-sm font-semibold"
                style={{ background: '#1a4a2e', color: '#faf7f2' }}
              >
                🛒 Beställ via Mathem
              </button>
              <button
                onClick={() => { setOrdered(true); setShowOrder(false) }}
                className="w-full py-3.5 rounded-xl text-sm font-semibold"
                style={{ background: '#f0ebe0', color: '#44403c' }}
              >
                🏪 Hämta på ICA
              </button>
              <button
                onClick={() => setShowOrder(false)}
                className="w-full py-3 text-sm"
                style={{ color: '#a8a29e' }}
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
