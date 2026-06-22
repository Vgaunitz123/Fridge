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

  const { recipeId } = await req.json()
  if (!recipeId) return NextResponse.json({ error: 'recipeId saknas' }, { status: 400 })

  const { data: existing } = await supabase
    .from('recipe_likes')
    .select('recipe_id')
    .eq('recipe_id', recipeId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    await supabase.from('recipe_likes').delete().eq('recipe_id', recipeId).eq('user_id', user.id)
    return NextResponse.json({ liked: false })
  } else {
    await supabase.from('recipe_likes').insert({ recipe_id: recipeId, user_id: user.id })
    return NextResponse.json({ liked: true })
  }
}
