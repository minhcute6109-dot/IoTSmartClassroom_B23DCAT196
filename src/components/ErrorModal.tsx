import type { SensorRecord } from "../types"
import { formatDateTime } from "../utils/formatters"

interface ErrorModalProps {
  record: SensorRecord
  onClose: () => void
}

/**
 * Modal popup hiển thị nguyên nhân chi tiết khi bản ghi cảm biến có trạng thái "Không hợp lệ".
 */
export default function ErrorModal({ record, onClose }: ErrorModalProps) {
  const details = [
    { label: "Mã bản ghi", value: `#${String(record.id).padStart(3, "0")}` },
    { label: "Tên cảm biến", value: record.sensorName },
    { label: "Loại cảm biến", value: record.sensorType },
    { label: "Giá trị nhận được", value: `${record.value} ${record.unit}` },
    { label: "Thời gian ghi nhận", value: formatDateTime(record.datetime) },
    { label: "Trạng thái", value: "Không hợp lệ", isStatus: true },
  ]

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(15,23,42,0.28)",
        backdropFilter: "blur(2px)",
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
          boxShadow:
            "0 8px 40px rgba(239,68,68,0.14), 0 2px 12px rgba(0,0,0,0.1)",
          width: 460,
          maxWidth: "92vw",
          overflow: "hidden",
        }}
      >
        {/* Header màu đỏ cảnh báo */}
        <div
          style={{
            background: "linear-gradient(135deg, #dc2626, #b91c1c)",
            padding: "16px 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  color: "#fff",
                }}
              >
                Chi tiết lỗi
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.7)",
                  fontFamily: "'Inter', sans-serif",
                  marginTop: 1,
                }}
              >
                Bản ghi #{String(record.id).padStart(3, "0")}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              cursor: "pointer",
              color: "#fff",
              width: 28,
              height: 28,
              borderRadius: 6,
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Nội dung thông tin bản ghi */}
        <div style={{ padding: "20px 22px" }}>
          {details.map(({ label, value, isStatus }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "flex-start",
                padding: "8px 0",
                borderBottom: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <span
                style={{
                  width: 150,
                  fontSize: 11,
                  color: "#64748b",
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: "0.03em",
                  flexShrink: 0,
                }}
              >
                {label}
              </span>
              {isStatus ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "2px 10px",
                    borderRadius: 5,
                    background: "rgba(239,68,68,0.09)",
                    border: "1px solid rgba(239,68,68,0.22)",
                    color: "#dc2626",
                    fontSize: 11,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "#ef4444",
                    }}
                  />
                  {value}
                </span>
              ) : (
                <span
                  style={{
                    fontSize: 12,
                    color: "#1e293b",
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                  }}
                >
                  {value}
                </span>
              )}
            </div>
          ))}

          {/* Khung giải thích nguyên nhân lỗi */}
          <div
            style={{
              marginTop: 14,
              padding: "12px 14px",
              background: "rgba(239,68,68,0.05)",
              border: "1px solid rgba(239,68,68,0.18)",
              borderRadius: 8,
              borderLeft: "3px solid #ef4444",
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "#dc2626",
                fontFamily: "'Inter', sans-serif",
                letterSpacing: "0.06em",
                marginBottom: 6,
              }}
            >
              NGUYÊN NHÂN LỖI
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#334155",
                fontFamily: "'Inter', sans-serif",
                lineHeight: 1.6,
              }}
            >
              {record.errorReason}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 18,
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                border: "none",
                background: "#f1f5f9",
                color: "#475569",
                fontSize: 12,
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
