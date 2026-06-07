'use client'

import { useState } from 'react'
import Link from 'next/link'

type VideoItem = {
  id: string; kind: 'video'
  title: string; emoji: string; gradient: string
  creator: string; duration: string; views: string; likes: number; tag: string
}
type RecipeItem = {
  id: string; kind: 'recipe'
  title: string; emoji: string; gradient: string
  cookTime: number; tags: string[]; description: string; likes: number
}
type FeedItem = VideoItem | RecipeItem

const FEED: FeedItem[] = [
  { id: 'v1', kind: 'video', title: 'Pasta i en panna — 12 minuter', emoji: '🍝',
    gradient: 'linear-gradient(160deg,#1c1917 0%,#292524 60%,#3d2a1a 100%)',
    creator: 'Anna K.', duration: '0:48', views: '14k', likes: 2341, tag: 'Snabb mat' },
  { id: 'r1', kind: 'recipe', title: 'Kyckling Pesto Pasta', emoji: '🍗',
    gradient: 'linear-gradient(135deg,#f59e0b 0%,#ea580c 100%)',
    cookTime: 25, tags: ['Snabb', 'Barnvänlig'], description: 'Enkel vardagsrätt med pesto', likes: 892 },
  { id: 'r2', kind: 'recipe', title: 'Kylskåpsfrittata', emoji: '🍳',
    gradient: 'linear-gradient(135deg,#fde68a 0%,#f59e0b 100%)',
    cookTime: 20, tags: ['Vegetariskt'], description: 'Ägg och grönsaker du har hemma', likes: 541 },
  { id: 'v2', kind: 'video', title: 'Så skär du lök utan att gråta', emoji: '🧅',
    gradient: 'linear-gradient(160deg,#14532d 0%,#166534 60%,#1a4a2e 100%)',
    creator: 'Erik S.', duration: '0:31', views: '38k', likes: 5102, tag: 'Tips & Tricks' },
  { id: 'r3', kind: 'recipe', title: 'Halloumisallad', emoji: '🥗',
    gradient: 'linear-gradient(135deg,#34d399 0%,#0d9488 100%)',
    cookTime: 15, tags: ['Sommar', 'Vegetariskt'], description: 'Perfekt för en varm kväll', likes: 1203 },
  { id: 'r4', kind: 'recipe', title: 'Laxpanna', emoji: '🐟',
    gradient: 'linear-gradient(135deg,#fb7185 0%,#e11d48 100%)',
    cookTime: 30, tags: ['Klassisk'], description: 'Lax med dill och potatis', likes: 718 },
  { id: 'v3', kind: 'video', title: 'Världens enklaste bröd utan jäst', emoji: '🍞',
    gradient: 'linear-gradient(160deg,#44403c 0%,#57534e 60%,#78350f 100%)',
    creator: 'Sara L.', duration: '1:12', views: '62k', likes: 8830, tag: 'Bakning' },
  { id: 'r5', kind: 'recipe', title: 'Bönsoppa', emoji: '🫘',
    gradient: 'linear-gradient(135deg,#a3e635 0%,#16a34a 100%)',
    cookTime: 20, tags: ['Veganskt', 'Budget'], description: 'Billig, snabb och mättande', likes: 394 },
]

function VideoCard({ item }: { item: VideoItem }) {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(item.likes)
  return (
    <div className="relative rounded-3xl overflow-hidden" style={{ height: '280px', background: item.gradient }}>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 50%)' }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-8xl select-none opacity-50">{item.emoji}</span>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.3)' }}>
          <span className="text-white text-xl ml-1">▶</span>
        </div>
      </div>
      <div className="absolute top-3.5 left-3.5">
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(212,133,10,0.9)', color: '#fff' }}>{item.tag}</span>
      </div>
      <div className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full text-xs font-semibold"
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', color: '#fff' }}>{item.duration}</div>
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-white font-bold text-base leading-snug" style={{ fontFamily: 'var(--font-playfair)' }}>{item.title}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#1a4a2e', color: '#faf7f2' }}>{item.creator[0]}</div>
            <span className="text-white/80 text-xs">{item.creator}</span>
            <span className="text-white/50 text-xs">· {item.views}</span>
          </div>
        </div>
        <button onClick={() => { setLiked(!liked); setCount(c => liked ? c - 1 : c + 1) }} className="flex flex-col items-center gap-0.5">
          <span className="text-2xl" style={{ transform: liked ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.15s' }}>{liked ? '❤️' : '🤍'}</span>
          <span className="text-white/70 text-xs">{count > 999 ? `${(count / 1000).toFixed(1)}k` : count}</span>
        </button>
      </div>
    </div>
  )
}

function SmallRecipeCard({ item }: { item: RecipeItem }) {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(item.likes)
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 1px 3px rgba(28,25,23,0.06),0 4px 12px rgba(28,25,23,0.08)' }}>
      <div className="flex items-center justify-center relative" style={{ height: '100px', background: item.gradient }}>
        <span className="text-5xl drop-shadow select-none">{item.emoji}</span>
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold"
          style={{ background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(8px)', color: '#fff' }}>⏱ {item.cookTime}m</div>
      </div>
      <div className="p-3">
        <h3 className="font-bold text-sm leading-snug" style={{ fontFamily: 'var(--font-playfair)', color: '#1c1917' }}>{item.title}</h3>
        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: '#78716c' }}>{item.description}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#f0fdf4', color: '#1a4a2e' }}>{item.tags[0]}</span>
          <button onClick={() => { setLiked(!liked); setCount(c => liked ? c - 1 : c + 1) }} className="flex items-center gap-1">
            <span className="text-sm">{liked ? '❤️' : '🤍'}</span>
            <span className="text-xs" style={{ color: '#a8a29e' }}>{count}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CommunityPage() {
  const videos = FEED.filter(i => i.kind === 'video') as VideoItem[]
  const recipes = FEED.filter(i => i.kind === 'recipe') as RecipeItem[]

  const blocks: Array<{ type: 'video'; item: VideoItem } | { type: 'pair'; items: RecipeItem[] }> = []
  let vi = 0, ri = 0
  while (vi < videos.length || ri < recipes.length) {
    if (vi < videos.length) blocks.push({ type: 'video', item: videos[vi++] })
    if (ri < recipes.length) { blocks.push({ type: 'pair', items: recipes.slice(ri, ri + 2) }); ri += 2 }
  }

  return (
    <div>
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#d4850a' }}>Idag</p>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-playfair)', color: '#1c1917' }}>Community</h1>
          </div>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#f0fdf4', fontSize: '18px' }}>🔔</div>
        </div>
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {['Allt', 'Video', 'Recept', 'Veganskt', 'Under 30 min'].map((c, i) => (
            <span key={c} className="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 cursor-pointer"
              style={{ background: i === 0 ? '#1a4a2e' : '#f0ebe0', color: i === 0 ? '#faf7f2' : '#78716c' }}>{c}</span>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-4 pb-4">
        {blocks.map((block, i) =>
          block.type === 'video' ? (
            <div key={block.item.id} className="fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <VideoCard item={block.item} />
            </div>
          ) : (
            <div key={i} className="grid grid-cols-2 gap-3 fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
              {block.items.map(r => <SmallRecipeCard key={r.id} item={r} />)}
            </div>
          )
        )}
        <p className="text-center py-4 text-sm" style={{ color: '#a8a29e' }}>✦ Laga något och dela med communityn ✦</p>
      </div>
    </div>
  )
}
