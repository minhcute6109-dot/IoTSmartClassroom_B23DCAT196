import { useState, useEffect } from "react"

import type {
  ActionApiStatus,
  ActionRecord,
  ActionStatus,
  DeviceAction,
  DeviceName,
  SortDirection,
} from "../types"

import { formatDateTime } from "../utils/formatters"

import { getHistory } from "../services/api"
import {
  onActionUpdated,
  offActionUpdated,
  onDeviceStateChanged,
  offDeviceStateChanged,
} from "../services/socket"

const DEFAULT_PAGE_SIZE = 10

type SortKey = "id" | "device" | "action" | "status" | "datetime"

type StatusFilter = "" | "ON" | "OFF" | "PENDING" | "FAILED"

type DeviceFilter = "" | DeviceName

type ActionFilter = "" | DeviceAction

const SORT_KEY_API_MAP: Record<SortKey, "id" | "device" | "action" | "status" | "time"> =
  {
    id: "id",

    device: "device",

    action: "action",

    status: "status",

    datetime: "time",
  }

function SearchIcon() {
  return (
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
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function ChevronDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path
        d="M2 3.5L5 6.5L8 3.5"
        stroke="#64748b"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DeviceBadge({ device }: { device: ActionRecord["device"] }) {
  /* =========================================================================
   * ========================================================================= */
  const colors: Record<string, string> = {
    Đèn: "#f59e0b", // <-- [Màu vàng cam cho Đèn]
    Quạt: "#3b82f6", // <-- [Màu xanh dương cho Quạt]
    "Điều hòa": "#8b5cf6", // <-- [Màu tím cho Điều hòa]
    "Máy hút ẩm": "#0f766e", // <-- [Màu xanh mòng két cho Máy hút ẩm]
    "Đèn ngoài trời": "#eab308", // <-- [Màu vàng sáng cho Đèn ngoài trời]
  }

  const color = colors[device] || "#64748b"

  return (
    <span
      style={{
        display: "inline-flex",

        alignItems: "center",

        padding: "2px 9px",

        borderRadius: 6,

        background: `${color}12`,

        border: `1px solid ${color}28`,

        color,

        fontSize: 12,

        fontFamily: "'Inter', sans-serif",

        fontWeight: 700,

        whiteSpace: "nowrap",
      }}
    >
      {device}
    </span>
  )
}

function ActionBadge({ action }: { action: DeviceAction }) {
  const isOn = action === "ON"

  return (
    <span
      style={{
        display: "inline-flex",

        alignItems: "center",

        gap: 6,

        padding: "4px 12px",

        borderRadius: 999,

        background: isOn ? "rgba(34,197,94,0.09)" : "rgba(244,63,94,0.08)",

        border: `1px solid ${
          isOn ? "rgba(34,197,94,0.25)" : "rgba(244,63,94,0.20)"
        }`,

        color: isOn ? "#047857" : "#be123c",

        fontSize: 11,

        fontFamily: "'Inter', sans-serif",

        fontWeight: 800,

        letterSpacing: "0.04em",
      }}
    >
      {action}
    </span>
  )
}

function StatusBadge({ status }: { status: ActionStatus }) {
  const config: Record<ActionStatus, {
    bg: string
    border: string
    text: string
  }> = {
    ON: {
      bg: "rgba(34,197,94,0.09)",

      border: "rgba(34,197,94,0.25)",

      text: "#047857",
    },

    OFF: {
      bg: "rgba(244,63,94,0.08)",

      border: "rgba(244,63,94,0.20)",

      text: "#be123c",
    },

    PENDING: {
      bg: "rgba(245,158,11,0.10)",

      border: "rgba(245,158,11,0.24)",

      text: "#b45309",
    },

    FAILED: {
      bg: "rgba(239,68,68,0.10)",

      border: "rgba(239,68,68,0.25)",

      text: "#dc2626",
    },
  }

  const current = config[status]

  return (
    <span
      style={{
        display: "inline-flex",

        alignItems: "center",

        gap: 6,

        padding: "4px 12px",

        borderRadius: 999,

        background: current.bg,

        border: `1px solid ${current.border}`,

        color: current.text,

        fontSize: 11,

        fontFamily: "'Inter', sans-serif",

        fontWeight: 800,

        letterSpacing: "0.04em",
      }}
    >
      {status}
    </span>
  )
}

function ResponseTime({ value }: { value?: Date | null }) {
  if (!value) {
    return (
      <span
        style={{
          display: "inline-flex",

          alignItems: "center",

          gap: 7,

          color: "#d97706",

          fontFamily: "'Inter', sans-serif",

          fontSize: 12,

          fontWeight: 700,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#fde68a",
          }}
        />
        Đang chờ...
      </span>
    )
  }

  return <>{formatDateTime(value)}</>
}

function toDisplayStatus(
  status: ActionApiStatus,
  action: DeviceAction,
): ActionStatus {
  if (status === "SUCCESS") return action

  if (status === "FAIL") return "FAILED"

  return "PENDING"
}

export default function ActionHistory() {
  const [records, setRecords] = useState<ActionRecord[]>([])

  const [totalRecords, setTotalRecords] = useState(0)

  const [searchInput, setSearchInput] = useState("")

  const [submittedSearchQuery, setSubmittedSearchQuery] = useState("")

  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>("")

  const [actionFilter, setActionFilter] = useState<ActionFilter>("")

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("")

  const [sortKey, setSortKey] = useState<SortKey>("id")

  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const [currentPage, setCurrentPage] = useState(1)

  const [pageJumpInput, setPageJumpInput] = useState("1")

  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const [pageSizeInput, setPageSizeInput] = useState(String(DEFAULT_PAGE_SIZE))
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))

  // Lắng nghe sự kiện Realtime để tự động cập nhật bảng lịch sử ngay khi trạng thái đổi (SUCCESS / FAIL)
  useEffect(() => {
    const handleUpdate = () => {
      setRefreshTrigger((prev) => prev + 1)
    }
    onActionUpdated(handleUpdate)
    onDeviceStateChanged(handleUpdate)
    return () => {
      offActionUpdated(handleUpdate)
      offDeviceStateChanged(handleUpdate)
    }
  }, [])

  useEffect(() => {
    setPageJumpInput(String(currentPage))
  }, [currentPage])

  useEffect(() => {
    getHistory({
      page: currentPage,

      limit: pageSize,

      sort_key: SORT_KEY_API_MAP[sortKey],

      sort_dir: sortDirection.toUpperCase() as "ASC" | "DESC",

      search_field: "all",

      search_value: submittedSearchQuery.trim(),

      device: deviceFilter,

      action: actionFilter,

      status: statusFilter,
    })

      .then((res) => {
        if (!res?.data) return

        setRecords(
          res.data.map((r) => ({
            id: r.id,

            device: r.device,

            action: r.action,

            status: toDisplayStatus(r.status, r.action),

            datetime: new Date(r.time),

            responseTime: r.response_time ? new Date(r.response_time) : null,
          })),
        )

        setTotalRecords(res.pagination.total)
      })

      .catch((err) => {
        console.error("[ActionHistory] Lỗi khi tải lịch sử:", err)
      })
  }, [
    currentPage,

    pageSize,

    sortKey,

    sortDirection,

    submittedSearchQuery,

    deviceFilter,

    actionFilter,

    statusFilter,

    refreshTrigger,
  ])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  const handleSearch = () => {
    setSubmittedSearchQuery(searchInput)

    setCurrentPage(1)
  }

  const handleReset = () => {
    setSearchInput("")

    setSubmittedSearchQuery("")

    setDeviceFilter("")

    setActionFilter("")

    setStatusFilter("")

    setCurrentPage(1)
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)

      setSortDirection("asc")
    }

    setCurrentPage(1)
  }

  const handlePageSizeChange = (value: string) => {
    setPageSizeInput(value)

    const next = Number(value)

    if (Number.isInteger(next) && next > 0) {
      setPageSize(next)

      setCurrentPage(1)
    }
  }

  const restorePageSizeInput = () => {
    if (!pageSizeInput || Number(pageSizeInput) < 1) {
      setPageSizeInput(String(pageSize))
    }
  }

  const getHeaderStyle = (key: SortKey): React.CSSProperties => ({
    padding: "12px 18px",

    textAlign: "left",

    fontSize: 11,

    fontFamily: "'Inter', sans-serif",

    letterSpacing: "0.08em",

    color: sortKey === key ? "#2563eb" : "#475569",

    fontWeight: 700,

    cursor: "pointer",

    userSelect: "none",

    whiteSpace: "nowrap",

    borderBottom: "1px solid rgba(0,0,0,0.07)",
  })

  const selectStyle: React.CSSProperties = {
    width: "100%",

    appearance: "none",

    background: "#ffffff",

    border: "1px solid rgba(37,99,235,0.16)",

    borderRadius: 8,

    padding: "10px 32px 10px 14px",

    color: "#334155",

    fontSize: 13,

    fontFamily: "'Inter', sans-serif",

    fontWeight: 600,

    outline: "none",

    cursor: "pointer",
  }

  const renderSelectShell = (
    width: number,

    children: React.ReactNode,
  ) => (
    <div style={{ position: "relative", width, flexShrink: 0 }}>
      {children}
      <span
        style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          display: "flex",
        }}
      >
        <ChevronDown />
      </span>
    </div>
  )

  return (
    <div
      style={{
        padding: "20px 24px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 22,
            fontWeight: 700,
            color: "#0f172a",
            margin: 0,
          }}
        >
          Lịch sử hoạt động
        </h1>
        <div
          style={{
            fontSize: 12,
            color: "#64748b",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            marginTop: 1,
          }}
        >
          Theo dõi lịch sử yêu cầu bật/tắt thiết bị
        </div>
        <div
          style={{
            fontSize: 10,
            color: "#94a3b8",
            fontFamily: "'Inter', sans-serif",
            marginTop: 2,
          }}
        >
          {totalRecords} sự kiện · Trang {currentPage}/{totalPages}
        </div>
      </div>

      <div
        style={{ display: "flex", gap: 10, marginBottom: 14, flexShrink: 0 }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
              display: "flex",
            }}
          >
            <SearchIcon />
          </span>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch()
            }}
            placeholder="Nhập từ khóa tìm kiếm..."
            style={{
              width: "100%",

              background: "#ffffff",

              border: "1px solid rgba(37,99,235,0.12)",

              borderRadius: 8,

              padding: "10px 12px 10px 36px",

              color: "#0f172a",

              fontSize: 13,

              fontFamily: "'Inter', sans-serif",

              outline: "none",

              boxSizing: "border-box",
            }}
          />
        </div>

        {renderSelectShell(
          168,

          <select
            value={deviceFilter}
            onChange={(e) => {
              setDeviceFilter(e.target.value as DeviceFilter)

              setCurrentPage(1)
            }}
            style={selectStyle}
          >
            <option value="">Tất cả thiết bị</option>
            <option value="Đèn">Đèn</option>
            <option value="Quạt">Quạt</option>
            <option value="Điều hòa">Điều hòa</option>
          </select>,
        )}

        {renderSelectShell(
          164,

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value as ActionFilter)

              setCurrentPage(1)
            }}
            style={selectStyle}
          >
            <option value="">Tất cả hành động</option>
            <option value="ON">ON</option>
            <option value="OFF">OFF</option>
          </select>,
        )}

        {renderSelectShell(
          168,

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter)

              setCurrentPage(1)
            }}
            style={selectStyle}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ON">ON</option>
            <option value="OFF">OFF</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
          </select>,
        )}

        {/* =========================================================================
         * ========================================================================= */}
        <button
          onClick={handleSearch}
          style={{
            padding: "0 18px",

            borderRadius: 8,

            border: "none",

            /* [MÀU NÚT TÌM KIẾM TẠI ĐÂY]*/
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",

            color: "#ffffff",

            cursor: "pointer",

            display: "inline-flex",

            alignItems: "center",

            gap: 8,

            fontSize: 13,

            fontFamily: "'Inter', sans-serif",

            fontWeight: 700,

            whiteSpace: "nowrap",

            boxShadow: "0 4px 14px rgba(37,99,235,0.28)",

            transition: "all 0.15s ease",
          }}
        >
          <SearchIcon />
          Tìm kiếm
        </button>

        <button
          onClick={handleReset}
          title="Làm mới"
          style={{
            width: 42,

            borderRadius: 8,

            border: "1px solid rgba(37,99,235,0.12)",

            background: "#ffffff",

            color: "#64748b",

            cursor: "pointer",

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            flexShrink: 0,
          }}
        >
          ↻
        </button>
      </div>

      <div
        style={{
          flex: 1,

          background: "#ffffff",

          border: "1px solid rgba(0,0,0,0.07)",

          borderRadius: 12,

          overflow: "hidden",

          display: "flex",

          flexDirection: "column",

          minHeight: 0,

          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ flex: 1, overflow: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              tableLayout: "fixed",
            }}
          >
            <colgroup>
              <col style={{ width: "8%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "24%" }} />
              <col style={{ width: "25%" }} />
            </colgroup>
            <thead
              style={{ position: "sticky", top: 0, background: "#f8fafc" }}
            >
              <tr>
                {[
                  { key: "id" as SortKey, label: "ID" },

                  { key: "device" as SortKey, label: "TÊN THIẾT BỊ" },

                  { key: "action" as SortKey, label: "HÀNH ĐỘNG" },

                  { key: "status" as SortKey, label: "TRẠNG THÁI" },

                  {
                    key: "datetime" as SortKey,
                    label: "THỜI GIAN GỬI YÊU CẦU",
                  },

                  { key: "datetime" as SortKey, label: "THỜI GIAN PHẢN HỒI" },
                ].map(({ key, label }, index) => (
                  <th
                    key={`${key}-${index}`}
                    style={getHeaderStyle(key)}
                    onClick={() => handleSort(key)}
                  >
                    {label}
                    <span
                      style={{
                        marginLeft: 4,
                        fontSize: 10,
                        color: sortKey === key ? "#2563eb" : "#94a3b8",
                      }}
                    >
                      {sortKey === key
                        ? sortDirection === "asc"
                          ? "↑"
                          : "↓"
                        : "↕"}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((row, index) => (
                <tr
                  key={row.id}
                  style={{
                    background:
                      index % 2 === 0 ? "transparent" : "rgba(0,0,0,0.013)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f0f6ff")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      index % 2 === 0 ? "transparent" : "rgba(0,0,0,0.013)")
                  }
                >
                  <td
                    style={{
                      padding: "12px 18px",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 12,
                      color: "#475569",
                      fontWeight: 700,
                      borderBottom: "1px solid rgba(0,0,0,0.04)",
                    }}
                  >
                    {row.id}
                  </td>
                  <td
                    style={{
                      padding: "12px 18px",
                      borderBottom: "1px solid rgba(0,0,0,0.04)",
                    }}
                  >
                    <DeviceBadge device={row.device} />
                  </td>
                  <td
                    style={{
                      padding: "12px 18px",
                      borderBottom: "1px solid rgba(0,0,0,0.04)",
                    }}
                  >
                    <ActionBadge action={row.action} />
                  </td>
                  <td
                    style={{
                      padding: "12px 18px",
                      borderBottom: "1px solid rgba(0,0,0,0.04)",
                    }}
                  >
                    <StatusBadge status={row.status} />
                  </td>
                  <td
                    style={{
                      padding: "12px 18px",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 12,
                      color: "#334155",
                      fontWeight: 600,
                      borderBottom: "1px solid rgba(0,0,0,0.04)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDateTime(row.datetime)}
                  </td>
                  <td
                    style={{
                      padding: "12px 18px",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 12,
                      color: "#334155",
                      fontWeight: 600,
                      borderBottom: "1px solid rgba(0,0,0,0.04)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <ResponseTime value={row.responseTime} />
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: 52,
                      textAlign: "center",
                      color: "#cbd5e1",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 13,
                    }}
                  >
                    Không tìm thấy sự kiện nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderTop: "1px solid rgba(0,0,0,0.06)",
            flexShrink: 0,
            gap: 12,
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              fontSize: 12,
              color: "#64748b",
              fontFamily: "'Inter', sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            Hiển thị
            <input
              type="number"
              min={1}
              value={pageSizeInput}
              onChange={(e) => handlePageSizeChange(e.target.value)}
              onBlur={restorePageSizeInput}
              style={{
                width: 76,

                height: 36,

                borderRadius: 8,

                border: "1px solid rgba(37,99,235,0.12)",

                background: "#f8fafc",

                color: "#334155",

                fontFamily: "'Inter', sans-serif",

                fontSize: 13,

                fontWeight: 700,

                textAlign: "center",

                outline: "none",
              }}
            />
            bản ghi / trang
          </label>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: "8px 14px",

                borderRadius: 8,

                border: "1px solid rgba(37,99,235,0.12)",

                background: "#ffffff",

                color: currentPage === 1 ? "#cbd5e1" : "#475569",

                fontSize: 12,

                fontFamily: "'Inter', sans-serif",

                cursor: currentPage === 1 ? "not-allowed" : "pointer",
              }}
            >
              ‹ Trước
            </button>
            <div
              style={{
                display: "flex",

                alignItems: "center",

                gap: 6,

                padding: "4px 10px",

                borderRadius: 8,

                background: "#f8fafc",

                border: "1px solid rgba(37,99,235,0.12)",

                color: "#334155",

                fontSize: 12,

                fontFamily: "'Inter', sans-serif",

                fontWeight: 700,
              }}
            >
              <span>Trang</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={pageJumpInput}
                onChange={(e) => setPageJumpInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = parseInt(pageJumpInput, 10)

                    if (!isNaN(val) && val >= 1 && val <= totalPages) {
                      setCurrentPage(val)
                    } else {
                      setPageJumpInput(String(currentPage))
                    }
                  }
                }}
                onBlur={() => {
                  const val = parseInt(pageJumpInput, 10)

                  if (!isNaN(val) && val >= 1 && val <= totalPages) {
                    setCurrentPage(val)
                  } else {
                    setPageJumpInput(String(currentPage))
                  }
                }}
                style={{
                  width: 44,

                  height: 28,

                  borderRadius: 6,

                  border: "1px solid rgba(37,99,235,0.2)",

                  background: "#ffffff",

                  color: "#1e293b",

                  fontFamily: "'Inter', sans-serif",

                  fontSize: 12,

                  fontWeight: 700,

                  textAlign: "center",

                  outline: "none",
                }}
              />
              <span>/ {totalPages}</span>
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: "8px 14px",

                borderRadius: 8,

                border: "1px solid rgba(37,99,235,0.12)",

                background: "#ffffff",

                color: currentPage === totalPages ? "#cbd5e1" : "#475569",

                fontSize: 12,

                fontFamily: "'Inter', sans-serif",

                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              }}
            >
              Sau ›
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
