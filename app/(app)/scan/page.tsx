'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase'
import { ScannedIngredient } from '@/lib/types'
import AddItemDialog from '@/components/fridge/AddItemDialog'
import { FridgeItem } from '@/lib/types'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type State = 'idle' | 'scanning' | 'results' | 'saving' | 'done'
type ScanMode = 'receipt' | 'product' | null


export default function ScanPage() {
  const [state, setState] = useState<State>('idle')
  const [scanMode, setScanMode] = useState<ScanMode>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [ingredients, setIngredients] = useState<ScannedIngredient[]>([])
  const [error, setError] = useState<string | null>(null)
  const [manualOpen, setManualOpen] = useState(false)
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
    onDrop, accept: { 'image/*': [] }, maxFiles: 1,
  })

  async function handleScan() {
    if (!file) return
    setState('scanning')
    setError(null)
    const formData = new FormData()
    formData.append('image', file)
    formData.append('mode', scanMode ?? 'product')
    const res = await fetch('/api/scan', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok || data.error) {
      setError(data.error ?? 'Något gick fel')
      setState('idle')
      return
    }
    const items = (data.ingredients as Omit<ScannedIngredient, 'selected'>[]).map(i => ({ ...i, selected: true }))
    setIngredients(items)
    if (data.mock) setError('Demo-läge: Inga riktiga AI-resultat (API-nyckel saknas)')
    setState('results')
  }

  function toggleIngredient(idx: number) {
    setIngredients(prev => prev.map((item, i) => i === idx ? { ...item, selected: !item.selected } : item))
  }

  async function handleSave() {
    const selected = ingredients.filter(i => i.selected)
    if (!selected.length) return
    setState('saving')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setState('results'); return }
    await supabase.from('fridge_items').insert(selected.map(i => ({
      user_id: user.id,
      name: i.name,
      quantity: i.estimated_quantity,
      unit: i.unit,
      category: i.dbCategory ?? 'other',
      expiry_date: i.expiry_date ?? null,
    })))
    setState('done')
    setTimeout(() => router.push('/fridge'), 1200)
  }

  async function handleManualAdd(item: Omit<FridgeItem, 'id' | 'user_id' | 'created_at'>) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('fridge_items').insert({ ...item, user_id: user.id })
    setManualOpen(false)
    router.push('/fridge')
  }

  const showScanArea = scanMode !== null

  return (
    <div>
      {/* Header */}
      <div className="px-5 pt-8 pb-5">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#d4850a' }}>
          Lägg till varor
        </p>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-playfair)', color: '#1c1917' }}>
          Skanna & Lägg till
        </h1>
        <p className="text-sm mt-1" style={{ color: '#78716c' }}>
          Scanna kvitto, produkt eller lägg till manuellt
        </p>
      </div>

      <div className="px-4 space-y-3">
        {/* Scan mode selector — shown when no image loaded */}
        {!preview && (
          <>
            {/* Receipt scan */}
            <button
              onClick={() => setScanMode('receipt')}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all active:scale-98"
              style={{
                background: scanMode === 'receipt' ? '#f0fdf4' : '#fff',
                border: `2px solid ${scanMode === 'receipt' ? '#1a4a2e' : 'rgba(28,25,23,0.08)'}`,
                boxShadow: '0 1px 3px rgba(28,25,23,0.05)',
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: '#f0fdf4' }}
              >
                🧾
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: '#1c1917' }}>Skanna kvitto</p>
                <p className="text-xs mt-0.5" style={{ color: '#78716c' }}>
                  Fotografera ditt kassakvitto — vi hittar alla varor automatiskt
                </p>
              </div>
              {scanMode === 'receipt' && <span className="ml-auto text-lg">✓</span>}
            </button>

            {/* Product scan */}
            <button
              onClick={() => setScanMode('product')}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all active:scale-98"
              style={{
                background: scanMode === 'product' ? '#f0fdf4' : '#fff',
                border: `2px solid ${scanMode === 'product' ? '#1a4a2e' : 'rgba(28,25,23,0.08)'}`,
                boxShadow: '0 1px 3px rgba(28,25,23,0.05)',
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: '#fff7ed' }}
              >
                📦
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: '#1c1917' }}>Skanna produkt</p>
                <p className="text-xs mt-0.5" style={{ color: '#78716c' }}>
                  Ta ett foto av en vara eller kylskåpet — AI:n känner igen innehållet
                </p>
              </div>
              {scanMode === 'product' && <span className="ml-auto text-lg">✓</span>}
            </button>

            {/* Camera upload if mode selected */}
            {showScanArea && (
              <div
                {...getRootProps()}
                className="cursor-pointer transition-all"
                style={{
                  borderRadius: '20px',
                  border: `2px dashed ${isDragActive ? '#1a4a2e' : 'rgba(28,25,23,0.15)'}`,
                  background: isDragActive ? '#f0fdf4' : '#faf7f2',
                  padding: '32px 24px',
                  textAlign: 'center',
                }}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: '#f0fdf4' }}>
                    📷
                  </div>
                  <p className="font-semibold text-sm" style={{ color: '#1c1917' }}>
                    {isDragActive ? 'Släpp bilden här' : scanMode === 'receipt' ? 'Fotografera kvittot' : 'Fotografera produkten'}
                  </p>
                  <p className="text-xs" style={{ color: '#a8a29e' }}>eller dra och släpp en bild</p>
                  <label className="mt-1 cursor-pointer">
                    <input
                      type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) { setFile(f); setPreview(URL.createObjectURL(f)) }
                      }}
                    />
                    <span className="text-xs font-semibold px-4 py-2 rounded-full" style={{ background: '#1a4a2e', color: '#faf7f2' }}>
                      📸 Öppna kameran
                    </span>
                  </label>
                </div>
              </div>
            )}
          </>
        )}

        {/* Image preview + results */}
        {preview && (
          <div className="space-y-4">
            <div className="relative overflow-hidden" style={{ borderRadius: '20px', height: '220px', background: '#f0ebe0' }}>
              <Image src={preview} alt="Skannad bild" fill className="object-cover" />
              {state === 'scanning' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                  <div className="w-10 h-10 rounded-full border-4 border-white/30 animate-spin" style={{ borderTopColor: '#fff' }} />
                  <p className="text-white text-sm font-semibold">Analyserar {scanMode === 'receipt' ? 'kvittot' : 'produkten'}…</p>
                </div>
              )}
              {state === 'done' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ background: 'rgba(26,74,46,0.88)', backdropFilter: 'blur(4px)' }}>
                  <span className="text-5xl">✅</span>
                  <p className="text-white text-sm font-semibold">Varor sparade!</p>
                  <p className="text-white/70 text-xs">Skickar dig till kylskåpet…</p>
                </div>
              )}
            </div>

            <button onClick={() => { setPreview(null); setFile(null); setState('idle'); setIngredients([]) }}
              className="text-xs underline" style={{ color: '#a8a29e' }}>
              ← Välj annan bild
            </button>

            {error && (
              <div className="px-4 py-3 rounded-2xl text-sm"
                style={error.startsWith('Demo')
                  ? { background: '#f0f9ff', color: '#0369a1', border: '1px solid rgba(3,105,161,0.2)' }
                  : { background: '#fff7ed', color: '#92400e', border: '1px solid rgba(217,119,6,0.2)' }}>
                {error}
              </div>
            )}

            {state === 'idle' && (
              <button onClick={handleScan} className="w-full py-3.5 rounded-xl text-sm font-semibold" style={{ background: '#1a4a2e', color: '#faf7f2' }}>
                ✨ Hitta varor automatiskt
              </button>
            )}

            {(state === 'results' || state === 'saving') && ingredients.length > 0 && (
              <div className="fade-up space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#78716c' }}>
                    Hittade {ingredients.length} varor
                  </p>
                  <span className="text-lg">🎉</span>
                </div>

                {(['fridge', 'pantry'] as const).map(loc => {
                  const group = ingredients.filter(i => i.location === loc)
                  if (!group.length) return null
                  return (
                    <div key={loc}>
                      <div className="flex items-center gap-2 mb-1.5 px-1">
                        <span className="text-base">{loc === 'fridge' ? '🧊' : '🏠'}</span>
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: loc === 'fridge' ? '#0369a1' : '#92400e' }}>
                          {loc === 'fridge' ? 'Kylskåp' : 'Skafferi'}
                        </span>
                      </div>
                      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${loc === 'fridge' ? 'rgba(3,105,161,0.15)' : 'rgba(146,64,14,0.15)'}` }}>
                        {group.map((ing) => {
                          const globalIdx = ingredients.indexOf(ing)
                          return (
                            <button key={globalIdx} onClick={() => toggleIngredient(globalIdx)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left"
                              style={{
                                background: ing.selected
                                  ? (loc === 'fridge' ? '#f0f9ff' : '#fffbeb')
                                  : '#fff',
                                borderBottom: group.indexOf(ing) < group.length - 1 ? '1px solid rgba(28,25,23,0.05)' : 'none',
                              }}
                            >
                              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 transition-all"
                                style={{ background: ing.selected ? '#1a4a2e' : 'rgba(28,25,23,0.08)', color: '#fff' }}>
                                {ing.selected ? '✓' : ''}
                              </div>
                              <span className="text-xl flex-shrink-0">{ing.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <span className="block text-sm font-semibold truncate" style={{ color: '#1c1917' }}>{ing.name}</span>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span className="text-xs" style={{ color: '#78716c' }}>{ing.category}</span>
                                  {ing.expiry_date && (
                                    <span className="text-xs font-medium" style={{ color: '#d97706' }}>
                                      · Bäst före {ing.expiry_date}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs flex-shrink-0" style={{ color: '#a8a29e' }}>
                                {ing.estimated_quantity} {ing.unit}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                <button onClick={handleSave} disabled={state === 'saving' || !ingredients.some(i => i.selected)}
                  className="w-full py-3.5 rounded-xl text-sm font-semibold"
                  style={{ background: state === 'saving' ? '#a3b8a8' : '#1a4a2e', color: '#faf7f2' }}>
                  {state === 'saving' ? 'Sparar…' : `Lägg till ${ingredients.filter(i => i.selected).length} varor i kylskåpet`}
                </button>
              </div>
            )}

            {state === 'results' && ingredients.length === 0 && (
              <div className="text-center py-6">
                <p className="text-sm font-semibold" style={{ color: '#1c1917' }}>Inga varor hittades</p>
                <p className="text-xs mt-1" style={{ color: '#a8a29e' }}>Prova med en tydligare bild</p>
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px" style={{ background: 'rgba(28,25,23,0.08)' }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#a8a29e' }}>eller</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(28,25,23,0.08)' }} />
        </div>

        {/* Manual add */}
        <button
          onClick={() => setManualOpen(true)}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all active:scale-98"
          style={{
            background: '#fff',
            border: '2px solid rgba(28,25,23,0.08)',
            boxShadow: '0 1px 3px rgba(28,25,23,0.05)',
          }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: '#faf7f2' }}>
            ✏️
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: '#1c1917' }}>Lägg till vara manuellt</p>
            <p className="text-xs mt-0.5" style={{ color: '#78716c' }}>
              Ange namn, mängd, kategori och bäst-före-datum
            </p>
          </div>
          <span className="ml-auto text-lg" style={{ color: '#a8a29e' }}>→</span>
        </button>
      </div>

      <AddItemDialog open={manualOpen} onClose={() => setManualOpen(false)} onAdd={handleManualAdd} />
    </div>
  )
}
