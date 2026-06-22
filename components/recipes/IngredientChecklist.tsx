'use client'

import { useState } from 'react'
import type { Ingredient } from '@/lib/types'

type Props = {
  ingredients: Ingredient[]
  fridgeMap: Record<string, boolean>
}

export default function IngredientChecklist({ ingredients, fridgeMap }: Props) {
  const [checked, setChecked] = useState<Set<number>>(new Set())

  function toggle(i: number) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const done = checked.size
  const total = ingredients.length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Ingredienser
        </p>
        {done > 0 && (
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#1C3A2A', background: '#EBF2ED', padding: '2px 10px', borderRadius: '100px' }}>
            {done}/{total} klara
          </span>
        )}
      </div>

      <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.07)' }}>
        {ingredients.map((ing, i) => {
          const isChecked = checked.has(i)
          const inFridge = fridgeMap[ing.name.toLowerCase()]
          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                padding: '13px 16px', background: isChecked ? '#F0F7F2' : i % 2 === 0 ? '#fff' : '#FAFAF8',
                borderBottom: i < ingredients.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.1s',
              }}
            >
              {/* Checkbox */}
              <div style={{
                width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                border: `2px solid ${isChecked ? '#1C3A2A' : 'rgba(0,0,0,0.2)'}`,
                background: isChecked ? '#1C3A2A' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}>
                {isChecked && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>

              <span style={{
                flex: 1, fontSize: '15px', color: isChecked ? '#9B9B9B' : '#1A1A1A',
                textDecoration: isChecked ? 'line-through' : 'none',
                transition: 'all 0.15s',
              }}>
                {ing.name}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {inFridge && !isChecked && (
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '2px 7px', borderRadius: '100px' }}>
                    I kylen
                  </span>
                )}
                <span style={{ fontSize: '13px', fontWeight: 600, color: isChecked ? '#9B9B9B' : '#6B6B6B', whiteSpace: 'nowrap' }}>
                  {ing.amount} {ing.unit}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
