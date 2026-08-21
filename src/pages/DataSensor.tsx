import { useState, useMemo } from 'react'

interface SensorRecord {
  id: number
  sensorName: string
  sensorType: string
  value: number
  unit: string
  quality: 'Hợp lệ' | 'Không hợp lệ'
  errorReason?: string
  datetime: Date
}

const SENSOR_DEFS = [
  {
    name: 'Cảm biến nhiệt độ',
    type: 'Nhiệt độ',
    unit: '°C',
    gen: () => +(25 + Math.random() * 7).toFixed(1),
    badGen: () => +(45 + Math.random() * 15).toFixed(1),
    errors: [
      'Giá trị vượt quá ngưỡng nhiệt độ cho phép (> 40°C).',
      'Cảm biến phát hiện giá trị bất thường, có thể do nhiễu tín hiệu.',
    ],
  },
  {
    name: 'Cảm biến độ ẩm',
    type: 'Độ ẩm',
    unit: '%',
    gen: () => +(50 + Math.random() * 20).toFixed(1),
    badGen: () => +(100 + Math.random() * 15).toFixed(1),
    errors: [
      'Độ ẩm vượt mức 100%, dữ liệu không hợp lệ về mặt vật lý.',
      'Cảm biến trả về giá trị ngoài dải đo (0–100%).',
    ],
  },
  {
    name: 'Cảm biến ánh sáng',
    type: 'Ánh sáng',
    unit: 'lux',
    gen: () => +(180 + Math.random() * 150).toFixed(1),
    badGen: () => +(-5 + Math.random() * -10).toFixed(1),
    errors: [
      'Giá trị cường độ ánh sáng âm, cảm biến có thể bị lỗi phần cứng.',
      'Dữ liệu ánh sáng bất thường, vượt ra ngoài phạm vi đo lường.',
    ],
  },
]

function generateData(): SensorRecord[] {
  const rows: SensorRecord[] = []
  const base = new Date('2026-08-16T08:00:00')
  let id = 1
  for (let day = 0; day < 5; day++) {
    for (let tick = 0; tick < 6; tick++) {
      const t = new Date(base.getTime() + day * 86400000 + tick * 30 * 60000 + Math.floor(Math.random() * 60000))
      for (const def of SENSOR_DEFS) {
        const isInvalid = Math.random() < 0.07
        const errMsg = def.errors[Math.floor(Math.random() * def.errors.length)]
        rows.push({
          id: id++,
          sensorName: def.name,
          sensorType: def.type,
          value: isInvalid ? def.badGen() : def.gen(),
          unit: def.unit,
          quality: isInvalid ? 'Không hợp lệ' : 'Hợp lệ',
          errorReason: isInvalid ? errMsg : undefined,
          datetime: t,
        })
      }
    }
  }
  return rows
}

const ALL_DATA = generateData()
const PAGE_SIZE = 8

