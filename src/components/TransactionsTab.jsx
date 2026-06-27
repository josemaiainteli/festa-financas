import { useEffect, useMemo, useState } from 'react'
import { computeAmount } from '../lib/finance'
import { money, todayISO } from '../lib/format'

const SORT_OPTIONS = [
  { key: 'added', label: 'Ordem de adição' },
  { key: 'value', label: 'Valor' },
  { key: 'category', label: 'Categoria' },
  { key: 'alpha', label: 'Ordem alfabética' },
]

function EditableRow({ tx, isReal, isReceita, categories, onChange, onDelete }) {
  const [draft, setDraft] = useState(tx)
  useEffect(() => { setDraft(tx) }, [tx.id])

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }))
  const commit = (k, v) => {
    const value = v ?? draft[k]
    if (value !== tx[k]) onChange(tx.id, { [k]: value })
  }
  const commitNum = (k) => {
    const n = Number(draft[k]) || 0
    if (n !== Number(tx[k])) onChange(tx.id, { [k]: n })
  }

  const statusOptions = isReceita ? ['pendente', 'recebido'] : ['pendente', 'pago']
  const total = computeAmount(draft)

  return (
    <tr>
      {isReal && (
        <td>
          <input
            className="cell-input"
            type="date"
            value={draft.occurred_on || ''}
            onChange={(e) => set('occurred_on', e.target.value)}
            onBlur={() => commit('occurred_on')}
          />
        </td>
      )}
      <td>
        <select
          className="cell-input"
          value={draft.category || ''}
          onChange={(e) => { set('category', e.target.value); onChange(tx.id, { category: e.target.value }) }}
        >
          <option value="">—</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          {draft.category && !categories.includes(draft.category) && (
            <option value={draft.category}>{draft.category}</option>
          )}
        </select>
      </td>
      <td>
        <input
          className="cell-input"
          value={draft.description || ''}
          placeholder="Descrição"
          onChange={(e) => set('description', e.target.value)}
          onBlur={() => commit('description')}
        />
      </td>
      <td className="num">
        <input
          className="cell-input num"
          type="number" min="0" step="0.01"
          value={draft.unit_value}
          onChange={(e) => set('unit_value', e.target.value)}
          onBlur={() => commitNum('unit_value')}
        />
      </td>
      <td className="num">
        <input
          className="cell-input num"
          type="number" min="0" step="1"
          value={draft.quantity}
          onChange={(e) => set('quantity', e.target.value)}
          onBlur={() => commitNum('quantity')}
        />
      </td>
      <td className="num"><strong>{money(total)}</strong></td>
      {isReal && (
        <td>
          <select
            className="cell-input"
            value={draft.status || 'pendente'}
            onChange={(e) => { set('status', e.target.value); onChange(tx.id, { status: e.target.value }) }}
          >
            {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </td>
      )}
      <td style={{ width: 36 }}>
        <button className="row-del" title="Remover" onClick={() => onDelete(tx.id)}>✕</button>
      </td>
    </tr>
  )
}

export default function TransactionsTab({ store, type, scenario, title, description, categories }) {
  const isReal = scenario === 'real'
  const isReceita = type === 'receita'

  const [query, setQuery] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [sortKey, setSortKey] = useState('added')
  const [sortDir, setSortDir] = useState('asc')

  // Linhas deste tipo/cenário, na ordem original (= ordem de adição).
  const rows = useMemo(
    () => store.transactions
      .filter((t) => t.type === type && t.scenario === scenario)
      .map((t, idx) => ({ ...t, _idx: idx })),
    [store.transactions, type, scenario],
  )

  // Categorias disponíveis no filtro: as padrão + as que já existem nos dados.
  const filterCategories = useMemo(() => {
    const set = new Set(categories)
    rows.forEach((t) => { if (t.category) set.add(t.category) })
    return [...set]
  }, [categories, rows])

  // Aplica busca, filtro de categoria e ordenação (sem alterar os dados).
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    let out = rows.filter((t) => {
      const matchQ = !q || (t.description || '').toLowerCase().includes(q)
      const matchCat = !catFilter || t.category === catFilter
      return matchQ && matchCat
    })
    const dir = sortDir === 'asc' ? 1 : -1
    out = [...out].sort((a, b) => {
      switch (sortKey) {
        case 'value': return (computeAmount(a) - computeAmount(b)) * dir
        case 'category': return (a.category || '').localeCompare(b.category || '', 'pt') * dir
        case 'alpha': return (a.description || '').localeCompare(b.description || '', 'pt') * dir
        default: return (a._idx - b._idx) * dir
      }
    })
    return out
  }, [rows, query, catFilter, sortKey, sortDir])

  const isFiltered = query.trim() !== '' || catFilter !== ''
  const total = visible.reduce((a, t) => a + computeAmount(t), 0)
  const qtdTotal = visible.reduce((a, t) => a + (Number(t.quantity) || 0), 0)

  const add = () => store.addTx({
    type, scenario,
    category: categories[0] || '',
    description: '',
    unit_value: 0,
    quantity: isReceita ? 1 : 1,
    status: isReal ? 'pendente' : null,
    occurred_on: isReal ? todayISO() : null,
  })

  const unitLabel = isReceita ? 'Preço (R$)' : 'Valor unit. (R$)'
  const qtyLabel = isReceita ? 'Qtd ingressos' : 'Qtd'

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <button className="btn primary" onClick={add}>+ Adicionar linha</button>
      </div>

      <div className="table-wrap">
        <div className="toolbar">
          <div className="sum">
            {isReceita
              ? <>Ingressos: <b>{qtdTotal}</b> &nbsp;·&nbsp; Receita: <b>{money(total)}</b></>
              : <>Itens: <b>{visible.length}</b>{isFiltered ? ` de ${rows.length}` : ''} &nbsp;·&nbsp; Total: <b>{money(total)}</b></>}
            {isFiltered && <span className="filtered-tag">filtrado</span>}
          </div>
          <button className="btn sm" onClick={add}>+ Linha</button>
        </div>

        {rows.length > 0 && (
          <div className="table-controls">
            <input
              className="ctrl-search"
              type="search"
              placeholder="Buscar por descrição…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="ctrl-select"
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              aria-label="Filtrar por categoria"
            >
              <option value="">Todas as categorias</option>
              {filterCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              className="ctrl-select"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              aria-label="Ordenar por"
            >
              {SORT_OPTIONS.map((o) => <option key={o.key} value={o.key}>Ordenar: {o.label}</option>)}
            </select>
            <button
              className="ctrl-dir"
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              title={sortDir === 'asc' ? 'Crescente' : 'Decrescente'}
            >
              {sortDir === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="empty">Nenhum lançamento ainda. Clique em “Adicionar linha”.</div>
        ) : visible.length === 0 ? (
          <div className="empty">Nenhum resultado para os filtros atuais.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  {isReal && <th style={{ width: 130 }}>Data</th>}
                  <th style={{ width: 150 }}>Categoria</th>
                  <th>Descrição</th>
                  <th className="num" style={{ width: 120 }}>{unitLabel}</th>
                  <th className="num" style={{ width: 100 }}>{qtyLabel}</th>
                  <th className="num" style={{ width: 120 }}>Total</th>
                  {isReal && <th style={{ width: 120 }}>Status</th>}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((t) => (
                  <EditableRow
                    key={t.id}
                    tx={t}
                    isReal={isReal}
                    isReceita={isReceita}
                    categories={categories}
                    onChange={store.updateTx}
                    onDelete={store.deleteTx}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
