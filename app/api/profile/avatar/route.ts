import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

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
  const file = formData.get('avatar') as File | null
  if (!file) return NextResponse.json({ error: 'Ingen fil' }, { status: 400 })
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Max 5 MB' }, { status: 400 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Ensure bucket exists
  await admin.storage.createBucket('avatars', { public: true, fileSizeLimit: 5 * 1024 * 1024 }).catch(() => {})

  const ext = file.type === 'image/png' ? 'png' : 'jpg'
  const path = `${user.id}/avatar.${ext}`
  const bytes = await file.arrayBuffer()

  const { error } = await admin.storage
    .from('avatars')
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(path)
  return NextResponse.json({ url: publicUrl })
}
