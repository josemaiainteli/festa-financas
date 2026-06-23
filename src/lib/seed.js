// Dados iniciais (estimativas editaveis). Tudo aqui pode ser alterado dentro do app.
// Valores em R$. amount = unit_value * quantity (calculado no app ao salvar).

let _id = 0
const mk = (o) => ({ id: `seed-${++_id}`, unit_value: 0, quantity: 1, status: null, occurred_on: null, notes: '', ...o })

export const SEED_SETTINGS = {
  event_name: 'Festa Fim de Férias · MLG',
  event_date: '2026-07-25',
  capacity: 250,
  margin_target: 30, // % minimo de lucro sobre o custo total
}

export const SEED_TRANSACTIONS = [
  // ---------- PREVISAO DE GASTOS ----------
  mk({ type: 'gasto', scenario: 'previsto', category: 'Estrutura', description: 'Aluguel da casa de praia', unit_value: 4700, quantity: 1 }),
  mk({ type: 'gasto', scenario: 'previsto', category: 'Estrutura', description: 'Som e iluminação (DJ booth + caixas)', unit_value: 1500, quantity: 1 }),
  mk({ type: 'gasto', scenario: 'previsto', category: 'Estrutura', description: 'Gerador / energia reserva (casa isolada)', unit_value: 600, quantity: 1 }),
  mk({ type: 'gasto', scenario: 'previsto', category: 'Equipe', description: 'DJs (line-up)', unit_value: 600, quantity: 3 }),
  mk({ type: 'gasto', scenario: 'previsto', category: 'Equipe', description: 'Barmen', unit_value: 350, quantity: 2 }),
  mk({ type: 'gasto', scenario: 'previsto', category: 'Equipe', description: 'Seguranças (casa isolada)', unit_value: 450, quantity: 3 }),
  mk({ type: 'gasto', scenario: 'previsto', category: 'Equipe', description: 'Portaria / controle de lista', unit_value: 200, quantity: 2 }),
  mk({ type: 'gasto', scenario: 'previsto', category: 'Equipe', description: 'Limpeza (pré e pós-evento)', unit_value: 300, quantity: 1 }),
  mk({ type: 'gasto', scenario: 'previsto', category: 'Bebidas', description: 'Destilados + mixers (open bar) — por pessoa', unit_value: 22, quantity: 250 }),
  mk({ type: 'gasto', scenario: 'previsto', category: 'Bebidas', description: 'Beats / Ice (soft drinks) — por pessoa', unit_value: 8, quantity: 250 }),
  mk({ type: 'gasto', scenario: 'previsto', category: 'Bebidas', description: 'Água e refrigerante — por pessoa', unit_value: 4, quantity: 250 }),
  mk({ type: 'gasto', scenario: 'previsto', category: 'Bebidas', description: 'Gelo — por pessoa', unit_value: 3, quantity: 250 }),
  mk({ type: 'gasto', scenario: 'previsto', category: 'Operação', description: 'Copos, canudos e descartáveis — por pessoa', unit_value: 2.5, quantity: 250 }),
  mk({ type: 'gasto', scenario: 'previsto', category: 'Marketing', description: 'Tráfego pago no Instagram', unit_value: 800, quantity: 1 }),
  mk({ type: 'gasto', scenario: 'previsto', category: 'Marketing', description: 'Material gráfico / designer', unit_value: 400, quantity: 1 }),
  mk({ type: 'gasto', scenario: 'previsto', category: 'Operação', description: 'Transporte / frete de materiais', unit_value: 500, quantity: 1 }),
  mk({ type: 'gasto', scenario: 'previsto', category: 'Operação', description: 'Reserva para imprevistos (contingência)', unit_value: 1000, quantity: 1 }),

  // ---------- PREVISAO DE RECEITAS (ingresso all-inclusive, por lotes) ----------
  mk({ type: 'receita', scenario: 'previsto', category: 'Lote 1 (promo)', description: 'Ingresso all-inclusive — Lote 1', unit_value: 100, quantity: 50 }),
  mk({ type: 'receita', scenario: 'previsto', category: 'Lote 2', description: 'Ingresso all-inclusive — Lote 2', unit_value: 120, quantity: 100 }),
  mk({ type: 'receita', scenario: 'previsto', category: 'Lote 3', description: 'Ingresso all-inclusive — Lote 3', unit_value: 140, quantity: 80 }),
  mk({ type: 'receita', scenario: 'previsto', category: 'Porta', description: 'Ingresso all-inclusive — na porta', unit_value: 160, quantity: 20 }),

  // ---------- GASTOS CONCRETIZADOS (exemplos do inicio da campanha) ----------
  mk({ type: 'gasto', scenario: 'real', category: 'Estrutura', description: 'Sinal do aluguel da casa (50%)', unit_value: 2350, quantity: 1, status: 'pago', occurred_on: '2026-06-15' }),
  mk({ type: 'gasto', scenario: 'real', category: 'Equipe', description: 'Sinal dos DJs', unit_value: 600, quantity: 1, status: 'pago', occurred_on: '2026-06-18' }),
  mk({ type: 'gasto', scenario: 'real', category: 'Marketing', description: 'Designer (logo + flyer)', unit_value: 400, quantity: 1, status: 'pago', occurred_on: '2026-06-20' }),
  mk({ type: 'gasto', scenario: 'real', category: 'Marketing', description: 'Tráfego pago — 1ª semana', unit_value: 250, quantity: 1, status: 'pago', occurred_on: '2026-06-22' }),

  // ---------- RECEITAS CONCRETIZADAS (vendas ja realizadas) ----------
  mk({ type: 'receita', scenario: 'real', category: 'Lote 1 (promo)', description: 'Ingressos vendidos — Lote 1', unit_value: 100, quantity: 38, status: 'recebido', occurred_on: '2026-06-22' }),
]
