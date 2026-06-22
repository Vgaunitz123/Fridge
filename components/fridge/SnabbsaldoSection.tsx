'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { FridgeItem } from '@/lib/types'

const STAPLES = [
  { name: 'Mjölk',    emoji: '🥛', unit: 'liter', category: 'dairy' },
  { name: 'Ägg',      emoji: '🥚', unit: 'st',    category: 'dairy' },
  { name: 'Smör',     emoji: '🧈', unit: 'förp',  category: 'dairy' },
  { name: 'Ost',      emoji: '🧀', unit: 'förp',  category: 'dairy' },
  { name: 'Bröd',     emoji: '🍞', unit: 'förp',  category: 'bread' },
  { name: 'Yoghurt',  emoji: '🫙', unit: 'förp',  category: 'dairy' },
]

type StapleState = { qty: number; id: string | null }

type Props = {
  items: FridgeItem[]
  onRefresh: () => void
}

export default function SnabbsaldoSection({ items, onRefresh }: Props) {
  const [states, setStates] = useState<Record<string, StapleState>>({})

  useEffect(() => {
    const map: Record<string, StapleState> = {}
    for (const staple of STAPLES) {
      const match = items.find(i => i.name.toLowerCase() === staple.name.toLowerCase())
      map[staple.name] = { qty: match?.quantity ?? 0, id: match?.id ?? null }
    }
    setStates(map)
  }, [items])

  async function adjust(staple: (typeof STAPLES)[0], delta: number) {
    const current = states[staple.name] ?? { qty: 0, id: null }
    const newQty = Math.max(0, current.qty + delta)

    setStates(prev => ({ ...prev, [staple.name]: { ...current, qty: newQty } }))

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (current.id) {
      if (newQty === 0) {
        await supabase.from('fridge_items').delete().eq('id', current.id)
        setStates(prev => ({ ...prev, [staple.name]: { qty: 0, id: null } }))
      } else {
        await supabase.from('fridge_items').update({ quantity: newQty }).eq('id', current.id)
      }
    } else if (newQty > 0) {
      const { data } = await supabase
        .from('fridge_items')
        .insert({ name: staple.name, quantity: newQty, unit: staple.unit, category: staple.category, user_id: user.id, expiry_date: null })
        .select()
        .single()
      if (data) {
        setStates(prev => ({ ...prev, [staple.name]: { qty: newQty, id: data.id } }))
      }
    }
    onRefresh()
  }

  return (
    <div style={{ padding: '0 12px 4px' }}>
      <p style={{
        fontSize: '10px', fontWeight: 700, color: '#9B9B9B',
        textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '8px',
        paddingLeft: '2px',
      }}>
        Snabbsaldo
      </p>
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }} className="no-scrollbar">
        {STAPLES.map(staple => {
          const { qty } = states[staple.name] ?? { qty: 0 }
          const hasStock = qty > 0

          return (
            <div
              key={staple.name}
              style={{
                flexShrink: 0,
                width: '84px',
                background: hasStock ? '#fff' : '#EFEDE8',
                border: `1.5px solid ${hasStock ? 'rgba(0,0,0,0.07)' : 'transparent'}`,
                borderRadius: '14px',
                padding: '10px 8px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                transition: 'background 0.15s, border 0.15s',
                boxShadow: hasStock ? '0 1px 4px rgba(0,0,0,0.07)' : 'none',
              }}
            >
              <span style={{ fontSize: '24px', opacity: hasStock ? 1 : 0.3, transition: 'opacity 0.15s' }}>
                {staple.emoji}
              </span>
              <p style={{ fontSize: '11px', fontWeight: 600, color: hasStock ? '#1A1A1A' : '#AEAAA4', textAlign: 'center', lineHeight: 1.2 }}>
                {staple.name}
              </p>
              <p style={{ fontSize: '14px', fontWeight: 700, color: hasStock ? '#1C3A2A' : '#C8C4BC', lineHeight: 1 }}>
                {qty}
                <span style={{ fontSize: '9px', fontWeight: 500, marginLeft: '2px' }}>{staple.unit}</span>
              </p>
              <div style={{ display: 'flex', gap: '4px', width: '100%', marginTop: '2px' }}>
                <button
                  onClick={() => adjust(staple, -1)}
                  disabled={qty === 0}
                  style={{
                    flex: 1, height: '26px', borderRadius: '7px',
                    background: qty === 0 ? 'rgba(0,0,0,0.04)' : '#F0EDE6',
                    border: 'none', fontSize: '17px', fontWeight: 300,
                    color: qty === 0 ? '#D8D4CC' : '#555',
                    cursor: qty === 0 ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1, paddingBottom: '1px',
                  }}
                >−</button>
                <button
                  onClick={() => adjust(staple, 1)}
                  style={{
                    flex: 1, height: '26px', borderRadius: '7px',
                    background: '#1C3A2A',
                    border: 'none', fontSize: '17px', fontWeight: 300,
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1, paddingBottom: '1px',
                  }}
                >+</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
