import Link from 'next/link'
import { Recipe } from '@/lib/types'

const GRADIENTS = [
  'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
  'linear-gradient(135deg, #34d399 0%, #0d9488 100%)',
  'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)',
  'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
  'linear-gradient(135deg, #fde68a 0%, #f59e0b 100%)',
  'linear-gradient(135deg, #a3e635 0%, #16a34a 100%)',
]

const FOOD_EMOJIS = ['🍝', '🥘', '🫕', '🥗', '🍲', '🫔']

function pick(title: string, arr: string[]) {
  let hash = 0
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash)
  return arr[Math.abs(hash) % arr.length]
}

type Props = { recipe: Recipe; showLink?: boolean }

export default function RecipeCard({ recipe, showLink = true }: Props) {
  const gradient = pick(recipe.title, GRADIENTS)
  const emoji = pick(recipe.title, FOOD_EMOJIS)

  const card = (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200 active:scale-95"
      style={{
        background: '#fff',
        boxShadow: '0 1px 3px rgba(28,25,23,0.06), 0 4px 12px rgba(28,25,23,0.08)',
      }}
    >
      {/* Hero */}
      <div
        className="flex items-center justify-center relative"
        style={{ height: '120px', background: gradient }}
      >
        <span className="text-5xl drop-shadow select-none">{emoji}</span>
        <div
          className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
          style={{ background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(8px)', color: '#fff' }}
        >
          ⏱ {recipe.cook_time_minutes}m
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3
          className="font-bold text-sm leading-snug mb-0.5"
          style={{ fontFamily: 'var(--font-playfair)', color: '#1c1917' }}
        >
          {recipe.title}
        </h3>
        <p className="text-xs line-clamp-2" style={{ color: '#78716c' }}>{recipe.description}</p>

        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {recipe.tags.slice(0, 2).map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: '#f0fdf4', color: '#1a4a2e' }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  if (showLink && recipe.id) return <Link href={`/recipes/${recipe.id}`}>{card}</Link>
  return card
}
