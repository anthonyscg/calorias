import { useState, useEffect } from 'react'

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

function EntryCard({ entry, onRemove }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ fontSize: 13, lineHeight: 1.45, flex: 1 }}>{entry.desc}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{Math.round(entry.kcal)} kcal</span>
          <button
            onClick={onRemove}
            style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 16, lineHeight: 1, padding: '0 0 0 2px' }}
          >×</button>
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

function TodayTab() {
  const [entries, setEntries] = useState(() => getDay(todayKey()))
  const [mealType, setMealType] = useState('Café da manhã')
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const t = totals(entries)
  const remaining = GOAL_KCAL - Math.round(t.k)

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
        type: mealType,
        desc,
        kcal: data.kcal || 0,
        prot: data.prot || 0,
        carb: data.carb || 0,
        fat:  data.fat  || 0,
        note: data.note || '',
      }
      const updated = [...entries, entry]
      setEntries(updated)
      saveDay(todayKey(), updated)
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
    saveDay(todayKey(), updated)
  }

  const grouped = MEAL_TYPES.reduce((acc, mt) => {
    const items = entries.filter(e => e.type === mt.label)
    if (items.length) acc[mt.label] = items
    return acc
  }, {})

  return (
    <div>
      {/* Summary */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 18px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
          <span style={{
            fontSize: 42, fontWeight: 600,
            color: t.k > GOAL_KCAL ? 'var(--red)' : t.k > GOAL_KCAL * 0.85 ? 'var(--amber)' : 'var(--text)'
          }}>{Math.round(t.k)}</span>
          <span style={{ fontSize: 15, color: 'var(--text2)' }}>/ {GOAL_KCAL} kcal</span>
          <span style={{
            fontSize: 12, color: remaining < 0 ? 'var(--red)' : remaining < 300 ? 'var(--amber)' : 'var(--text2)',
            marginLeft: 'auto'
          }}>
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

      {/* Input */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {MEAL_TYPES.map(mt => (
            <button
              key={mt.label}
              onClick={() => setMealType(mt.label)}
              style={{
                padding: '5px 11px', fontSize: 12, borderRadius: 20,
                border: '1px solid ' + (mealType === mt.label ? 'var(--border2)' : 'var(--border)'),
                background: mealType === mt.label ? 'var(--bg3)' : 'transparent',
                color: mealType === mt.label ? 'var(--text)' : 'var(--text2)',
                fontWeight: mealType === mt.label ? 500 : 400,
              }}
            >{mt.icon} {mt.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); analyze() } }}
            disabled={loading}
            placeholder="Ex: frango grelhado 150g com arroz e feijão..."
            rows={2}
            style={{
              flex: 1, padding: '10px 12px', fontSize: 14, lineHeight: 1.4,
              background: 'var(--bg2)', border: '1px solid var(--border2)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text)', resize: 'none',
              outline: 'none', opacity: loading ? 0.6 : 1,
            }}
          />
          <button
            onClick={analyze}
            disabled={loading || !input.trim()}
            style={{
              padding: '10px 16px', fontSize: 13, borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border2)', background: 'var(--bg3)',
              color: 'var(--text)', opacity: loading || !input.trim() ? 0.4 : 1,
              whiteSpace: 'nowrap',
            }}
          >{loading ? 'Analisando...' : 'Analisar ↗'}</button>
        </div>
        {error && <div style={{ marginTop: 6, fontSize: 12, color: 'var(--red)' }}>Erro: {error}</div>}
      </div>

      {/* Entries */}
      {Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, padding: '2rem 0' }}>
          Nenhuma refeição registrada hoje
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {MEAL_TYPES.filter(mt => grouped[mt.label]).map(mt => (
            <div key={mt.label}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '10px 0 5px' }}>
                {mt.icon} {mt.label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {grouped[mt.label].map(e => <EntryCard key={e.id} entry={e} onRemove={() => remove(e.id)} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function HistoryTab() {
  const data = loadAll()
  const today = todayKey()
  const keys = Object.keys(data).sort().reverse().filter(k => k !== today)

  if (!keys.length) {
    return <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, padding: '2rem 0' }}>Os dias anteriores aparecerão aqui</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {keys.map(k => {
        const entries = data[k]
        const t = totals(entries)
        const p = pct(t.k, GOAL_KCAL)
        const color = t.k > GOAL_KCAL ? 'var(--red)' : t.k > GOAL_KCAL * 0.85 ? 'var(--amber)' : 'var(--green)'
        const label = new Date(k + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
        return (
          <div key={k} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text2)', textTransform: 'capitalize' }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color }}>{Math.round(t.k)} kcal</span>
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 4, height: 6, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ width: p + '%', height: '100%', background: color, borderRadius: 4 }} />
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              {[['Prot', t.p, 'var(--green)'], ['Carb', t.c, 'var(--blue)'], ['Gord', t.f, 'var(--amber)']].map(([lbl, val, c]) => (
                <span key={lbl} style={{ fontSize: 11, color: 'var(--text2)' }}>
                  {lbl} <span style={{ color: c, fontWeight: 500 }}>{Math.round(val)}g</span>
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('today')

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20, paddingTop: 8 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>Calorias</h1>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>Meta diária: {GOAL_KCAL} kcal</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg2)', borderRadius: 'var(--radius-sm)', padding: 3 }}>
        {[['today', 'Hoje'], ['history', 'Histórico']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, padding: '7px 0', fontSize: 13, borderRadius: 5, border: 'none',
              background: tab === key ? 'var(--bg3)' : 'transparent',
              color: tab === key ? 'var(--text)' : 'var(--text2)',
              fontWeight: tab === key ? 500 : 400,
              transition: 'all 0.15s',
            }}
          >{label}</button>
        ))}
      </div>

      {tab === 'today' ? <TodayTab /> : <HistoryTab />}
    </div>
  )
}
