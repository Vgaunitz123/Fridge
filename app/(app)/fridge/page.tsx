'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { FridgeItem } from '@/lib/types'
import AddItemDialog from '@/components/fridge/AddItemDialog'
import SnabbsaldoSection from '@/components/fridge/SnabbsaldoSection'
import Link from 'next/link'
import { differenceInDays } from 'date-fns'

const CATEGORY_EMOJI: Record<string, string> = {
  dairy: '🥛', meat: '🥩', vegetable: '🥦', fruit: '🍎',
  bread: '🍞', pantry: '🧂', other: '🥡',
  frozen_meat: '🥩', frozen_vegetable: '🥦', frozen_ready: '🍱', frozen_other: '❄️',
}

const FRIDGE_CATEGORIES = ['dairy', 'meat', 'vegetable', 'fruit', 'other']
const PANTRY_CATEGORIES = ['bread', 'pantry']
const FREEZER_CATEGORIES = ['frozen_meat', 'frozen_vegetable', 'frozen_ready', 'frozen_other']

const FRIDGE_SHELVES = [
  { id: 'dairy', label: 'Mejeri & Ägg',     categories: ['dairy'] },
  { id: 'meat',  label: 'Kött & Fisk',       categories: ['meat'] },
  { id: 'veg',   label: 'Grönsaker & Frukt', categories: ['vegetable', 'fruit'] },
  { id: 'other', label: 'Övrigt',            categories: ['other'] },
]

const PANTRY_SHELVES = [
  { id: 'bread',  label: 'Torrvaror & Bröd',   categories: ['bread'] },
  { id: 'pantry', label: 'Konserver & Kryddor', categories: ['pantry'] },
]

const FREEZER_SHELVES = [
  { id: 'frozen_meat', label: 'Kött & Fisk',   categories: ['frozen_meat'] },
  { id: 'frozen_veg',  label: 'Grönsaker',      categories: ['frozen_vegetable'] },
  { id: 'frozen_ready',label: 'Färdigrätter',   categories: ['frozen_ready'] },
  { id: 'frozen_other',label: 'Övrigt',         categories: ['frozen_other'] },
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
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        border: '1px solid rgba(0,0,0,0.06)',
        cursor: 'default',
      }}
    >
      <span style={{ fontSize: '15px', lineHeight: 1 }}>{emoji}</span>
      <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A1A', whiteSpace: 'nowrap' }}>
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

type Tab = 'fridge' | 'pantry' | 'freezer'

