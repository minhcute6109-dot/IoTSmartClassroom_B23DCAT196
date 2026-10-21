import { useState, useEffect, useRef } from "react"
import Sidebar from "./components/Sidebar"
import LogoutModal from "./components/LogoutModal"
import Dashboard from "./pages/Dashboard"
import DataSensor from "./pages/DataSensor"
import ActionHistory from "./pages/ActionHistory"
import Profile from "./pages/Profile"
import Login from "./pages/Login"
import type { Page } from "./types"
import { clearAllDeviceStoreData } from "./services/deviceControlStore"

const PAGE_LABELS: Record<Page, string> = {
  dashboard: "Dashboard",
  "data-sensor": "Data Sensor",
  "action-history": "Action History",
  profile: "Profile",
}

const AUTH_STORAGE_KEY = "iot_smart_classroom_logged_in"
const PAGE_STORAGE_KEY = "iot_smart_classroom_current_page"

/**
 * Root component
 */
export default function App() {
  // 1. Giữ trạng thái đăng nhập khi F5 (chỉ thoát khi bấm Đăng xuất)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTH_STORAGE_KEY) === "true"
    } catch {
      return false
    }
  })

  // 2. Giữ màn hình hiện tại khi F5 (không bị reset về Dashboard nếu đang xem Data Sensor, Action History...)
  const [currentPage, setCurrentPageState] = useState<Page>(() => {
    try {
      const savedPage = localStorage.getItem(PAGE_STORAGE_KEY) as Page
      if (
        savedPage &&
        ["dashboard", "data-sensor", "action-history", "profile"].includes(
          savedPage,
        )
      ) {
        return savedPage
      }
    } catch {}
    return "dashboard"
  })

  const setCurrentPage = (page: Page) => {
    setCurrentPageState(page)
    try {
      localStorage.setItem(PAGE_STORAGE_KEY, page)
    } catch {}
  }

  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Cập nhật Document Title cho ứng dụng
  useEffect(() => {
    document.title = "IoT Smart Classroom - B23DCAT196"
  }, [])

  // Đóng menu avatar khi người dùng bấm chuột ra ngoài
  useEffect(() => {
    if (!showUserMenu) return
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showUserMenu])

  // Xử lý đăng nhập thành công
  const handleLogin = (_remember: boolean) => {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, "true")
    } catch {}
    setIsLoggedIn(true)
  }

  // Xử lý đăng xuất khỏi hệ thống: Chỉ khi người dùng bấm đăng xuất mới xóa phiên làm việc
  const handleLogout = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      localStorage.removeItem(PAGE_STORAGE_KEY)
      sessionStorage.clear()
      clearAllDeviceStoreData()
    } catch {}
    setShowLogoutModal(false)
    setShowUserMenu(false)
    setIsLoggedIn(false)
    setCurrentPageState("dashboard")
  }

  // Nếu chưa đăng nhập -> hiển thị màn hình Login
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />
  }

  // Hàm render nội dung trang tương ứng
  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />
      case "data-sensor":
        return <DataSensor />
      case "action-history":
        return <ActionHistory />
      case "profile":
        return <Profile />
    }
  }

  return (
    <>
      {/* Modal xác nhận đăng xuất */}
      {showLogoutModal && (
        <LogoutModal
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}

      {/* Bố cục chính của ứng dụng */}
      <div
        style={{
          display: "flex",
          height: "100vh",
          width: "100vw",
          overflow: "hidden",
          background: "#f0f4fa",
        }}
      >
        {/* Menu thanh bên trái */}
        <Sidebar current={currentPage} onChange={setCurrentPage} />

        {/* Khung nội dung bên phải */}
        <main
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            position: "relative",
          }}
        >
          {/* Lưới chấm bi nền mờ */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(circle, rgba(37,99,235,0.06) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          {/* Thanh Topbar phía trên */}
          <div
            style={{
              position: "relative",
              zIndex: 10,
              height: 52,
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 24px",
              flexShrink: 0,
              background: "rgba(240,244,250,0.92)",
              backdropFilter: "blur(8px)",
            }}
          >
            {/* Breadcrumb điều hướng */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  color: "#94a3b8",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                IoT Smart Classroom
              </span>
              <span style={{ color: "#cbd5e1" }}>›</span>
              <span
                style={{
                  fontSize: 10,
                  color: "#2563eb",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                }}
              >
                {PAGE_LABELS[currentPage]}
              </span>
            </div>

            {/* Khối bên phải: Ngày tháng + Menu người dùng */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  fontSize: 10,
                  color: "#94a3b8",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {new Date().toLocaleDateString("vi-VN", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>

              {/* Nút bấm mở Dropdown người dùng */}
              <div ref={userMenuRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setShowUserMenu((v) => !v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: showUserMenu
                      ? "rgba(37,99,235,0.08)"
                      : "transparent",
                    border: `1px solid ${
                      showUserMenu ? "rgba(37,99,235,0.2)" : "transparent"
                    }`,
                    borderRadius: 8,
                    padding: "4px 8px 4px 4px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {/* Avatar AM */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 700,
                      color: "white",
                      boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
                      flexShrink: 0,
                    }}
                  >
                    AM
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: "#334155",
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 500,
                    }}
                  >
                    Nguyễn Anh Minh
                  </span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    style={{
                      color: "#94a3b8",
                      transition: "transform 0.15s",
                      transform: showUserMenu ? "rotate(180deg)" : "none",
                    }}
                  >
                    <path
                      d="M2 4l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      right: 0,
                      background: "#ffffff",
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 10,
                      boxShadow:
                        "0 8px 24px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.06)",
                      minWidth: 180,
                      overflow: "hidden",
                      zIndex: 100,
                    }}
                  >
                    {/* Header thông tin sinh viên */}
                    <div
                      style={{
                        padding: "12px 14px 10px",
                        borderBottom: "1px solid rgba(0,0,0,0.06)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#0f172a",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        Nguyễn Anh Minh
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#94a3b8",
                          fontFamily: "'Inter', sans-serif",
                          marginTop: 2,
                        }}
                      >
                        B23DCAT196
                      </div>
                    </div>

                    {/* Các mục chọn trong Menu */}
                    <div style={{ padding: "6px" }}>
                      <button
                        onClick={() => {
                          setCurrentPage("profile")
                          setShowUserMenu(false)
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 10px",
                          borderRadius: 7,
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          textAlign: "left",
                          fontSize: 12,
                          color: "#334155",
                          fontFamily: "'Inter', sans-serif",
                          transition: "background 0.12s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#f1f5f9")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#64748b"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        Hồ sơ
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          setShowLogoutModal(true)
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 10px",
                          borderRadius: 7,
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          textAlign: "left",
                          fontSize: 12,
                          color: "#dc2626",
                          fontFamily: "'Inter', sans-serif",
                          transition: "background 0.12s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(239,68,68,0.06)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <svg
                          width="14"
                          height="14"
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
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vùng hiển thị nội dung trang (Cho phép cuộn dọc khi thu nhỏ màn hình) */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              position: "relative",
              zIndex: 1,
            }}
          >
            {renderCurrentPage()}
          </div>
        </main>
      </div>
    </>
  )
}
