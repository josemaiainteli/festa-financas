// Camada de calculos financeiros. Recebe a lista de transacoes e as configuracoes.

export const computeAmount = (t) =>
  (Number(t.unit_value) || 0) * (Number(t.quantity) || 0)

const sum = (rows) => rows.reduce((acc, t) => acc + computeAmount(t), 0)

export const filterTx = (txs, type, scenario) =>
  txs.filter((t) => t.type === type && t.scenario === scenario)

export const groupByCategory = (rows) => {
  const map = new Map()
  for (const t of rows) {
    const k = t.category || 'Sem categoria'
    map.set(k, (map.get(k) || 0) + computeAmount(t))
  }
  return [...map.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
}

export function computeMetrics(txs, settings) {
  const capacity = Number(settings?.capacity) || 0
  const marginTarget = Number(settings?.margin_target) || 0

  const gastoPrev = filterTx(txs, 'gasto', 'previsto')
  const recPrev = filterTx(txs, 'receita', 'previsto')
  const gastoReal = filterTx(txs, 'gasto', 'real')
  const recReal = filterTx(txs, 'receita', 'real')

  const custoPrevisto = sum(gastoPrev)
  const receitaPrevista = sum(recPrev)
  const custoReal = sum(gastoReal)
  const receitaReal = sum(recReal)

  const lucroPrevisto = receitaPrevista - custoPrevisto
  const lucroReal = receitaReal - custoReal

  // margem = lucro / custo (meta e' sobre as despesas)
  const margemPrevista = custoPrevisto > 0 ? (lucroPrevisto / custoPrevisto) * 100 : 0
  const margemReal = custoReal > 0 ? (lucroReal / custoReal) * 100 : 0

  const ingressosPrevistos = recPrev.reduce((a, t) => a + (Number(t.quantity) || 0), 0)
  const ingressosVendidos = recReal.reduce((a, t) => a + (Number(t.quantity) || 0), 0)

  const precoMedioPrevisto = ingressosPrevistos > 0 ? receitaPrevista / ingressosPrevistos : 0
  const precoMedioReal = ingressosVendidos > 0 ? receitaReal / ingressosVendidos : 0

  // Preco de ingresso necessario p/ bater a meta de margem, vendendo toda a capacidade
  const precoSugerido =
    capacity > 0 ? (custoPrevisto * (1 + marginTarget / 100)) / capacity : 0

  // Receita minima p/ bater a meta
  const receitaMeta = custoPrevisto * (1 + marginTarget / 100)

  // Break-even (ingressos p/ empatar) usando o preco medio previsto
  const breakEven =
    precoMedioPrevisto > 0 ? Math.ceil(custoPrevisto / precoMedioPrevisto) : 0
  // Ingressos p/ bater a meta de 30%
  const ingressosMeta =
    precoMedioPrevisto > 0 ? Math.ceil(receitaMeta / precoMedioPrevisto) : 0

  const ocupacaoPrevista = capacity > 0 ? (ingressosPrevistos / capacity) * 100 : 0
  const ocupacaoReal = capacity > 0 ? (ingressosVendidos / capacity) * 100 : 0

  const metaPrevistaAtingida = margemPrevista >= marginTarget
  const metaRealAtingida = margemReal >= marginTarget

  // progresso do realizado em relacao ao previsto
  const custoExecutado = custoPrevisto > 0 ? (custoReal / custoPrevisto) * 100 : 0
  const receitaExecutada = receitaPrevista > 0 ? (receitaReal / receitaPrevista) * 100 : 0

  return {
    capacity, marginTarget,
    custoPrevisto, receitaPrevista, lucroPrevisto, margemPrevista,
    custoReal, receitaReal, lucroReal, margemReal,
    ingressosPrevistos, ingressosVendidos,
    precoMedioPrevisto, precoMedioReal,
    precoSugerido, receitaMeta, breakEven, ingressosMeta,
    ocupacaoPrevista, ocupacaoReal,
    metaPrevistaAtingida, metaRealAtingida,
    custoExecutado, receitaExecutada,
    gastosPorCategoria: groupByCategory(gastoPrev),
    gastosReaisPorCategoria: groupByCategory(gastoReal),
  }
}

export const CATEGORIES_GASTO = ['Estrutura', 'Equipe', 'Atrações', 'Bebidas', 'Marketing', 'Operação', 'Outros']
export const CATEGORIES_RECEITA = ['Lote 1 (promo)', 'Lote 2', 'Lote 3', 'Porta', 'Outros']

/* ----------------- Bar / drinks ----------------- */
// Valores por drink (preco e custo sao por unidade; qtd = vendas esperadas).
export const drinkReceita = (d) => (Number(d.sale_price) || 0) * (Number(d.expected_qty) || 0)
export const drinkCusto = (d) => (Number(d.unit_cost) || 0) * (Number(d.expected_qty) || 0)
export const drinkLucro = (d) => drinkReceita(d) - drinkCusto(d)
// Margem unitaria sobre o preco de venda (markup do bar).
export const drinkMargemPct = (d) => {
  const p = Number(d.sale_price) || 0
  const c = Number(d.unit_cost) || 0
  return p > 0 ? ((p - c) / p) * 100 : 0
}

// Compara os dois modelos de receita usando as metricas ja calculadas,
// o cardapio de drinks e os 3 parametros de planejamento (em settings).
//   A = All-inclusive (empresa de open bar)
//   B = Entrada + Bar (vocCs operam, comprando insumos + barman)
export function computeBarComparison(m, drinks = [], settings = {}) {
  const entry = Number(settings.bar_entry_price) || 0
  const openbar = Number(settings.openbar_company_cost) || 0
  const barman = Number(settings.bar_barman_cost) || 0

  const barReceita = drinks.reduce((a, d) => a + drinkReceita(d), 0)
  const barCogs = drinks.reduce((a, d) => a + drinkCusto(d), 0)
  const qtyTotal = drinks.reduce((a, d) => a + (Number(d.expected_qty) || 0), 0)

  // Base compartilhada = custo previsto atual, como esta (sem subtrair nada).
  const base = m.custoPrevisto
  const publico = m.ingressosPrevistos

  const a = {
    receita: m.receitaPrevista,
    custo: base + openbar,
  }
  a.lucro = a.receita - a.custo
  a.margem = a.custo > 0 ? (a.lucro / a.custo) * 100 : 0

  const receitaEntrada = entry * publico
  const b = {
    receitaEntrada,
    receitaBar: barReceita,
    receita: receitaEntrada + barReceita,
    custo: base + barman + barCogs,
  }
  b.lucro = b.receita - b.custo
  b.margem = b.custo > 0 ? (b.lucro / b.custo) * 100 : 0

  const diff = b.lucro - a.lucro
  return {
    a, b, diff,
    winner: diff > 0 ? 'B' : diff < 0 ? 'A' : 'tie',
    base, publico, entry, openbar, barman,
    barReceita, barCogs, qtyTotal,
    drinksPerPerson: publico > 0 ? qtyTotal / publico : 0,
  }
}
