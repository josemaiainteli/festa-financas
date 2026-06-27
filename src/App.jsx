import { useMemo, useState } from 'react'
import { useStore } from './lib/store'
import { computeMetrics, CATEGORIES_GASTO, CATEGORIES_RECEITA } from './lib/finance'
import { dateBR } from './lib/format'
import DashboardPreditivo from './components/DashboardPreditivo'
import DashboardReal from './components/DashboardReal'
import TransactionsTab from './components/TransactionsTab'
import SettingsTab from './components/SettingsTab'
import NotesTab from './components/NotesTab'

const TABS = [
  { id: 'pred', ico: '📊', label: 'Dashboard Preditivo', group: 'Visão geral' },
  { id: 'real', ico: '📈', label: 'Dashboard Real', group: 'Visão geral' },
  { id: 'gasto-prev', ico: '🧾', label: 'Previsão de Gastos', group: 'Planejamento' },
  { id: 'rec-prev', ico: '🎟️', label: 'Previsão de Receitas', group: 'Planejamento' },
  { id: 'gasto-real', ico: '💸', label: 'Gastos Concretizados', group: 'Realizado' },
  { id: 'rec-real', ico: '💰', label: 'Receitas Concretizadas', group: 'Realizado' },
  { id: 'notas', ico: '📝', label: 'Anotações', group: 'Organização' },
  { id: 'config', ico: '⚙️', label: 'Configurações', group: 'Organização' },
]

// Agrupa as abas preservando a ordem dos grupos.
const GROUPS = TABS.reduce((acc, t) => {
  const g = acc.find((x) => x.name === t.group)
  if (g) g.items.push(t)
  else acc.push({ name: t.group, items: [t] })
  return acc
}, [])

export default function App() {
  const store = useStore()
  const [tab, setTab] = useState('pred')
  const [navOpen, setNavOpen] = useState(false)
  const m = useMemo(
    () => computeMetrics(store.transactions, store.settings),
    [store.transactions, store.settings],
  )

  const render = () => {
    switch (tab) {
      case 'pred': return <DashboardPreditivo m={m} />
      case 'real': return <DashboardReal m={m} />
      case 'gasto-prev': return (
        <TransactionsTab store={store} type="gasto" scenario="previsto"
          title="Previsão de Gastos"
          description="Tudo o que planejamos gastar. O total alimenta o Dashboard Preditivo e o preço sugerido de ingresso."
          categories={CATEGORIES_GASTO} />
      )
      case 'rec-prev': return (
        <TransactionsTab store={store} type="receita" scenario="previsto"
          title="Previsão de Receitas (all-inclusive)"
          description="Ingressos por lote. Preço × quantidade = receita esperada. Ajuste os lotes para atingir a meta de margem."
          categories={CATEGORIES_RECEITA} />
      )
      case 'gasto-real': return (
        <TransactionsTab store={store} type="gasto" scenario="real"
          title="Gastos Concretizados"
          description="Despesas que já aconteceram. Marque como pago ou pendente e registre a data."
          categories={CATEGORIES_GASTO} />
      )
      case 'rec-real': return (
        <TransactionsTab store={store} type="receita" scenario="real"
          title="Receitas Concretizadas"
          description="Ingressos efetivamente vendidos. Alimenta o caixa atual e a ocupação no Dashboard Real."
          categories={CATEGORIES_RECEITA} />
      )
      case 'notas': return <NotesTab store={store} />
      case 'config': return <SettingsTab store={store} m={m} />
      default: return null
    }
  }

  if (store.loading) return <div className="loading">Carregando dados…</div>

  const goTo = (id) => { setTab(id); setNavOpen(false) }
  const activeLabel = TABS.find((t) => t.id === tab)?.label

  return (
    <div className="shell">
      {/* Fundo ambiente (liquid glass) */}
      <div className="aurora" aria-hidden="true">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
      </div>

      {navOpen && <div className="scrim" onClick={() => setNavOpen(false)} aria-hidden="true" />}

      <aside className={`sidebar glass ${navOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">MLG</div>
          <div className="brand-text">
            <strong>{store.settings.event_name || 'Festa Fim de Férias · MLG'}</strong>
            <span>{dateBR(store.settings.event_date)} · Fortaleza</span>
          </div>
        </div>

        <nav className="nav">
          {GROUPS.map((g) => (
            <div className="nav-group" key={g.name}>
              <div className="nav-group-label">{g.name}</div>
              {g.items.map((t) => (
                <button
                  key={t.id}
                  className={`nav-item ${tab === t.id ? 'active' : ''}`}
                  onClick={() => goTo(t.id)}
                >
                  <span className="nav-ico">{t.ico}</span>
                  <span className="nav-label">{t.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <span className="badge-mode" title={store.mode === 'cloud' ? 'Conectado ao Supabase (dados compartilhados)' : 'Modo local: dados salvos só neste navegador'}>
            <span className={`dot ${store.mode === 'cloud' ? 'cloud' : 'local'}`} />
            {store.mode === 'cloud' ? 'Nuvem · compartilhado' : 'Local · este navegador'}
          </span>
          <button className="btn sm ghost" onClick={store.refresh}>↻ Atualizar</button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar glass">
          <button className="hamburger" onClick={() => setNavOpen(true)} aria-label="Abrir menu">☰</button>
          <h1>{activeLabel}</h1>
          <span className="topbar-spacer" />
        </header>

        <main className="content">
          {store.error && (
            <div className="note"><b>Atenção:</b> {store.error} — verifique as variáveis do Supabase na Vercel. O app continua funcionando com os últimos dados carregados.</div>
          )}
          {store.mode === 'local' && (
            <div className="note">
              <b>Modo local ativo.</b> Os dados estão salvos só neste navegador. Para você, a Malu e a Letícia compartilharem os mesmos números, configure o Supabase (veja o README) e adicione as variáveis na Vercel.
            </div>
          )}
          {render()}
        </main>
      </div>
    </div>
  )
}
