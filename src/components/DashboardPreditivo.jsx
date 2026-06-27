import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import KpiCard from './KpiCard'
import PieTooltip from './PieTooltip'
import { money, moneyShort, pct } from '../lib/format'

const COLORS = ['#0ea5e9', '#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#8b5cf6', '#64748b']

export default function DashboardPreditivo({ m }) {
  const goalClass = m.metaPrevistaAtingida ? 'ok' : m.margemPrevista >= m.marginTarget * 0.66 ? 'warn' : 'bad'
  const compareData = [
    { name: 'Custo', Previsto: m.custoPrevisto },
    { name: 'Receita', Previsto: m.receitaPrevista },
    { name: 'Lucro', Previsto: m.lucroPrevisto },
  ]

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>Dashboard Preditivo</h2>
          <p>Cenário planejado: o que esperamos gastar e arrecadar. A meta é lucro de pelo menos {m.marginTarget}% sobre as despesas.</p>
        </div>
      </div>

      <div className={`goal ${goalClass}`}>
        <div className="big">{pct(m.margemPrevista)}</div>
        <div className="txt">
          Margem de lucro prevista &nbsp;·&nbsp; meta de <strong>{m.marginTarget}%</strong><br />
          {m.metaPrevistaAtingida
            ? `Plano atinge a meta. Lucro previsto de ${money(m.lucroPrevisto)}.`
            : `Faltam ${pct(m.marginTarget - m.margemPrevista)} para a meta. Aumente o preço ou reduza custos.`}
        </div>
      </div>

      <div className="grid kpis">
        <KpiCard label="Custo total previsto" value={money(m.custoPrevisto)} accent="red" hint={`${m.gastosPorCategoria.length} categorias`} />
        <KpiCard label="Receita prevista" value={money(m.receitaPrevista)} accent="blue" hint={`${m.ingressosPrevistos} ingressos · ${pct(m.ocupacaoPrevista)} da casa`} />
        <KpiCard label="Lucro previsto" value={money(m.lucroPrevisto)} accent={m.lucroPrevisto >= 0 ? 'green' : 'red'} tone={m.lucroPrevisto >= 0 ? 'pos' : 'neg'} />
        <KpiCard label="Preço sugerido p/ meta" value={money(m.precoSugerido)} accent="amber" hint={`vendendo os ${m.capacity} lugares`} />
        <KpiCard label="Preço médio previsto" value={money(m.precoMedioPrevisto)} hint={`break-even: ${m.breakEven} ingressos`} />
        <KpiCard label="Ingressos p/ meta" value={`${m.ingressosMeta}`} hint={`de ${m.capacity} · receita meta ${moneyShort(m.receitaMeta)}`} />
      </div>

      <div className="grid chart-grid">
        <div className="card">
          <h3>Gastos previstos por categoria</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={m.gastosPorCategoria} dataKey="total" nameKey="category" innerRadius={55} outerRadius={95} paddingAngle={2}>
                {m.gastosPorCategoria.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<PieTooltip total={m.custoPrevisto} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="legend">
            {m.gastosPorCategoria.map((g, i) => (
              <span key={g.category}>
                <i style={{ background: COLORS[i % COLORS.length] }} />
                {g.category} — {money(g.total)}
              </span>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Custo × Receita × Lucro (previsto)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={compareData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={moneyShort} tick={{ fontSize: 11 }} width={56} />
              <Tooltip formatter={(v) => money(v)} />
              <Bar dataKey="Previsto" radius={[6, 6, 0, 0]}>
                {compareData.map((d, i) => (
                  <Cell key={i} fill={d.name === 'Custo' ? '#f43f5e' : d.name === 'Receita' ? '#0ea5e9' : (d.Previsto >= 0 ? '#16a34a' : '#dc2626')} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
