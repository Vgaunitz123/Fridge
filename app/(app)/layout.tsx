import BottomNav from '@/components/nav/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#faf7f2' }}>
      <div className="flex-1 max-w-md mx-auto w-full pb-24">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
