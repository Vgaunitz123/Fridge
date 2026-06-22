'use client'

import { useState } from 'react'
import type { RecipeStep } from '@/lib/types'

export default function CookingSteps({ steps }: { steps: RecipeStep[] }) {
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  function toggleComplete(stepNum: number) {
    setCompletedSteps(prev => {
      const next = new Set(prev)
      next.has(stepNum) ? next.delete(stepNum) : next.add(stepNum)
      return next
    })
  }

  const done = completedSteps.size
  const total = steps.length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Tillagning
        </p>
        {done > 0 && (
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#1C3A2A', background: '#EBF2ED', padding: '2px 10px', borderRadius: '100px' }}>
            {done}/{total} steg klara
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {steps.map(step => {
          const isActive = activeStep === step.step
          const isDone = completedSteps.has(step.step)

          return (
            <div
              key={step.step}
              style={{
                borderRadius: '14px', overflow: 'hidden',
                border: `1.5px solid ${isActive ? '#1C3A2A' : isDone ? '#d1fae5' : 'rgba(0,0,0,0.08)'}`,
                background: isDone ? '#F0F7F2' : isActive ? '#fff' : '#fff',
                transition: 'all 0.2s',
                boxShadow: isActive ? '0 4px 16px rgba(28,58,42,0.12)' : 'none',
              }}
            >
              <div
                onClick={() => setActiveStep(isActive ? null : step.step)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'flex-start', gap: '14px',
                  padding: '16px', background: 'none', cursor: 'pointer', textAlign: 'left',
                }}
              >
                {/* Step number circle */}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                  background: isDone ? '#1C3A2A' : isActive ? '#1C3A2A' : '#F5F3EE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}>
                  {isDone ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <span style={{
                      fontSize: '14px', fontWeight: 700,
                      color: isActive ? '#fff' : '#6B6B6B',
                      fontFamily: 'Georgia, serif',
                    }}>
                      {step.step}
                    </span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: isActive ? '16px' : '14px',
                    lineHeight: 1.6,
                    color: isDone ? '#9B9B9B' : '#1A1A1A',
                    textDecoration: isDone ? 'line-through' : 'none',
                    transition: 'all 0.2s',
                    margin: 0,
                  }}>
                    {step.instruction}
                  </p>

                  {isActive && !isDone && (
                    <button
                      onClick={e => { e.stopPropagation(); toggleComplete(step.step); setActiveStep(null) }}
                      style={{
                        marginTop: '14px',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: '#1C3A2A', color: '#fff',
                        border: 'none', borderRadius: '10px',
                        padding: '10px 18px', fontSize: '13px', fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Markera som klar
                    </button>
                  )}

                  {isDone && (
                    <button
                      onClick={e => { e.stopPropagation(); toggleComplete(step.step) }}
                      style={{
                        marginTop: '8px', fontSize: '12px', color: '#9B9B9B',
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      }}
                    >
                      Ångra
                    </button>
                  )}
                </div>

                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="#C8C8C8" strokeWidth="2"
                  style={{ flexShrink: 0, marginTop: '8px', transform: isActive ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>
          )
        })}
      </div>

      {done === total && total > 0 && (
        <div style={{
          marginTop: '16px', padding: '16px', borderRadius: '14px',
          background: 'linear-gradient(135deg, #1C3A2A, #2D5A3F)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '20px', marginBottom: '4px' }}>🎉</p>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif' }}>
            Receptet är klart!
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
            Smaklig måltid!
          </p>
        </div>
      )}
    </div>
  )
}
