'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function FridgeIcon({ active }: { active: boolean }) {
  const c = active ? '#1C3A2A' : '#9aa5a0'
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="2" width="16" height="20" rx="3" stroke={c} strokeWidth="1.7"/>
      <line x1="4" y1="9" x2="20" y2="9" stroke={c} strokeWidth="1.7"/>
      <line x1="8" y1="5.5" x2="8" y2="7.5" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
      <line x1="8" y1="12.5" x2="8" y2="16.5" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  )
}

function RecipeIcon({ active }: { active: boolean }) {
  const c = active ? '#1C3A2A' : '#9aa5a0'
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4C4 3 5 2 6 2H18C19 2 20 3 20 4V20C20 21 19 22 18 22H6C5 22 4 21 4 20V4Z" stroke={c} strokeWidth="1.7"/>
      <line x1="8" y1="8" x2="16" y2="8" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
      <line x1="8" y1="12" x2="16" y2="12" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
      <line x1="8" y1="16" x2="12" y2="16" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  )
}

function PantryIcon({ active }: { active: boolean }) {
  const c = active ? '#1C3A2A' : '#9aa5a0'
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="4" rx="1.5" stroke={c} strokeWidth="1.7"/>
      <rect x="3" y="10" width="18" height="4" rx="1.5" stroke={c} strokeWidth="1.7"/>
      <rect x="3" y="17" width="18" height="4" rx="1.5" stroke={c} strokeWidth="1.7"/>
      <line x1="7" y1="5" x2="7" y2="5" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
      <line x1="7" y1="12" x2="7" y2="12" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
      <line x1="7" y1="19" x2="7" y2="19" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  )
}

function CommunityIcon({ active }: { active: boolean }) {
  const c = active ? '#1C3A2A' : '#9aa5a0'
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="7" r="3.2" stroke={c} strokeWidth="1.7"/>
      <path d="M2 20C2 17 5.1 14.5 9 14.5C12.9 14.5 16 17 16 20" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
      <circle cx="17.5" cy="7.5" r="2.5" stroke={c} strokeWidth="1.5"/>
      <path d="M19.5 14.5C21.5 15.2 23 16.8 23 20" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function ProfileIcon({ active }: { active: boolean }) {
  const c = active ? '#1C3A2A' : '#9aa5a0'
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="7.5" r="3.5" stroke={c} strokeWidth="1.7"/>
      <path d="M3 21C3 17.5 7 14.5 12 14.5C17 14.5 21 17.5 21 21" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  )
}

const NAV_ITEMS = [
  { href: '/fridge',    label: 'Kylskåp',   Icon: FridgeIcon },
  { href: '/recipes',   label: 'Recept',    Icon: RecipeIcon },
  { href: '/community', label: 'Community', Icon: CommunityIcon },
  { href: '/profile',   label: 'Profil',    Icon: ProfileIcon },
]

export default function BottomNav() {
  const pathname = usePathname()
  if (pathname === '/community/videos') return null

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 px-3 pb-3">
      <div
        className="flex rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          boxShadow: '0 -1px 0 rgba(28,25,23,0.05), 0 8px 40px rgba(28,25,23,0.14)',
          border: '1px solid rgba(255,255,255,0.7)',
        }}
      >
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center py-3 gap-1 relative pressable"
            >
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-b-full scale-in"
                  style={{ background: '#1C3A2A' }}
                />
              )}
              <Icon active={active} />
              <span
                className="text-xs transition-all"
                style={{
                  color: active ? '#1C3A2A' : '#9aa5a0',
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
