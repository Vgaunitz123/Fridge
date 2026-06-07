import BottomNav from '@/components/nav/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#f5f6f4' }}>
      <div className="max-w-md mx-auto w-full min-h-screen" style={{ background: '#f5f6f4' }}>
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
