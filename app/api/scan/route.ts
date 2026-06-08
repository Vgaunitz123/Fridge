import { NextRequest, NextResponse } from 'next/server'

// ─── Category keyword matcher ────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  dairy: [
    'mjölk', 'milk', 'smör', 'butter', 'ost', 'cheese', 'yoghurt', 'yogurt',
    'grädde', 'cream', 'kvarg', 'quark', 'ägg', 'egg', 'filmjölk', 'kefir',
    'kesella', 'ricotta', 'mozzarella', 'brie', 'camembert', 'fetaost', 'feta',
    'parmesan', 'gouda', 'havarti', 'crème fraîche', 'creme fraiche', 'matyoghurt',
  ],
  meat: [
    'kyckling', 'chicken', 'nötkött', 'beef', 'fläsk', 'pork', 'lamm', 'lamb',
    'korv', 'sausage', 'bacon', 'skinka', 'ham', 'köttfärs', 'mince', 'biff', 'steak',
    'lax', 'salmon', 'tonfisk', 'tuna', 'torsk', 'cod', 'fisk', 'fish',
    'räkor', 'shrimp', 'musslor', 'mussels', 'falukorv', 'kassler', 'salami', 'chorizo',
    'kebab', 'entrecôte', 'kycklingfilé', 'laxfilé', 'fläskfilé',
  ],
  vegetable: [
    'morot', 'carrot', 'lök', 'onion', 'tomat', 'tomato', 'gurka', 'cucumber',
    'sallad', 'lettuce', 'broccoli', 'blomkål', 'cauliflower', 'paprika', 'pepper',
    'spenat', 'spinach', 'vitlök', 'garlic', 'purjolök', 'leek', 'zucchini', 'squash',
    'aubergine', 'svamp', 'mushroom', 'rödbeta', 'beet', 'potatis', 'potato',
    'sötpotatis', 'kålrot', 'majs', 'corn', 'ärtor', 'pea', 'bönor', 'bean',
    'linser', 'lentil', 'kikärtor', 'chickpea', 'selleri', 'celery', 'fänkål',
    'ruccola', 'sparris', 'asparagus', 'avokado', 'avocado', 'halloumi',
  ],
  fruit: [
    'äpple', 'apple', 'päron', 'pear', 'banan', 'banana', 'apelsin', 'orange',
    'citron', 'lemon', 'lime', 'jordgubb', 'strawberry', 'hallon', 'raspberry',
    'blåbär', 'blueberry', 'körsbär', 'cherry', 'vindruv', 'grape', 'mango',
    'ananas', 'pineapple', 'vattenmelon', 'watermelon', 'melon', 'persika', 'peach',
    'nektarin', 'plommon', 'plum', 'kiwi', 'papaya', 'passionsfrukt',
  ],
  bread: [
    'bröd', 'bread', 'knäckebröd', 'crispbread', 'pasta', 'spaghetti', 'makaroni',
    'penne', 'rigatoni', 'nudlar', 'noodle', 'ris', 'rice', 'mjöl', 'flour',
    'havregryn', 'oats', 'müsli', 'muesli', 'flingor', 'cereal', 'tortilla',
    'pita', 'bagel', 'bulle', 'kex', 'cracker', 'couscous', 'quinoa', 'bulgur',
  ],
  pantry: [
    'olja', 'oil', 'olivolja', 'rapsolja', 'ketchup', 'senap', 'mustard',
    'majonnäs', 'mayonnaise', 'soja', 'soy', 'vinäger', 'vinegar', 'salt', 'socker',
    'sugar', 'honung', 'honey', 'sylt', 'jam', 'marmelad', 'buljong', 'broth',
    'konserv', 'tomatsås', 'passerade tomater', 'kokosmjölk', 'curry', 'krydda',
    'spice', 'kanel', 'kardemumma', 'bakpulver', 'jäst', 'yeast', 'vanilj', 'vanilla',
  ],
}

const VALID_CATEGORIES = ['dairy', 'meat', 'vegetable', 'fruit', 'bread', 'pantry', 'other']

function guessCategory(name: string): string {
  const lower = name.toLowerCase()
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return category
  }
  return 'other'
}

