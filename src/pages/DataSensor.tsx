import { useState, useEffect, useCallback, useRef } from "react"
import type { SensorRecord, SortDirection } from "../types"
import { formatDateTime } from "../utils/formatters"
import { getSensors } from "../services/api"
import { onSensorData, offSensorData } from "../services/socket"

const DEFAULT_PAGE_SIZE = 50

type SortKey = "id" | "sensorName" | "value" | "datetime"
type SensorFilterValue = "" | "Nhiệt độ" | "Độ ẩm" | "Ánh sáng" | "recorded_at"

const SENSOR_TYPE_VALUES: SensorFilterValue[] = [
  "Nhiệt độ",
  "Độ ẩm",
  "Ánh sáng",
]

const SORT_KEY_API_MAP: Record<SortKey, "data_id" | "sensor_name" | "value" | "recorded_at"> =
  {
    id: "data_id",
    sensorName: "sensor_name",
    value: "value",
    datetime: "recorded_at",
  }

const SEARCH_PLACEHOLDER_MAP: Record<SensorFilterValue, string> = {
  "": "Nhập từ khóa tìm kiếm...",
  "Nhiệt độ": "Tìm kiếm theo nhiệt độ...",
  "Độ ẩm": "Tìm kiếm theo độ ẩm...",
  "Ánh sáng": "Tìm kiếm theo ánh sáng...",
  "recorded_at": "Tìm kiếm theo thời gian...",
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

function FilterIcon() {
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
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

/* =========================================================================
 * [MÀU CẢM BIẾN TRÊN TRANG DATA SENSOR]
 * ========================================================================= */
function getValueStyle(type?: string) {
  if (type === "Nhiệt độ") {
    return {
      color: "#ef4444",                     /* <-- [MÀU CHỮ NHIỆT ĐỘ: Đỏ] */
      background: "rgba(239,68,68,0.08)",   /* <-- [MÀU NỀN MỜ NHIỆT ĐỘ] */
      border: "1px solid rgba(239,68,68,0.22)",
    }
  }
  if (type === "Độ ẩm") {
    return {
      color: "#3b82f6",                     /* <-- [MÀU CHỮ ĐỘ ẨM: Xanh lam] */
      background: "rgba(59,130,246,0.08)",   /* <-- [MÀU NỀN MỜ ĐỘ ẨM] */
      border: "1px solid rgba(59,130,246,0.22)",
    }
  }
  if (type === "Ánh sáng") {
    return {
      color: "#f59e0b",                     /* <-- [MÀU CHỮ ÁNH SÁNG: Vàng cam] */
      background: "rgba(245,158,11,0.08)",   /* <-- [MÀU NỀN MỜ ÁNH SÁNG] */
      border: "1px solid rgba(245,158,11,0.22)",
    }
  }
  return {
    color: "#0284c7",                       /* <-- [MÀU MẶC ĐỊNH KHÁC] */
    background: "rgba(14,165,233,0.08)",
    border: "1px solid rgba(14,165,233,0.18)",
  }
}

function ValueBadge({ record }: { record: SensorRecord }) {
  const style = getValueStyle(record.sensorType)
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 8,
        background: style.background,
        border: style.border,
        color: style.color,
        fontFamily: "'Inter', sans-serif",
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {record.value === null ? "--" : record.value} {record.unit}
    </span>
  )
}

function SensorNameBadge({ record }: { record: SensorRecord }) {
  const style = getValueStyle(record.sensorType)
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "4px 10px",
        borderRadius: 8,
        background: style.background,
        border: style.border,
        color: style.color,
        fontFamily: "'Inter', sans-serif",
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: style.color,
          boxShadow: `0 0 6px ${style.color}80`,
          flexShrink: 0,
        }}
      />
      {record.sensorName}
    </span>
  )
}

