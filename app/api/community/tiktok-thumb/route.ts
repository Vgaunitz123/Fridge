import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ thumbnailUrl: null })

  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return NextResponse.json({ thumbnailUrl: null })
    const data = await res.json()
    return NextResponse.json({ thumbnailUrl: data.thumbnail_url ?? null })
  } catch {
    return NextResponse.json({ thumbnailUrl: null })
  }
}
