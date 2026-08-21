import type { Page } from '../types'

interface SidebarProps {
  current: Page
  onChange: (p: Page) => void
}

const nav: { id: Page; label: string; icon: JSX.Element }[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'data-sensor',
    label: 'Data Sensor',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    id: 'action-history',
    label: 'Action History',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export default function Sidebar({ current, onChange }: SidebarProps) {
  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
        height: '100vh',
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 700, fontSize: 13, color: '#2563eb', letterSpacing: '0.05em', lineHeight: 1.2 }}>
              IoT SMART
            </div>
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 400, fontSize: 10, color: '#94a3b8', letterSpacing: '0.08em' }}>
              CLASSROOM
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.5)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>
            SYSTEM ONLINE
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 9, color: '#cbd5e1', letterSpacing: '0.12em', fontFamily: "'JetBrains Mono', monospace", padding: '0 8px 8px' }}>
          NAVIGATION
        </div>
        {nav.map((item) => {
          const active = current === item.id
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                background: active ? 'rgba(37,99,235,0.08)' : 'transparent',
                color: active ? '#2563eb' : '#94a3b8',
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s ease',
                position: 'relative',
                borderLeft: active ? '2px solid #2563eb' : '2px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  ;(e.currentTarget as HTMLButtonElement).style.background = '#f8fafc'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#64748b'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'
                }
              }}
            >
              {item.icon}
              <span>{item.label}</span>
              {active && (
                <div style={{ position: 'absolute', right: 10, width: 4, height: 4, borderRadius: '50%', background: '#2563eb', boxShadow: '0 0 6px rgba(37,99,235,0.5)' }} />
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: 10, color: '#cbd5e1', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6 }}>
          <div>Room: LAB-B204</div>
          <div>v1.0.0 · 2026</div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </aside>
  )
}
