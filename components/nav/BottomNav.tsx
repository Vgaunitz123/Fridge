'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', icon: '🍽️', label: 'Flöde' },
  { href: '/fridge', icon: '🧊', label: 'Kylskåp' },
  { href: '/scan', icon: '📷', label: 'Scanna' },
  { href: '/recipes', icon: '👨‍🍳', label: 'Recept' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 px-2 pb-2"
    >
      <div
        className="flex rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          boxShadow: '0 -1px 0 rgba(28,25,23,0.06), 0 8px 32px rgba(28,25,23,0.12)',
          border: '1px solid rgba(255,255,255,0.6)',
        }}
      >
        {navItems.map(({ href, icon, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center py-3 relative transition-colors"
              style={{ color: active ? '#1a4a2e' : '#a8a29e' }}
            >
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full"
                  style={{ background: '#1a4a2e' }}
                />
              )}
              <span className="text-xl leading-none">{icon}</span>
              <span
                className="text-xs mt-1 transition-all"
                style={{
                  fontWeight: active ? 600 : 400,
                  fontFamily: 'var(--font-dm-sans)',
                }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
