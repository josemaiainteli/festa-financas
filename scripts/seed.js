import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key || url.includes('SEU-PROJETO')) {
  console.error('Erro: configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env')
  process.exit(1)
}

const supabase = createClient(url, key)

// ---------- Dados de configuração ----------
const SETTINGS = {
  id: 1,
  event_name: 'Festa Fim de Férias · MLG',
  event_date: '2026-07-25',
  capacity: 250,
  margin_target: 30,
}

// ---------- Transações ----------
const tx = (o) => ({ unit_value: 0, quantity: 1, status: null, occurred_on: null, notes: '', ...o })

const TRANSACTIONS = [
  // PREVISAO DE GASTOS
  tx({ type: 'gasto', scenario: 'previsto', category: 'Estrutura',  description: 'Aluguel da casa de praia',                       unit_value: 4700,  quantity: 1 }),
  tx({ type: 'gasto', scenario: 'previsto', category: 'Estrutura',  description: 'Som e iluminação (DJ booth + caixas)',            unit_value: 1500,  quantity: 1 }),
  tx({ type: 'gasto', scenario: 'previsto', category: 'Estrutura',  description: 'Gerador / energia reserva (casa isolada)',        unit_value: 600,   quantity: 1 }),
  tx({ type: 'gasto', scenario: 'previsto', category: 'Equipe',     description: 'DJs (line-up)',                                  unit_value: 600,   quantity: 3 }),
  tx({ type: 'gasto', scenario: 'previsto', category: 'Equipe',     description: 'Barmen',                                         unit_value: 350,   quantity: 2 }),
  tx({ type: 'gasto', scenario: 'previsto', category: 'Equipe',     description: 'Seguranças (casa isolada)',                      unit_value: 450,   quantity: 3 }),
  tx({ type: 'gasto', scenario: 'previsto', category: 'Equipe',     description: 'Portaria / controle de lista',                   unit_value: 200,   quantity: 2 }),
  tx({ type: 'gasto', scenario: 'previsto', category: 'Equipe',     description: 'Limpeza (pré e pós-evento)',                     unit_value: 300,   quantity: 1 }),
  tx({ type: 'gasto', scenario: 'previsto', category: 'Bebidas',    description: 'Destilados + mixers (open bar) — por pessoa',    unit_value: 22,    quantity: 250 }),
  tx({ type: 'gasto', scenario: 'previsto', category: 'Bebidas',    description: 'Beats / Ice (soft drinks) — por pessoa',         unit_value: 8,     quantity: 250 }),
  tx({ type: 'gasto', scenario: 'previsto', category: 'Bebidas',    description: 'Água e refrigerante — por pessoa',               unit_value: 4,     quantity: 250 }),
  tx({ type: 'gasto', scenario: 'previsto', category: 'Bebidas',    description: 'Gelo — por pessoa',                              unit_value: 3,     quantity: 250 }),
  tx({ type: 'gasto', scenario: 'previsto', category: 'Operação',   description: 'Copos, canudos e descartáveis — por pessoa',     unit_value: 2.5,   quantity: 250 }),
  tx({ type: 'gasto', scenario: 'previsto', category: 'Marketing',  description: 'Tráfego pago no Instagram',                      unit_value: 800,   quantity: 1 }),
  tx({ type: 'gasto', scenario: 'previsto', category: 'Marketing',  description: 'Material gráfico / designer',                    unit_value: 400,   quantity: 1 }),
  tx({ type: 'gasto', scenario: 'previsto', category: 'Operação',   description: 'Transporte / frete de materiais',                unit_value: 500,   quantity: 1 }),
  tx({ type: 'gasto', scenario: 'previsto', category: 'Operação',   description: 'Reserva para imprevistos (contingência)',        unit_value: 1000,  quantity: 1 }),

  // PREVISAO DE RECEITAS
  tx({ type: 'receita', scenario: 'previsto', category: 'Lote 1 (promo)', description: 'Ingresso all-inclusive — Lote 1', unit_value: 100, quantity: 50 }),
  tx({ type: 'receita', scenario: 'previsto', category: 'Lote 2',         description: 'Ingresso all-inclusive — Lote 2', unit_value: 120, quantity: 100 }),
  tx({ type: 'receita', scenario: 'previsto', category: 'Lote 3',         description: 'Ingresso all-inclusive — Lote 3', unit_value: 140, quantity: 80 }),
  tx({ type: 'receita', scenario: 'previsto', category: 'Porta',           description: 'Ingresso all-inclusive — na porta', unit_value: 160, quantity: 20 }),

  // GASTOS REAIS
  tx({ type: 'gasto', scenario: 'real', category: 'Estrutura', description: 'Sinal do aluguel da casa (50%)', unit_value: 2350, quantity: 1, status: 'pago',     occurred_on: '2026-06-15' }),
  tx({ type: 'gasto', scenario: 'real', category: 'Equipe',    description: 'Sinal dos DJs',                  unit_value: 600,  quantity: 1, status: 'pago',     occurred_on: '2026-06-18' }),
  tx({ type: 'gasto', scenario: 'real', category: 'Marketing', description: 'Designer (logo + flyer)',         unit_value: 400,  quantity: 1, status: 'pago',     occurred_on: '2026-06-20' }),
  tx({ type: 'gasto', scenario: 'real', category: 'Marketing', description: 'Tráfego pago — 1ª semana',       unit_value: 250,  quantity: 1, status: 'pago',     occurred_on: '2026-06-22' }),

  // RECEITAS REAIS
  tx({ type: 'receita', scenario: 'real', category: 'Lote 1 (promo)', description: 'Ingressos vendidos — Lote 1', unit_value: 100, quantity: 38, status: 'recebido', occurred_on: '2026-06-22' }),
]

async function seed() {
  console.log('Conectando ao Supabase:', url)

  // Upsert settings
  console.log('\n→ Inserindo configurações...')
  const { error: settingsErr } = await supabase
    .from('settings')
    .upsert(SETTINGS, { onConflict: 'id' })
  if (settingsErr) throw settingsErr
  console.log('  ✓ settings OK')

  // Limpar transações existentes e reinserir
  console.log('\n→ Limpando transações existentes...')
  const { error: deleteErr } = await supabase
    .from('transactions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // deleta tudo
  if (deleteErr) throw deleteErr
  console.log('  ✓ transações removidas')

  console.log('\n→ Inserindo transações...')
  const { error: txErr } = await supabase.from('transactions').insert(TRANSACTIONS)
  if (txErr) throw txErr
  console.log(`  ✓ ${TRANSACTIONS.length} transações inseridas`)

  console.log('\nSeed concluído com sucesso!')
}

seed().catch((err) => {
  console.error('\nErro no seed:', err.message)
  process.exit(1)
})
