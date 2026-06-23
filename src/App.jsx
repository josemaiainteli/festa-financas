import { useMemo, useState } from 'react'
import { useStore } from './lib/store'
import { computeMetrics, CATEGORIES_GASTO, CATEGORIES_RECEITA } from './lib/finance'
import { dateBR } from './lib/format'
import DashboardPreditivo from './components/DashboardPreditivo'
import DashboardReal from './components/DashboardReal'
import TransactionsTab from './components/TransactionsTab'
import SettingsTab from './components/SettingsTab'

const TABS = [
  { id: 'pred', ico: '📊', label: 'Dashboard Preditivo' },
  { id: 'real', ico: '📈', label: 'Dashboard Real' },
  { id: 'gasto-prev', ico: '🧾', label: 'Previsão de Gastos' },
  { id: 'rec-prev', ico: '🎟️', label: 'Previsão de Receitas' },
  { id: 'gasto-real', ico: '💸', label: 'Gastos Concretizados' },
  { id: 'rec-real', ico: '💰', label: 'Receitas Concretizadas' },
  { id: 'config', ico: '⚙️', label: 'Configurações' },
]

export default function App() {
  const store = useStore()
  const [tab, setTab] = useState('pred')
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
      case 'config': return <SettingsTab store={store} m={m} />
      default: return null
    }
  }

  if (store.loading) return <div className="loading">Carregando dados…</div>

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>{store.settings.event_name || 'Festa Fim de Férias · MLG'}</h1>
          <div className="sub">Sistema de gestão financeira · {dateBR(store.settings.event_date)}</div>
        </div>
        <div className="meta">
          <span className={`badge-mode`} title={store.mode === 'cloud' ? 'Conectado ao Supabase (dados compartilhados)' : 'Modo local: dados salvos só neste navegador'}>
            <span className={`dot ${store.mode === 'cloud' ? 'cloud' : 'local'}`} />
            {store.mode === 'cloud' ? 'Nuvem (compartilhado)' : 'Local (este navegador)'}
          </span>
          <div style={{ marginTop: 8 }}>
            <button className="btn sm" onClick={store.refresh}>↻ Atualizar</button>
          </div>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <span className="tab-ico">{t.ico}</span>
            <span className={t.id.startsWith('dashboard') ? '' : ''}>{t.label}</span>
          </button>
        ))}
      </nav>

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
        <p className="foot">Festa Fim de Férias · MLG — feito para José, Malu e Letícia 🏖️</p>
      </main>
    </div>
  )
}
