'use client'

import { useState } from 'react'
import { FridgeItem } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Props = {
  open: boolean
  onClose: () => void
  onAdd: (item: Omit<FridgeItem, 'id' | 'user_id' | 'created_at'>) => Promise<void>
  defaultCategory?: string
}

const CATEGORIES = [
  { value: 'dairy',     label: '🥛 Mejeri' },
  { value: 'meat',      label: '🥩 Kött & Fisk' },
  { value: 'vegetable', label: '🥦 Grönsaker' },
  { value: 'fruit',     label: '🍎 Frukt' },
  { value: 'bread',     label: '🍞 Bröd' },
  { value: 'pantry',    label: '🧂 Skafferi' },
  { value: 'other',     label: '🥡 Övrigt' },
]

const UNITS = ['st', 'g', 'kg', 'dl', 'liter', 'förp', 'burk', 'påse']

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '12px',
  background: '#faf7f2',
  border: '1.5px solid rgba(28,25,23,0.1)',
  color: '#1c1917',
  fontSize: '14px',
  outline: 'none',
  fontFamily: 'var(--font-dm-sans)',
}

export default function AddItemDialog({ open, onClose, onAdd, defaultCategory = 'other' }: Props) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState('st')
  const [category, setCategory] = useState(defaultCategory)
  const [expiryDate, setExpiryDate] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onAdd({ name, quantity: parseFloat(quantity) || 1, unit, category, expiry_date: expiryDate || null })
    setName(''); setQuantity('1'); setUnit('st'); setCategory('other'); setExpiryDate('')
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-4 rounded-3xl p-6 border-0" style={{ background: '#fff' }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.25rem', color: '#1c1917' }}>
            Lägg till vara
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#78716c' }}>
              Namn
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="T.ex. Kycklingfilé"
              required
              autoFocus
              style={inputStyle}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#78716c' }}>
                Mängd
              </label>
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                min="0"
                step="0.1"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#78716c' }}>
                Enhet
              </label>
              <Select value={unit} onValueChange={v => v && setUnit(v)}>
                <SelectTrigger className="rounded-xl h-11" style={{ background: '#faf7f2', border: '1.5px solid rgba(28,25,23,0.1)' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#78716c' }}>
              Kategori
            </label>
            <Select value={category} onValueChange={v => v && setCategory(v)}>
              <SelectTrigger className="rounded-xl h-11 w-full" style={{ background: '#faf7f2', border: '1.5px solid rgba(28,25,23,0.1)' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#78716c' }}>
              Bäst före (valfritt)
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ background: '#f0ebe0', color: '#44403c' }}
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={saving || !name}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: saving || !name ? '#a3b8a8' : '#1a4a2e',
                color: '#faf7f2',
                cursor: saving || !name ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Sparar…' : 'Lägg till'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
