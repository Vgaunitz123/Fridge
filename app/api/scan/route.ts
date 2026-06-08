import { NextRequest, NextResponse } from 'next/server'

// ─── Map Swedish category labels → DB category values ────────────────────────

const CATEGORY_TO_DB: Record<string, string> = {
  'Mejeri & Ägg':    'dairy',
  'Kött & Fisk':     'meat',
  'Grönsaker & Frukt': 'vegetable',
  'Dryck':           'other',
  'Torrvaror':       'bread',
  'Konserver':       'pantry',
  'Kryddor & Såser': 'pantry',
  'Snacks':          'pantry',
  'Övrigt':          'other',
}

// ─── Keyword fallback for category + location ─────────────────────────────────

const FRIDGE_KEYWORDS: [string, string][] = [
  // [keyword, Swedish category]
  ['mjölk', 'Mejeri & Ägg'], ['milk', 'Mejeri & Ägg'], ['smör', 'Mejeri & Ägg'],
  ['ost', 'Mejeri & Ägg'], ['yoghurt', 'Mejeri & Ägg'], ['grädde', 'Mejeri & Ägg'],
  ['ägg', 'Mejeri & Ägg'], ['egg', 'Mejeri & Ägg'], ['kvarg', 'Mejeri & Ägg'],
  ['filmjölk', 'Mejeri & Ägg'], ['kefir', 'Mejeri & Ägg'], ['crème fraîche', 'Mejeri & Ägg'],
  ['kyckling', 'Kött & Fisk'], ['chicken', 'Kött & Fisk'], ['nöt', 'Kött & Fisk'],
  ['fläsk', 'Kött & Fisk'], ['lax', 'Kött & Fisk'], ['fisk', 'Kött & Fisk'],
  ['korv', 'Kött & Fisk'], ['skinka', 'Kött & Fisk'], ['köttfärs', 'Kött & Fisk'],
  ['räkor', 'Kött & Fisk'], ['bacon', 'Kött & Fisk'], ['biff', 'Kött & Fisk'],
  ['tofu', 'Kött & Fisk'], ['halloumi', 'Kött & Fisk'],
  ['morot', 'Grönsaker & Frukt'], ['lök', 'Grönsaker & Frukt'], ['tomat', 'Grönsaker & Frukt'],
  ['gurka', 'Grönsaker & Frukt'], ['sallad', 'Grönsaker & Frukt'], ['broccoli', 'Grönsaker & Frukt'],
  ['paprika', 'Grönsaker & Frukt'], ['spenat', 'Grönsaker & Frukt'], ['potatis', 'Grönsaker & Frukt'],
  ['äpple', 'Grönsaker & Frukt'], ['banan', 'Grönsaker & Frukt'], ['apelsin', 'Grönsaker & Frukt'],
  ['citron', 'Grönsaker & Frukt'], ['avokado', 'Grönsaker & Frukt'], ['svamp', 'Grönsaker & Frukt'],
  ['juice', 'Dryck'], ['smoothie', 'Dryck'],
]

const PANTRY_KEYWORDS: [string, string][] = [
  ['pasta', 'Torrvaror'], ['ris', 'Torrvaror'], ['mjöl', 'Torrvaror'],
  ['havregryn', 'Torrvaror'], ['bröd', 'Torrvaror'], ['müsli', 'Torrvaror'],
  ['flingor', 'Torrvaror'], ['knäckebröd', 'Torrvaror'], ['couscous', 'Torrvaror'],
  ['quinoa', 'Torrvaror'], ['nudlar', 'Torrvaror'], ['linser', 'Torrvaror'],
  ['bönor', 'Torrvaror'], ['kikärtor', 'Torrvaror'],
  ['konserv', 'Konserver'], ['burk', 'Konserver'], ['tomatsås', 'Konserver'],
  ['kokosmjölk', 'Konserver'], ['tonfisk burk', 'Konserver'],
  ['olja', 'Kryddor & Såser'], ['olivolja', 'Kryddor & Såser'], ['ketchup', 'Kryddor & Såser'],
  ['senap', 'Kryddor & Såser'], ['soja', 'Kryddor & Såser'], ['vinäger', 'Kryddor & Såser'],
  ['salt', 'Kryddor & Såser'], ['socker', 'Kryddor & Såser'], ['krydda', 'Kryddor & Såser'],
  ['peppar', 'Kryddor & Såser'], ['curry', 'Kryddor & Såser'], ['kanel', 'Kryddor & Såser'],
  ['honung', 'Kryddor & Såser'], ['sylt', 'Kryddor & Såser'],
  ['chips', 'Snacks'], ['nötter', 'Snacks'], ['mandel', 'Snacks'],
  ['cashew', 'Snacks'], ['popcorn', 'Snacks'], ['kex', 'Snacks'],
  ['kaffe', 'Torrvaror'], ['te', 'Torrvaror'], ['kakao', 'Torrvaror'],
]

function guessFromKeywords(name: string): { category: string; location: 'fridge' | 'pantry' } {
  const lower = name.toLowerCase()
  for (const [kw, cat] of FRIDGE_KEYWORDS) {
    if (lower.includes(kw)) return { category: cat, location: 'fridge' }
  }
  for (const [kw, cat] of PANTRY_KEYWORDS) {
    if (lower.includes(kw)) return { category: cat, location: 'pantry' }
  }
  return { category: 'Övrigt', location: 'fridge' }
}

