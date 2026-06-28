import { useEffect, useState } from 'react'
import {
  computeBarComparison, drinkReceita, drinkCusto, drinkLucro, drinkMargemPct,
} from '../lib/finance'
import { money, pct } from '../lib/format'

// Campo numerico de planejamento (salva ao sair do campo).
function PlanField({ label, hint, value, onCommit }) {
  const [draft, setDraft] = useState(value ?? 0)
  useEffect(() => { setDraft(value ?? 0) }, [value])
  return (
    <div className="plan-field">
      <label>{label}</label>
      <input
        type="number" min="0" step="0.01"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { const n = Number(draft) || 0; if (n !== (Number(value) || 0)) onCommit(n) }}
      />
      {hint && <span className="plan-hint">{hint}</span>}
    </div>
  )
}

function DrinkRow({ drink, onChange, onDelete }) {
  const [draft, setDraft] = useState(drink)
  useEffect(() => { setDraft(drink) }, [drink.id])

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }))
  const commit = (k) => { if ((draft[k] ?? '') !== (drink[k] ?? '')) onChange(drink.id, { [k]: draft[k] }) }
  const commitNum = (k) => { const n = Number(draft[k]) || 0; if (n !== Number(drink[k])) onChange(drink.id, { [k]: n }) }

  const margem = drinkMargemPct(draft)
  return (
    <tr>
      <td>
        <input className="cell-input" value={draft.name || ''} placeholder="Nome do drink"
          onChange={(e) => set('name', e.target.value)} onBlur={() => commit('name')} />
      </td>
      <td className="num">
        <input className="cell-input num" type="number" min="0" step="0.01" value={draft.unit_cost}
          onChange={(e) => set('unit_cost', e.target.value)} onBlur={() => commitNum('unit_cost')} />
      </td>
      <td className="num">
        <input className="cell-input num" type="number" min="0" step="0.01" value={draft.sale_price}
          onChange={(e) => set('sale_price', e.target.value)} onBlur={() => commitNum('sale_price')} />
      </td>
      <td className="num">
        <span className={`pill ${margem >= 50 ? 'green' : 'amber'}`}>{pct(margem)}</span>
      </td>
      <td className="num">
        <input className="cell-input num" type="number" min="0" step="1" value={draft.expected_qty}
          onChange={(e) => set('expected_qty', e.target.value)} onBlur={() => commitNum('expected_qty')} />
      </td>
      <td className="num">{money(drinkReceita(draft))}</td>
      <td className="num">{money(drinkCusto(draft))}</td>
      <td className="num"><strong>{money(drinkLucro(draft))}</strong></td>
      <td style={{ width: 36 }}>
        <button className="row-del" title="Remover" onClick={() => onDelete(drink.id)}>✕</button>
      </td>
    </tr>
  )
}

function ScenarioCard({ tag, title, sub, s, win }) {
  return (
    <div className={`scenario-card glass ${win ? 'win' : ''}`}>
      <div className="scenario-head">
        <span className="scenario-tag">{tag}</span>
        {win && <span className="scenario-win">melhor lucro</span>}
      </div>
      <h4>{title}</h4>
      <p className="scenario-sub">{sub}</p>
      <dl className="scenario-stats">
        <div><dt>Receita</dt><dd>{money(s.receita)}</dd></div>
        <div><dt>Custo</dt><dd>{money(s.custo)}</dd></div>
        <div className="big-row"><dt>Lucro</dt><dd className={s.lucro >= 0 ? 'pos' : 'neg'}>{money(s.lucro)}</dd></div>
        <div><dt>Margem</dt><dd>{pct(s.margem)}</dd></div>
      </dl>
    </div>
  )
}

