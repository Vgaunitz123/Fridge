import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// POST /api/follows/[userId]  — toggle follow for the given user
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId: targetId } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  if (user.id === targetId) return NextResponse.json({ error: 'Kan inte följa dig själv' }, { status: 400 })

  const { data: existing } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('followed_id', targetId)
    .single()

  if (existing) {
    await supabase.from('follows').delete().eq('follower_id', user.id).eq('followed_id', targetId)
  } else {
    await supabase.from('follows').insert({ follower_id: user.id, followed_id: targetId })
  }

  const { count } = await supabase
    .from('follows')
    .select('follower_id', { count: 'exact', head: true })
    .eq('followed_id', targetId)

  return NextResponse.json({ following: !existing, followerCount: count ?? 0 })
}