export default function FridgePage({ initialTab = 'fridge' }: { initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([])
  const [pantryItems, setPantryItems] = useState<FridgeItem[]>([])
  const [freezerItems, setFreezerItems] = useState<FridgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchItems = useCallback(async () => {
    const supabase = createClient()
    const [{ data: fridge }, { data: pantry }, { data: freezer }] = await Promise.all([
      supabase.from('fridge_items').select('*').in('category', FRIDGE_CATEGORIES).order('name'),
      supabase.from('fridge_items').select('*').in('category', PANTRY_CATEGORIES).order('name'),
      supabase.from('fridge_items').select('*').in('category', FREEZER_CATEGORIES).order('name'),
    ])
    setFridgeItems(fridge ?? [])
    setPantryItems(pantry ?? [])
    setFreezerItems(freezer ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  async function deleteItem(id: string) {
    const supabase = createClient()
    await supabase.from('fridge_items').delete().eq('id', id)
    setFridgeItems(prev => prev.filter(i => i.id !== id))
    setPantryItems(prev => prev.filter(i => i.id !== id))
    setFreezerItems(prev => prev.filter(i => i.id !== id))
  }

  async function addItem(item: Omit<FridgeItem, 'id' | 'user_id' | 'created_at'>) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('fridge_items').insert({ ...item, user_id: user.id }).select().single()
    if (data) {
      if (PANTRY_CATEGORIES.includes(data.category)) {
        setPantryItems(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      } else if (FREEZER_CATEGORIES.includes(data.category)) {
        setFreezerItems(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      } else {
        setFridgeItems(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      }
    }
    setDialogOpen(false)
  }

  const items = tab === 'fridge' ? fridgeItems : tab === 'pantry' ? pantryItems : freezerItems
  const shelves = tab === 'fridge' ? FRIDGE_SHELVES : tab === 'pantry' ? PANTRY_SHELVES : FREEZER_SHELVES

  const expiringSoon = fridgeItems.filter(i => {
    if (!i.expiry_date) return false
    return differenceInDays(new Date(i.expiry_date), new Date()) <= 2
  })

  const isFridge = tab === 'fridge'
  const isFreezer = tab === 'freezer'

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F3EE' }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-3">
        <div className="flex items-center justify-between mb-4">
          <p style={{ fontSize: '13px', color: '#6B6B6B', fontWeight: 500 }}>
            {loading ? '…' : `${items.length} varor`}
          </p>
        </div>

        {/* Tab toggle */}
        <div
          className="flex p-1"
          style={{ background: '#E8E5DE', borderRadius: '10px' }}
        >
          {([
            { id: 'fridge',  emoji: '🧊', label: 'Kyl' },
            { id: 'pantry',  emoji: '🏠', label: 'Skafferi' },
            { id: 'freezer', emoji: '❄️', label: 'Frys' },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2"
              style={{
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                transition: 'all 0.15s',
                background: tab === t.id ? '#fff' : 'transparent',
                color: tab === t.id ? '#1A1A1A' : '#6B6B6B',
                boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span>{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Snabbsaldo — always visible */}
      <SnabbsaldoSection
        items={[...fridgeItems, ...pantryItems, ...freezerItems]}
        onRefresh={fetchItems}
      />

      {/* Expiry warning — only on fridge tab */}
      {(isFridge || isFreezer) && expiringSoon.length > 0 && (
        <div className="mx-4 mb-2 px-4 py-2.5 flex items-center gap-2"
          style={{ background: '#fff8e6', borderRadius: '8px', border: '1px solid rgba(212,133,10,0.2)' }}>
          <span style={{ fontSize: '14px' }}>⚠️</span>
          <p style={{ fontSize: '12px', color: '#7a4f00', fontWeight: 500 }}>
            {expiringSoon.map(i => i.name).join(', ')} håller på att gå ut
          </p>
        </div>
      )}

      {/* Container */}
      <div
        className="flex-1 mx-3 mb-3 overflow-hidden relative"
        style={isFreezer ? {
          background: 'linear-gradient(180deg, #dceef8 0%, #c8e0f4 40%, #b8d4ee 100%)',
          boxShadow: 'inset 0 2px 10px rgba(255,255,255,0.8), inset 0 -2px 6px rgba(0,60,120,0.1), 0 2px 12px rgba(0,0,0,0.1)',
          border: '1.5px solid #90c0e0',
          borderRadius: '16px',
          minHeight: '400px',
        } : isFridge ? {
          background: 'linear-gradient(180deg, #e8ecef 0%, #dde3e8 40%, #d5dde3 100%)',
          boxShadow: 'inset 0 2px 8px rgba(255,255,255,0.7), inset 0 -2px 6px rgba(0,0,0,0.08), 0 2px 12px rgba(0,0,0,0.1)',
          border: '1.5px solid #c4cfd6',
          borderRadius: '16px',
          minHeight: '400px',
        } : {
          background: 'linear-gradient(180deg, #f0e6d3 0%, #e8d8c0 40%, #dfd0b4 100%)',
          boxShadow: 'inset 0 2px 8px rgba(255,255,255,0.6), 0 2px 12px rgba(0,0,0,0.08)',
          border: '1.5px solid #c8b89a',
          borderRadius: '16px',
          minHeight: '400px',
        }}
      >
        {/* Top light strip */}
        <div style={{ height: '8px', background: isFreezer
          ? 'linear-gradient(90deg, #8ab8d8, #d8f0ff, #c0e4f8, #d8f0ff, #8ab8d8)'
          : isFridge
            ? 'linear-gradient(90deg, #b8cdd8, #e8f4f8, #ddeef5, #e8f4f8, #b8cdd8)'
            : 'linear-gradient(90deg, #c8a882, #e8d4b8, #d4bc96, #e8d4b8, #c8a882)',
          opacity: 0.85 }} />

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="text-5xl animate-pulse">{isFreezer ? '❄️' : isFridge ? '🧊' : '📦'}</div>
            <p style={{ fontSize: '13px', color: '#9a9a9a' }}>Laddar…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2">
            <div className="text-5xl opacity-25">{isFreezer ? '❄️' : isFridge ? '🧊' : '📦'}</div>
            <p style={{ fontSize: '13px', color: '#9a9a9a' }}>
              {isFreezer ? 'Frysen är tom' : isFridge ? 'Kylskåpet är tomt' : 'Skafferiet är tomt'}
            </p>
            <p style={{ fontSize: '12px', color: '#b0b0b0' }}>Lägg till varor nedan</p>
          </div>
        ) : (
          <div>
            {shelves.map((shelf, si) => {
              const shelfItems = items.filter(i => shelf.categories.includes(i.category))
              const isLast = si === shelves.length - 1
              const dividerColor = isFreezer
                ? 'rgba(80,160,220,0.4)'
                : isFridge ? 'rgba(150,195,215,0.5)' : 'rgba(160,120,70,0.3)'
              const shelfLineColor = isFreezer
                ? 'linear-gradient(90deg, transparent, rgba(80,160,220,0.4), rgba(120,190,240,0.6), rgba(80,160,220,0.4), transparent)'
                : isFridge
                  ? 'linear-gradient(90deg, transparent, rgba(150,195,215,0.5), rgba(180,215,230,0.7), rgba(150,195,215,0.5), transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(160,120,70,0.4), rgba(180,140,90,0.6), rgba(160,120,70,0.4), transparent)'
              const labelColor = isFreezer
                ? 'rgba(20,80,140,0.65)'
                : isFridge ? 'rgba(80,120,140,0.75)' : 'rgba(100,70,30,0.65)'

              return (
                <div
                  key={shelf.id}
                  style={{
                    padding: '10px 12px 14px',
                    borderBottom: isLast ? 'none' : `2px solid ${dividerColor}`,
                    background: si % 2 === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
                  }}
                >
                  <p style={{ fontSize: '10px', fontWeight: 700, color: labelColor, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
                    {shelf.label}
                  </p>
                  {shelfItems.length === 0 ? (
                    <div style={{ height: '28px', borderTop: `1px dashed ${dividerColor}`, marginTop: '4px' }} />
                  ) : (
                    <div className="stagger" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {shelfItems.map(item => (
                        <div key={item.id} className="fade-up">
                          <ItemTag item={item} onDelete={deleteItem} />
                        </div>
                      ))}
                    </div>
                  )}
                  {!isLast && (
                    <div style={{ marginTop: '12px', height: '3px', borderRadius: '2px', background: shelfLineColor, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }} />
                  )}
                </div>
              )
            })}
          </div>
        )}
        <div style={{ height: '6px', opacity: 0.4, background: isFreezer ? 'rgba(0,80,160,0.15)' : isFridge ? 'rgba(0,50,80,0.1)' : 'rgba(100,60,20,0.1)' }} />
      </div>

      {/* Bottom buttons */}
      <div className="px-3 pb-28 flex flex-col gap-2">
        <Link
          href="/scan"
          className="pressable flex items-center justify-center gap-2 py-4 text-sm font-semibold"
          style={{ background: '#1C3A2A', color: '#fff', textDecoration: 'none', borderRadius: '8px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01"/></svg>
          Skanna kvitto / AI-foto
        </Link>
        <button
          onClick={() => setDialogOpen(true)}
          className="pressable py-3.5 text-sm font-semibold"
          style={{ background: '#fff', color: '#1A1A1A', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: '8px' }}
        >
          + Lägg till {isFreezer ? 'frysvara' : isFridge ? 'kylvara' : 'skafferivara'} manuellt
        </button>

        {(isFridge || isFreezer) && (
          <div className="flex items-center justify-center gap-4 pt-1">
            {[['#22c55e','OK'],['#d97706','≤5 d'],['#ea580c','≤2 d'],['#dc2626','Gått ut']].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1">
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: c, display: 'inline-block' }} />
                <span style={{ fontSize: '10px', color: '#9aa5a0' }}>{l}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddItemDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdd={addItem}
        defaultCategory={tab === 'pantry' ? 'pantry' : tab === 'freezer' ? 'frozen_other' : 'other'}
      />
    </div>
  )
}
