'use client'

import { useState } from 'react'
import FeedPost from '@/components/social/FeedPost'

const DEMO_POSTS = [
  {
    id: 'demo-1',
    title: 'Kyckling med pesto och pasta',
    description: 'En enkel vardagsrätt med vad som finns hemma',
    emoji: '🍝',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
    author: 'Anna K.',
    cookTime: 25,
    tags: ['Snabb', 'Barnvänlig'],
    caption: 'Räddade kycklingfilén som var på väg att gå ut! Perfekt med pesto.',
    likesCount: 42,
    userLiked: false,
  },
  {
    id: 'demo-2',
    title: 'Kylskåpsfrittata',
    description: 'Ägg och grönsaker du har hemma – enkelt och gott',
    emoji: '🍳',
    gradient: 'linear-gradient(135deg, #fde68a 0%, #f59e0b 100%)',
    author: 'Erik S.',
    cookTime: 20,
    tags: ['Vegetariskt', 'Proteinrikt'],
    caption: 'Använde sista äggen och lite resterna i kylen. Grymt bra!',
    likesCount: 28,
    userLiked: false,
  },
  {
    id: 'demo-3',
    title: 'Halloumi med sommarsallad',
    description: 'Perfekt för en varm sommarkväll',
    emoji: '🥗',
    gradient: 'linear-gradient(135deg, #34d399 0%, #0d9488 100%)',
    author: 'Sara L.',
    cookTime: 15,
    tags: ['Sommar', 'Vegetariskt'],
    caption: 'Halloumi är alltid rätt. Kombinerat med resten av kransen från helgen!',
    likesCount: 67,
    userLiked: true,
  },
  {
    id: 'demo-4',
    title: 'Laxpanna med dill och potatis',
    description: 'Klassisk svensk kombination',
    emoji: '🐟',
    gradient: 'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)',
    author: 'Magnus B.',
    cookTime: 30,
    tags: ['Klassisk', 'Hållbar'],
    caption: 'Laxen var på väg ut så jag svängde ihop det här på 30 min!',
    likesCount: 54,
    userLiked: false,
  },
  {
    id: 'demo-5',
    title: 'Snabb bönsoppa',
    description: 'Billig, snabb och mättande',
    emoji: '🫘',
    gradient: 'linear-gradient(135deg, #a3e635 0%, #16a34a 100%)',
    author: 'Fatima A.',
    cookTime: 20,
    tags: ['Veganskt', 'Budget'],
    caption: 'Konservburkar i all ära – den här soppan är bättre än den ser ut!',
    likesCount: 31,
    userLiked: false,
  },
]

export default function FeedPage() {
  const [posts, setPosts] = useState(DEMO_POSTS)

  function handleLike(id: string) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, userLiked: !p.userLiked, likesCount: p.userLiked ? p.likesCount - 1 : p.likesCount + 1 }
          : p
      )
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="px-5 pt-8 pb-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#d4850a' }}>
              Dagens inspiration
            </p>
            <h1 className="text-3xl font-bold leading-tight" style={{ fontFamily: 'var(--font-playfair)', color: '#1c1917' }}>
              Matflödet
            </h1>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: '#1a4a2e' }}>
            🌿
          </div>
        </div>

        {/* Seasonal banner */}
        <div className="mt-4 px-4 py-3 rounded-2xl flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '1px solid rgba(212,133,10,0.2)' }}>
          <span className="text-2xl">☀️</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#92400e' }}>Sommarsäsongen är här!</p>
            <p className="text-xs mt-0.5" style={{ color: '#b45309' }}>Jordgubbar, halloumi & grillade grönsaker</p>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="px-4 space-y-4 pb-4">
        {posts.map((post, i) => (
          <div key={post.id} className="fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
            <FeedPost {...post} onLike={handleLike} />
          </div>
        ))}

        <div className="text-center py-6 text-sm" style={{ color: '#a8a29e' }}>
          ✦ Laga något och dela med communityn ✦
        </div>
      </div>
    </div>
  )
}