export default function BarTab({ store, m }) {
  const drinks = store.drinks || []
  const c = computeBarComparison(m, drinks, store.settings)
  const set = (patch) => store.updateSettings(patch)

  const totReceita = drinks.reduce((a, d) => a + drinkReceita(d), 0)
  const totCusto = drinks.reduce((a, d) => a + drinkCusto(d), 0)
  const totLucro = totReceita - totCusto

  const verdictClass = c.winner === 'B' ? 'ok' : c.winner === 'A' ? 'warn' : 'warn'
  const verdictText = c.winner === 'tie'
    ? 'Os dois cenários empatam em lucro.'
    : `Cenário ${c.winner} gera ${money(Math.abs(c.diff))} a mais de lucro.`

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>Bar · comparação de cenários</h2>
          <p>Compare manter o <b>all-inclusive (empresa de open bar)</b> com <b>vender drinks no próprio bar</b>. Monte o cardápio abaixo e ajuste os 3 parâmetros — os números atualizam na hora.</p>
        </div>
      </div>

      {/* Parametros de planejamento */}
      <div className="card plan-card">
        <PlanField label="Preço da entrada — Cenário B (R$)" hint="ingresso só-entrada"
          value={store.settings.bar_entry_price} onCommit={(n) => set({ bar_entry_price: n })} />
        <PlanField label="Open bar terceirizado — só Cenário A (R$)" hint="taxa da empresa"
          value={store.settings.openbar_company_cost} onCommit={(n) => set({ openbar_company_cost: n })} />
        <PlanField label="Barman de produção — só Cenário B (R$)" hint="mão de obra do bar"
          value={store.settings.bar_barman_cost} onCommit={(n) => set({ bar_barman_cost: n })} />
        <div className="plan-field readonly">
          <label>Público (igual nos dois)</label>
          <div className="plan-readonly">{c.publico} pessoas</div>
          <span className="plan-hint">= ingressos previstos atuais</span>
        </div>
      </div>

      {/* Veredito */}
      <div className={`goal ${verdictClass}`}>
        <div className="big">{c.winner === 'tie' ? '=' : `+${money(Math.abs(c.diff))}`}</div>
        <div className="txt">
          {verdictText}<br />
          Bar previsto: {money(c.barReceita)} de receita · {c.drinksPerPerson.toFixed(1)} drinks/pessoa
          {c.drinksPerPerson > 6 && ' ⚠️ otimista'}
        </div>
      </div>

      {/* Cenarios lado a lado */}
      <div className="grid scenarios-grid">
        <ScenarioCard tag="A" title="All-inclusive (empresa)" sub="Ingresso all-inclusive + open bar terceirizado"
          s={c.a} win={c.winner === 'A'} />
        <ScenarioCard tag="B" title="Entrada + Bar (vocês operam)" sub="Entrada + venda de drinks (insumos + barman)"
          s={c.b} win={c.winner === 'B'} />
      </div>

      <p className="bar-assumption">
        <b>Premissa do cálculo:</b> a base de custos compartilhada é o custo previsto atual como está (estrutura, equipe, atrações, marketing, operação e <b>água mineral</b> contam nos dois). O <b>open bar terceirizado</b> e o <b>barman de produção</b> são exclusivos desta tela — não devem estar lançados nas tabelas de gastos, senão contam em dobro.
      </p>

      {/* Cardapio */}
      <div className="section-head" style={{ marginTop: 26 }}>
        <div>
          <h2 style={{ fontSize: '1.2rem' }}>Cardápio do bar</h2>
          <p>Cada drink: custo dos insumos, preço de venda e quantidade esperada. A margem e o lucro são calculados sozinhos.</p>
        </div>
        <button className="btn primary" onClick={() => store.addDrink()}>+ Adicionar drink</button>
      </div>

      <div className="table-wrap">
        <div className="toolbar">
          <div className="sum">
            Drinks: <b>{drinks.length}</b> &nbsp;·&nbsp; Receita: <b>{money(totReceita)}</b> &nbsp;·&nbsp; Custo: <b>{money(totCusto)}</b> &nbsp;·&nbsp; Lucro: <b>{money(totLucro)}</b>
          </div>
          <button className="btn sm" onClick={() => store.addDrink()}>+ Drink</button>
        </div>

        {drinks.length === 0 ? (
          <div className="empty">Nenhum drink no cardápio. Clique em “Adicionar drink”.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Drink</th>
                  <th className="num" style={{ width: 120 }}>Custo unit. (R$)</th>
                  <th className="num" style={{ width: 120 }}>Preço venda (R$)</th>
                  <th className="num" style={{ width: 90 }}>Margem</th>
                  <th className="num" style={{ width: 100 }}>Qtd esperada</th>
                  <th className="num" style={{ width: 120 }}>Receita</th>
                  <th className="num" style={{ width: 120 }}>Custo</th>
                  <th className="num" style={{ width: 120 }}>Lucro</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {drinks.map((d) => (
                  <DrinkRow key={d.id} drink={d} onChange={store.updateDrink} onDelete={store.deleteDrink} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
