import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Serverkonfiguration saknas' }, { status: 500 })
    }

    const formData = await req.formData()
    const file = formData.get('image') as File | null
    if (!file) return NextResponse.json({ error: 'Ingen fil' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Max 10 MB' }, { status: 400 })

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    )

    await admin.storage.createBucket('images', { public: true, fileSizeLimit: 10 * 1024 * 1024 }).catch(() => {})

    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const path = `${user.id}/${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error } = await admin.storage
      .from('images')
      .upload(path, buffer, { contentType: file.type, upsert: false })

    if (error) return NextResponse.json({ error: `Storage: ${error.message}` }, { status: 500 })

    const { data: { publicUrl } } = admin.storage.from('images').getPublicUrl(path)
    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Okänt fel'
    return NextResponse.json({ error: `Serverfel: ${msg}` }, { status: 500 })
  }
}
