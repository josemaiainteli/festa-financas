import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, isCloud } from './supabase'
import {
  SEED_TRANSACTIONS, SEED_SETTINGS, SEED_NOTE_CATEGORIES, SEED_NOTES, SEED_DRINKS,
} from './seed'

const LS_TX = 'mlg_transactions_v1'
const LS_SET = 'mlg_settings_v1'
const LS_NCAT = 'mlg_note_categories_v1'
const LS_NOTE = 'mlg_notes_v1'
const LS_DRINK = 'mlg_drinks_v1'

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

// Campos das anotacoes que vao para o banco.
const catPayload = (c) => ({ name: c.name ?? '', color: c.color ?? '#0ea5e9' })
const notePayload = (n) => ({
  category_id: n.category_id ?? null,
  title: n.title ?? '',
  body: n.body ?? '',
})
const drinkPayload = (d) => ({
  name: d.name ?? '',
  unit_cost: Number(d.unit_cost) || 0,
  sale_price: Number(d.sale_price) || 0,
  expected_qty: Number(d.expected_qty) || 0,
})

/* ----------------- localStorage backend ----------------- */
const local = {
  load() {
    let txs = null
    let settings = null
    let noteCats = null
    let notes = null
    let drinks = null
    try { txs = JSON.parse(localStorage.getItem(LS_TX)) } catch { /* ignore */ }
    try { settings = JSON.parse(localStorage.getItem(LS_SET)) } catch { /* ignore */ }
    try { noteCats = JSON.parse(localStorage.getItem(LS_NCAT)) } catch { /* ignore */ }
    try { notes = JSON.parse(localStorage.getItem(LS_NOTE)) } catch { /* ignore */ }
    try { drinks = JSON.parse(localStorage.getItem(LS_DRINK)) } catch { /* ignore */ }
    if (!Array.isArray(txs)) {
      txs = SEED_TRANSACTIONS.map((t) => ({ ...t }))
      localStorage.setItem(LS_TX, JSON.stringify(txs))
    }
    if (!settings) {
      settings = { ...SEED_SETTINGS }
      localStorage.setItem(LS_SET, JSON.stringify(settings))
    }
    if (!Array.isArray(noteCats)) {
      noteCats = SEED_NOTE_CATEGORIES.map((c) => ({ ...c }))
      localStorage.setItem(LS_NCAT, JSON.stringify(noteCats))
    }
    if (!Array.isArray(notes)) {
      notes = SEED_NOTES.map((n) => ({ ...n }))
      localStorage.setItem(LS_NOTE, JSON.stringify(notes))
    }
    if (!Array.isArray(drinks)) {
      drinks = SEED_DRINKS.map((d) => ({ ...d }))
      localStorage.setItem(LS_DRINK, JSON.stringify(drinks))
    }
    return { txs, settings, noteCats, notes, drinks }
  },
  saveTx(txs) { localStorage.setItem(LS_TX, JSON.stringify(txs)) },
  saveSettings(s) { localStorage.setItem(LS_SET, JSON.stringify(s)) },
  saveNoteCats(c) { localStorage.setItem(LS_NCAT, JSON.stringify(c)) },
  saveNotes(n) { localStorage.setItem(LS_NOTE, JSON.stringify(n)) },
  saveDrinks(d) { localStorage.setItem(LS_DRINK, JSON.stringify(d)) },
}

