import { useState, useEffect, useRef, type ReactNode } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import type { DeviceState, SensorChartPoint, SensorApiRecord } from "../types"
import { getDeviceStates, getSensors } from "../services/api"
import {
  useDevicePending,
  triggerDeviceToggle,
  getCachedChartData,
  setCachedChartData,
  getCachedLatestSensors,
  setCachedLatestSensors,
  getCachedDevices,
  setCachedDevices,
  getCachedLastUpdatedTime,
  setCachedLastUpdatedTime,
} from "../services/deviceControlStore"
import {
  onSensorData,
  offSensorData,
  onDeviceStateChanged,
  offDeviceStateChanged,
  onActionUpdated,
  offActionUpdated,
} from "../services/socket"
import type {
  DeviceStateChangedEvent,
  ActionUpdatedEvent,
} from "../services/socket"

/**
 * 1. Component Thẻ Cảm Biến (Hiển thị giá trị đo tức thời)
 */
interface SensorCardProps {
  label: string
  value: number
  unit: string
  icon: ReactNode
  color: string
  updated: string
}

function SensorCard({
  label,
  value,
  unit,
  icon,
  color,
  updated,
}: SensorCardProps) {
  return (
    <div
      style={{
        flex: 1,
        background: "#ffffff",
        border: `1px solid ${color}30`,
        borderRadius: 12,
        padding: "16px 20px",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      {/* Vạch sáng màu trang trí phía trên */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          opacity: 0.8,
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              color: "#94a3b8",
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "0.1em",
              marginBottom: 6,
              textTransform: "uppercase",
            }}
          >
            {label}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 30,
                fontWeight: 700,
                color,
                lineHeight: 1,
              }}
            >
              {value.toFixed(1)}
            </span>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                color: `${color}99`,
                fontWeight: 500,
              }}
            >
              {unit}
            </span>
          </div>
        </div>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `${color}12`,
            border: `1px solid ${color}25`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color,
          }}
        >
          {icon}
        </div>
      </div>
      <div
        style={{
          fontSize: 10,
          color: "#94a3b8",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        Cập nhật lúc {updated}
      </div>
    </div>
  )
}

/**
 * 2. Component Nút Gạt Điều Khiển Thiết Bị
 */
interface DeviceToggleProps {
  name: string
  icon: ReactNode
  isOn: boolean
  isPending?: boolean
  onToggle: () => void
}

function DeviceToggle({
  name,
  icon,
  isOn,
  isPending = false,
  onToggle,
}: DeviceToggleProps) {
  return (
    <div
      onClick={isPending ? undefined : onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        background: isPending
          ? "rgba(245,158,11,0.06)"
          : isOn
            ? "rgba(34,197,94,0.06)"
            : "#f8fafc",
        border: `1px solid ${
          isPending
            ? "rgba(245,158,11,0.35)"
            : isOn
              ? "rgba(34,197,94,0.25)"
              : "#e2e8f0"
        }`,
        borderRadius: 10,
        transition: "all 0.2s ease",
        cursor: isPending ? "wait" : "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: isPending
              ? "rgba(245,158,11,0.14)"
              : isOn
                ? "rgba(34,197,94,0.12)"
                : "#f1f5f9",
            border: `1px solid ${
              isPending
                ? "rgba(245,158,11,0.4)"
                : isOn
                  ? "rgba(34,197,94,0.3)"
                  : "#e2e8f0"
            }`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: isPending ? "#d97706" : isOn ? "#16a34a" : "#94a3b8",
            transition: "all 0.2s ease",
          }}
        >
          {icon}
        </div>
        <div>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: 10,
              fontFamily: "'Inter', sans-serif",
              color: isPending ? "#d97706" : isOn ? "#16a34a" : "#94a3b8",
              letterSpacing: "0.08em",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {isPending ? "ĐANG CHỜ..." : isOn ? "ACTIVE" : "STANDBY"}
          </div>
        </div>
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={(e) => {
          e.stopPropagation()
          if (!isPending) onToggle()
        }}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          background: isPending ? "#f59e0b" : isOn ? "#22c55e" : "#cbd5e1",
          position: "relative",
          transition: "background 0.2s ease",
          boxShadow: isPending
            ? "0 0 10px rgba(245,158,11,0.35)"
            : isOn
              ? "0 0 10px rgba(34,197,94,0.35)"
              : "none",
          cursor: isPending ? "wait" : "pointer",
          border: "none",
          outline: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 3,
            left: isPending ? 13 : isOn ? 23 : 3,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "white",
            transition: "left 0.2s ease",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        />
      </button>
    </div>
  )
}

