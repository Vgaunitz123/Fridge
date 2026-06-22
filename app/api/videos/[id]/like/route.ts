import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  const { data: existing } = await supabase
    .from('video_likes')
    .select('video_id')
    .eq('video_id', id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    await supabase.from('video_likes').delete().eq('video_id', id).eq('user_id', user.id)
  } else {
    await supabase.from('video_likes').insert({ video_id: id, user_id: user.id })
  }

  const { count } = await supabase
    .from('video_likes')
    .select('video_id', { count: 'exact', head: true })
    .eq('video_id', id)

  return NextResponse.json({ liked: !existing, count: count ?? 0 })
}
