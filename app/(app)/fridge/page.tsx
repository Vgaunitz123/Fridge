'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { FridgeItem } from '@/lib/types'
import IngredientCard from '@/components/fridge/IngredientCard'
import AddItemDialog from '@/components/fridge/AddItemDialog'
import Link from 'next/link'
import { differenceInDays } from 'date-fns'

export default function FridgePage() {
  const [items, setItems] = useState<FridgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchItems = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('fridge_items')
      .select('*')
      .order('expiry_date', { ascending: true, nullsFirst: false })
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
    if (data) setItems(prev => [data, ...prev])
    setDialogOpen(false)
  }

  const fridgeItems = items.filter(i => i.category !== 'pantry')
  const pantryItems = items.filter(i => i.category === 'pantry')
  const expiringSoon = fridgeItems.filter(i => {
    if (!i.expiry_date) return false
    return differenceInDays(new Date(i.expiry_date), new Date()) <= 2
  })

  return (
    <div>
      {/* Header */}
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#d4850a' }}>
              Mitt förråd
            </p>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-playfair)', color: '#1c1917' }}>
              Kylskåpet
            </h1>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
            style={{ background: '#1a4a2e', color: '#faf7f2' }}
          >
            <span>+</span> Lägg till
          </button>
        </div>

        {/* Expiry warning */}
        {expiringSoon.length > 0 && (
          <div
            className="mt-4 flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: 'linear-gradient(135deg, #fff7ed, #fef3c7)', border: '1px solid rgba(217,119,6,0.2)' }}
          >
            <span className="text-2xl">⏰</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#92400e' }}>
                {expiringSoon.length} vara{expiringSoon.length > 1 ? 'r' : ''} håller på att gå ut
              </p>
              <Link href="/recipes" className="text-xs underline" style={{ color: '#b45309' }}>
                Hitta ett recept för att rädda dem →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-5xl mb-3 animate-pulse">🧊</div>
            <p className="text-sm" style={{ color: '#a8a29e' }}>Laddar kylskåpet…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-5"
              style={{ background: '#f0fdf4' }}
            >
              🧊
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-playfair)', color: '#1c1917' }}>
              Kylskåpet är tomt
            </h2>
            <p className="text-sm mb-4" style={{ color: '#78716c' }}>Lägg till ingredienser manuellt eller scanna ditt kylskåp</p>
            <Link
              href="/scan"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: '#1a4a2e', color: '#faf7f2' }}
            >
              📷 Scanna kylskåpet
            </Link>
          </div>
        ) : (
          <div className="space-y-6 pb-4">
            {fridgeItems.length > 0 && (
              <div className="fade-up">
                <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: '#a8a29e' }}>
                  Kylskåp — {fridgeItems.length} varor
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {fridgeItems.map(item => (
                    <IngredientCard key={item.id} item={item} onDelete={deleteItem} />
                  ))}
                </div>
              </div>
            )}

            {pantryItems.length > 0 && (
              <div className="fade-up fade-up-2">
                <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: '#a8a29e' }}>
                  Skafferi — {pantryItems.length} varor
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {pantryItems.map(item => (
                    <IngredientCard key={item.id} item={item} onDelete={deleteItem} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AddItemDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onAdd={addItem} />
    </div>
  )
}
