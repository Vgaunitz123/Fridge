import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (!q || q.length < 2) {
    return NextResponse.json({ users: [], recipes: [], videos: [] })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const pat = `%${q}%`

  const [usersRes, recipesRes, videosRes] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('user_id, username, bio, avatar_url')
      .ilike('username', pat)
      .limit(10),
    supabase
      .from('recipes')
      .select('id, title, image_url, cook_time_minutes, tags')
      .ilike('title', pat)
      .limit(10),
    supabase
      .from('videos')
      .select('id, author_username, user_id, caption, thumbnail_url, video_url')
      .or(`caption.ilike.${pat},author_username.ilike.${pat}`)
      .limit(10),
  ])

  return NextResponse.json({
    users:   usersRes.data   ?? [],
    recipes: recipesRes.data ?? [],
    videos:  videosRes.data  ?? [],
  })
}
