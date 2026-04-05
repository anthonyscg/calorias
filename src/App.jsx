import { useState } from 'react'

const GOAL_KCAL = 2000
const GOAL_PROT = 150
const GOAL_CARB = 250
const GOAL_FAT  = 65

const MEAL_TYPES = [
  { label: 'Café da manhã', icon: '☕' },
  { label: 'Almoço',        icon: '🍽' },
  { label: 'Lanche',        icon: '🥪' },
  { label: 'Jantar',        icon: '🌙' },
  { label: 'Ceia',          icon: '🫖' },
]

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}
function loadAll() {
  try { return JSON.parse(localStorage.getItem('calorias_v1') || '{}') } catch { return {} }
}
function saveAll(d) {
  try { localStorage.setItem('calorias_v1', JSON.stringify(d)) } catch {}
}
function getDay(key) {
  return loadAll()[key] || []
}
function saveDay(key, entries) {
  const d = loadAll()
  d[key] = entries
  saveAll(d)
}
function totals(entries) {
  return entries.reduce(
    (a, e) => ({ k: a.k + e.kcal, p: a.p + e.prot, c: a.c + e.carb, f: a.f + e.fat }),
    { k: 0, p: 0, c: 0, f: 0 }
  )
}
function pct(val, goal) {
  return Math.min(Math.round((val / goal) * 100), 100)
}
function dayColor(kcal) {
  if (kcal === 0) return null
  if (kcal > GOAL_KCAL) return 'var(--red)'
  if (kcal > GOAL_KCAL * 0.85) return 'var(--amber)'
  return 'var(--green)'
}
function formatDateLabel(key) {
  if (!key) return ''
  const today = todayKey()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yKey = yesterday.toISOString().slice(0, 10)
  if (key === today) return 'Hoje'
  if (key === yKey) return 'Ontem'
  return new Date(key + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
}

function ProgressBar({ value, goal, color }) {
  const p = pct(value, goal)
  const barColor = value > goal ? 'var(--red)' : value > goal * 0.85 ? 'var(--amber)' : color
  return (
    <div style={{ background: 'var(--bg3)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
      <div style={{ width: p + '%', height: '100%', background: barColor, borderRadius: 4, transition: 'width 0.4s' }} />
    </div>
  )
}

function MacroCard({ label, value, goal, color }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 5 }}>{Math.round(value)}g</div>
      <ProgressBar value={value} goal={goal} color={color} />
    </div>
  )
}

function EntryCard({ entry, onRemove, readOnly }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ fontSize: 13, lineHeight: 1.45, flex: 1 }}>{entry.desc}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{Math.round(entry.kcal)} kcal</span>
          {!readOnly && (
            <button onClick={onRemove} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 16, lineHeight: 1, padding: '0 0 0 2px' }}>×</button>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
        {[['Prot', entry.prot, 'var(--green)'], ['Carb', entry.carb, 'var(--blue)'], ['Gord', entry.fat, 'var(--amber)']].map(([lbl, val, color]) => (
          <span key={lbl} style={{ fontSize: 11, color: 'var(--text2)' }}>
            {lbl} <span style={{ color, fontWeight: 500 }}>{Math.round(val)}g</span>
          </span>
        ))}
        {entry.note && <span style={{ fontSize: 11, color: 'var(--text3)', fontStyle: 'italic' }}>{entry.note}</span>}
      </div>
    </div>
  )
}

