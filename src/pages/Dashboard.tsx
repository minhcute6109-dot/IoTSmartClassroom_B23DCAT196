import { useState, useEffect, useRef } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

type DeviceState = { light: boolean; fan: boolean; ac: boolean }

function generatePoint(i: number) {
  const t = new Date(Date.now() - (19 - i) * 5000)
  const label = t.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return {
    time: label,
    temp: +(27 + Math.random() * 1.5).toFixed(1),
    humidity: +(53 + Math.random() * 3).toFixed(1),
    light: +(230 + Math.random() * 30).toFixed(1),
  }
}

const INITIAL_DATA = Array.from({ length: 20 }, (_, i) => generatePoint(i))

function SensorCard({ label, value, unit, icon, color, updated }: {
  label: string; value: number; unit: string; icon: JSX.Element; color: string; updated: string
}) {
  return (
    <div
      style={{
        flex: 1,
        background: '#ffffff',
        border: `1px solid ${color}30`,
        borderRadius: 12,
        padding: '16px 20px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 3,
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          opacity: 0.8,
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginBottom: 6, textTransform: 'uppercase' }}>
            {label}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: 30, fontWeight: 700, color, lineHeight: 1 }}>
              {value.toFixed(1)}
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: `${color}99`, fontWeight: 500 }}>
              {unit}
            </span>
          </div>
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}12`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>
        Cập nhật lúc {updated}
      </div>
    </div>
  )
}

function DeviceToggle({ name, icon, on, onToggle }: { name: string; icon: JSX.Element; on: boolean; onToggle: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: on ? 'rgba(34,197,94,0.06)' : '#f8fafc',
        border: `1px solid ${on ? 'rgba(34,197,94,0.25)' : '#e2e8f0'}`,
        borderRadius: 10,
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 36, height: 36, borderRadius: 8,
            background: on ? 'rgba(34,197,94,0.12)' : '#f1f5f9',
            border: `1px solid ${on ? 'rgba(34,197,94,0.3)' : '#e2e8f0'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: on ? '#16a34a' : '#94a3b8',
            transition: 'all 0.2s ease',
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
            {name}
          </div>
          <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: on ? '#16a34a' : '#94a3b8', letterSpacing: '0.08em' }}>
            {on ? 'ACTIVE' : 'STANDBY'}
          </div>
        </div>
      </div>
      <button
        onClick={onToggle}
        style={{
          width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: on ? '#22c55e' : '#cbd5e1',
          position: 'relative', transition: 'background 0.2s ease',
          boxShadow: on ? '0 0 10px rgba(34,197,94,0.35)' : 'none',
        }}
      >
        <div
          style={{
            position: 'absolute', top: 3, left: on ? 23 : 3,
            width: 18, height: 18, borderRadius: '50%', background: 'white',
            transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      </button>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ color: '#94a3b8', marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color, lineHeight: 1.8 }}>
          {p.name}: {p.value}{p.dataKey === 'temp' ? ' °C' : p.dataKey === 'humidity' ? ' %' : ' lux'}
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(INITIAL_DATA)
  const [devices, setDevices] = useState<DeviceState>({ light: true, fan: false, ac: false })
  const [now, setNow] = useState(new Date())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const t = new Date()
      setNow(t)
      const label = t.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      setData((prev) => [...prev.slice(-19), {
        time: label,
        temp: +(27 + Math.random() * 1.5).toFixed(1),
        humidity: +(53 + Math.random() * 3).toFixed(1),
        light: +(230 + Math.random() * 30).toFixed(1),
      }])
    }, 3000)
    return () => clearInterval(intervalRef.current!)
  }, [])

  const latest = data[data.length - 1]
  const updatedStr = now.toLocaleTimeString('vi-VN')
  const toggle = (key: keyof DeviceState) => setDevices((d) => ({ ...d, [key]: !d[key] }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 14, padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
            Dashboard
          </h1>
          <div style={{ fontSize: 12, color: '#64748b', fontFamily: "'Inter', sans-serif", fontWeight: 500, marginTop: 1 }}>
            Bảng điều khiển
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
            Phòng LAB-B204 · Đồng bộ lúc {updatedStr}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'blink 1.5s infinite', boxShadow: '0 0 6px #22c55e' }} />
          <span style={{ fontSize: 10, color: '#16a34a', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }}>
            MONITORING ACTIVE
          </span>
        </div>
      </div>

      {/* Sensor cards */}
      <div style={{ display: 'flex', gap: 14, flexShrink: 0 }}>
        <SensorCard label="Nhiệt độ" value={latest.temp} unit="°C" color="#ef4444" updated={updatedStr}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" /></svg>}
        />
        <SensorCard label="Độ ẩm" value={latest.humidity} unit="%" color="#3b82f6" updated={updatedStr}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>}
        />
        <SensorCard label="Ánh sáng" value={latest.light} unit="lux" color="#f59e0b" updated={updatedStr}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>}
        />
      </div>

      {/* Chart + Device control */}
      <div style={{ display: 'flex', gap: 14, flex: 1, minHeight: 0 }}>
        {/* Chart */}
        <div style={{ flex: 1, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', minWidth: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexShrink: 0 }}>
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
              Lịch sử cảm biến
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', animation: 'blink 1.5s infinite' }} />
              <span style={{ fontSize: 10, color: '#2563eb', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }}>
                REALTIME
              </span>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <ResponsiveContainer width="100%" height={290}>
              <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }} interval={4} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, paddingTop: 6, paddingBottom: 2 }}
                  formatter={(value) => value === 'temp' ? 'Nhiệt độ (°C)' : value === 'humidity' ? 'Độ ẩm (%)' : 'Ánh sáng (lux)'}
                />
                <Line type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
                <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
                <Line type="monotone" dataKey="light" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device control */}
        <div style={{ width: 260, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 14 }}>
            Điều khiển thiết bị
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            <DeviceToggle name="Đèn" on={devices.light} onToggle={() => toggle('light')}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="18" x2="15" y2="18" /><line x1="10" y1="22" x2="14" y2="22" /><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" /></svg>}
            />
            <DeviceToggle name="Quạt" on={devices.fan} onToggle={() => toggle('fan')}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M6 12a6 6 0 0 1 6 -6" /><path d="M18 12a6 6 0 0 1 -6 6" /><path d="M12 6a6 6 0 0 1 6 6" /><path d="M12 18a6 6 0 0 1 -6 -6" /></svg>}
            />
            <DeviceToggle name="Điều Hòa" on={devices.ac} onToggle={() => toggle('ac')}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="8" rx="2" /><path d="M7 14v4m5-4v4m5-4v4" /><path d="M7 6V2m5 4V2m5 4V2" /></svg>}
            />
          </div>

          {/* Summary */}
          <div style={{ marginTop: 16, padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6, letterSpacing: '0.08em' }}>
              TRẠNG THÁI
            </div>
            {[{ label: 'Đèn', on: devices.light }, { label: 'Quạt', on: devices.fan }, { label: 'Điều Hòa', on: devices.ac }].map((d) => (
              <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: '#64748b', fontFamily: "'Inter', sans-serif" }}>{d.label}</span>
                <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', color: d.on ? '#16a34a' : '#94a3b8', background: d.on ? 'rgba(34,197,94,0.1)' : '#f1f5f9', padding: '1px 6px', borderRadius: 4 }}>
                  {d.on ? 'ON' : 'OFF'}
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
