import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, isCloud } from './supabase'
import { SEED_TRANSACTIONS, SEED_SETTINGS } from './seed'

const LS_TX = 'mlg_transactions_v1'
const LS_SET = 'mlg_settings_v1'

const uid = () =>
  (crypto?.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`)

// Campos que vao para o banco (amount e' coluna gerada no Postgres).
const txPayload = (t) => ({
  type: t.type,
  scenario: t.scenario,
  category: t.category ?? '',
  description: t.description ?? '',
  unit_value: Number(t.unit_value) || 0,
  quantity: Number(t.quantity) || 0,
  status: t.status ?? null,
  occurred_on: t.occurred_on || null,
  notes: t.notes ?? '',
})

/* ----------------- localStorage backend ----------------- */
const local = {
  load() {
    let txs = null
    let settings = null
    try { txs = JSON.parse(localStorage.getItem(LS_TX)) } catch { /* ignore */ }
    try { settings = JSON.parse(localStorage.getItem(LS_SET)) } catch { /* ignore */ }
    if (!Array.isArray(txs)) {
      txs = SEED_TRANSACTIONS.map((t) => ({ ...t }))
      localStorage.setItem(LS_TX, JSON.stringify(txs))
    }
    if (!settings) {
      settings = { ...SEED_SETTINGS }
      localStorage.setItem(LS_SET, JSON.stringify(settings))
    }
    return { txs, settings }
  },
  saveTx(txs) { localStorage.setItem(LS_TX, JSON.stringify(txs)) },
  saveSettings(s) { localStorage.setItem(LS_SET, JSON.stringify(s)) },
}

/* ----------------- hook ----------------- */
export function useStore() {
  const [transactions, setTransactions] = useState([])
  const [settings, setSettings] = useState(SEED_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const txRef = useRef([])
  txRef.current = transactions

  const refresh = useCallback(async () => {
    setError(null)
    if (!isCloud) {
      const { txs, settings } = local.load()
      setTransactions(txs)
      setSettings(settings)
      setLoading(false)
      return
    }
    try {
      const [{ data: txs, error: e1 }, { data: setRows, error: e2 }] = await Promise.all([
        supabase.from('transactions').select('*').order('created_at', { ascending: true }),
        supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
      ])
      if (e1) throw e1
      if (e2) throw e2
      setTransactions(txs || [])
      setSettings(setRows || SEED_SETTINGS)
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados do Supabase.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // re-busca ao voltar o foco (mantem dados frescos entre as 3 pessoas no modo nuvem)
  useEffect(() => {
    if (!isCloud) return
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])

  const addTx = useCallback(async (partial) => {
    const base = {
      type: 'gasto', scenario: 'previsto', category: '', description: '',
      unit_value: 0, quantity: 1, status: null, occurred_on: null, notes: '',
      ...partial,
    }
    if (!isCloud) {
      const row = { ...base, id: uid() }
      const next = [...txRef.current, row]
      setTransactions(next); local.saveTx(next)
      return row
    }
    const { data, error } = await supabase.from('transactions').insert(txPayload(base)).select().single()
    if (error) { setError(error.message); return null }
    setTransactions((prev) => [...prev, data])
    return data
  }, [])

  const updateTx = useCallback(async (id, patch) => {
    // atualiza local imediatamente (otimista)
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
    if (!isCloud) {
      const next = txRef.current.map((t) => (t.id === id ? { ...t, ...patch } : t))
      local.saveTx(next)
      return
    }
    const merged = { ...txRef.current.find((t) => t.id === id), ...patch }
    const { error } = await supabase.from('transactions').update(txPayload(merged)).eq('id', id)
    if (error) setError(error.message)
  }, [])

  const deleteTx = useCallback(async (id) => {
    const next = txRef.current.filter((t) => t.id !== id)
    setTransactions(next)
    if (!isCloud) { local.saveTx(next); return }
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) setError(error.message)
  }, [])

  const updateSettings = useCallback(async (patch) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    if (!isCloud) { local.saveSettings(next); return }
    const { error } = await supabase.from('settings').upsert({ id: 1, ...next }).eq('id', 1)
    if (error) setError(error.message)
  }, [settings])

  return {
    loading, error, mode: isCloud ? 'cloud' : 'local',
    transactions, settings,
    addTx, updateTx, deleteTx, updateSettings, refresh,
  }
}