function fmt(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`
}

const WEEKDAY_NAMES = ['', 'Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
const ALL_SENSOR_TYPES = Array.from(new Set(SENSOR_DEFS.map((s) => s.type)))

interface DetailFilter {
  weekday: string
  day: string
  month: string
  year: string
  hour: string
  minute: string
  second: string
  sensorType: string
  quality: string
}

const EMPTY_FILTER: DetailFilter = {
  weekday: '', day: '', month: '', year: '',
  hour: '', minute: '', second: '', sensorType: '', quality: '',
}

function ChevronDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ pointerEvents: 'none' }}>
      <path d="M2 3.5L5 6.5L8 3.5" stroke="#64748b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const selectWrap: React.CSSProperties = { position: 'relative', display: 'flex', alignItems: 'center' }
const selectBase: React.CSSProperties = {
  appearance: 'none',
  background: '#f8fafc',
  border: '1px solid rgba(37,99,235,0.14)',
  borderRadius: 7,
  padding: '7px 30px 7px 10px',
  fontSize: 12,
  fontFamily: "'Inter', sans-serif",
  color: '#334155',
  outline: 'none',
  cursor: 'pointer',
  width: '100%',
}
const chevronPos: React.CSSProperties = {
  position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none',
}

function FilterModal({
  open, initial, onClose, onSearch,
}: {
  open: boolean
  initial: DetailFilter
  onClose: () => void
  onSearch: (f: DetailFilter) => void
}) {
  const [form, setForm] = useState<DetailFilter>(initial)

  if (!open) return null

  const set = (k: keyof DetailFilter) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const years = [2026, 2025, 2024]
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: 60 }, (_, i) => i)
  const seconds = Array.from({ length: 60 }, (_, i) => i)

  const Sel = ({ fkey, children }: { fkey: keyof DetailFilter; children: React.ReactNode }) => (
    <div style={selectWrap}>
      <select value={form[fkey]} onChange={set(fkey)} style={selectBase}>{children}</select>
      <span style={chevronPos}><ChevronDown /></span>
    </div>
  )

  const Field = ({ fkey, label, children }: { fkey: keyof DetailFilter; label: string; children: React.ReactNode }) => (
    <div>
      <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  )

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(15,23,42,0.22)',
        backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 14,
          boxShadow: '0 8px 40px rgba(37,99,235,0.12), 0 2px 8px rgba(0,0,0,0.08)',
          width: 520,
          maxWidth: '94vw',
          padding: '22px 24px 20px',
        }}
      >
        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
              Bộ lọc chi tiết
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: "'Inter', sans-serif", marginTop: 2 }}>
              Bỏ trống để bỏ qua điều kiện đó
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 20, lineHeight: 1, padding: 2 }}>
            ×
          </button>
        </div>

        {/* 3-column grid, 3 rows */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 14px', marginBottom: 20 }}>
          {/* Row 1 */}
          <Field fkey="weekday" label="Thứ">
            <Sel fkey="weekday">
              <option value="">Tất cả</option>
              {WEEKDAY_NAMES.slice(1).map((w, i) => <option key={i} value={String(i + 1)}>{w}</option>)}
            </Sel>
          </Field>
          <Field fkey="day" label="Ngày">
            <Sel fkey="day">
              <option value="">Tất cả</option>
              {days.map((d) => <option key={d} value={String(d)}>{d}</option>)}
            </Sel>
          </Field>
          <Field fkey="month" label="Tháng">
            <Sel fkey="month">
              <option value="">Tất cả</option>
              {months.map((m) => <option key={m} value={String(m)}>Tháng {m}</option>)}
            </Sel>
          </Field>
          {/* Row 2 */}
          <Field fkey="year" label="Năm">
            <Sel fkey="year">
              <option value="">Tất cả</option>
              {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
            </Sel>
          </Field>
          <Field fkey="hour" label="Giờ">
            <Sel fkey="hour">
              <option value="">Tất cả</option>
              {hours.map((h) => <option key={h} value={String(h)}>{String(h).padStart(2, '0')}:xx</option>)}
            </Sel>
          </Field>
          <Field fkey="minute" label="Phút">
            <Sel fkey="minute">
              <option value="">Tất cả</option>
              {minutes.map((m) => <option key={m} value={String(m)}>:{String(m).padStart(2, '0')}</option>)}
            </Sel>
          </Field>
          {/* Row 3 */}
          <Field fkey="second" label="Giây">
            <Sel fkey="second">
              <option value="">Tất cả</option>
              {seconds.map((s) => <option key={s} value={String(s)}>{String(s).padStart(2, '0')}s</option>)}
            </Sel>
          </Field>
          <Field fkey="sensorType" label="Loại cảm biến">
            <Sel fkey="sensorType">
              <option value="">Tất cả</option>
              <option value="Nhiệt độ">Nhiệt độ</option>
              <option value="Độ ẩm">Độ ẩm</option>
              <option value="Ánh sáng">Ánh sáng</option>
            </Sel>
          </Field>
          <Field fkey="quality" label="Chất lượng">
            <Sel fkey="quality">
              <option value="">Tất cả</option>
              <option value="Hợp lệ">Hợp lệ</option>
              <option value="Không hợp lệ">Không hợp lệ</option>
            </Sel>
          </Field>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 16 }}>
          <button
            onClick={() => setForm(EMPTY_FILTER)}
            style={{
              padding: '7px 18px', borderRadius: 7,
              border: '1px solid rgba(37,99,235,0.15)',
              background: 'transparent', color: '#64748b',
              fontSize: 12, fontFamily: "'Inter', sans-serif", cursor: 'pointer',
            }}
          >
            Đặt lại
          </button>
          <button
            onClick={() => { onSearch(form); onClose() }}
            style={{
              padding: '7px 22px', borderRadius: 7, border: 'none',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#ffffff', fontSize: 12, fontFamily: "'Inter', sans-serif",
              fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
            }}
          >
            Tìm kiếm
          </button>
        </div>
      </div>
    </div>
  )
}

function ErrorModal({ record, onClose }: { record: SensorRecord; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(15,23,42,0.28)',
        backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 14,
          boxShadow: '0 8px 40px rgba(239,68,68,0.14), 0 2px 12px rgba(0,0,0,0.1)',
          width: 460,
          maxWidth: '92vw',
          overflow: 'hidden',
        }}
      >
        {/* Red header bar */}
        <div style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 700, fontSize: 15, color: '#fff' }}>
                Chi tiết lỗi
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: "'JetBrains Mono', monospace", marginTop: 1 }}>
                Bản ghi #{String(record.id).padStart(3, '0')}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: '#fff', width: 28, height: 28, borderRadius: 6, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 22px' }}>
          {[
            { label: 'Mã bản ghi', value: `#${String(record.id).padStart(3, '0')}` },
            { label: 'Tên cảm biến', value: record.sensorName },
            { label: 'Loại cảm biến', value: record.sensorType },
            { label: 'Giá trị nhận được', value: `${record.value} ${record.unit}` },
            { label: 'Thời gian ghi nhận', value: fmt(record.datetime) },
            { label: 'Trạng thái', value: 'Không hợp lệ', isStatus: true },
          ].map(({ label, value, isStatus }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <span style={{ width: 150, fontSize: 11, color: '#64748b', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.03em', flexShrink: 0 }}>
                {label}
              </span>
              {isStatus ? (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '2px 10px', borderRadius: 5,
                  background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.22)',
                  color: '#dc2626', fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444' }} />
                  {value}
                </span>
              ) : (
                <span style={{ fontSize: 12, color: '#1e293b', fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                  {value}
                </span>
              )}
            </div>
          ))}

          {/* Error message box */}
          <div style={{
            marginTop: 14,
            padding: '12px 14px',
            background: 'rgba(239,68,68,0.05)',
            border: '1px solid rgba(239,68,68,0.18)',
            borderRadius: 8,
            borderLeft: '3px solid #ef4444',
          }}>
            <div style={{ fontSize: 10, color: '#dc2626', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em', marginBottom: 6 }}>
              NGUYÊN NHÂN LỖI
            </div>
            <div style={{ fontSize: 12, color: '#334155', fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
              {record.errorReason}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: '#f1f5f9', color: '#475569',
                fontSize: 12, fontFamily: "'Inter', sans-serif",
                fontWeight: 500, cursor: 'pointer',
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

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.18)',
      borderRadius: 20, padding: '3px 10px',
      fontSize: 11, color: '#2563eb', fontFamily: "'Inter', sans-serif",
    }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', padding: 0, fontSize: 13, lineHeight: 1, marginLeft: 1 }}>
        ×
      </button>
    </span>
  )
}

function QualityBadge({
  quality, errorReason, onClick,
}: {
  quality: 'Hợp lệ' | 'Không hợp lệ'
  errorReason?: string
  onClick?: () => void
}) {
  const ok = quality === 'Hợp lệ'
  return (
    <span
      onClick={ok ? undefined : onClick}
      title={ok ? undefined : 'Bấm để xem chi tiết lỗi'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '2px 8px', borderRadius: 5,
        background: ok ? 'rgba(34,197,94,0.09)' : 'rgba(239,68,68,0.09)',
        border: `1px solid ${ok ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
        color: ok ? '#16a34a' : '#dc2626',
        fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
        cursor: ok ? 'default' : 'pointer',
        transition: 'background 0.12s',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => { if (!ok) (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.16)' }}
      onMouseLeave={(e) => { if (!ok) (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.09)' }}
    >
      <span style={{ width: 4, height: 4, borderRadius: '50%', background: ok ? '#22c55e' : '#ef4444' }} />
      {quality}
      {!ok && (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 1 }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}
    </span>
  )
}

const TYPE_COLORS: Record<string, string> = {
  'Nhiệt độ': '#ef4444',
  'Độ ẩm': '#3b82f6',
  'Ánh sáng': '#f59e0b',
}

function TypeBadge({ type }: { type: string }) {
  const color = TYPE_COLORS[type] || '#64748b'
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 5,
      background: `${color}12`, border: `1px solid ${color}28`,
      color, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500,
    }}>
      {type}
    </span>
  )
}

type SortKey = 'id' | 'sensorName' | 'sensorType' | 'value' | 'datetime' | 'quality'
type SortDir = 'asc' | 'desc'

export default function DataSensor() {
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<DetailFilter>(EMPTY_FILTER)
  const [filterApplied, setFilterApplied] = useState(false)
  const [errorRecord, setErrorRecord] = useState<SensorRecord | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('id')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    let rows = ALL_DATA
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter((r) =>
        String(r.id).includes(q) ||
        r.sensorName.toLowerCase().includes(q) ||
        r.sensorType.toLowerCase().includes(q) ||
        String(r.value).includes(q) ||
        r.unit.toLowerCase().includes(q) ||
        fmt(r.datetime).includes(q) ||
        r.quality.toLowerCase().includes(q)
      )
    }
    if (filterApplied) {
      const f = activeFilter
      if (f.weekday) {
        const wd = Number(f.weekday)
        rows = rows.filter((r) => {
          const jsDay = r.datetime.getDay()
          const mapped = jsDay === 0 ? 1 : jsDay + 1
          return mapped === wd
        })
      }
      if (f.day) rows = rows.filter((r) => r.datetime.getDate() === Number(f.day))
      if (f.month) rows = rows.filter((r) => r.datetime.getMonth() + 1 === Number(f.month))
      if (f.year) rows = rows.filter((r) => r.datetime.getFullYear() === Number(f.year))
      if (f.hour) rows = rows.filter((r) => r.datetime.getHours() === Number(f.hour))
      if (f.minute) rows = rows.filter((r) => r.datetime.getMinutes() === Number(f.minute))
      if (f.second) rows = rows.filter((r) => r.datetime.getSeconds() === Number(f.second))
      if (f.sensorType) rows = rows.filter((r) => r.sensorType === f.sensorType)
      if (f.quality) rows = rows.filter((r) => r.quality === f.quality)
    }
    rows = [...rows].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'id') cmp = a.id - b.id
      else if (sortKey === 'sensorName') cmp = a.sensorName.localeCompare(b.sensorName)
      else if (sortKey === 'sensorType') cmp = a.sensorType.localeCompare(b.sensorType)
      else if (sortKey === 'value') cmp = a.value - b.value
      else if (sortKey === 'datetime') cmp = a.datetime.getTime() - b.datetime.getTime()
      else if (sortKey === 'quality') cmp = a.quality.localeCompare(b.quality)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return rows
  }, [search, filterApplied, activeFilter, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  const handleSearch = (f: DetailFilter) => {
    const hasAny = Object.values(f).some((v) => v !== '')
    setActiveFilter(f)
    setFilterApplied(hasAny)
    setPage(1)
  }

  const removeTag = (key: keyof DetailFilter) => {
    const next = { ...activeFilter, [key]: '' }
    const hasAny = Object.values(next).some((v) => v !== '')
    setActiveFilter(next)
    setFilterApplied(hasAny)
    setPage(1)
  }

  const TAG_LABELS: Record<keyof DetailFilter, (v: string) => string> = {
    weekday: (v) => WEEKDAY_NAMES[Number(v)] || v,
    day: (v) => `Ngày ${v}`,
    month: (v) => `Tháng ${v}`,
    year: (v) => `Năm ${v}`,
    hour: (v) => `Giờ ${v}`,
    minute: (v) => `Phút ${v}`,
    second: (v) => `Giây ${v}`,
    sensorType: (v) => v,
    quality: (v) => v,
  }

  const filterTags = filterApplied
    ? (Object.entries(activeFilter) as [keyof DetailFilter, string][])
        .filter(([, v]) => v !== '')
        .map(([k, v]) => ({ key: k, label: TAG_LABELS[k](v) }))
    : []

  const activeFilterCount = Object.values(activeFilter).filter((v) => v !== '').length

  const thStyle = (key: SortKey): React.CSSProperties => ({
    padding: '9px 14px',
    textAlign: 'left',
    fontSize: 10,
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: '0.08em',
    color: sortKey === key ? '#2563eb' : '#475569',
    fontWeight: 600,
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    borderBottom: '1px solid rgba(0,0,0,0.07)',
  })

  const pageRange = (): number[] => {
    const pages: number[] = []
    const delta = 2
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) pages.push(i)
    }
    const result: number[] = []
    let prev = 0
    for (const p of pages) {
      if (p - prev > 1) result.push(-1)
      result.push(p)
      prev = p
    }
    return result
  }

  return (
    <>
      <FilterModal
        open={filterOpen}
        initial={activeFilter}
        onClose={() => setFilterOpen(false)}
        onSearch={handleSearch}
      />
      {errorRecord && (
        <ErrorModal record={errorRecord} onClose={() => setErrorRecord(null)} />
      )}

      <div style={{ padding: '20px 24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ marginBottom: 16, flexShrink: 0 }}>
          <h1 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Data Sensor
          </h1>
          <div style={{ fontSize: 12, color: '#64748b', fontFamily: "'Inter', sans-serif", fontWeight: 500, marginTop: 1 }}>
            Dữ liệu cảm biến
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
            {filtered.length} bản ghi · Trang {page}/{totalPages}
          </div>
        </div>

        {/* Search bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: filterTags.length > 0 ? 10 : 14, flexShrink: 0 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <svg
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Tìm kiếm dữ liệu..."
              style={{
                width: '100%', background: '#ffffff',
                border: '1px solid rgba(37,99,235,0.12)', borderRadius: 8,
                padding: '9px 12px 9px 32px', color: '#0f172a',
                fontSize: 12, fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            onClick={() => { setSearch(''); setActiveFilter(EMPTY_FILTER); setFilterApplied(false); setPage(1) }}
            title="Làm mới"
            style={{
              padding: '0 13px', borderRadius: 8,
              border: '1px solid rgba(37,99,235,0.12)',
              background: '#ffffff', color: '#64748b', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
            </svg>
          </button>
          <button
            onClick={() => setFilterOpen(true)}
            style={{
              padding: '9px 16px', borderRadius: 8, cursor: 'pointer',
              border: `1px solid ${filterApplied ? '#2563eb' : 'rgba(37,99,235,0.15)'}`,
              background: filterApplied ? 'rgba(37,99,235,0.08)' : '#ffffff',
              color: filterApplied ? '#2563eb' : '#475569',
              fontSize: 12, fontFamily: "'Inter', sans-serif", fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Bộ lọc chi tiết
            {activeFilterCount > 0 && (
              <span style={{
                background: '#2563eb', color: '#fff', borderRadius: '50%',
                width: 17, height: 17, fontSize: 9, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Active filter tags */}
        {filterTags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12, flexShrink: 0 }}>
            {filterTags.map((tag) => (
              <FilterTag key={tag.key} label={tag.label} onRemove={() => removeTag(tag.key)} />
            ))}
          </div>
        )}

        {/* Table */}
        <div style={{
          flex: 1, background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12,
          overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0,
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '8%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '18%' }} />
              </colgroup>
              <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                <tr>
                  {([
                    { key: 'id' as SortKey, label: 'MÃ' },
                    { key: 'sensorName' as SortKey, label: 'TÊN CẢM BIẾN' },
                    { key: 'sensorType' as SortKey, label: 'LOẠI CẢM BIẾN' },
                    { key: 'value' as SortKey, label: 'GIÁ TRỊ' },
                    { key: 'id' as SortKey, label: 'ĐƠN VỊ', noSort: true },
                    { key: 'datetime' as SortKey, label: 'THỜI GIAN' },
                    { key: 'quality' as SortKey, label: 'CHẤT LƯỢNG' },
                  ] as { key: SortKey; label: string; noSort?: boolean }[]).map(({ key, label, noSort }, i) => (
                    <th
                      key={i}
                      style={{ ...thStyle(key), cursor: noSort ? 'default' : 'pointer' }}
                      onClick={noSort ? undefined : () => handleSort(key)}
                    >
                      {label}
                      {!noSort && (
                        <span style={{ marginLeft: 3, fontSize: 9, color: sortKey === key ? '#2563eb' : '#94a3b8' }}>
                          {sortKey === key ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.map((row, i) => (
                  <tr
                    key={row.id}
                    style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.013)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f6ff')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.013)')}
                  >
                    <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#94a3b8', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      #{String(row.id).padStart(3, '0')}
                    </td>
                    <td style={{ padding: '8px 14px', fontSize: 12, color: '#1e293b', borderBottom: '1px solid rgba(0,0,0,0.04)', fontFamily: "'Inter', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.sensorName}
                    </td>
                    <td style={{ padding: '8px 14px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <TypeBadge type={row.sensorType} />
                    </td>
                    <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#0f172a', fontWeight: 500, borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      {row.value}
                    </td>
                    <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#94a3b8', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      {row.unit}
                    </td>
                    <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#475569', borderBottom: '1px solid rgba(0,0,0,0.04)', whiteSpace: 'nowrap' }}>
                      {fmt(row.datetime)}
                    </td>
                    <td style={{ padding: '8px 14px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <QualityBadge
                        quality={row.quality}
                        errorReason={row.errorReason}
                        onClick={() => setErrorRecord(row)}
                      />
                    </td>
                  </tr>
                ))}
                {pageData.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: 52, textAlign: 'center', color: '#cbd5e1', fontFamily: "'Inter', sans-serif", fontSize: 13 }}>
                      Không tìm thấy bản ghi nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px', borderTop: '1px solid rgba(0,0,0,0.06)', flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, color: '#64748b', fontFamily: "'Inter', sans-serif" }}>
              Hiển thị {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} trên {filtered.length} bản ghi
            </span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '4px 11px', borderRadius: 6, border: '1px solid rgba(37,99,235,0.12)',
                  background: 'transparent', color: page === 1 ? '#cbd5e1' : '#475569',
                  fontSize: 11, fontFamily: "'Inter', sans-serif", cursor: page === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                ‹ Trước
              </button>
              {pageRange().map((p, i) =>
                p === -1 ? (
                  <span key={`e${i}`} style={{ padding: '0 4px', color: '#94a3b8', fontSize: 12 }}>…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      width: 28, height: 28, borderRadius: 6,
                      border: `1px solid ${page === p ? '#2563eb' : 'rgba(37,99,235,0.1)'}`,
                      background: page === p ? '#2563eb' : 'transparent',
                      color: page === p ? '#ffffff' : '#475569',
                      fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                      cursor: 'pointer', fontWeight: page === p ? 600 : 400,
                    }}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '4px 11px', borderRadius: 6, border: '1px solid rgba(37,99,235,0.12)',
                  background: 'transparent', color: page === totalPages ? '#cbd5e1' : '#475569',
                  fontSize: 11, fontFamily: "'Inter', sans-serif", cursor: page === totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Sau ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