/**
 * 3. Component Tooltip tùy biến cho biểu đồ Recharts
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: "8px 12px",
        fontFamily: "'Inter', sans-serif",
        fontSize: 11,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ color: "#94a3b8", marginBottom: 4 }}>{label}</div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((item: any) => (
        <div key={item.dataKey} style={{ color: item.color, lineHeight: 1.8 }}>
          {item.name}: {item.value}
        </div>
      ))}
    </div>
  )
}

const DEFAULT_POINT: SensorChartPoint = {
  time: "--:--:--",
  temp: 0,
  humidity: 0,
  light: 0,
}

/**
 * Hàm chuyển đổi mảng bản ghi cảm biến từ Backend thành các điểm vẽ đồ thị
 */
function transformSensorsToChartPoints(
  records: SensorApiRecord[],
): SensorChartPoint[] {
  const pointsMap = new Map<
    string,
    {
      time: string
      temp: number
      humidity: number
      light: number
    }
  >()

  let lastTemp = 0
  let lastHum = 0
  let lastLight = 0

  records.forEach((record) => {
    const date = new Date(record.recorded_at)
    const timeKey = date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })

    if (!pointsMap.has(timeKey)) {
      pointsMap.set(timeKey, {
        time: timeKey,
        temp: lastTemp,
        humidity: lastHum,
        light: lastLight,
      })
    }

    const current = pointsMap.get(timeKey)!
    if (record.value !== null && record.value !== undefined) {
      if (record.sensor_type === "Nhiệt độ" || record.sensor_id === 1) {
        current.temp = record.value
        lastTemp = record.value
      } else if (record.sensor_type === "Độ ẩm" || record.sensor_id === 2) {
        current.humidity = record.value
        lastHum = record.value
      } else if (record.sensor_type === "Ánh sáng" || record.sensor_id === 3) {
        current.light = record.value
        lastLight = record.value
      }
    }
  })

  const result = Array.from(pointsMap.values())
  // Điền ngược giá trị cho các điểm đầu nếu lúc đầu chưa ghi nhận đủ 3 cảm biến
  const firstTemp = result.find((p) => p.temp > 0)?.temp || 0
  const firstHum = result.find((p) => p.humidity > 0)?.humidity || 0
  const firstLight = result.find((p) => p.light > 0)?.light || 0
  result.forEach((p) => {
    if (p.temp === 0) p.temp = firstTemp
    if (p.humidity === 0) p.humidity = firstHum
    if (p.light === 0) p.light = firstLight
  })

  return result.slice(-20)
}

const DEVICE_ID_MAP: Record<keyof DeviceState, number> = {
  light: 1,
  fan: 2,
  ac: 3,
}

/**
 * 4. Màn hình chính Dashboard
 */