/* ----------------- hook ----------------- */
export function useStore() {
  const [transactions, setTransactions] = useState([])
  const [settings, setSettings] = useState(SEED_SETTINGS)
  const [noteCategories, setNoteCategories] = useState([])
  const [notes, setNotes] = useState([])
  const [drinks, setDrinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const txRef = useRef([])
  txRef.current = transactions
  const catRef = useRef([])
  catRef.current = noteCategories
  const noteRef = useRef([])
  noteRef.current = notes
  const drinkRef = useRef([])
  drinkRef.current = drinks

  const refresh = useCallback(async () => {
    setError(null)
    if (!isCloud) {
      const { txs, settings, noteCats, notes, drinks } = local.load()
      setTransactions(txs)
      setSettings(settings)
      setNoteCategories(noteCats)
      setNotes(notes)
      setDrinks(drinks)
      setLoading(false)
      return
    }
    try {
      const [
        { data: txs, error: e1 },
        { data: setRows, error: e2 },
        { data: catRows, error: e3 },
        { data: noteRows, error: e4 },
        { data: drinkRows, error: e5 },
      ] = await Promise.all([
        supabase.from('transactions').select('*').order('created_at', { ascending: true }),
        supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
        supabase.from('note_categories').select('*').order('created_at', { ascending: true }),
        supabase.from('notes').select('*').order('created_at', { ascending: true }),
        supabase.from('drinks').select('*').order('created_at', { ascending: true }),
      ])
      if (e1) throw e1
      if (e2) throw e2
      // Anotacoes e bar sao opcionais: se as tabelas ainda nao existirem, nao quebra o app.
      if (!e3) setNoteCategories(catRows || [])
      if (!e4) setNotes(noteRows || [])
      if (!e5) setDrinks(drinkRows || [])
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

  /* ----------------- Anotacoes: categorias ----------------- */
  const addCategory = useCallback(async (name, color = '#0ea5e9') => {
    const base = { name: name?.trim() || 'Nova categoria', color }
    if (!isCloud) {
      const row = { ...base, id: uid() }
      const next = [...catRef.current, row]
      setNoteCategories(next); local.saveNoteCats(next)
      return row
    }
    const { data, error } = await supabase.from('note_categories').insert(catPayload(base)).select().single()
    if (error) { setError(error.message); return null }
    setNoteCategories((prev) => [...prev, data])
    return data
  }, [])

  const updateCategory = useCallback(async (id, patch) => {
    setNoteCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
    if (!isCloud) {
      const next = catRef.current.map((c) => (c.id === id ? { ...c, ...patch } : c))
      local.saveNoteCats(next)
      return
    }
    const merged = { ...catRef.current.find((c) => c.id === id), ...patch }
    const { error } = await supabase.from('note_categories').update(catPayload(merged)).eq('id', id)
    if (error) setError(error.message)
  }, [])

  const deleteCategory = useCallback(async (id) => {
    const nextCats = catRef.current.filter((c) => c.id !== id)
    const nextNotes = noteRef.current.filter((n) => n.category_id !== id)
    setNoteCategories(nextCats)
    setNotes(nextNotes)
    if (!isCloud) { local.saveNoteCats(nextCats); local.saveNotes(nextNotes); return }
    // ON DELETE CASCADE no banco remove as notas junto.
    const { error } = await supabase.from('note_categories').delete().eq('id', id)
    if (error) setError(error.message)
  }, [])

  /* ----------------- Anotacoes: notas ----------------- */
  const addNote = useCallback(async (categoryId, partial = {}) => {
    const base = { category_id: categoryId, title: '', body: '', ...partial }
    if (!isCloud) {
      const row = { ...base, id: uid(), created_at: new Date().toISOString() }
      const next = [...noteRef.current, row]
      setNotes(next); local.saveNotes(next)
      return row
    }
    const { data, error } = await supabase.from('notes').insert(notePayload(base)).select().single()
    if (error) { setError(error.message); return null }
    setNotes((prev) => [...prev, data])
    return data
  }, [])

  const updateNote = useCallback(async (id, patch) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)))
    if (!isCloud) {
      const next = noteRef.current.map((n) => (n.id === id ? { ...n, ...patch } : n))
      local.saveNotes(next)
      return
    }
    const merged = { ...noteRef.current.find((n) => n.id === id), ...patch }
    const { error } = await supabase.from('notes').update(notePayload(merged)).eq('id', id)
    if (error) setError(error.message)
  }, [])

  const deleteNote = useCallback(async (id) => {
    const next = noteRef.current.filter((n) => n.id !== id)
    setNotes(next)
    if (!isCloud) { local.saveNotes(next); return }
    const { error } = await supabase.from('notes').delete().eq('id', id)
    if (error) setError(error.message)
  }, [])

  /* ----------------- Bar / drinks ----------------- */
  const addDrink = useCallback(async (partial = {}) => {
    const base = { name: '', unit_cost: 0, sale_price: 0, expected_qty: 0, ...partial }
    if (!isCloud) {
      const row = { ...base, id: uid(), created_at: new Date().toISOString() }
      const next = [...drinkRef.current, row]
      setDrinks(next); local.saveDrinks(next)
      return row
    }
    const { data, error } = await supabase.from('drinks').insert(drinkPayload(base)).select().single()
    if (error) { setError(error.message); return null }
    setDrinks((prev) => [...prev, data])
    return data
  }, [])

  const updateDrink = useCallback(async (id, patch) => {
    setDrinks((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))
    if (!isCloud) {
      const next = drinkRef.current.map((d) => (d.id === id ? { ...d, ...patch } : d))
      local.saveDrinks(next)
      return
    }
    const merged = { ...drinkRef.current.find((d) => d.id === id), ...patch }
    const { error } = await supabase.from('drinks').update(drinkPayload(merged)).eq('id', id)
    if (error) setError(error.message)
  }, [])

  const deleteDrink = useCallback(async (id) => {
    const next = drinkRef.current.filter((d) => d.id !== id)
    setDrinks(next)
    if (!isCloud) { local.saveDrinks(next); return }
    const { error } = await supabase.from('drinks').delete().eq('id', id)
    if (error) setError(error.message)
  }, [])

  return {
    loading, error, mode: isCloud ? 'cloud' : 'local',
    transactions, settings,
    noteCategories, notes, drinks,
    addTx, updateTx, deleteTx, updateSettings, refresh,
    addCategory, updateCategory, deleteCategory,
    addNote, updateNote, deleteNote,
    addDrink, updateDrink, deleteDrink,
  }
}
