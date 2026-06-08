'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { FridgeItem } from '@/lib/types'
import AddItemDialog from '@/components/fridge/AddItemDialog'
import Link from 'next/link'
import { differenceInDays } from 'date-fns'

const CATEGORY_EMOJI: Record<string, string> = {
  dairy: '🥛', meat: '🥩', vegetable: '🥦', fruit: '🍎',
  bread: '🍞', pantry: '🧂', other: '🥡',
}

const FRIDGE_CATEGORIES = ['dairy', 'meat', 'vegetable', 'fruit', 'other']

const SHELVES = [
  { id: 'dairy', label: 'Mejeri & Ägg',     categories: ['dairy'] },
  { id: 'meat',  label: 'Kött & Fisk',       categories: ['meat'] },
  { id: 'veg',   label: 'Grönsaker & Frukt', categories: ['vegetable', 'fruit'] },
  { id: 'other', label: 'Övrigt',            categories: ['other'] },
]

function expiryDot(expiry: string | null) {
  if (!expiry) return null
  const d = differenceInDays(new Date(expiry), new Date())
  if (d < 0)  return '#dc2626'
  if (d <= 2)  return '#ea580c'
  if (d <= 5)  return '#d97706'
  return '#22c55e'
}

function ItemTag({ item, onDelete }: { item: FridgeItem; onDelete: (id: string) => void }) {
  const dot = expiryDot(item.expiry_date)
  const emoji = CATEGORY_EMOJI[item.category] ?? '🥡'

  return (
    <div
      className="group relative inline-flex items-center gap-1.5 select-none"
      style={{
        padding: '5px 11px 5px 7px',
        background: '#ffffff',
        borderRadius: '100px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
        border: '1px solid rgba(0,0,0,0.06)',
        cursor: 'default',
      }}
    >
      <span style={{ fontSize: '15px', lineHeight: 1 }}>{emoji}</span>
      <span style={{ fontSize: '12px', fontWeight: 600, color: '#111211', whiteSpace: 'nowrap' }}>
        {item.name}
      </span>
      {dot && (
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dot, flexShrink: 0 }} />
      )}
      <button
        onClick={() => onDelete(item.id)}
        className="absolute -top-1.5 -right-1 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 rounded-full flex items-center justify-center text-white"
        style={{ background: '#666', fontSize: '9px' }}
      >✕</button>
    </div>
  )
}

