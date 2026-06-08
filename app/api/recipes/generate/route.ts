import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// Smart mock generator — works without Anthropic API key
function generateMockRecipes(ingredients: string[], filters: { maxTime?: string; dietary?: string }) {
  const ing = ingredients
  const main = ing[0] ?? 'Ingredienser'
  const secondary = ing[1] ?? 'grönsaker'
  const third = ing[2] ?? 'kryddor'
  const maxTime = filters?.maxTime ? parseInt(filters.maxTime) : 45
  const isVeg = filters?.dietary === 'Vegetariskt' || filters?.dietary === 'Veganskt'

  const recipes = [
    {
      title: `${main} med ${secondary}`,
      description: `En enkel och smakrik rätt med ${ing.slice(0, 3).join(', ')} — perfekt för en vardagsmiddag.`,
      ingredients: [
        ...ing.map(name => ({ name, amount: '200', unit: 'g' })),
        { name: 'Olivolja', amount: '2', unit: 'msk' },
        { name: 'Salt och peppar', amount: '1', unit: 'krm' },
      ],
      steps: [
        { step: 1, instruction: `Förbered alla ingredienser. Skär ${main} i lagom stora bitar.` },
        { step: 2, instruction: `Hetta upp olivolja i en stekpanna på medelhög värme.` },
        { step: 3, instruction: `Tillsätt ${main} och stek i 5–7 minuter tills gyllenbrun.` },
        { step: 4, instruction: `Lägg i ${secondary} och ${third}. Stek ytterligare 3–4 minuter.` },
        { step: 5, instruction: `Smaka av med salt och peppar. Servera direkt.` },
      ],
      cook_time_minutes: Math.min(maxTime, 25),
      tags: isVeg ? ['Vegetariskt', 'Snabb'] : ['Snabb', 'Enkel'],
    },
    {
      title: `${main}-soppa med ${secondary}`,
      description: `En värmande soppa gjord på det du har hemma — ${ing.slice(0, 4).join(', ')}.`,
      ingredients: [
        ...ing.map(name => ({ name, amount: '150', unit: 'g' })),
        { name: 'Grönsaksbuljong', amount: '5', unit: 'dl' },
        { name: 'Grädde', amount: '1', unit: 'dl' },
        { name: 'Vitlök', amount: '2', unit: 'klyftor' },
      ],
      steps: [
        { step: 1, instruction: `Hacka ${main} och ${secondary} grovt.` },
        { step: 2, instruction: `Fräs vitlök i en kastrull med lite olja i 1 minut.` },
        { step: 3, instruction: `Tillsätt ${main} och fräs 3 minuter.` },
        { step: 4, instruction: `Häll på buljong och låt koka 15 minuter.` },
        { step: 5, instruction: `Tillsätt grädde, mixa slät och smaka av. Servera med bröd.` },
      ],
      cook_time_minutes: Math.min(maxTime, 30),
      tags: isVeg ? ['Vegetariskt', 'Värmande'] : ['Klassisk', 'Mättande'],
    },
    {
      title: `Ugnsrostad ${main} med ${secondary} och ${third}`,
      description: `Enkel ugnstilllagning som lyfter smaken på ${ing.slice(0, 3).join(', ')}.`,
      ingredients: [
        ...ing.map(name => ({ name, amount: '250', unit: 'g' })),
        { name: 'Olivolja', amount: '3', unit: 'msk' },
        { name: 'Citron', amount: '1', unit: 'st' },
        { name: 'Rosmarin', amount: '1', unit: 'kvist' },
      ],
      steps: [
        { step: 1, instruction: `Sätt ugnen på 200°C.` },
        { step: 2, instruction: `Skär ${main} i bitar och lägg på en plåt med bakplåtspapper.` },
        { step: 3, instruction: `Tillsätt ${secondary}, ${third} och ringla över olivolja.` },
        { step: 4, instruction: `Rosta i ugnen i 20–25 minuter tills allt är gyllenbrun.` },
        { step: 5, instruction: `Pressa citron över och servera direkt.` },
      ],
      cook_time_minutes: Math.min(maxTime, 35),
      tags: isVeg ? ['Vegetariskt', 'Ugn'] : ['Ugnsbakat', 'Enkelt'],
    },
  ]

  return recipes
}

export async function POST(request: NextRequest) {
  const { ingredients, filters } = await request.json()

  if (!ingredients || ingredients.length === 0) {
    return NextResponse.json({ error: 'Inga ingredienser valda' }, { status: 400 })
  }

  // Use Anthropic API if key is available
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { anthropic } = await import('@/lib/claude')
      const supabase = await createServerSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      const filterParts: string[] = []
      if (filters?.maxTime) filterParts.push(`Max ${filters.maxTime} minuters tillagningstid`)
      if (filters?.dietary && filters.dietary !== 'all') filterParts.push(filters.dietary)
      const filterText = filterParts.length > 0 ? `Krav: ${filterParts.join(', ')}.` : ''

      const prompt = `Du är en kreativ svensk matlagningsassistent. Skapa 3 olika recept där dessa ingredienser är stjärnorna: ${ingredients.join(', ')}.
${filterText}

Returnera ENBART ett JSON-array med exakt 3 recept (ingen markdown, ingen förklaring):
[{"title":"...","description":"...","ingredients":[{"name":"...","amount":"...","unit":"..."}],"steps":[{"step":1,"instruction":"..."}],"cook_time_minutes":30,"tags":["..."]}]`

      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
      })

      const content = message.content[0]
      if (content.type === 'text') {
        const text = content.text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '')
        const recipes = JSON.parse(text)

        if (user) {
          const { data: saved } = await supabase.from('recipes')
            .insert(recipes.map((r: Record<string, unknown>) => ({ ...r, created_by: user.id })))
            .select()
          if (saved) return NextResponse.json({ recipes: saved })
        }
        return NextResponse.json({ recipes })
      }
    } catch (err) {
      console.error('AI generation failed, falling back to mock:', err)
    }
  }

  // Fallback: smart mock generator
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const recipes = generateMockRecipes(ingredients, filters ?? {})

  if (user) {
    const { data: saved } = await supabase.from('recipes')
      .insert(recipes.map(r => ({ ...r, created_by: user.id })))
      .select()
    if (saved) return NextResponse.json({ recipes: saved })
  }

  return NextResponse.json({ recipes })
}
