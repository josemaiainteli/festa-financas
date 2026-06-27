-- =====================================================================
-- Festa Fim de Ferias - MLG | Schema do Supabase
-- Cole tudo no Supabase > SQL Editor > New query > Run.
-- =====================================================================

-- ---------- Tabela de configuracoes (linha unica id=1) ----------
create table if not exists public.settings (
  id            int primary key default 1,
  event_name    text   not null default 'Festa Fim de Férias · MLG',
  event_date    date,
  capacity      int    not null default 250,
  margin_target numeric not null default 30,
  constraint settings_single_row check (id = 1)
);

-- ---------- Tabela de transacoes ----------
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('gasto','receita')),
  scenario    text not null check (scenario in ('previsto','real')),
  category    text not null default '',
  description text not null default '',
  unit_value  numeric not null default 0,
  quantity    numeric not null default 0,
  amount      numeric generated always as (unit_value * quantity) stored,
  status      text,            -- 'pago'/'recebido'/'pendente' (apenas para 'real')
  occurred_on date,
  notes       text default '',
  created_at  timestamptz not null default now()
);

create index if not exists idx_tx_type_scenario on public.transactions (type, scenario);

-- ---------- Anotacoes: categorias ----------
create table if not exists public.note_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null default 'Nova categoria',
  color      text not null default '#0ea5e9',
  created_at timestamptz not null default now()
);

-- ---------- Anotacoes: notas ----------
create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid references public.note_categories (id) on delete cascade,
  title       text not null default '',
  body        text not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists idx_notes_category on public.notes (category_id);

-- ---------- Row Level Security ----------
-- App pequeno e privado: liberamos leitura/escrita para a chave anon.
-- (Quem tiver o link + a anon key pode editar. Suficiente para 3 organizadoras.)
alter table public.settings        enable row level security;
alter table public.transactions    enable row level security;
alter table public.note_categories enable row level security;
alter table public.notes           enable row level security;

drop policy if exists "anon full settings" on public.settings;
create policy "anon full settings" on public.settings
  for all using (true) with check (true);

drop policy if exists "anon full transactions" on public.transactions;
create policy "anon full transactions" on public.transactions
  for all using (true) with check (true);

drop policy if exists "anon full note_categories" on public.note_categories;
create policy "anon full note_categories" on public.note_categories
  for all using (true) with check (true);

drop policy if exists "anon full notes" on public.notes;
create policy "anon full notes" on public.notes
  for all using (true) with check (true);

-- ---------- Dados iniciais ----------
insert into public.settings (id, event_name, event_date, capacity, margin_target)
values (1, 'Festa Fim de Férias · MLG', '2026-07-25', 250, 30)
on conflict (id) do nothing;

-- Previsao de gastos
insert into public.transactions (type, scenario, category, description, unit_value, quantity) values
('gasto','previsto','Estrutura','Aluguel da casa de eventos',4700,1),
('gasto','previsto','Estrutura','Som e iluminação (DJ booth + caixas)',1500,1),
('gasto','previsto','Estrutura','Gerador / energia reserva',600,1),
('gasto','previsto','Equipe','DJs (line-up)',600,3),
('gasto','previsto','Equipe','Barmen',350,2),
('gasto','previsto','Equipe','Seguranças',450,3),
('gasto','previsto','Equipe','Portaria / controle de lista',200,2),
('gasto','previsto','Equipe','Limpeza (pré e pós-evento)',300,1),
('gasto','previsto','Bebidas','Destilados + mixers (open bar) — por pessoa',22,250),
('gasto','previsto','Bebidas','Beats / Ice (soft drinks) — por pessoa',8,250),
('gasto','previsto','Bebidas','Água e refrigerante — por pessoa',4,250),
('gasto','previsto','Bebidas','Gelo — por pessoa',3,250),
('gasto','previsto','Operação','Copos, canudos e descartáveis — por pessoa',2.5,250),
('gasto','previsto','Marketing','Tráfego pago no Instagram',800,1),
('gasto','previsto','Marketing','Material gráfico / designer',400,1),
('gasto','previsto','Operação','Transporte / frete de materiais',500,1),
('gasto','previsto','Operação','Reserva para imprevistos (contingência)',1000,1);

-- Previsao de receitas (all-inclusive, por lotes)
insert into public.transactions (type, scenario, category, description, unit_value, quantity) values
('receita','previsto','Lote 1 (promo)','Ingresso all-inclusive — Lote 1',100,50),
('receita','previsto','Lote 2','Ingresso all-inclusive — Lote 2',120,100),
('receita','previsto','Lote 3','Ingresso all-inclusive — Lote 3',140,80),
('receita','previsto','Porta','Ingresso all-inclusive — na porta',160,20);

-- Gastos concretizados (exemplos)
insert into public.transactions (type, scenario, category, description, unit_value, quantity, status, occurred_on) values
('gasto','real','Estrutura','Sinal do aluguel da casa (50%)',2350,1,'pago','2026-06-15'),
('gasto','real','Equipe','Sinal dos DJs',600,1,'pago','2026-06-18'),
('gasto','real','Marketing','Designer (logo + flyer)',400,1,'pago','2026-06-20'),
('gasto','real','Marketing','Tráfego pago — 1ª semana',250,1,'pago','2026-06-22');

-- Receitas concretizadas (exemplos)
insert into public.transactions (type, scenario, category, description, unit_value, quantity, status, occurred_on) values
('receita','real','Lote 1 (promo)','Ingressos vendidos — Lote 1',100,38,'recebido','2026-06-22');

-- ---------- Anotacoes iniciais ----------
with seed_cats as (
  insert into public.note_categories (name, color) values
    ('Fornecedores', '#0ea5e9'),
    ('Tarefas',      '#8b5cf6'),
    ('Ideias',       '#fb7185')
  returning id, name
)
insert into public.notes (category_id, title, body)
select id,
  case name
    when 'Fornecedores' then 'Casa de eventos (Fortaleza)'
    when 'Tarefas'      then 'Lista de tarefas da semana'
    else 'Ideias para a festa'
  end,
  case name
    when 'Fornecedores' then 'Confirmar valor do aluguel, horário de liberação e regras de som até as 4h. Pedir contato do responsável e fechar a vistoria.'
    when 'Tarefas'      then '• Fechar line-up dos DJs\n• Subir criativos do tráfego\n• Confirmar barmen e seguranças\n• Abrir o Lote 2 quando o Lote 1 chegar a 80%'
    else 'Cabine de fotos na entrada, drink autoral da MLG e um momento surpresa à meia-noite.'
  end
from seed_cats;