// ─── Prompts ─────────────────────────────────────────────────────────────────

const RECEIPT_PROMPT = `Det här är ett foto av ett kassakvitto eller matkvitto.
Läs av alla matvaror och returnera ett JSON-array med exakt detta format:
[{"name":"produktnamn på svenska","estimated_quantity":1,"unit":"st","expiry_date":null,"category":"dairy"}]

Regler:
- name: produktens namn på svenska, rent och läsbart (t.ex. "Mjölk 3%", "Smör", "Ägg 6-pack")
- estimated_quantity: antal från kvittot, annars 1
- unit: "st", "kg", "g", "l", "dl" eller "förp"
- expiry_date: bäst-före-datum som YYYY-MM-DD om det syns på kvittot, annars null
- category: en av: "dairy", "meat", "vegetable", "fruit", "bread", "pantry", "other"
  - dairy = mejeri & ägg (mjölk, ost, smör, yoghurt, ägg...)
  - meat = kött & fisk (kyckling, lax, fläsk, korv...)
  - vegetable = grönsaker (morot, lök, tomat, potatis...)
  - fruit = frukt (äpple, banan, apelsin...)
  - bread = bröd & spannmål (bröd, pasta, ris, havregryn...)
  - pantry = skafferivaror (olja, ketchup, kryddor, konserver...)
  - other = övrigt
- Ta med ALLA matvaror, hoppa över icke-livsmedel (påsar, serviceavgifter, pant)
- Svara BARA med JSON-arrayen, ingen markdown, ingen förklaring`

const PRODUCT_PROMPT = `Identifiera alla matvaror i bilden och returnera ett JSON-array med exakt detta format:
[{"name":"produktnamn på svenska","estimated_quantity":1,"unit":"st","expiry_date":null,"category":"dairy"}]

Regler:
- name: produktens namn på svenska
- estimated_quantity: uppskattad mängd
- unit: lämplig enhet (st, kg, g, l, dl, förp)
- expiry_date: bäst-före-datum (YYYY-MM-DD) om det syns tydligt på förpackningen, annars null
- category: en av: "dairy", "meat", "vegetable", "fruit", "bread", "pantry", "other"
- Inkludera bara faktiska matvaror. Tom array [] om ingen mat syns.
- Svara BARA med JSON-arrayen, ingen markdown, ingen förklaring`

// ─── Mock fallback (no API key) ───────────────────────────────────────────────

function mockReceiptItems() {
  return [
    { name: 'Mjölk 1,5%',    estimated_quantity: 1,   unit: 'l',    expiry_date: null, category: 'dairy' },
    { name: 'Smör',          estimated_quantity: 1,   unit: 'förp', expiry_date: null, category: 'dairy' },
    { name: 'Ägg 10-pack',   estimated_quantity: 1,   unit: 'st',   expiry_date: null, category: 'dairy' },
    { name: 'Kycklingfilé',  estimated_quantity: 500, unit: 'g',    expiry_date: null, category: 'meat'  },
    { name: 'Pasta',         estimated_quantity: 500, unit: 'g',    expiry_date: null, category: 'bread' },
    { name: 'Morötter',      estimated_quantity: 500, unit: 'g',    expiry_date: null, category: 'vegetable' },
  ]
}

function mockProductItems() {
  return [
    { name: 'Produkt (demo)', estimated_quantity: 1, unit: 'st', expiry_date: null, category: 'other' },
  ]
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
    const raw = JSON.parse(text)

    const ingredients = raw.map((i: Record<string, unknown>) => {
      const name = String(i.name ?? '')
      const aiCategory = String(i.category ?? '')
      const category = VALID_CATEGORIES.includes(aiCategory) ? aiCategory : guessCategory(name)
      return {
        name,
        estimated_quantity: Number(i.estimated_quantity ?? 1),
        unit: String(i.unit ?? 'st'),
        expiry_date: (i.expiry_date as string | null) ?? null,
        category,
      }
    })

    return NextResponse.json({ ingredients })
  } catch (err) {
    console.error('Scan error:', err)
    return NextResponse.json({ error: 'Kunde inte tolka bilden. Prova en tydligare bild.' }, { status: 500 })
  }
}