export default function Dashboard() {
  const [chartData, setChartData] = useState<SensorChartPoint[]>(() =>
    getCachedChartData(),
  )
  const [latestSensors, setLatestSensors] = useState<{
    temp: number
    humidity: number
    light: number
  }>(() => getCachedLatestSensors())
  const [devices, setDevices] = useState<DeviceState>(() => getCachedDevices())
  const pendingDevices = useDevicePending()
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(() =>
    getCachedLastUpdatedTime(),
  )

  // Đồng hồ chạy thời gian thực liên tục mỗi giây
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Hàm tải toàn bộ dữ liệu từ Backend REST API (Cảm biến & Trạng thái thiết bị)
  const fetchDashboardData = () => {
    // 1. Tải 60 bản ghi cảm biến MỚI NHẤT từ GET /api/sensors (sort_dir: "DESC")
    getSensors({ limit: 60, sort_key: "data_id", sort_dir: "DESC" })
      .then((res) => {
        if (res?.data && res.data.length > 0) {
          // res.data đang theo thứ tự MỚI NHẤT -> CŨ NHẤT
          const newestRecord = res.data[0]

          // Cập nhật mốc thời gian của bản ghi mới nhất thực tế
          if (newestRecord?.recorded_at) {
            const lastTime = new Date(
              newestRecord.recorded_at,
            ).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
            setLastUpdatedTime(lastTime)
            setCachedLastUpdatedTime(lastTime)
          }

          // Lấy giá trị mới nhất của từng loại cảm biến cho 3 thẻ card
          let t = 0
          let h = 0
          let l = 0
          for (const r of res.data) {
            if (r.value !== null && r.value !== undefined) {
              if (t === 0 && (r.sensor_type === "Nhiệt độ" || r.sensor_id === 1)) t = r.value
              if (h === 0 && (r.sensor_type === "Độ ẩm" || r.sensor_id === 2)) h = r.value
              if (l === 0 && (r.sensor_type === "Ánh sáng" || r.sensor_id === 3)) l = r.value
            }
            if (t > 0 && h > 0 && l > 0) break
          }
          const latest = { temp: t, humidity: h, light: l }
          setLatestSensors(latest)
          setCachedLatestSensors(latest)

          // Đảo ngược mảng để điểm cũ nằm bên trái, điểm mới nhất nằm bên phải biểu đồ theo trục thời gian
          const chronological = [...res.data].reverse()
          const points = transformSensorsToChartPoints(chronological)
          if (points.length > 0) {
            setChartData(points)
            setCachedChartData(points)
          }
        }
      })
      .catch((err) => {
        console.error(
          "[Dashboard] Lỗi khi tải dữ liệu cảm biến từ GET /api/sensors:",
          err,
        )
      })

    // 2. Tải trạng thái 3 thiết bị từ GET /api/device-states
    getDeviceStates()
      .then((res) => {
        if (res?.devices) {
          const stateObj: DeviceState = { light: false, fan: false, ac: false }
          res.devices.forEach((d) => {
            if (d.device_id === 1) stateObj.light = d.status === "ON"
            if (d.device_id === 2) stateObj.fan = d.status === "ON"
            if (d.device_id === 3) stateObj.ac = d.status === "ON"
          })
          setDevices(stateObj)
          setCachedDevices(stateObj)
        }
      })
      .catch((err) => {
        console.error(
          "[Dashboard] Lỗi khi tải trạng thái thiết bị từ GET /api/device-states:",
          err,
        )
      })
  }

  // Tải dữ liệu ban đầu khi mở/refresh Dashboard và lắng nghe sự kiện Realtime qua Socket.IO
  useEffect(() => {
    // 1. Tải dữ liệu ban đầu qua REST API
    fetchDashboardData()

    // 2. Lắng nghe sự kiện Realtime 'sensor_data' khi ESP32 gửi dữ liệu mới
    const handleRealtimeSensorData = (record: SensorApiRecord) => {
      if (record.value === null) return

      if (record.value !== null && record.value !== undefined) {
        if (record.sensor_type === "Nhiệt độ" || record.sensor_id === 1) {
          setLatestSensors((prev) => {
            const next = { ...prev, temp: record.value! }
            setCachedLatestSensors(next)
            return next
          })
        } else if (record.sensor_type === "Độ ẩm" || record.sensor_id === 2) {
          setLatestSensors((prev) => {
            const next = { ...prev, humidity: record.value! }
            setCachedLatestSensors(next)
            return next
          })
        } else if (
          record.sensor_type === "Ánh sáng" ||
          record.sensor_id === 3
        ) {
          setLatestSensors((prev) => {
            const next = { ...prev, light: record.value! }
            setCachedLatestSensors(next)
            return next
          })
        }
      }

      const timeKey = record.recorded_at
        ? new Date(record.recorded_at).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        : new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })

      setLastUpdatedTime(timeKey)
      setCachedLastUpdatedTime(timeKey)

      setChartData((prev) => {
        const lastPoint = prev[prev.length - 1]
        let nextData: SensorChartPoint[]
        // Nếu điểm cuối cùng cùng mốc thời gian, cập nhật giá trị vào điểm đó
        if (lastPoint && lastPoint.time === timeKey) {
          const updated = { ...lastPoint }
          if (record.sensor_type === "Nhiệt độ" || record.sensor_id === 1) {
            updated.temp = record.value!
          } else if (record.sensor_type === "Độ ẩm" || record.sensor_id === 2) {
            updated.humidity = record.value!
          } else if (
            record.sensor_type === "Ánh sáng" ||
            record.sensor_id === 3
          ) {
            updated.light = record.value!
          }
          nextData = [...prev.slice(0, -1), updated]
        } else {
          // Nếu là mốc thời gian mới, tạo điểm mới
          const newPoint: SensorChartPoint = {
            time: timeKey,
            temp: lastPoint ? lastPoint.temp : 0,
            humidity: lastPoint ? lastPoint.humidity : 0,
            light: lastPoint ? lastPoint.light : 0,
          }
          if (record.sensor_type === "Nhiệt độ" || record.sensor_id === 1) {
            newPoint.temp = record.value!
          } else if (record.sensor_type === "Độ ẩm" || record.sensor_id === 2) {
            newPoint.humidity = record.value!
          } else if (
            record.sensor_type === "Ánh sáng" ||
            record.sensor_id === 3
          ) {
            newPoint.light = record.value!
          }
          nextData = [...prev.slice(-19), newPoint]
        }
        setCachedChartData(nextData)
        return nextData
      })
    }

    // 3. Lắng nghe sự kiện Realtime 'device_state_changed' khi phần cứng xác nhận trạng thái
    const handleRealtimeDeviceStateChanged = (
      event: DeviceStateChangedEvent,
    ) => {
      const isON = event.status === "ON"
      const key: keyof DeviceState =
        event.device_id === 1 ? "light" : event.device_id === 2 ? "fan" : "ac"

      // Cập nhật trạng thái thiết bị BẬT/TẮT thực tế
      setDevices((prev) => {
        const next = { ...prev, [key]: isON }
        setCachedDevices(next)
        return next
      })
    }

    onSensorData(handleRealtimeSensorData)
    onDeviceStateChanged(handleRealtimeDeviceStateChanged)

    // 4. Cleanup Socket.IO listener khi unmount Dashboard
    return () => {
      offSensorData(handleRealtimeSensorData)
      offDeviceStateChanged(handleRealtimeDeviceStateChanged)
    }
  }, [])

  const latestPoint =
    chartData.length > 0 ? chartData[chartData.length - 1] : DEFAULT_POINT
  const currentTimeString = currentTime.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
  const updatedTimeString = lastUpdatedTime || currentTimeString

  // Hàm chuyển đổi trạng thái bật/tắt thiết bị thông qua Store điều khiển
  // Tự động duy trì trạng thái PENDING 2.5s ngay cả khi người dùng chuyển qua trang khác và quay lại
  const toggleDevice = async (key: keyof DeviceState) => {
    await triggerDeviceToggle(key, devices)
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: 14,
        padding: "20px 24px",
      }}
    >
      {/* Tiêu đề Dashboard */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              color: "#0f172a",
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            Dashboard
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
            Bảng điều khiển
          </div>
          <div
            style={{
              fontSize: 10,
              color: "#94a3b8",
              fontFamily: "'Inter', sans-serif",
              marginTop: 2,
            }}
          >
            Phòng LAB-B204 · Đồng bộ lúc {updatedTimeString}
          </div>
        </div>
      </div>

      {/* 3 Thẻ hiển thị số liệu Cảm biến */}
      <div style={{ display: "flex", gap: 14, flexShrink: 0 }}>
        {/* 1. THẺ NHIỆT ĐỘ */}
        <SensorCard
          label="Nhiệt độ"
          value={latestSensors.temp || latestPoint.temp}
          unit="°C"
          color="#ef4444"
          updated={updatedTimeString}
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
            </svg>
          }
        />
        {/* 2. THẺ ĐỘ ẨM */}
        <SensorCard
          label="Độ ẩm"
          value={latestSensors.humidity || latestPoint.humidity}
          unit="%"
          color="#3b82f6"
          updated={updatedTimeString}
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          }
        />
        {/* 3. THẺ ÁNH SÁNG */}
        <SensorCard
          label="Ánh sáng"
          value={latestSensors.light || latestPoint.light}
          unit="lux"
          color="#f59e0b"
          updated={updatedTimeString}
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          }
        />
      </div>

      {/* Phần dưới: Biểu đồ (Trái) + Điều khiển thiết bị (Phải) */}
      <div style={{ display: "flex", gap: 14, flex: 1, minHeight: 0 }}>
        {/* Biểu đồ Recharts */}
        <div
          style={{
            flex: 1,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "16px 20px 14px",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                fontWeight: 600,
                color: "#0f172a",
              }}
            >
              Lịch sử cảm biến
            </div>
          </div>
          <div
            style={{
              width: "100%",
              height: 260,
              minHeight: 260,
              position: "relative",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 12, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(0,0,0,0.06)"
                />
                <XAxis
                  dataKey="time"
                  tick={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />

                <YAxis
                  domain={[0, "auto"]}
                  tick={{
                    fontSize: 9,
                    fill: "#94a3b8",
                    fontFamily: "'Inter', sans-serif",
                  }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 10,
                    paddingTop: 6,
                    paddingBottom: 2,
                  }}
                />
                {/* 1. ĐƯỜNG NHIỆT ĐỘ */}
                <Line
                  name="Nhiệt độ (°C)"
                  type="monotone"
                  dataKey="temp"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
                {/* 2. ĐƯỜNG ĐỘ ẨM */}
                <Line
                  name="Độ ẩm (%)"
                  type="monotone"
                  dataKey="humidity"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
                {/* 3. ĐƯỜNG ÁNH SÁNG */}
                <Line
                  name="Ánh sáng (lux)"
                  type="monotone"
                  dataKey="light"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Phần giờ ở dưới chân biểu đồ: Giờ lần cuối cập nhật & Thời gian hiện tại */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 10,
              borderTop: "1px solid #f1f5f9",
              marginTop: "auto",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 10,
                color: "#94a3b8",
              }}
            >
              Cập nhật lúc {updatedTimeString}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 10,
                  color: "#64748b",
                  fontWeight: 600,
                }}
              >
                Thời gian hiện tại: {currentTimeString}
              </div>
            </div>
          </div>
        </div>

        {/* Cột điều khiển 3 thiết bị */}
        <div
          style={{
            width: 260,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              color: "#0f172a",
              marginBottom: 14,
            }}
          >
            Điều khiển thiết bị
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              flex: 1,
            }}
          >
            <DeviceToggle
              name="Đèn"
              isOn={devices.light}
              isPending={pendingDevices.light}
              onToggle={() => toggleDevice("light")}
              icon={
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18h6" />
                  <path d="M10 22h4" />
                  <path d="M12 2v1" />
                  <path d="M12 17a5 5 0 0 0 5-5c0-2.76-2.24-5-5-5s-5 2.24-5 5a5 5 0 0 0 5 5z" />
                </svg>
              }
            />
            <DeviceToggle
              name="Quạt"
              isOn={devices.fan}
              isPending={pendingDevices.fan}
              onToggle={() => toggleDevice("fan")}
              icon={
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 12c0-3 2.5-5 5-5s3 2 3 5-2 5-5 5" />
                  <path d="M12 12c-3 0-5-2.5-5-5s2-3 5-3 5 2 5 5" />
                  <path d="M12 12c0 3-2.5 5-5 5s-3-2-3-5 2-5 5-5" />
                </svg>
              }
            />
            <DeviceToggle
              name="Điều Hòa"
              isOn={devices.ac}
              isPending={pendingDevices.ac}
              onToggle={() => toggleDevice("ac")}
              icon={
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8 16a4 4 0 0 1-4-4 4 4 0 0 1 4-4" />
                  <path d="M16 8a4 4 0 0 1 4 4 4 4 0 0 1-4 4" />
                  <rect x="2" y="4" width="20" height="8" rx="2" />
                  <line x1="6" y1="16" x2="6" y2="18" />
                  <line x1="10" y1="16" x2="10" y2="20" />
                  <line x1="14" y1="16" x2="14" y2="20" />
                  <line x1="18" y1="16" x2="18" y2="18" />
                </svg>
              }
            />
          </div>

          {/* Hộp tóm tắt trạng thái 3 thiết bị */}
          <div
            style={{
              marginTop: 14,
              padding: "12px 14px",
              background: "#f8fafc",
              border: "1px solid #f1f5f9",
              borderRadius: 8,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "#94a3b8",
                fontFamily: "'Inter', sans-serif",
                letterSpacing: "0.08em",
                marginBottom: 8,
              }}
            >
              TRẠNG THÁI
            </div>
            {[
              {
                label: "Đèn",
                on: devices.light,
                pending: pendingDevices.light,
              },
              {
                label: "Quạt",
                on: devices.fan,
                pending: pendingDevices.fan,
              },
              {
                label: "Điều Hòa",
                on: devices.ac,
                pending: pendingDevices.ac,
              },
            ].map((device) => (
              <div
                key={device.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {device.label}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: "'Inter', sans-serif",
                    letterSpacing: "0.1em",
                    color: device.pending
                      ? "#b45309"
                      : device.on
                        ? "#16a34a"
                        : "#94a3b8",
                    background: device.pending
                      ? "rgba(245,158,11,0.15)"
                      : device.on
                        ? "rgba(34,197,94,0.1)"
                        : "#f1f5f9",
                    padding: "1px 6px",
                    borderRadius: 4,
                    fontWeight: 700,
                  }}
                >
                  {device.pending ? "PENDING" : device.on ? "ON" : "OFF"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  )
}
