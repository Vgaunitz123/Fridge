import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/claude'

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI-scanning är inte aktiverat ännu.' }, { status: 503 })
  }
  const formData = await request.formData()
  const file = formData.get('image') as File | null

  if (!file) {
    return NextResponse.json({ error: 'Ingen bild skickades' }, { status: 400 })
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Bildformat stöds ej. Använd JPEG, PNG, GIF eller WebP.' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: 'Identifiera alla matvaror som är synliga i bilden. Returnera ett JSON-array med formatet: [{"name": "produktnamn på svenska", "estimated_quantity": 1, "unit": "st"}]. Inkludera bara faktiska matvaror och ingredienser. Om bilden inte innehåller mat, returnera en tom array []. Svara BARA med JSON-arrayen utan markdown eller förklaring.',
          },
        ],
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Oväntat svar från AI' }, { status: 500 })
  }

  try {
    const text = content.text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '')
    const ingredients = JSON.parse(text)
    return NextResponse.json({ ingredients })
  } catch {
    return NextResponse.json({ error: 'Kunde inte tolka ingredienser från bilden' }, { status: 500 })
  }
}
