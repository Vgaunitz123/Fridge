'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase'
import { ScannedIngredient } from '@/lib/types'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type State = 'idle' | 'scanning' | 'results' | 'saving' | 'done'

export default function ScanPage() {
  const [state, setState] = useState<State>('idle')
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [ingredients, setIngredients] = useState<ScannedIngredient[]>([])
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError(null)
    setState('idle')
    setIngredients([])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  })

  async function handleScan() {
    if (!file) return
    setState('scanning')
    setError(null)
    const formData = new FormData()
    formData.append('image', file)
    const res = await fetch('/api/scan', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok || data.error) {
      setError(data.error ?? 'Något gick fel')
      setState('idle')
      return
    }
    setIngredients((data.ingredients as Omit<ScannedIngredient, 'selected'>[]).map(i => ({ ...i, selected: true })))
    setState('results')
  }

  function toggleIngredient(idx: number) {
    setIngredients(prev => prev.map((item, i) => i === idx ? { ...item, selected: !item.selected } : item))
  }

  async function handleSave() {
    const selected = ingredients.filter(i => i.selected)
    if (selected.length === 0) return
    setState('saving')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setState('results'); return }
    await supabase.from('fridge_items').insert(selected.map(i => ({
      user_id: user.id, name: i.name, quantity: i.estimated_quantity, unit: i.unit, category: 'other', expiry_date: null,
    })))
    setState('done')
    setTimeout(() => router.push('/fridge'), 1200)
  }

  return (
    <div>
      {/* Header */}
      <div className="px-5 pt-8 pb-5">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#d4850a' }}>
          Smart igenkänning
        </p>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-playfair)', color: '#1c1917' }}>
          Scanna kylskåpet
        </h1>
        <p className="text-sm mt-1" style={{ color: '#78716c' }}>
          Ta en bild — AI:n listar ingredienserna automatiskt
        </p>
      </div>

      <div className="px-4 space-y-4">
        {!preview ? (
          <>
            {/* Drop zone */}
            <div
              {...getRootProps()}
              className="cursor-pointer transition-all"
              style={{
                borderRadius: '24px',
                border: `2px dashed ${isDragActive ? '#1a4a2e' : 'rgba(28,25,23,0.15)'}`,
                background: isDragActive ? '#f0fdf4' : '#faf7f2',
                padding: '40px 24px',
                textAlign: 'center',
              }}
            >
              <input {...getInputProps()} />
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
                style={{ background: isDragActive ? '#dcfce7' : '#f0fdf4' }}
              >
                📷
              </div>
              <p className="font-semibold text-sm mb-1" style={{ color: '#1c1917' }}>
                {isDragActive ? 'Släpp bilden här' : 'Dra och släpp en bild'}
              </p>
              <p className="text-xs" style={{ color: '#a8a29e' }}>eller klicka för att välja från galleri</p>

              <label className="inline-block mt-4 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) { setFile(f); setPreview(URL.createObjectURL(f)) }
                  }}
                />
                <span
                  className="text-xs font-semibold px-4 py-2 rounded-full"
                  style={{ background: '#1a4a2e', color: '#faf7f2' }}
                >
                  📸 Ta foto med kameran
                </span>
              </label>
            </div>

            {/* Info card */}
            <div
              className="rounded-2xl px-4 py-4 flex items-start gap-3"
              style={{ background: '#f0fdf4', border: '1px solid rgba(26,74,46,0.1)' }}
            >
              <span className="text-xl">🤖</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#1a4a2e' }}>Hur det fungerar</p>
                <p className="text-xs mt-0.5" style={{ color: '#4a7c5a' }}>
                  Fotografera kylskåpet, bänkskivan eller matpåsarna — vår AI känner igen ingredienserna och lägger till dem i ditt förråd.
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {/* Image preview */}
            <div
              className="relative overflow-hidden"
              style={{ borderRadius: '20px', height: '220px', background: '#f0ebe0' }}
            >
              <Image src={preview} alt="Kylskåpsbild" fill className="object-cover" />

              {/* Overlay state indicator */}
              {state === 'scanning' && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                  style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
                >
                  <div
                    className="w-10 h-10 rounded-full border-4 border-white/30 animate-spin"
                    style={{ borderTopColor: '#fff' }}
                  />
                  <p className="text-white text-sm font-semibold">Analyserar bilden…</p>
                </div>
              )}

              {state === 'done' && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                  style={{ background: 'rgba(26,74,46,0.85)', backdropFilter: 'blur(4px)' }}
                >
                  <span className="text-5xl">✅</span>
                  <p className="text-white text-sm font-semibold">Ingredienser sparade!</p>
                  <p className="text-white/70 text-xs">Skickar dig till kylskåpet…</p>
                </div>
              )}
            </div>

            <button
              onClick={() => { setPreview(null); setFile(null); setState('idle'); setIngredients([]) }}
              className="text-xs underline"
              style={{ color: '#a8a29e' }}
            >
              Välj annan bild
            </button>

            {/* Error */}
            {error && (
              <div
                className="px-4 py-3 rounded-2xl text-sm"
                style={{ background: '#fff7ed', color: '#92400e', border: '1px solid rgba(217,119,6,0.2)' }}
              >
                {error}
              </div>
            )}

            {/* Scan CTA */}
            {state === 'idle' && (
              <button
                onClick={handleScan}
                className="w-full py-3.5 rounded-xl text-sm font-semibold"
                style={{ background: '#1a4a2e', color: '#faf7f2' }}
              >
                ✨ Scanna ingredienser
              </button>
            )}

            {/* Results */}
            {(state === 'results' || state === 'saving') && ingredients.length > 0 && (
              <div className="fade-up">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#78716c' }}>
                    Hittade {ingredients.length} ingredienser
                  </p>
                  <span className="text-lg">🎉</span>
                </div>

                <div
                  className="rounded-2xl overflow-hidden mb-3"
                  style={{ border: '1px solid rgba(28,25,23,0.08)' }}
                >
                  {ingredients.map((ing, idx) => (
                    <button
                      key={idx}
                      onClick={() => toggleIngredient(idx)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
                      style={{
                        background: ing.selected ? '#f0fdf4' : '#fff',
                        borderBottom: idx < ingredients.length - 1 ? '1px solid rgba(28,25,23,0.06)' : 'none',
                      }}
                    >
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 transition-all"
                        style={{
                          background: ing.selected ? '#1a4a2e' : 'rgba(28,25,23,0.08)',
                          color: '#fff',
                        }}
                      >
                        {ing.selected ? '✓' : ''}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: '#1c1917' }}>{ing.name}</p>
                      </div>
                      <p className="text-xs" style={{ color: '#a8a29e' }}>
                        {ing.estimated_quantity} {ing.unit}
                      </p>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleSave}
                  disabled={state === 'saving' || ingredients.filter(i => i.selected).length === 0}
                  className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: state === 'saving' ? '#a3b8a8' : '#1a4a2e',
                    color: '#faf7f2',
                  }}
                >
                  {state === 'saving' ? 'Sparar…' : `Lägg till ${ingredients.filter(i => i.selected).length} ingredienser`}
                </button>
              </div>
            )}

            {state === 'results' && ingredients.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm font-semibold" style={{ color: '#1c1917' }}>Inga matvaror hittades</p>
                <p className="text-xs mt-1" style={{ color: '#a8a29e' }}>Prova med en tydligare bild.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
