export default function KpiCard({ label, value, hint, accent, tone }) {
  return (
    <div className={`card kpi ${accent ? 'accent-' + accent : ''}`}>
      <div className="label">{label}</div>
      <div className={`value ${tone || ''}`}>{value}</div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  )
}
