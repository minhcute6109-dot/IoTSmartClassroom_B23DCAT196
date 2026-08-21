function LinkCard({
  icon,
  label,
  description,
  href,
  accent,
}: {
  icon: JSX.Element
  label: string
  description: string
  href: string
  accent: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        background: '#f8fafc',
        border: `1px solid ${accent}18`,
        borderRadius: 9,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: `${accent}14`,
            border: `1px solid ${accent}28`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: accent,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
            {label}
          </div>
          <div style={{ fontSize: 10, color: '#64748b', fontFamily: "'JetBrains Mono', monospace", marginTop: 1 }}>
            {description}
          </div>
        </div>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: '5px 13px',
          borderRadius: 6,
          border: `1px solid ${accent}35`,
          background: `${accent}10`,
          color: accent,
          fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
          textDecoration: 'none',
          letterSpacing: '0.06em',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLAnchorElement).style.background = `${accent}22`
          ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 0 10px ${accent}28`
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLAnchorElement).style.background = `${accent}10`
          ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none'
        }}
      >
        Open ↗
      </a>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
        paddingBottom: 8,
        marginBottom: 8,
      }}
    >
      <span
        style={{
          width: 120,
          fontSize: 9,
          color: '#64748b',
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.08em',
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 12, color: '#334155', fontFamily: "'Inter', sans-serif" }}>{value}</span>
    </div>
  )
}

export default function Profile() {
  return (
    <div
      style={{
        padding: '16px 24px',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 14, flexShrink: 0 }}>
        <h1
          style={{
            fontFamily: "'Exo 2', sans-serif",
            fontSize: 22,
            fontWeight: 700,
            color: '#0f172a',
            margin: 0,
          }}
        >
          Profile
        </h1>
        <div style={{ fontSize: 12, color: '#64748b', fontFamily: "'Inter', sans-serif", fontWeight: 500, marginTop: 1 }}>
          Hồ sơ
        </div>
        <div
          style={{
            fontSize: 10,
            color: '#94a3b8',
            fontFamily: "'JetBrains Mono', monospace",
            marginTop: 2,
          }}
        >
          Thông tin cá nhân &amp; liên kết dự án
        </div>
      </div>

      {/* 3-column grid: avatar | info | links */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '220px 1fr 1fr',
          gap: 14,
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Column 1: Avatar + Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Avatar card */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid rgba(37,99,235,0.1)',
              borderRadius: 12,
              padding: '20px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 50,
                background: 'linear-gradient(135deg, rgba(37,99,235,0.06), rgba(37,99,235,0.04))',
              }}
            />
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563eb, #0066ff)',
                border: '2px solid rgba(37,99,235,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
                boxShadow: '0 0 20px rgba(37,99,235,0.25)',
                position: 'relative',
                zIndex: 1,
                fontFamily: "'Exo 2', sans-serif",
                fontSize: 24,
                fontWeight: 700,
                color: 'white',
              }}
            >
              AM
            </div>
            <div
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                color: '#0f172a',
                marginBottom: 2,
              }}
            >
              Nguyễn Anh Minh
            </div>
            <div
              style={{
                fontSize: 10,
                color: '#2563eb',
                fontFamily: "'JetBrains Mono', monospace",
                marginBottom: 10,
              }}
            >
              IoT Developer
            </div>
            <div
              style={{
                padding: '3px 10px',
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.25)',
                borderRadius: 20,
                fontSize: 8,
                color: '#22c55e',
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.08em',
              }}
            >
              ● ACTIVE STUDENT
            </div>
          </div>

          {/* Stats card */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid rgba(37,99,235,0.1)',
              borderRadius: 12,
              padding: '14px 16px',
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: '#64748b',
                fontFamily: "'JetBrains Mono', monospace",
                marginBottom: 12,
                letterSpacing: '0.1em',
              }}
            >
              THỐNG KÊ DỰ ÁN
            </div>
            {[
              { label: 'Cảm biến', value: '3' },
              { label: 'Thiết bị', value: '3' },
              { label: 'Điểm dữ liệu', value: '1.440' },
              { label: 'Uptime', value: '99.8%' },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '7px 0',
                  borderBottom: '1px solid rgba(0,0,0,0.04)',
                }}
              >
                <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: "'Inter', sans-serif" }}>
                  {s.label}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: '#2563eb',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 600,
                  }}
                >
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Personal info */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid rgba(37,99,235,0.1)',
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: '#64748b',
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: 14,
              letterSpacing: '0.1em',
            }}
          >
            THÔNG TIN CÁ NHÂN
          </div>
          <InfoRow label="HỌ VÀ TÊN" value="Nguyễn Anh Minh" />
          <InfoRow label="MÃ SINH VIÊN" value="B23DCAT196" />
          <InfoRow label="EMAIL" value="MinhNA.B23AT196@stu.ptit.edu.vn" />
          <InfoRow label="NGÀNH" value="An toàn thông tin" />
          <InfoRow label="TRƯỜNG" value="Học viện Công nghệ Bưu chính Viễn thông (PTIT)" />
          <InfoRow label="LỚP" value="INT14149-13" />
          <div style={{ display: 'flex', alignItems: 'center', paddingTop: 4 }}>
            <span
              style={{
                width: 120,
                fontSize: 9,
                color: '#64748b',
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.08em',
                flexShrink: 0,
              }}
            >
              KHÓA HỌC
            </span>
            <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: "'Inter', sans-serif" }}>
              2023 – 2028
            </span>
          </div>

          {/* Spacer + room info */}
          <div style={{ flex: 1 }} />
          <div
            style={{
              marginTop: 16,
              padding: '12px 14px',
              background: 'rgba(37,99,235,0.04)',
              border: '1px solid rgba(37,99,235,0.1)',
              borderRadius: 8,
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: '#64748b',
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.08em',
                marginBottom: 6,
              }}
            >
              PHÒNG PHỤ TRÁCH
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              {[
                { label: 'Phòng', value: 'LAB-B204' },
                { label: 'Tòa nhà', value: 'E3' },
                { label: 'Trạng thái', value: 'Online' },
              ].map((item) => (
                <div key={item.label}>
                  <div style={{ fontSize: 9, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: item.label === 'Trạng thái' ? '#22c55e' : '#94a3b8',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 600,
                      marginTop: 2,
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 3: Project links */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid rgba(37,99,235,0.1)',
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: '#64748b',
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: 14,
              letterSpacing: '0.1em',
            }}
          >
            TÀI NGUYÊN DỰ ÁN
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            <LinkCard
              label="GitHub Repository"
              description="Mã nguồn & tài liệu kỹ thuật"
              href="https://github.com"
              accent="#24292f"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
              }
            />
            <LinkCard
              label="Figma Design"
              description="Prototype & hệ thống thiết kế UI/UX"
              href="https://figma.com"
              accent="#a78bfa"
              icon={
                <svg width="16" height="16" viewBox="0 0 38 57" fill="currentColor">
                  <path d="M19 28.5A9.5 9.5 0 0 1 28.5 19 9.5 9.5 0 0 1 38 28.5 9.5 9.5 0 0 1 28.5 38 9.5 9.5 0 0 1 19 28.5z" opacity=".8" />
                  <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 0 1-19 0z" opacity=".7" />
                  <path d="M19 0v19h9.5a9.5 9.5 0 0 0 0-19H19z" opacity=".6" />
                  <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" opacity=".5" />
                  <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" opacity=".4" />
                </svg>
              }
            />
            <LinkCard
              label="API Documentation"
              description="Tài liệu REST API — Swagger / Postman"
              href="https://swagger.io"
              accent="#22c55e"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="8" y1="13" x2="16" y2="13" />
                  <line x1="8" y1="17" x2="12" y2="17" />
                </svg>
              }
            />
            <LinkCard
              label="PDF Report"
              description="Báo cáo & tài liệu dự án"
              href="#"
              accent="#fb923c"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M9 15v-4h2a2 2 0 0 1 0 4H9zm0 0v2" />
                  <path d="M13 11v6m2-4h-4" />
                  <path d="M17 11v6" />
                </svg>
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
