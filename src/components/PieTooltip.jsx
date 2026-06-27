import { money, pct } from '../lib/format'

// Tooltip do gráfico de pizza: mostra a categoria, o valor e a
// porcentagem que ela representa do custo total.
export default function PieTooltip({ active, payload, total }) {
  if (!active || !payload || !payload.length) return null
  const slice = payload[0]
  const value = Number(slice.value) || 0
  const share = total > 0 ? (value / total) * 100 : 0
  const color = slice.payload?.fill || slice.color

  return (
    <div className="pie-tip">
      <div className="pie-tip-head">
        <span className="pie-tip-dot" style={{ background: color }} />
        {slice.name}
      </div>
      <div className="pie-tip-row">
        <span>{money(value)}</span>
        <strong>{pct(share)}</strong>
      </div>
    </div>
  )
}
