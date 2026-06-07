import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/claude'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI-receptgenerering är inte aktiverat ännu.' }, { status: 503 })
  }
  const { ingredients, filters } = await request.json()

  if (!ingredients || ingredients.length === 0) {
    return NextResponse.json({ error: 'Inga ingredienser valda' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const filterParts: string[] = []
  if (filters?.maxTime) filterParts.push(`Max ${filters.maxTime} minuters tillagningstid`)
  if (filters?.dietary && filters.dietary !== 'all') filterParts.push(filters.dietary)
  const filterText = filterParts.length > 0 ? `Krav: ${filterParts.join(', ')}.` : ''

  const prompt = `Du är en kreativ svensk matlagningsassistent. Skapa 3 olika recept där dessa ingredienser är stjärnorna: ${ingredients.join(', ')}.
${filterText}

Recepten ska vara realistiska att laga hemma och använda ingredienserna på ett smart sätt för att minska matsvinn.

Returnera ENBART ett JSON-array med exakt 3 recept i detta format (ingen markdown, ingen förklaring):
[
  {
    "title": "Receptnamn på svenska",
    "description": "En mening om rätten",
    "ingredients": [{"name": "ingrediens", "amount": "2", "unit": "dl"}],
    "steps": [{"step": 1, "instruction": "Gör så här..."}],
    "cook_time_minutes": 30,
    "tags": ["Vegetariskt", "Snabb"]
  }
]`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Oväntat svar från AI' }, { status: 500 })
  }

  try {
    const text = content.text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '')
    const recipes = JSON.parse(text)

    if (user) {
      const toInsert = recipes.map((r: Record<string, unknown>) => ({
        ...r,
        created_by: user.id,
      }))
      const { data: saved } = await supabase.from('recipes').insert(toInsert).select()
      if (saved) return NextResponse.json({ recipes: saved })
    }

    return NextResponse.json({ recipes })
  } catch {
    return NextResponse.json({ error: 'Kunde inte tolka recepten' }, { status: 500 })
  }
}
