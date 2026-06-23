export const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 2,
})

export const money = (n) => BRL.format(Number(n) || 0)

export const moneyShort = (n) => {
  const v = Number(n) || 0
  if (Math.abs(v) >= 1000) return 'R$ ' + (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'k'
  return 'R$ ' + v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
}

export const pct = (n, digits = 1) => `${(Number(n) || 0).toFixed(digits)}%`

export const dateBR = (iso) => {
  if (!iso) return '—'
  const [y, m, d] = String(iso).slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

export const todayISO = () => new Date().toISOString().slice(0, 10)