// ─── Default emoji per category ───────────────────────────────────────────────

const CATEGORY_EMOJI: Record<string, string> = {
  'Mejeri & Ägg':      '🥛',
  'Kött & Fisk':       '🥩',
  'Grönsaker & Frukt': '🥦',
  'Dryck':             '🥤',
  'Torrvaror':         '🍞',
  'Konserver':         '🥫',
  'Kryddor & Såser':   '🧂',
  'Snacks':            '🍿',
  'Övrigt':            '🥡',
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Du är en smart matassistent. När du får ett kvitto eller en bild på varor ska du:

1. Identifiera alla matvaror
2. Kategorisera varje vara i RÄTT PLATS:
   - "fridge" (kylskåp): mejeri, kött, fisk, färska grönsaker, öppnade produkter, allt som behöver kylas
   - "pantry" (skafferi): torrvaror, konserver, pasta, ris, kryddor, kaffe, te, chips, nötter, olja

3. Returnera ENDAST giltig JSON, inget annat:
{
  "items": [
    {
      "name": "Mjölk 1,5%",
      "category": "Mejeri & Ägg",
      "location": "fridge",
      "emoji": "🥛",
      "quantity": 1,
      "unit": "liter",
      "bestBefore": null
    }
  ]
}

Kategorier att använda:
- Fridge: "Mejeri & Ägg", "Kött & Fisk", "Grönsaker & Frukt", "Dryck", "Övrigt"
- Pantry: "Torrvaror", "Konserver", "Kryddor & Såser", "Snacks", "Övrigt"

Regler:
- Hoppa över icke-livsmedel (kassar, serviceavgifter, pant)
- bestBefore: datum som "YYYY-MM-DD" om det syns, annars null
- unit: "st", "kg", "g", "liter", "dl", "förp" eller liknande
- Välj en passande emoji för varje vara
- Svara ENDAST med JSON-objektet, ingen förklaring, ingen markdown`

// ─── Mock fallback ────────────────────────────────────────────────────────────

function mockItems(mode: string) {
  if (mode === 'receipt') {
    return [
      { name: 'Mjölk 1,5%',   category: 'Mejeri & Ägg',      location: 'fridge',  emoji: '🥛', quantity: 1,   unit: 'liter', bestBefore: null },
      { name: 'Smör',          category: 'Mejeri & Ägg',      location: 'fridge',  emoji: '🧈', quantity: 1,   unit: 'förp',  bestBefore: null },
      { name: 'Ägg 10-pack',   category: 'Mejeri & Ägg',      location: 'fridge',  emoji: '🥚', quantity: 10,  unit: 'st',    bestBefore: null },
      { name: 'Kycklingfilé',  category: 'Kött & Fisk',       location: 'fridge',  emoji: '🍗', quantity: 500, unit: 'g',     bestBefore: null },
      { name: 'Pasta',         category: 'Torrvaror',         location: 'pantry',  emoji: '🍝', quantity: 500, unit: 'g',     bestBefore: null },
      { name: 'Olivolja',      category: 'Kryddor & Såser',   location: 'pantry',  emoji: '🫒', quantity: 1,   unit: 'förp',  bestBefore: null },
    ]
  }
  return [{ name: 'Produkt (demo)', category: 'Övrigt', location: 'fridge' as const, emoji: '🥡', quantity: 1, unit: 'st', bestBefore: null }]
}

// ─── Normalise AI response → internal format ──────────────────────────────────

function normalise(raw: Record<string, unknown>[]) {
  return raw.map(i => {
    const name = String(i.name ?? '')
    const aiCategory = String(i.category ?? '')
    const aiLocation = String(i.location ?? '')
    const guess = guessFromKeywords(name)

    const category = aiCategory in CATEGORY_TO_DB ? aiCategory : guess.category
    const location: 'fridge' | 'pantry' =
      aiLocation === 'fridge' || aiLocation === 'pantry' ? aiLocation : guess.location
    const dbCategory = CATEGORY_TO_DB[category] ?? 'other'
    const emoji = String(i.emoji ?? CATEGORY_EMOJI[category] ?? '🥡')

    return {
      name,
      emoji,
      category,
      location,
      estimated_quantity: Number(i.quantity ?? 1),
      unit: String(i.unit ?? 'st'),
      expiry_date: (i.bestBefore as string | null) ?? null,
      dbCategory,
    }
  })
}

// ─── Route handler ────────────────────────────────────────────────────────────

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
    const ingredients = normalise(mockItems(mode))
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
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: mode === 'receipt' ? 'Analysera detta kvitto.' : 'Analysera bilden och identifiera alla matvaror.' },
          ],
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Oväntat svar från AI' }, { status: 500 })
    }

    const text = content.text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(text)
    const raw: Record<string, unknown>[] = Array.isArray(parsed) ? parsed : parsed.items ?? []
    const ingredients = normalise(raw)

    return NextResponse.json({ ingredients })
  } catch (err) {
    console.error('Scan error:', err)
    return NextResponse.json({ error: 'Kunde inte tolka bilden. Prova en tydligare bild.' }, { status: 500 })
  }
}
