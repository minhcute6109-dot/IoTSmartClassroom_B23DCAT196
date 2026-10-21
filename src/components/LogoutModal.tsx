interface LogoutModalProps {
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Modal popup xác nhận khi người dùng bấm nút Đăng xuất.
 */
export default function LogoutModal({ onConfirm, onCancel }: LogoutModalProps) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        background: "rgba(15,23,42,0.25)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#ffffff",
          borderRadius: 14,
          boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
          width: 380,
          padding: "28px 28px 22px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              flexShrink: 0,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#dc2626"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 16,
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: 5,
              }}
            >
              Đăng xuất
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#64748b",
                fontFamily: "'Inter', sans-serif",
                lineHeight: 1.5,
              }}
            >
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            borderTop: "1px solid rgba(0,0,0,0.06)",
            paddingTop: 18,
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "1px solid rgba(37,99,235,0.15)",
              background: "transparent",
              color: "#475569",
              fontSize: 12,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, #dc2626, #b91c1c)",
              color: "#ffffff",
              fontSize: 12,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(220,38,38,0.28)",
            }}
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  )
}
