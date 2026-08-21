import { useState, useMemo } from 'react'

interface ActionRow {
  id: number
  device: 'Đèn' | 'Quạt' | 'Điều hòa'
  action: 'ON' | 'OFF'
  datetime: Date
}

function generateActions(): ActionRow[] {
  const devices: ActionRow['device'][] = ['Đèn', 'Quạt', 'Điều hòa']
  const rows: ActionRow[] = []
  const base = new Date('2026-08-16T08:00:00')
  for (let i = 0; i < 60; i++) {
    const t = new Date(base.getTime() + i * 7 * 60 * 1000 + Math.floor(Math.random() * 2 * 60 * 1000))
    rows.push({
      id: i + 1,
      device: devices[Math.floor(Math.random() * 3)],
      action: Math.random() > 0.45 ? 'ON' : 'OFF',
      datetime: t,
    })
  }
  return rows
}

const ALL_DATA = generateActions()
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

interface DetailFilter {
  weekday: string
  day: string
  month: string
  year: string
  hour: string
  minute: string
  second: string
  device: string
  action: string
}

const EMPTY_FILTER: DetailFilter = {
  weekday: '', day: '', month: '', year: '',
  hour: '', minute: '', second: '', device: '', action: '',
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
  appearance: 'none', background: '#f8fafc',
  border: '1px solid rgba(37,99,235,0.14)', borderRadius: 7,
  padding: '7px 28px 7px 10px', fontSize: 12,
  fontFamily: "'Inter', sans-serif", color: '#334155',
  outline: 'none', cursor: 'pointer', width: '100%',
}
const chevronPos: React.CSSProperties = {
  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none',
}

function FilterModal({ open, initial, onClose, onSearch }: {
  open: boolean; initial: DetailFilter; onClose: () => void; onSearch: (f: DetailFilter) => void
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

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(15,23,42,0.22)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff', borderRadius: 14,
          boxShadow: '0 8px 40px rgba(37,99,235,0.12), 0 2px 8px rgba(0,0,0,0.08)',
          width: 560, maxWidth: '94vw', padding: '24px 26px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
              Bộ lọc chi tiết
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: "'Inter', sans-serif", marginTop: 2 }}>
              Kết hợp nhiều điều kiện, bỏ trống để bỏ qua
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 20, lineHeight: 1, padding: 2 }}>
            ×
          </button>
        </div>

        {/* Time section */}
        <div style={{ fontSize: 10, color: '#64748b', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em', marginBottom: 10 }}>
          THỜI GIAN
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px 14px', marginBottom: 16 }}>
          {[
            { key: 'weekday' as const, label: 'Thứ', opts: WEEKDAY_NAMES.slice(1).map((w, i) => ({ v: String(i + 1), l: w })) },
            { key: 'day' as const, label: 'Ngày', opts: days.map((d) => ({ v: String(d), l: String(d) })) },
            { key: 'month' as const, label: 'Tháng', opts: months.map((m) => ({ v: String(m), l: `Tháng ${m}` })) },
            { key: 'year' as const, label: 'Năm', opts: years.map((y) => ({ v: String(y), l: String(y) })) },
            { key: 'hour' as const, label: 'Giờ', opts: hours.map((h) => ({ v: String(h), l: `${String(h).padStart(2, '0')}:xx` })) },
            { key: 'minute' as const, label: 'Phút', opts: minutes.map((m) => ({ v: String(m), l: `:${String(m).padStart(2, '0')}` })) },
            { key: 'second' as const, label: 'Giây', opts: seconds.map((s) => ({ v: String(s), l: `${String(s).padStart(2, '0')}s` })) },
          ].map(({ key, label, opts }) => (
            <div key={key}>
              <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>{label}</label>
              <div style={selectWrap}>
                <select value={form[key]} onChange={set(key)} style={selectBase}>
                  <option value="">Tất cả</option>
                  {opts.map(({ v, l }) => <option key={v} value={v}>{l}</option>)}
                </select>
                <span style={chevronPos}><ChevronDown /></span>
              </div>
            </div>
          ))}
        </div>

        {/* Device + Action section */}
        <div style={{ fontSize: 10, color: '#64748b', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em', marginBottom: 10 }}>
          THIẾT BỊ & HÀNH ĐỘNG
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 14px', marginBottom: 22 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>Thiết bị</label>
            <div style={selectWrap}>
              <select value={form.device} onChange={set('device')} style={selectBase}>
                <option value="">Tất cả</option>
                <option value="Đèn">Đèn</option>
                <option value="Quạt">Quạt</option>
                <option value="Điều hòa">Điều hòa</option>
              </select>
              <span style={chevronPos}><ChevronDown /></span>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>Hành động</label>
            <div style={selectWrap}>
              <select value={form.action} onChange={set('action')} style={selectBase}>
                <option value="">Tất cả</option>
                <option value="ON">ON</option>
                <option value="OFF">OFF</option>
              </select>
              <span style={chevronPos}><ChevronDown /></span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={() => setForm(EMPTY_FILTER)}
            style={{
              padding: '8px 18px', borderRadius: 8,
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
              padding: '8px 22px', borderRadius: 8, border: 'none',
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

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.18)',
      borderRadius: 20, padding: '3px 10px',
      fontSize: 11, color: '#2563eb', fontFamily: "'Inter', sans-serif",
    }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', padding: 0, fontSize: 13, lineHeight: 1 }}>
        ×
      </button>
    </span>
  )
}

function DeviceBadge({ device }: { device: ActionRow['device'] }) {
  const colors: Record<string, string> = { 'Đèn': '#f59e0b', 'Quạt': '#3b82f6', 'Điều hòa': '#8b5cf6' }
  const c = colors[device] || '#64748b'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 9px', borderRadius: 5,
      background: `${c}12`, border: `1px solid ${c}28`,
      color: c, fontSize: 11,
      fontFamily: "'JetBrains Mono', monospace", fontWeight: 500,
    }}>
      {device}
    </span>
  )
}

