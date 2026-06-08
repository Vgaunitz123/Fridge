import BottomNav from '@/components/nav/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#F5F3EE' }}>
      <div className="max-w-md mx-auto w-full min-h-screen" style={{ background: '#F5F3EE' }}>
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
