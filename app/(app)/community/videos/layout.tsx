// Videos-sidan är helt fullskärm – ingen padding, ingen nav
export default function VideosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      {children}
    </div>
  )
}