function CalendarView({ onSelectDay, selectedDay }) {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const data = loadAll()
  const today = todayKey()
  const { year, month } = viewDate
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthLabel = new Date(year, month, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  function prevMonth() {
    setViewDate(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 })
  }
  function nextMonth() {
    setViewDate(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 })
  }

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer', padding: '2px 8px' }}>‹</button>
        <span style={{ fontSize: 14, fontWeight: 500, textTransform: 'capitalize' }}>{monthLabel}</span>
        <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer', padding: '2px 8px' }}>›</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {['D','S','T','Q','Q','S','S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text3)', fontWeight: 500, padding: '3px 0' }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const entries = data[key] || []
          const t = totals(entries)
          const color = dayColor(t.k)
          const isToday = key === today
          const isSelected = key === selectedDay
          const isFuture = key > today

          return (
            <button
              key={i}
              onClick={() => !isFuture && onSelectDay(key)}
              style={{
                aspectRatio: '1', borderRadius: 7,
                border: isSelected ? '2px solid var(--text)' : isToday ? '1px solid var(--border2)' : '1px solid transparent',
                background: isSelected ? 'var(--bg3)' : 'transparent',
                cursor: isFuture ? 'default' : 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 2,
                padding: 2, opacity: isFuture ? 0.2 : 1,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: isToday ? 600 : 400, color: isToday ? 'var(--text)' : 'var(--text2)', lineHeight: 1 }}>{day}</span>
              {color
                ? <div style={{ width: 4, height: 4, borderRadius: '50%', background: color }} />
                : <div style={{ width: 4, height: 4 }} />
              }
            </button>
          )
        })}
      </div>

      {/* Legenda */}
      <div style={{ display: 'flex', gap: 12, marginTop: 14, justifyContent: 'center' }}>
        {[['var(--green)', 'Dentro da meta'], ['var(--amber)', 'Próximo do limite'], ['var(--red)', 'Acima da meta']].map(([c, lbl]) => (
          <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>{lbl}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DayDetail({ dayKey }) {
  const [entries, setEntries] = useState(() => getDay(dayKey))
  const today = todayKey()
  const isToday = dayKey === today
  const t = totals(entries)
  const color = t.k > GOAL_KCAL ? 'var(--red)' : t.k > GOAL_KCAL * 0.85 ? 'var(--amber)' : 'var(--green)'

  // Atualiza quando muda de dia
  useState(() => { setEntries(getDay(dayKey)) }, [dayKey])

  const grouped = MEAL_TYPES.reduce((acc, mt) => {
    const items = entries.filter(e => e.type === mt.label)
    if (items.length) acc[mt.label] = items
    return acc
  }, {})

  function remove(id) {
    const updated = entries.filter(e => e.id !== id)
    setEntries(updated)
    saveDay(dayKey, updated)
  }

  if (!dayKey) return null

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', textTransform: 'capitalize', marginBottom: 12 }}>
        {formatDateLabel(dayKey)}
      </div>

      {entries.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, padding: '1.5rem 0' }}>
          Nenhuma refeição registrada
        </div>
      ) : (
        <>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 28, fontWeight: 600, color }}>{Math.round(t.k)}</span>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>/ {GOAL_KCAL} kcal</span>
            </div>
            <ProgressBar value={t.k} goal={GOAL_KCAL} color="var(--green)" />
            <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
              {[['Prot', t.p, 'var(--green)'], ['Carb', t.c, 'var(--blue)'], ['Gord', t.f, 'var(--amber)']].map(([lbl, val, c]) => (
                <span key={lbl} style={{ fontSize: 12, color: 'var(--text2)' }}>
                  {lbl} <span style={{ color: c, fontWeight: 500 }}>{Math.round(val)}g</span>
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {MEAL_TYPES.filter(mt => grouped[mt.label]).map(mt => (
              <div key={mt.label}>
                <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '8px 0 4px' }}>
                  {mt.icon} {mt.label}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {grouped[mt.label].map(e => (
                    <EntryCard key={e.id} entry={e} readOnly={!isToday} onRemove={() => remove(e.id)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function TodayTab() {
  const [dayKey, setDayKey] = useState(todayKey())
  const [entries, setEntries] = useState(() => getDay(todayKey()))
  const [mealType, setMealType] = useState('Café da manhã')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isToday = dayKey === todayKey()
  const t = totals(entries)
  const remaining = GOAL_KCAL - Math.round(t.k)

  function goDay(offset) {
    const d = new Date(dayKey + 'T12:00:00')
    d.setDate(d.getDate() + offset)
    const newKey = d.toISOString().slice(0, 10)
    if (newKey > todayKey()) return
    setDayKey(newKey)
    setEntries(getDay(newKey))
    setError('')
  }

  async function analyze() {
    const desc = input.trim()
    if (!desc || loading) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc, mealType }),
      })
      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.error || 'Erro desconhecido')
      }
      const data = await res.json()
      const entry = {
        id: Date.now().toString(),
        type: mealType, desc,
        kcal: data.kcal || 0, prot: data.prot || 0,
        carb: data.carb || 0, fat: data.fat || 0, note: data.note || '',
      }
      const updated = [...entries, entry]
      setEntries(updated)
      saveDay(dayKey, updated)
      setInput('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function remove(id) {
    const updated = entries.filter(e => e.id !== id)
    setEntries(updated)
    saveDay(dayKey, updated)
  }

  const grouped = MEAL_TYPES.reduce((acc, mt) => {
    const items = entries.filter(e => e.type === mt.label)
    if (items.length) acc[mt.label] = items
    return acc
  }, {})

  return (
    <div>
      {/* Navegação de data */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 4px' }}>
        <button onClick={() => goDay(-1)} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer', padding: '2px 12px' }}>‹</button>
        <span style={{ fontSize: 14, fontWeight: 500, textTransform: 'capitalize' }}>{formatDateLabel(dayKey)}</span>
        <button
          onClick={() => goDay(1)} disabled={isToday}
          style={{ background: 'none', border: 'none', color: isToday ? 'var(--text3)' : 'var(--text2)', fontSize: 20, cursor: isToday ? 'default' : 'pointer', padding: '2px 12px' }}
        >›</button>
      </div>

      {/* Summary */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 18px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 42, fontWeight: 600, color: t.k > GOAL_KCAL ? 'var(--red)' : t.k > GOAL_KCAL * 0.85 ? 'var(--amber)' : 'var(--text)' }}>{Math.round(t.k)}</span>
          <span style={{ fontSize: 15, color: 'var(--text2)' }}>/ {GOAL_KCAL} kcal</span>
          <span style={{ fontSize: 12, color: remaining < 0 ? 'var(--red)' : remaining < 300 ? 'var(--amber)' : 'var(--text2)', marginLeft: 'auto' }}>
            {remaining >= 0 ? `${remaining} restantes` : `${Math.abs(remaining)} acima`}
          </span>
        </div>
        <ProgressBar value={t.k} goal={GOAL_KCAL} color="var(--green)" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
          <MacroCard label="Proteína"    value={t.p} goal={GOAL_PROT} color="var(--green)" />
          <MacroCard label="Carboidrato" value={t.c} goal={GOAL_CARB} color="var(--blue)"  />
          <MacroCard label="Gordura"     value={t.f} goal={GOAL_FAT}  color="var(--amber)" />
        </div>
      </div>

      {/* Input — só hoje */}
      {isToday && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {MEAL_TYPES.map(mt => (
              <button key={mt.label} onClick={() => setMealType(mt.label)} style={{
                padding: '5px 11px', fontSize: 12, borderRadius: 20,
                border: '1px solid ' + (mealType === mt.label ? 'var(--border2)' : 'var(--border)'),
                background: mealType === mt.label ? 'var(--bg3)' : 'transparent',
                color: mealType === mt.label ? 'var(--text)' : 'var(--text2)',
                fontWeight: mealType === mt.label ? 500 : 400,
              }}>{mt.icon} {mt.label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <textarea
              value={input} onChange={e => setInput(e.target.value)} disabled={loading}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); analyze() } }}
              placeholder="Ex: frango grelhado 150g com arroz e feijão..." rows={2}
              style={{ flex: 1, padding: '10px 12px', fontSize: 14, lineHeight: 1.4, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', resize: 'none', outline: 'none', opacity: loading ? 0.6 : 1 }}
            />
            <button onClick={analyze} disabled={loading || !input.trim()} style={{
              padding: '10px 16px', fontSize: 13, borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border2)', background: 'var(--bg3)',
              color: 'var(--text)', opacity: loading || !input.trim() ? 0.4 : 1, whiteSpace: 'nowrap',
            }}>{loading ? 'Analisando...' : 'Analisar ↗'}</button>
          </div>
          {error && <div style={{ marginTop: 6, fontSize: 12, color: 'var(--red)' }}>Erro: {error}</div>}
        </div>
      )}

      {/* Entries */}
      {Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, padding: '2rem 0' }}>
          {isToday ? 'Nenhuma refeição registrada hoje' : 'Nenhuma refeição registrada neste dia'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {MEAL_TYPES.filter(mt => grouped[mt.label]).map(mt => (
            <div key={mt.label}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '10px 0 5px' }}>
                {mt.icon} {mt.label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {grouped[mt.label].map(e => <EntryCard key={e.id} entry={e} readOnly={!isToday} onRemove={() => remove(e.id)} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CalendarTab() {
  const [selectedDay, setSelectedDay] = useState(todayKey())
  return (
    <div>
      <CalendarView onSelectDay={setSelectedDay} selectedDay={selectedDay} />
      <DayDetail dayKey={selectedDay} />
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('today')
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 40px' }}>
      <div style={{ marginBottom: 20, paddingTop: 8 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>Calorias</h1>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>Meta diária: {GOAL_KCAL} kcal</p>
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg2)', borderRadius: 'var(--radius-sm)', padding: 3 }}>
        {[['today', 'Hoje'], ['calendar', 'Calendário']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: '7px 0', fontSize: 13, borderRadius: 5, border: 'none',
            background: tab === key ? 'var(--bg3)' : 'transparent',
            color: tab === key ? 'var(--text)' : 'var(--text2)',
            fontWeight: tab === key ? 500 : 400, transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>
      {tab === 'today' ? <TodayTab /> : <CalendarTab />}
    </div>
  )
}
