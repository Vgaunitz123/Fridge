import { FridgeItem } from '@/lib/types'
import { differenceInDays } from 'date-fns'

type Props = {
  item: FridgeItem
  onDelete: (id: string) => void
}

function expiryInfo(expiryDate: string | null) {
  if (!expiryDate) return { label: '', bg: 'transparent', color: 'transparent' }
  const days = differenceInDays(new Date(expiryDate), new Date())
  if (days < 0) return { label: 'Gått ut', bg: '#fef2f2', color: '#dc2626' }
  if (days === 0) return { label: 'Idag', bg: '#fef2f2', color: '#dc2626' }
  if (days === 1) return { label: 'Imorgon', bg: '#fff7ed', color: '#ea580c' }
  if (days <= 3) return { label: `${days} dagar`, bg: '#fffbeb', color: '#d97706' }
  return { label: `${days} dagar`, bg: '#f0fdf4', color: '#16a34a' }
}

const CATEGORY_STYLE: Record<string, { emoji: string; bg: string }> = {
  dairy:     { emoji: '🥛', bg: '#eff6ff' },
  meat:      { emoji: '🥩', bg: '#fff1f2' },
  vegetable: { emoji: '🥦', bg: '#f0fdf4' },
  fruit:     { emoji: '🍎', bg: '#fef2f2' },
  bread:     { emoji: '🍞', bg: '#fffbeb' },
  pantry:    { emoji: '🧂', bg: '#f8fafc' },
  other:     { emoji: '🥡', bg: '#faf7f2' },
}

export default function IngredientCard({ item, onDelete }: Props) {
  const { label, bg: expiryBg, color: expiryColor } = expiryInfo(item.expiry_date)
  const { emoji, bg } = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE.other

  return (
    <div
      className="rounded-2xl p-3.5 relative group cursor-default transition-all duration-200"
      style={{
        background: bg,
        border: '1px solid rgba(28,25,23,0.06)',
        boxShadow: '0 1px 2px rgba(28,25,23,0.04)',
      }}
    >
      <button
        onClick={() => onDelete(item.id)}
        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all"
        style={{ background: 'rgba(28,25,23,0.08)', color: '#78716c' }}
        aria-label="Ta bort"
      >
        ✕
      </button>

      <div className="text-2xl mb-2 leading-none">{emoji}</div>
      <p className="font-semibold text-sm leading-tight" style={{ color: '#1c1917' }}>{item.name}</p>
      <p className="text-xs mt-0.5" style={{ color: '#a8a29e' }}>
        {item.quantity} {item.unit}
      </p>

      {label && (
        <div
          className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-xs font-semibold"
          style={{ background: expiryBg, color: expiryColor }}
        >
          {label}
        </div>
      )}
    </div>
  )
}
