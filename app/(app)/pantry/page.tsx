'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { FridgeItem } from '@/lib/types'
import AddItemDialog from '@/components/fridge/AddItemDialog'

const CATEGORY_EMOJI: Record<string, string> = {
  bread: '🍞', pantry: '🧂',
}

const PANTRY_CATEGORIES = ['bread', 'pantry']

const SHELVES = [
  { id: 'bread',  label: 'Torrvaror & Bröd',  categories: ['bread'] },
  { id: 'pantry', label: 'Konserver & Kryddor', categories: ['pantry'] },
]

function ItemTag({ item, onDelete }: { item: FridgeItem; onDelete: (id: string) => void }) {
  const emoji = CATEGORY_EMOJI[item.category] ?? '🥡'
  return (
    <div
      className="group relative inline-flex items-center gap-1.5 select-none"
      style={{
        padding: '5px 11px 5px 7px',
        background: '#ffffff',
        borderRadius: '100px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        border: '1px solid rgba(0,0,0,0.06)',
        cursor: 'default',
      }}
    >
      <span style={{ fontSize: '15px', lineHeight: 1 }}>{emoji}</span>
      <span style={{ fontSize: '12px', fontWeight: 600, color: '#111211', whiteSpace: 'nowrap' }}>
        {item.name}
      </span>
      {item.quantity > 1 && (
        <span style={{ fontSize: '11px', color: '#9aa5a0' }}>×{item.quantity}</span>
      )}
      <button
        onClick={() => onDelete(item.id)}
        className="absolute -top-1.5 -right-1 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 rounded-full flex items-center justify-center text-white"
        style={{ background: '#666', fontSize: '9px' }}
      >✕</button>
    </div>
  )
}

export default function PantryPage() {
  const [items, setItems] = useState<FridgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchItems = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('fridge_items')
      .select('*')
      .in('category', PANTRY_CATEGORIES)
      .order('name')
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
    const { data } = await supabase
      .from('fridge_items')
      .insert({ ...item, user_id: user.id })
      .select()
      .single()
    if (data) setItems(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    setDialogOpen(false)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f5f6f4' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-playfair)', color: '#1c1917' }}>
            Skafferi
          </h1>
          <p style={{ fontSize: '13px', color: '#6b6f6b', fontWeight: 500 }}>
            {loading ? '…' : `${items.length} varor`}
          </p>
        </div>
      </div>

      {/* Pantry container */}
      <div className="flex-1 mx-3 mb-3 rounded-2xl overflow-hidden relative" style={{
        background: 'linear-gradient(180deg, #f0e6d3 0%, #e8d8c0 40%, #dfd0b4 100%)',
        boxShadow: 'inset 0 2px 8px rgba(255,255,255,0.6), inset 0 -2px 6px rgba(0,0,0,0.06), 0 2px 12px rgba(0,0,0,0.08)',
        border: '1.5px solid #c8b89a',
        minHeight: '400px',
      }}>
        {/* Wood grain strip at top */}
        <div style={{ height: '8px', background: 'linear-gradient(90deg, #c8a882, #e8d4b8, #d4bc96, #e8d4b8, #c8a882)', opacity: 0.8 }} />

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="text-5xl animate-pulse">📦</div>
            <p style={{ fontSize: '13px', color: '#9a7a5a' }}>Laddar…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2">
            <div className="text-5xl opacity-30">📦</div>
            <p style={{ fontSize: '13px', color: '#9a8068' }}>Skafferiet är tomt</p>
            <p style={{ fontSize: '12px', color: '#b09878' }}>Lägg till torrvaror och konserver</p>
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
                    borderBottom: isLast ? 'none' : '2px solid rgba(160,120,70,0.3)',
                    background: si % 2 === 0
                      ? 'rgba(255,255,255,0.15)'
                      : 'rgba(255,255,255,0.08)',
                  }}
                >
                  <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(100,70,30,0.65)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
                    {shelf.label}
                  </p>

                  {shelfItems.length === 0 ? (
                    <div style={{ height: '28px', borderTop: '1px dashed rgba(160,120,70,0.3)', marginTop: '4px' }} />
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {shelfItems.map(item => (
                        <ItemTag key={item.id} item={item} onDelete={deleteItem} />
                      ))}
                    </div>
                  )}

                  {!isLast && (
                    <div style={{ marginTop: '12px', height: '4px', borderRadius: '2px', background: 'linear-gradient(90deg, transparent, rgba(160,120,70,0.4), rgba(180,140,90,0.6), rgba(160,120,70,0.4), transparent)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div style={{ height: '6px', background: 'linear-gradient(90deg, rgba(100,60,20,0.06), rgba(100,60,20,0.04), rgba(100,60,20,0.06))' }} />
      </div>

      {/* Bottom buttons */}
      <div className="px-3 pb-28 flex flex-col gap-2">
        <button
          onClick={() => setDialogOpen(true)}
          className="py-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: '#1C3A2A', color: '#fff' }}
        >
          + Lägg till skafferivar
        </button>
      </div>

      <AddItemDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdd={addItem}
        defaultCategory="pantry"
      />
    </div>
  )
}
