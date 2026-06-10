export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#F5F3EE', overflowY: 'auto' }}>
      {children}
    </div>
  )
}
