import { useState } from "react"
import { login, AUTH_TOKEN_KEY } from "../services/api"

interface LoginProps {
  onLogin: (remember: boolean) => void
}

/**
 * Màn hình Đăng nhập hệ thống IoT Smart Classroom.
 */
export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Xử lý khi người dùng nhấn nút Đăng nhập hoặc ấn Enter (Gửi API xác thực JWT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")

    if (!username.trim() || !password.trim()) {
      setErrorMessage("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.")
      return
    }

    setIsLoading(true)

    try {
      const res = await login(username.trim(), password)
      if (res?.token) {
        localStorage.setItem(AUTH_TOKEN_KEY, res.token)
        onLogin(remember)
      } else {
        setErrorMessage(res?.message || "Đăng nhập không thành công.")
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Tên đăng nhập hoặc mật khẩu không chính xác.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f0f4fa",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Nền lưới chấm bi mờ */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage:
            "radial-gradient(circle, rgba(37,99,235,0.07) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Hiệu ứng đốm sáng trang trí */}
      <div
        style={{
          position: "absolute",
          top: -120,
          right: -120,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(37,99,235,0.08), transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -100,
          left: -100,
          width: 350,
          height: 350,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(14,165,233,0.07), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Khung thẻ đăng nhập chính */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          background: "#ffffff",
          border: "1px solid rgba(37,99,235,0.1)",
          borderRadius: 18,
          boxShadow:
            "0 4px 32px rgba(37,99,235,0.08), 0 1px 6px rgba(0,0,0,0.06)",
          width: 420,
          maxWidth: "calc(100vw - 32px)",
          padding: "40px 40px 36px",
        }}
      >
        {/* Logo hệ thống */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
              boxShadow: "0 4px 16px rgba(37,99,235,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 18,
                fontWeight: 800,
                color: "#2563eb",
                letterSpacing: "0.04em",
                lineHeight: 1.1,
              }}
            >
              IoT SMART
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                fontWeight: 500,
                color: "#94a3b8",
                letterSpacing: "0.12em",
              }}
            >
              CLASSROOM
            </div>
          </div>
        </div>

        {/* Tiêu đề & mô tả */}
        <div style={{ marginBottom: 6 }}>
          <h1
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              color: "#0f172a",
              margin: 0,
            }}
          >
            Đăng nhập
          </h1>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              color: "#64748b",
              margin: "6px 0 0",
            }}
          >
            Đăng nhập để quản lý và giám sát hệ thống IoT Smart Classroom.
          </p>
        </div>

        {/* Đường gạch ngang phân cách */}
        <div
          style={{
            height: 1,
            background: "rgba(0,0,0,0.06)",
            margin: "20px 0",
          }}
        />

        {/* Form nhập tài khoản & mật khẩu */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {/* Tên đăng nhập */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: "#475569",
                fontFamily: "'Inter', sans-serif",
                marginBottom: 6,
                letterSpacing: "0.03em",
              }}
            >
              TÊN ĐĂNG NHẬP
            </label>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setErrorMessage("")
                }}
                placeholder="Nhập tên đăng nhập"
                autoComplete="username"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 12px 10px 36px",
                  border: `1px solid ${
                    errorMessage
                      ? "rgba(239,68,68,0.4)"
                      : "rgba(37,99,235,0.15)"
                  }`,
                  borderRadius: 9,
                  background: "#f8fafc",
                  fontSize: 13,
                  fontFamily: "'Inter', sans-serif",
                  color: "#0f172a",
                  outline: "none",
                  transition: "border 0.15s",
                }}
                onFocus={(e) => {
                  if (!errorMessage) {
                    e.currentTarget.style.border =
                      "1px solid rgba(37,99,235,0.5)"
                    e.currentTarget.style.background = "#fff"
                  }
                }}
                onBlur={(e) => {
                  if (!errorMessage) {
                    e.currentTarget.style.border =
                      "1px solid rgba(37,99,235,0.15)"
                    e.currentTarget.style.background = "#f8fafc"
                  }
                }}
              />
            </div>
          </div>

          {/* Mật khẩu */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: "#475569",
                fontFamily: "'Inter', sans-serif",
                marginBottom: 6,
                letterSpacing: "0.03em",
              }}
            >
              MẬT KHẨU
            </label>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setErrorMessage("")
                }}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 40px 10px 36px",
                  border: `1px solid ${
                    errorMessage
                      ? "rgba(239,68,68,0.4)"
                      : "rgba(37,99,235,0.15)"
                  }`,
                  borderRadius: 9,
                  background: "#f8fafc",
                  fontSize: 13,
                  fontFamily: "'Inter', sans-serif",
                  color: "#0f172a",
                  outline: "none",
                  transition: "border 0.15s",
                }}
                onFocus={(e) => {
                  if (!errorMessage) {
                    e.currentTarget.style.border =
                      "1px solid rgba(37,99,235,0.5)"
                    e.currentTarget.style.background = "#fff"
                  }
                }}
                onBlur={(e) => {
                  if (!errorMessage) {
                    e.currentTarget.style.border =
                      "1px solid rgba(37,99,235,0.15)"
                    e.currentTarget.style.background = "#f8fafc"
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showPassword ? (
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Thông báo lỗi khi đăng nhập sai */}
          {errorMessage && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 12px",
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 8,
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#dc2626"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span
                style={{
                  fontSize: 12,
                  color: "#dc2626",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {errorMessage}
              </span>
            </div>
          )}

          {/* Ghi nhớ đăng nhập */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              cursor: "pointer",
              fontSize: 12,
              color: "#475569",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              style={{
                accentColor: "#2563eb",
                width: 14,
                height: 14,
                cursor: "pointer",
              }}
            />
            Ghi nhớ đăng nhập
          </label>

          {/* Nút Submit */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "11px",
              borderRadius: 9,
              border: "none",
              background: isLoading
                ? "rgba(37,99,235,0.6)"
                : "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#ffffff",
              fontSize: 13,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              letterSpacing: "0.04em",
              cursor: isLoading ? "not-allowed" : "pointer",
              boxShadow: isLoading ? "none" : "0 3px 12px rgba(37,99,235,0.3)",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {isLoading ? (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 12 12"
                      to="360 12 12"
                      dur="0.8s"
                      repeatCount="indefinite"
                    />
                  </path>
                </svg>
                Đang xác thực...
              </>
            ) : (
              "Đăng nhập"
            )}
          </button>
        </form>

        {/* Chân trang */}
        <div
          style={{
            marginTop: 24,
            textAlign: "center",
            fontSize: 10,
            color: "#cbd5e1",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          IoT Smart Classroom Management System
        </div>
      </div>
    </div>
  )
}
