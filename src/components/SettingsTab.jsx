import { useEffect, useState } from 'react'
import { money } from '../lib/format'

function Field({ label, children }) {
  return <div className="field"><label>{label}</label>{children}</div>
}

export default function SettingsTab({ store, m }) {
  const s = store.settings
  const [draft, setDraft] = useState(s)
  useEffect(() => { setDraft(s) }, [s])

  const commit = (k, raw) => {
    const v = ['capacity', 'margin_target'].includes(k) ? Number(raw) || 0 : raw
    if (v !== s[k]) store.updateSettings({ [k]: v })
  }
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }))

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>Configurações</h2>
          <p>Parâmetros da festa usados em todos os cálculos. Ajuste conforme as decisões com a Malu e a Letícia.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="grid config-grid">
          <Field label="Nome do evento">
            <input value={draft.event_name || ''} onChange={(e) => set('event_name', e.target.value)} onBlur={(e) => commit('event_name', e.target.value)} />
          </Field>
          <Field label="Data do evento">
            <input type="date" value={draft.event_date || ''} onChange={(e) => set('event_date', e.target.value)} onBlur={(e) => commit('event_date', e.target.value)} />
          </Field>
          <Field label="Capacidade (pessoas)">
            <input type="number" min="0" value={draft.capacity} onChange={(e) => set('capacity', e.target.value)} onBlur={(e) => commit('capacity', e.target.value)} />
          </Field>
          <Field label="Meta de margem (%)">
            <input type="number" min="0" value={draft.margin_target} onChange={(e) => set('margin_target', e.target.value)} onBlur={(e) => commit('margin_target', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="card">
        <h3>Resumo rápido</h3>
        <table>
          <tbody>
            <tr><td>Preço de ingresso sugerido (p/ bater {m.marginTarget}%, lotando)</td><td className="num"><b>{money(m.precoSugerido)}</b></td></tr>
            <tr><td>Receita mínima para a meta</td><td className="num">{money(m.receitaMeta)}</td></tr>
            <tr><td>Custo total previsto</td><td className="num">{money(m.custoPrevisto)}</td></tr>
            <tr><td>Custo por pessoa (na capacidade cheia)</td><td className="num">{money(m.capacity ? m.custoPrevisto / m.capacity : 0)}</td></tr>
            <tr><td>Break-even (ingressos para empatar)</td><td className="num">{m.breakEven}</td></tr>
            <tr><td>Ingressos para a meta</td><td className="num">{m.ingressosMeta} de {m.capacity}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