function ActionBadge({ action }: { action: 'ON' | 'OFF' }) {
  const isOn = action === 'ON'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 10px', borderRadius: 5,
      background: isOn ? 'rgba(34,197,94,0.09)' : 'rgba(71,85,105,0.10)',
      border: `1px solid ${isOn ? 'rgba(34,197,94,0.28)' : 'rgba(71,85,105,0.22)'}`,
      color: isOn ? '#16a34a' : '#64748b',
      fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
      fontWeight: 600, letterSpacing: '0.06em',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: isOn ? '#22c55e' : '#94a3b8' }} />
      {action}
    </span>
  )
}

type SortKey = 'id' | 'device' | 'action' | 'datetime'
type SortDir = 'asc' | 'desc'

export default function ActionHistory() {
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<DetailFilter>(EMPTY_FILTER)
  const [filterApplied, setFilterApplied] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('id')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    let rows = ALL_DATA
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter((r) =>
        String(r.id).includes(q) ||
        r.device.toLowerCase().includes(q) ||
        r.action.toLowerCase().includes(q) ||
        fmt(r.datetime).includes(q)
      )
    }
    if (filterApplied) {
      const f = activeFilter
      if (f.weekday) {
        const wd = Number(f.weekday)
        rows = rows.filter((r) => {
          const jsDay = r.datetime.getDay()
          return (jsDay === 0 ? 1 : jsDay + 1) === wd
        })
      }
      if (f.day) rows = rows.filter((r) => r.datetime.getDate() === Number(f.day))
      if (f.month) rows = rows.filter((r) => r.datetime.getMonth() + 1 === Number(f.month))
      if (f.year) rows = rows.filter((r) => r.datetime.getFullYear() === Number(f.year))
      if (f.hour) rows = rows.filter((r) => r.datetime.getHours() === Number(f.hour))
      if (f.minute) rows = rows.filter((r) => r.datetime.getMinutes() === Number(f.minute))
      if (f.second) rows = rows.filter((r) => r.datetime.getSeconds() === Number(f.second))
      if (f.device) rows = rows.filter((r) => r.device === f.device)
      if (f.action) rows = rows.filter((r) => r.action === f.action)
    }
    rows = [...rows].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'id') cmp = a.id - b.id
      else if (sortKey === 'device') cmp = a.device.localeCompare(b.device)
      else if (sortKey === 'action') cmp = a.action.localeCompare(b.action)
      else if (sortKey === 'datetime') cmp = a.datetime.getTime() - b.datetime.getTime()
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
    setActiveFilter(next)
    setFilterApplied(Object.values(next).some((v) => v !== ''))
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
    device: (v) => v,
    action: (v) => v,
  }

  const filterTags = filterApplied
    ? (Object.entries(activeFilter) as [keyof DetailFilter, string][])
        .filter(([, v]) => v !== '')
        .map(([k, v]) => ({ key: k, label: TAG_LABELS[k](v) }))
    : []

  const activeFilterCount = Object.values(activeFilter).filter((v) => v !== '').length

  const thStyle = (key: SortKey): React.CSSProperties => ({
    padding: '10px 20px',
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

      <div style={{ padding: '20px 24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ marginBottom: 16, flexShrink: 0 }}>
          <h1 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Action History
          </h1>
          <div style={{ fontSize: 12, color: '#64748b', fontFamily: "'Inter', sans-serif", fontWeight: 500, marginTop: 1 }}>
            Lịch sử hoạt động
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
            {filtered.length} sự kiện · Trang {page}/{totalPages}
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
              placeholder="Tìm kiếm lịch sử..."
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
              padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
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

        {/* Filter tags */}
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
                <col style={{ width: '14%' }} />
                <col style={{ width: '24%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '40%' }} />
              </colgroup>
              <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                <tr>
                  {([
                    { key: 'id' as SortKey, label: 'MÃ' },
                    { key: 'device' as SortKey, label: 'THIẾT BỊ' },
                    { key: 'action' as SortKey, label: 'HÀNH ĐỘNG' },
                    { key: 'datetime' as SortKey, label: 'THỜI GIAN' },
                  ]).map(({ key, label }) => (
                    <th key={key} style={thStyle(key)} onClick={() => handleSort(key)}>
                      {label}
                      <span style={{ marginLeft: 3, fontSize: 9, color: sortKey === key ? '#2563eb' : '#94a3b8' }}>
                        {sortKey === key ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
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
                    <td style={{ padding: '10px 20px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#94a3b8', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      #{String(row.id).padStart(3, '0')}
                    </td>
                    <td style={{ padding: '10px 20px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <DeviceBadge device={row.device} />
                    </td>
                    <td style={{ padding: '10px 20px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <ActionBadge action={row.action} />
                    </td>
                    <td style={{ padding: '10px 20px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#475569', borderBottom: '1px solid rgba(0,0,0,0.04)', whiteSpace: 'nowrap' }}>
                      {fmt(row.datetime)}
                    </td>
                  </tr>
                ))}
                {pageData.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: 52, textAlign: 'center', color: '#cbd5e1', fontFamily: "'Inter', sans-serif", fontSize: 13 }}>
                      Không tìm thấy sự kiện nào
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
