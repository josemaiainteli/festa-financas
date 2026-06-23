import {
  Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts'
import KpiCard from './KpiCard'
import { money, moneyShort, pct } from '../lib/format'

const COLORS = ['#0ea5e9', '#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#8b5cf6', '#64748b']

export default function DashboardReal({ m }) {
  const caixa = m.receitaReal - m.custoReal
  const goalClass = caixa >= 0 ? 'ok' : 'warn'

  const compareData = [
    { name: 'Gastos', Previsto: m.custoPrevisto, Real: m.custoReal },
    { name: 'Receitas', Previsto: m.receitaPrevista, Real: m.receitaReal },
  ]

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>Dashboard Real</h2>
          <p>Cenário realizado: o que já entrou e saiu de fato. Acompanhe o ritmo de vendas e o caixa atual.</p>
        </div>
      </div>

      <div className={`goal ${goalClass}`}>
        <div className="big">{money(caixa)}</div>
        <div className="txt">
          Caixa atual (recebido − pago)<br />
          {m.ingressosVendidos} ingressos vendidos &nbsp;·&nbsp; <strong>{pct(m.ocupacaoReal)}</strong> da capacidade ({m.capacity})
        </div>
      </div>

      <div className="grid kpis">
        <KpiCard label="Receita recebida" value={money(m.receitaReal)} accent="green" hint={`${pct(m.receitaExecutada)} do previsto`} />
        <KpiCard label="Gastos pagos" value={money(m.custoReal)} accent="red" hint={`${pct(m.custoExecutado)} do previsto`} />
        <KpiCard label="Caixa atual" value={money(caixa)} accent={caixa >= 0 ? 'green' : 'red'} tone={caixa >= 0 ? 'pos' : 'neg'} />
        <KpiCard label="Margem real" value={pct(m.margemReal)} accent="amber" hint={`meta ${m.marginTarget}%`} />
        <KpiCard label="Ingressos vendidos" value={`${m.ingressosVendidos} / ${m.capacity}`} hint={pct(m.ocupacaoReal) + ' da casa'} />
        <KpiCard label="Lucro projetado*" value={money(m.lucroPrevisto)} hint="se o plano se confirmar" />
      </div>

      <div className="grid chart-grid">
        <div className="card">
          <h3>Previsto × Real</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={compareData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={moneyShort} tick={{ fontSize: 11 }} width={56} />
              <Tooltip formatter={(v) => money(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Previsto" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Real" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>Gastos realizados por categoria</h3>
          {m.gastosReaisPorCategoria.length === 0 ? (
            <div className="empty">Nenhum gasto pago registrado ainda.</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={m.gastosReaisPorCategoria} dataKey="total" nameKey="category" innerRadius={55} outerRadius={95} paddingAngle={2}>
                    {m.gastosReaisPorCategoria.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => money(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="legend">
                {m.gastosReaisPorCategoria.map((g, i) => (
                  <span key={g.category}>
                    <i style={{ background: COLORS[i % COLORS.length] }} />
                    {g.category} — {money(g.total)}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <p className="foot">* O lucro projetado usa a receita prevista; a margem real considera apenas o que já foi recebido e pago.</p>
    </div>
  )
}