export default function DataSensor() {
  const [records, setRecords] = useState<SensorRecord[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [searchInput, setSearchInput] = useState("")
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState("")
  const [sensorFilter, setSensorFilter] = useState<SensorFilterValue>("")
  const [submittedSensorFilter, setSubmittedSensorFilter] =
    useState<SensorFilterValue>("")
  const [sortKey, setSortKey] = useState<SortKey>("id")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageJumpInput, setPageJumpInput] = useState("1")
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [pageSizeInput, setPageSizeInput] = useState(String(DEFAULT_PAGE_SIZE))

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))

  useEffect(() => {
    setPageJumpInput(String(currentPage))
  }, [currentPage])

  const fetchSensorRecords = useCallback(() => {
    const isSensorTypeFilter = SENSOR_TYPE_VALUES.includes(
      submittedSensorFilter,
    )
    const searchValue = submittedSearchQuery.trim()
    const searchField =
      submittedSensorFilter === "recorded_at" ? "recorded_at" : "all"

    getSensors({
      page: currentPage,
      limit: pageSize,
      sort_key: SORT_KEY_API_MAP[sortKey],
      sort_dir: sortDirection.toUpperCase() as "ASC" | "DESC",
      search_field: searchField,
      search_value: searchValue,
      sensor_type: isSensorTypeFilter ? submittedSensorFilter : undefined,
    })
      .then((res) => {
        if (!res?.data) return
        setRecords(
          res.data.map((r) => ({
            id: r.data_id,
            sensorName: r.sensor_name,
            sensorType: r.sensor_type,
            value: r.value,
            unit: r.unit,
            datetime: new Date(r.recorded_at),
          })),
        )
        setTotalRecords(res.pagination.total)
      })
      .catch((err) => {
        console.error("[DataSensor] Lỗi khi tải dữ liệu cảm biến:", err)
      })
  }, [
    currentPage,
    pageSize,
    sortKey,
    sortDirection,
    submittedSearchQuery,
    submittedSensorFilter,
  ])

  useEffect(() => {
    fetchSensorRecords()
  }, [fetchSensorRecords])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  const fetchRef = useRef(fetchSensorRecords)
  useEffect(() => {
    fetchRef.current = fetchSensorRecords
  }, [fetchSensorRecords])

  useEffect(() => {
    const handleRealtimeSensorData = () => fetchRef.current()
    onSensorData(handleRealtimeSensorData)
    return () => offSensorData(handleRealtimeSensorData)
  }, [])

  const handleSearch = () => {
    setSubmittedSearchQuery(searchInput)
    setSubmittedSensorFilter(sensorFilter)
    setCurrentPage(1)
  }

  const handleReset = () => {
    setSearchInput("")
    setSubmittedSearchQuery("")
    setSensorFilter("")
    setSubmittedSensorFilter("")
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
    padding: "12px 20px",
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
          Dữ liệu cảm biến
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
          Danh sách chi tiết dữ liệu
        </div>
        <div
          style={{
            fontSize: 10,
            color: "#94a3b8",
            fontFamily: "'Inter', sans-serif",
            marginTop: 2,
          }}
        >
          {totalRecords} bản ghi · Trang {currentPage}/{totalPages}
        </div>
      </div>

      <div
        style={{ display: "flex", gap: 10, marginBottom: 14, flexShrink: 0 }}
      >
        <div style={{ position: "relative", flex: 1 }}>
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
            placeholder={SEARCH_PLACEHOLDER_MAP[sensorFilter]}
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

        <div style={{ position: "relative", width: 190, flexShrink: 0 }}>
          <span
            style={{
              position: "absolute",
              left: 11,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#64748b",
              display: "flex",
              pointerEvents: "none",
            }}
          >
            <FilterIcon />
          </span>
          <select
            value={sensorFilter}
            onChange={(e) =>
              setSensorFilter(e.target.value as SensorFilterValue)
            }
            style={{
              width: "100%",
              appearance: "none",
              background: "#ffffff",
              border: "1px solid rgba(37,99,235,0.16)",
              borderRadius: 8,
              padding: "10px 34px 10px 36px",
              color: "#334155",
              fontSize: 13,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="">Tất cả</option>
            <option value="Nhiệt độ">Nhiệt độ</option>
            <option value="Độ ẩm">Độ ẩm</option>
            <option value="Ánh sáng">Ánh sáng</option>
            <option value="recorded_at">Thời gian</option>
          </select>
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

        <button
          onClick={handleSearch}
          style={{
            padding: "0 18px",
            borderRadius: 8,
            border: "none",
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
              <col style={{ width: "12%" }} />
              <col style={{ width: "32%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "34%" }} />
            </colgroup>
            <thead
              style={{ position: "sticky", top: 0, background: "#f8fafc" }}
            >
              <tr>
                {[
                  { key: "id" as SortKey, label: "ID" },
                  { key: "sensorName" as SortKey, label: "TÊN CẢM BIẾN" },
                  { key: "value" as SortKey, label: "GIÁ TRỊ" },
                  { key: "datetime" as SortKey, label: "THỜI GIAN" },
                ].map(({ key, label }) => (
                  <th
                    key={key}
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
                      padding: "12px 20px",
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
                      padding: "12px 20px",
                      borderBottom: "1px solid rgba(0,0,0,0.04)",
                    }}
                  >
                    <SensorNameBadge record={row} />
                  </td>
                  <td
                    style={{
                      padding: "12px 20px",
                      borderBottom: "1px solid rgba(0,0,0,0.04)",
                    }}
                  >
                    <ValueBadge record={row} />
                  </td>
                  <td
                    style={{
                      padding: "12px 20px",
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
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: 52,
                      textAlign: "center",
                      color: "#cbd5e1",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 13,
                    }}
                  >
                    Không tìm thấy bản ghi nào
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
