import { NextRequest, NextResponse } from 'next/server'

const RECEIPT_PROMPT = `Det här är ett foto av ett kassakvitto eller matkvitto.
Läs av alla matvaror och returnera ett JSON-array med exakt detta format:
[{"name":"produktnamn på svenska","estimated_quantity":1,"unit":"st","expiry_date":null}]

Regler:
- name: produktens namn på svenska, ren och läsbar (t.ex. "Mjölk 3%", "Smör", "Ägg 6-pack")
- estimated_quantity: antal (siffran på kvittot, annars 1)
- unit: "st", "kg", "g", "l", "dl", "förp" eller liknande
- expiry_date: bäst-före-datum i ISO-format (YYYY-MM-DD) om det syns på kvittot, annars null
- Ta med ALLA matvaror på kvittot, inte bara några
- Hoppa över icke-livsmedel (t.ex. papperspåsar, serviceavgifter, pantbons)
- Svara BARA med JSON-arrayen, ingen markdown, ingen förklaring`

const PRODUCT_PROMPT = `Identifiera alla matvaror som är synliga i bilden.
Returnera ett JSON-array med exakt detta format:
[{"name":"produktnamn på svenska","estimated_quantity":1,"unit":"st","expiry_date":null}]

Regler:
- name: produktens namn på svenska
- estimated_quantity: uppskattad mängd
- unit: lämplig enhet (st, kg, g, l, dl, förp)
- expiry_date: bäst-före-datum (YYYY-MM-DD) om det syns tydligt på förpackningen, annars null
- Inkludera bara faktiska matvaror
- Om bilden inte innehåller mat, returnera []
- Svara BARA med JSON-arrayen, ingen markdown, ingen förklaring`

function mockReceiptItems() {
  return [
    { name: 'Mjölk 1,5%', estimated_quantity: 1, unit: 'l', expiry_date: null },
    { name: 'Smör', estimated_quantity: 1, unit: 'förp', expiry_date: null },
    { name: 'Ägg 10-pack', estimated_quantity: 1, unit: 'st', expiry_date: null },
    { name: 'Kycklingfilé', estimated_quantity: 500, unit: 'g', expiry_date: null },
    { name: 'Pasta', estimated_quantity: 500, unit: 'g', expiry_date: null },
  ]
}

function mockProductItems() {
  return [
    { name: 'Produkt (demo)', estimated_quantity: 1, unit: 'st', expiry_date: null },
  ]
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('image') as File | null
  const mode = (formData.get('mode') as string) ?? 'product'

  if (!file) {
    return NextResponse.json({ error: 'Ingen bild skickades' }, { status: 400 })
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Bildformat stöds ej. Använd JPEG, PNG, GIF eller WebP.' }, { status: 400 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    const ingredients = mode === 'receipt' ? mockReceiptItems() : mockProductItems()
    return NextResponse.json({ ingredients, mock: true })
  }

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

  try {
    const { anthropic } = await import('@/lib/claude')
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: mode === 'receipt' ? RECEIPT_PROMPT : PRODUCT_PROMPT },
          ],
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Oväntat svar från AI' }, { status: 500 })
    }

    const text = content.text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    const ingredients = JSON.parse(text)

    // Normalise expiry_date — ensure null if missing
    const normalised = ingredients.map((i: Record<string, unknown>) => ({
      name: i.name,
      estimated_quantity: i.estimated_quantity ?? 1,
      unit: i.unit ?? 'st',
      expiry_date: i.expiry_date ?? null,
    }))

    return NextResponse.json({ ingredients: normalised })
  } catch (err) {
    console.error('Scan error:', err)
    return NextResponse.json({ error: 'Kunde inte tolka bilden. Prova en tydligare bild.' }, { status: 500 })
  }
}
