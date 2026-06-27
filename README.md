# 🌴 Festa Fim de Férias · MLG — Sistema de Finanças

App web para a **José, Malu e Letícia** controlarem as finanças da festa (casa de eventos em Fortaleza): previsão x realizado de gastos e receitas, com dashboards para os dois cenários, anotações por categoria e cálculo automático da margem de lucro (meta de 30%).

Stack: **React + Vite**, gráficos com **Recharts**, dados no **Supabase** (com fallback automático para `localStorage` enquanto o Supabase não estiver configurado).

---

## Abas do sistema

| Aba | O que faz |
|-----|-----------|
| **Dashboard Preditivo** | Margem prevista vs meta, custo/receita/lucro planejados, **preço de ingresso sugerido**, break-even. |
| **Dashboard Real** | Caixa atual (recebido − pago), ingressos vendidos, ocupação, previsto × real. |
| **Previsão de Gastos** | Lista editável de custos planejados (fixos e por pessoa). |
| **Previsão de Receitas** | Ingressos all-inclusive por lote (preço × quantidade). |
| **Gastos Concretizados** | Despesas que já saíram, com data e status (pago/pendente). |
| **Receitas Concretizadas** | Ingressos efetivamente vendidos. |
| **Anotações** | Categorias livres (fornecedores, tarefas, ideias) com notas dentro de cada uma. |
| **Configurações** | Capacidade (250), meta de margem (30%), nome e data do evento. |

Todos os números vêm pré-preenchidos com **estimativas** (aluguel R$ 4.700, seguranças, DJs, barmen, soft drinks etc.) — é só ajustar.

---

## Rodando localmente

```bash
npm install
npm run dev
```

Abra o endereço que aparecer (ex.: `http://localhost:5173`). Sem configurar nada, o app já roda em **modo local** (dados salvos só no seu navegador).

---

## Passo 1 — Supabase (dados compartilhados entre as 3)

1. Crie uma conta grátis em https://supabase.com e um novo projeto.
2. No projeto, vá em **SQL Editor → New query**, cole TODO o conteúdo de [`supabase_schema.sql`](./supabase_schema.sql) e clique em **Run**. Isso cria as tabelas e já insere os dados iniciais.
3. Vá em **Project Settings → API** e copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
4. Localmente, crie um arquivo `.env` (copie de `.env.example`) com esses dois valores e rode `npm run dev`. O selo no topo deve mudar para **“Nuvem (compartilhado)”**.

> Observação de segurança: as políticas (RLS) deixam quem tiver a anon key ler e editar. É adequado para 3 organizadoras com o link privado. Não use a chave `service_role` no front-end.

---

## Passo 2 — Subir no GitHub

```bash
cd "festa-financas"
git init
git add .
git commit -m "Sistema de financas da festa MLG"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/festa-financas.git
git push -u origin main
```

---

## Passo 3 — Deploy na Vercel

1. Entre em https://vercel.com com o GitHub e clique em **Add New → Project**.
2. Selecione o repositório. A Vercel detecta o Vite automaticamente:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Em **Environment Variables**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (os mesmos do `.env`).
4. Clique em **Deploy**. Pronto — o link pode ser compartilhado com a Malu e a Letícia.

> Se o projeto não estiver na raiz do repositório, defina o **Root Directory** como `festa-financas` nas configurações do projeto na Vercel.

---

## Como a margem é calculada

- **Margem** = (Receita − Custo) ÷ Custo. A meta de 30% é sobre **todas as despesas**.
- **Preço sugerido** = (Custo total × 1,30) ÷ capacidade — preço de ingresso para bater a meta vendendo todos os lugares.
- **Break-even** = ingressos necessários para empatar (custo ÷ preço médio).

Ajuste os lotes na aba *Previsão de Receitas* até o Dashboard Preditivo ficar verde. 🎯
