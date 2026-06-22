import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { data: videos, error } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ videos: [], setupRequired: true })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!videos || videos.length === 0) return NextResponse.json({ videos: [] })

  const videoIds = videos.map(v => v.id)
  const { data: likes } = await supabase
    .from('video_likes')
    .select('video_id, user_id')
    .in('video_id', videoIds)

  const likeCountByVideo = new Map<string, number>()
  const userLikedSet = new Set<string>()

  for (const like of likes ?? []) {
    likeCountByVideo.set(like.video_id, (likeCountByVideo.get(like.video_id) ?? 0) + 1)
    if (user && like.user_id === user.id) userLikedSet.add(like.video_id)
  }

  const result = videos.map(v => ({
    ...v,
    likes_count: likeCountByVideo.get(v.id) ?? 0,
    user_liked: userLikedSet.has(v.id),
  }))

  return NextResponse.json({ videos: result })
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  const { videoUrl, thumbnailUrl, caption, recipeId } = await req.json()
  if (!videoUrl) return NextResponse.json({ error: 'videoUrl krävs' }, { status: 400 })

  const authorUsername =
    (user.user_metadata?.full_name as string) ||
    user.email?.split('@')[0] ||
    'anon'

  const { data, error } = await supabase
    .from('videos')
    .insert({
      user_id: user.id,
      author_username: authorUsername,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl ?? null,
      caption: caption ?? '',
      recipe_id: recipeId ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ video: { ...data, likes_count: 0, user_liked: false } })
}
