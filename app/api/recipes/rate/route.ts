import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  const { recipeId, rating, comment } = await req.json()
  if (!recipeId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Ogiltiga parametrar' }, { status: 400 })
  }

  const { error } = await supabase.from('recipe_ratings').upsert(
    { recipe_id: recipeId, user_id: user.id, rating, comment: comment ?? null },
    { onConflict: 'recipe_id,user_id' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, rating })
}