export default function FridgePage() {
  const [items, setItems] = useState<FridgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchItems = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('fridge_items').select('*').in('category', FRIDGE_CATEGORIES).order('name')
    setItems(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  async function deleteItem(id: string) {
    const supabase = createClient()
    await supabase.from('fridge_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function addItem(item: Omit<FridgeItem, 'id' | 'user_id' | 'created_at'>) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('fridge_items').insert({ ...item, user_id: user.id }).select().single()
    if (data) setItems(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    setDialogOpen(false)
  }

  const expiringSoon = items.filter(i => {
    if (!i.expiry_date) return false
    return differenceInDays(new Date(i.expiry_date), new Date()) <= 2
  })

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f5f6f4' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <div>
          <p style={{ fontSize: '13px', color: '#6b6f6b', fontWeight: 500 }}>
            {loading ? '…' : `${items.length} varor`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button style={{ color: '#111211' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
          <button style={{ color: '#111211' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Expiry warning */}
      {expiringSoon.length > 0 && (
        <div className="mx-4 mb-2 px-4 py-2.5 rounded-xl flex items-center gap-2"
          style={{ background: '#fff3cd', border: '1px solid rgba(212,133,10,0.2)' }}>
          <span style={{ fontSize: '14px' }}>⚠️</span>
          <p style={{ fontSize: '12px', color: '#7a4f00', fontWeight: 500 }}>
            {expiringSoon.map(i => i.name).join(', ')} håller på att gå ut
          </p>
        </div>
      )}

      {/* Fridge container */}
      <div className="flex-1 mx-3 mb-3 rounded-2xl overflow-hidden relative" style={{
        background: 'linear-gradient(180deg, #e8ecef 0%, #dde3e8 40%, #d5dde3 100%)',
        boxShadow: 'inset 0 2px 8px rgba(255,255,255,0.7), inset 0 -2px 6px rgba(0,0,0,0.08), 0 2px 12px rgba(0,0,0,0.1)',
        border: '1.5px solid #c4cfd6',
        minHeight: '460px',
      }}>
        {/* Light strip at top */}
        <div style={{ height: '8px', background: 'linear-gradient(90deg, #b8cdd8, #e8f4f8, #ddeef5, #e8f4f8, #b8cdd8)', opacity: 0.9 }} />

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="text-5xl animate-pulse">🧊</div>
            <p style={{ fontSize: '13px', color: '#7a9aaa' }}>Laddar…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2">
            <div className="text-5xl opacity-30">🧊</div>
            <p style={{ fontSize: '13px', color: '#8aa5b2' }}>Kylskåpet är tomt</p>
            <p style={{ fontSize: '12px', color: '#a0b8c2' }}>Lägg till varor nedan</p>
          </div>
        ) : (
          <div>
            {SHELVES.map((shelf, si) => {
              const shelfItems = items.filter(i => shelf.categories.includes(i.category))
              const isLast = si === SHELVES.length - 1
              return (
                <div
                  key={shelf.id}
                  style={{
                    padding: '10px 12px 14px',
                    borderBottom: isLast ? 'none' : '2px solid rgba(168,200,215,0.5)',
                    background: si % 2 === 0
                      ? 'rgba(255,255,255,0.12)'
                      : 'rgba(255,255,255,0.06)',
                  }}
                >
                  {/* Shelf label */}
                  <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(80,120,140,0.75)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
                    {shelf.label}
                  </p>

                  {shelfItems.length === 0 ? (
                    <div style={{ height: '28px', borderTop: '1px dashed rgba(150,195,215,0.4)', marginTop: '4px' }} />
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {shelfItems.map(item => (
                        <ItemTag key={item.id} item={item} onDelete={deleteItem} />
                      ))}
                    </div>
                  )}

                  {/* Shelf bottom line */}
                  {!isLast && (
                    <div style={{ marginTop: '12px', height: '3px', borderRadius: '2px', background: 'linear-gradient(90deg, transparent, rgba(150,195,215,0.5), rgba(180,215,230,0.7), rgba(150,195,215,0.5), transparent)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Fridge bottom shadow */}
        <div style={{ height: '6px', background: 'linear-gradient(90deg, rgba(0,50,80,0.06), rgba(0,50,80,0.04), rgba(0,50,80,0.06))' }} />
      </div>

      {/* Bottom buttons */}
      <div className="px-3 pb-28 flex flex-col gap-2">
        <Link
          href="/scan"
          className="flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-semibold"
          style={{ background: '#1e3a2a', color: '#fff', textDecoration: 'none' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01"/></svg>
          Skanna konto / Foto kylskåp AI
        </Link>
        <button
          onClick={() => setDialogOpen(true)}
          className="py-3.5 rounded-xl text-sm font-semibold"
          style={{ background: '#fff', color: '#111211', border: '1px solid rgba(0,0,0,0.1)' }}
        >
          + Lägg till vara manuellt
        </button>

        {/* Expiry legend */}
        <div className="flex items-center justify-center gap-4 pt-1">
          {[['#22c55e','OK'],['#d97706','≤5 d'],['#ea580c','≤2 d'],['#dc2626','Gått ut']].map(([c,l]) => (
            <div key={l} className="flex items-center gap-1">
              <span style={{ width:7, height:7, borderRadius:'50%', background:c, display:'inline-block' }} />
              <span style={{ fontSize:'10px', color:'#9aa5a0' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <AddItemDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onAdd={addItem} />
    </div>
  )
}
