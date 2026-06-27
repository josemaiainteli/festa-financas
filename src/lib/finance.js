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
