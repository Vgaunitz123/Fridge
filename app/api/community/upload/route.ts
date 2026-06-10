import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const MAX_BYTES = 100 * 1024 * 1024 // 100 MB

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const userClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('video') as File | null
  if (!file) return NextResponse.json({ error: 'Ingen fil' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Max 100 MB per video' }, { status: 400 })

  // Use service role client for storage operations
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Ensure bucket exists
  const { error: bucketErr } = await admin.storage.createBucket('videos', { public: true, fileSizeLimit: MAX_BYTES })
  if (bucketErr && !bucketErr.message.includes('already exists')) {
    console.error('Bucket error:', bucketErr)
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'mp4'
  const path = `${user.id}/${Date.now()}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: uploadErr } = await admin.storage
    .from('videos')
    .upload(path, bytes, { contentType: file.type, upsert: false })

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

  const { data: { publicUrl } } = admin.storage.from('videos').getPublicUrl(path)

  // Optional thumbnail
  let thumbnailUrl: string | null = null
  const thumbFile = formData.get('thumbnail') as File | null
  if (thumbFile && thumbFile.size > 0) {
    const thumbPath = `${user.id}/${Date.now()}_thumb.jpg`
    const thumbBytes = await thumbFile.arrayBuffer()
    const { error: thumbErr } = await admin.storage
      .from('videos')
      .upload(thumbPath, thumbBytes, { contentType: 'image/jpeg', upsert: false })
    if (!thumbErr) {
      const { data: { publicUrl: tp } } = admin.storage.from('videos').getPublicUrl(thumbPath)
      thumbnailUrl = tp
    }
  }

  return NextResponse.json({ url: publicUrl, thumbnailUrl })
}
