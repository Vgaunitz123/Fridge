'use client'

import { useState } from 'react'

type Props = {
  title: string
  imageUrl: string | null
}

export default function RecipeHeroImage({ title, imageUrl }: Props) {
  const [error, setError] = useState(false)
  const unsplash = `https://source.unsplash.com/featured/?food,${encodeURIComponent(title)}`
  const src = imageUrl || unsplash

  if (error) return null

  return (
    <img
      src={src}
      alt={title}
      onError={() => setError(true)}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
    />
  )
}
