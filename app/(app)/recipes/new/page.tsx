'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const AVAILABLE_TAGS = ['Snabbt', 'Vegetarisk', 'Veganskt', 'Barnvänl', 'Glutenfritt', 'Budget', 'Klassisk']
const UNITS = ['st', 'g', 'kg', 'dl', 'liter', 'msk', 'tsk', 'krm', 'förp', 'klyftor', 'kvist']

type Ingredient = { name: string; amount: string; unit: string }
type Step = { instruction: string }

const input = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: '8px',
  background: '#fff',
  border: '1.5px solid rgba(0,0,0,0.12)',
  color: '#1A1A1A',
  fontSize: '15px',
  outline: 'none',
  fontFamily: 'system-ui, sans-serif',
  lineHeight: '1.6',
} as const

export default function NewRecipePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [cookTime, setCookTime] = useState('30')
  const [imageUrl, setImageUrl] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', amount: '', unit: 'st' },
  ])
  const [steps, setSteps] = useState<Step[]>([{ instruction: '' }])

  function toggleTag(tag: string) {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  function updateIngredient(idx: number, field: keyof Ingredient, value: string) {
    setIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing))
  }
  function addIngredient() {
    setIngredients(prev => [...prev, { name: '', amount: '', unit: 'st' }])
  }
  function removeIngredient(idx: number) {
    setIngredients(prev => prev.filter((_, i) => i !== idx))
  }

  function updateStep(idx: number, value: string) {
    setSteps(prev => prev.map((s, i) => i === idx ? { instruction: value } : s))
  }
  function addStep() {
    setSteps(prev => [...prev, { instruction: '' }])
  }
  function removeStep(idx: number) {
    setSteps(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    if (!title.trim()) { setError('Ange ett receptnamn'); return }
    if (ingredients.every(i => !i.name.trim())) { setError('Lägg till minst en ingrediens'); return }
    if (steps.every(s => !s.instruction.trim())) { setError('Lägg till minst ett steg'); return }

    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Du måste vara inloggad'); setSaving(false); return }

    const recipe = {
      title: title.trim(),
      description: description.trim(),
      cook_time_minutes: parseInt(cookTime) || 30,
      image_url: imageUrl.trim() || null,
      tags,
      ingredients: ingredients.filter(i => i.name.trim()).map(i => ({
        name: i.name.trim(),
        amount: i.amount.trim(),
        unit: i.unit,
      })),
      steps: steps.filter(s => s.instruction.trim()).map((s, idx) => ({
        step: idx + 1,
        instruction: s.instruction.trim(),
      })),
      created_by: user.id,
    }

    const { data, error: dbError } = await supabase
      .from('recipes')
      .insert(recipe)
      .select()
      .single()

    if (dbError || !data) {
      setError('Kunde inte spara receptet. Försök igen.')
      setSaving(false)
      return
    }

    router.push(`/recipes/${data.id}`)
  }

  return (
    <div style={{ background: '#F5F3EE', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-6">
        <button
          onClick={() => router.back()}
          style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: '#fff', border: '1.5px solid rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 500, fontSize: '22px', color: '#1A1A1A' }}>
          Lägg upp recept
        </h1>
      </div>

      <div className="px-4 pb-32 space-y-6">

        {/* Grundinfo */}
        <section style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid rgba(0,0,0,0.07)' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '14px' }}>
            Grundinfo
          </p>
          <div className="space-y-3">
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#1A1A1A', display: 'block', marginBottom: '6px' }}>
                Receptnamn *
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="T.ex. Mormors köttbullar"
                style={input}
                autoFocus
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#1A1A1A', display: 'block', marginBottom: '6px' }}>
                Beskrivning
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Berätta lite om receptet…"
                rows={3}
                style={{ ...input, resize: 'vertical' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#1A1A1A', display: 'block', marginBottom: '6px' }}>
                  Tillagningstid (min)
                </label>
                <input
                  type="number"
                  value={cookTime}
                  onChange={e => setCookTime(e.target.value)}
                  min="1"
                  style={input}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#1A1A1A', display: 'block', marginBottom: '6px' }}>
                  Foto-URL (valfritt)
                </label>
                <input
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://…"
                  style={input}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Taggar */}
        <section style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid rgba(0,0,0,0.07)' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '12px' }}>
            Taggar
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {AVAILABLE_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '100px',
                  fontSize: '13px',
                  fontWeight: 500,
                  background: tags.includes(tag) ? '#1C3A2A' : 'transparent',
                  color: tags.includes(tag) ? '#fff' : '#1A1A1A',
                  border: `1.5px solid ${tags.includes(tag) ? '#1C3A2A' : 'rgba(0,0,0,0.18)'}`,
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </section>

        {/* Ingredienser */}
        <section style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid rgba(0,0,0,0.07)' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '14px' }}>
            Ingredienser *
          </p>
          <div className="space-y-2">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  value={ing.name}
                  onChange={e => updateIngredient(idx, 'name', e.target.value)}
                  placeholder="Ingrediens"
                  style={{ ...input, flex: 2 }}
                />
                <input
                  value={ing.amount}
                  onChange={e => updateIngredient(idx, 'amount', e.target.value)}
                  placeholder="Mängd"
                  style={{ ...input, flex: 1 }}
                />
                <select
                  value={ing.unit}
                  onChange={e => updateIngredient(idx, 'unit', e.target.value)}
                  style={{ ...input, flex: 1, appearance: 'none' }}
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                {ingredients.length > 1 && (
                  <button
                    onClick={() => removeIngredient(idx)}
                    style={{ color: '#6B6B6B', flexShrink: 0, fontSize: '18px', lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}
                  >×</button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addIngredient}
            style={{
              marginTop: '10px', width: '100%', padding: '10px',
              borderRadius: '8px', border: '1.5px dashed rgba(0,0,0,0.15)',
              background: 'transparent', color: '#6B6B6B', fontSize: '13px',
              fontWeight: 500, cursor: 'pointer',
            }}
          >
            + Lägg till ingrediens
          </button>
        </section>

        {/* Steg */}
        <section style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid rgba(0,0,0,0.07)' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: '14px' }}>
            Tillagningssteg *
          </p>
          <div className="space-y-3">
            {steps.map((step, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <div
                  style={{
                    width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                    background: '#1C3A2A', color: '#fff', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700, marginTop: '10px',
                  }}
                >
                  {idx + 1}
                </div>
                <textarea
                  value={step.instruction}
                  onChange={e => updateStep(idx, e.target.value)}
                  placeholder={`Steg ${idx + 1}…`}
                  rows={2}
                  style={{ ...input, flex: 1, resize: 'vertical' }}
                />
                {steps.length > 1 && (
                  <button
                    onClick={() => removeStep(idx)}
                    style={{ color: '#6B6B6B', fontSize: '18px', lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', marginTop: '10px' }}
                  >×</button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addStep}
            style={{
              marginTop: '10px', width: '100%', padding: '10px',
              borderRadius: '8px', border: '1.5px dashed rgba(0,0,0,0.15)',
              background: 'transparent', color: '#6B6B6B', fontSize: '13px',
              fontWeight: 500, cursor: 'pointer',
            }}
          >
            + Lägg till steg
          </button>
        </section>

        {error && (
          <p style={{ fontSize: '14px', color: '#dc2626', textAlign: 'center' }}>{error}</p>
        )}

        {/* Spara */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', padding: '15px',
            borderRadius: '8px',
            background: saving ? '#9aada4' : '#1C3A2A',
            color: '#fff', fontSize: '15px', fontWeight: 600,
            border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Sparar…' : 'Publicera recept'}
        </button>
      </div>
    </div>
  )
}
