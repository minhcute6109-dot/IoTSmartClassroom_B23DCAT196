import { useState, useEffect, useRef } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import DataSensor from './pages/DataSensor'
import ActionHistory from './pages/ActionHistory'
import Profile from './pages/Profile'
import Login from './pages/Login'
import type { Page } from './types'

function LogoutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(15,23,42,0.25)',
        backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 14,
          boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
          width: 380, padding: '28px 28px 22px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 5 }}>
              Đăng xuất
            </div>
            <div style={{ fontSize: 13, color: '#64748b', fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 18 }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 20px', borderRadius: 8,
              border: '1px solid rgba(37,99,235,0.15)',
              background: 'transparent', color: '#475569',
              fontSize: 12, fontFamily: "'Inter', sans-serif", fontWeight: 500, cursor: 'pointer',
            }}
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
              color: '#ffffff',
              fontSize: 12, fontFamily: "'Inter', sans-serif", fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(220,38,38,0.28)',
            }}
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [page, setPage] = useState<Page>('dashboard')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showUserMenu) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showUserMenu])

  const handleLogin = (_remember: boolean) => {
    setIsLoggedIn(true)
    setPage('dashboard')
  }

  const handleLogout = () => {
    setShowLogoutModal(false)
    setShowUserMenu(false)
    setIsLoggedIn(false)
    setPage('dashboard')
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard />
      case 'data-sensor': return <DataSensor />
      case 'action-history': return <ActionHistory />
      case 'profile': return <Profile />
    }
  }

  const PAGE_LABELS: Record<Page, string> = {
    dashboard: 'Dashboard',
    'data-sensor': 'Data Sensor',
    'action-history': 'Action History',
    profile: 'Profile',
  }

  return (
    <>
      {showLogoutModal && (
        <LogoutModal
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}

      <div
        style={{
          display: 'flex',
          height: '100vh',
          width: '100vw',
          overflow: 'hidden',
          background: '#f0f4fa',
        }}
      >
        <Sidebar current={page} onChange={setPage} />
        <main
          style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            position: 'relative',
          }}
        >
          {/* Subtle dot grid */}
          <div
            style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'radial-gradient(circle, rgba(37,99,235,0.06) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
              pointerEvents: 'none', zIndex: 0,
            }}
          />

          {/* Top bar */}
          <div
            style={{
              position: 'relative', zIndex: 10,
              height: 52, borderBottom: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 24px', flexShrink: 0,
              background: 'rgba(240,244,250,0.92)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>
                IoT Smart Classroom
              </span>
              <span style={{ color: '#cbd5e1' }}>›</span>
              <span style={{ fontSize: 10, color: '#2563eb', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                {PAGE_LABELS[page]}
              </span>
            </div>

            {/* Right: date + user menu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>
                {new Date().toLocaleDateString('vi-VN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
              </div>

              {/* User menu trigger */}
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowUserMenu((v) => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: showUserMenu ? 'rgba(37,99,235,0.08)' : 'transparent',
                    border: `1px solid ${showUserMenu ? 'rgba(37,99,235,0.2)' : 'transparent'}`,
                    borderRadius: 8, padding: '4px 8px 4px 4px',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontFamily: "'Exo 2', sans-serif", fontWeight: 700,
                    color: 'white', boxShadow: '0 2px 8px rgba(37,99,235,0.3)', flexShrink: 0,
                  }}>
                    AM
                  </div>
                  <span style={{ fontSize: 12, color: '#334155', fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                    Nguyễn Anh Minh
                  </span>
                  <svg
                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                    style={{ color: '#94a3b8', transition: 'transform 0.15s', transform: showUserMenu ? 'rotate(180deg)' : 'none' }}
                  >
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Dropdown */}
                {showUserMenu && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                    background: '#ffffff',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.06)',
                    minWidth: 180, overflow: 'hidden',
                    zIndex: 100,
                  }}>
                    {/* User info header */}
                    <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', fontFamily: "'Inter', sans-serif" }}>
                        Nguyễn Anh Minh
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                        B23DCAT196
                      </div>
                    </div>

                    {/* Menu items */}
                    <div style={{ padding: '6px' }}>
                      <button
                        onClick={() => { setPage('profile'); setShowUserMenu(false) }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 10px', borderRadius: 7, border: 'none',
                          background: 'transparent', cursor: 'pointer', textAlign: 'left',
                          fontSize: 12, color: '#334155', fontFamily: "'Inter', sans-serif",
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        Hồ sơ
                      </button>
                      <button
                        onClick={() => { setShowUserMenu(false); setShowLogoutModal(true) }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 10px', borderRadius: 7, border: 'none',
                          background: 'transparent', cursor: 'pointer', textAlign: 'left',
                          fontSize: 12, color: '#dc2626', fontFamily: "'Inter', sans-serif",
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Page content */}
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
            {renderPage()}
          </div>
        </main>
      </div>
    </>
  )
}
