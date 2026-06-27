import { useEffect, useMemo, useRef, useState } from 'react'

const PALETTE = ['#0ea5e9', '#8b5cf6', '#fb7185', '#22c55e', '#f59e0b', '#14b8a6']

function NoteCard({ note, onChange, onDelete, onExpand }) {
  const [draft, setDraft] = useState(note)
  useEffect(() => { setDraft(note) }, [note.id])

  const commit = (k, v) => {
    if (v !== note[k]) onChange(note.id, { [k]: v })
  }

  return (
    <article className="note-card glass">
      <input
        className="note-title"
        placeholder="Título da anotação"
        value={draft.title || ''}
        onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
        onBlur={(e) => commit('title', e.target.value)}
      />
      <textarea
        className="note-body"
        placeholder="Escreva aqui…"
        rows={4}
        value={draft.body || ''}
        onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
        onBlur={(e) => commit('body', e.target.value)}
      />
      <div className="note-foot">
        <button className="icon-btn" title="Abrir em tela cheia" onClick={() => onExpand(note.id)}>
          ⛶ Tela cheia
        </button>
        <button className="icon-btn danger" title="Excluir anotação" onClick={() => onDelete(note.id)}>
          Excluir
        </button>
      </div>
    </article>
  )
}

function FullNote({ note, onChange, onClose }) {
  const [draft, setDraft] = useState(note)
  useEffect(() => { setDraft(note) }, [note.id])

  // Fecha com Esc e trava o scroll do fundo enquanto aberto.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])

  const commit = (k, v) => { if (v !== note[k]) onChange(note.id, { [k]: v }) }

  return (
    <div className="note-overlay" onClick={onClose}>
      <div className="note-full glass" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="note-full-head">
          <input
            className="note-full-title"
            placeholder="Título da anotação"
            value={draft.title || ''}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            onBlur={(e) => commit('title', e.target.value)}
          />
          <button className="icon-btn" title="Fechar (Esc)" onClick={onClose}>✕ Fechar</button>
        </div>
        <textarea
          className="note-full-body"
          placeholder="Escreva aqui…"
          autoFocus
          value={draft.body || ''}
          onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
          onBlur={(e) => commit('body', e.target.value)}
        />
      </div>
    </div>
  )
}

export default function NotesTab({ store }) {
  const { noteCategories, notes } = store
  const [activeId, setActiveId] = useState(noteCategories[0]?.id || null)
  const [fullId, setFullId] = useState(null)
  const nameRef = useRef(null)
  const justAdded = useRef(false)

  const fullNote = notes.find((n) => n.id === fullId) || null

  // Mantém uma categoria válida selecionada quando a lista muda.
  useEffect(() => {
    if (!noteCategories.length) { setActiveId(null); return }
    if (!noteCategories.some((c) => c.id === activeId)) {
      setActiveId(noteCategories[0].id)
    }
  }, [noteCategories, activeId])

  // Foca o nome ao criar uma categoria nova.
  useEffect(() => {
    if (justAdded.current && nameRef.current) {
      nameRef.current.focus()
      nameRef.current.select()
      justAdded.current = false
    }
  }, [activeId])

  const active = noteCategories.find((c) => c.id === activeId) || null
  const countByCat = useMemo(() => {
    const map = {}
    for (const n of notes) map[n.category_id] = (map[n.category_id] || 0) + 1
    return map
  }, [notes])
  const visibleNotes = useMemo(
    () => notes.filter((n) => n.category_id === activeId),
    [notes, activeId],
  )

  const addCategory = async () => {
    const created = await store.addCategory('Nova categoria', PALETTE[noteCategories.length % PALETTE.length])
    if (created) { justAdded.current = true; setActiveId(created.id) }
  }

  const removeCategory = (c) => {
    const n = countByCat[c.id] || 0
    const msg = n
      ? `Excluir “${c.name}” e suas ${n} anotação(ões)?`
      : `Excluir a categoria “${c.name}”?`
    if (window.confirm(msg)) store.deleteCategory(c.id)
  }

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>Anotações</h2>
          <p>Organize tudo da festa em categorias — fornecedores, tarefas, ideias. Cada categoria guarda suas próprias anotações.</p>
        </div>
        <button className="btn primary" onClick={addCategory}>+ Nova categoria</button>
      </div>

      {!noteCategories.length ? (
        <div className="glass empty-panel">
          <div className="empty-emoji">🗂️</div>
          <h3>Nenhuma categoria ainda</h3>
          <p>Crie sua primeira categoria para começar a anotar.</p>
          <button className="btn primary" onClick={addCategory}>+ Criar categoria</button>
        </div>
      ) : (
        <div className="notes-layout">
          {/* ---- Rail de categorias ---- */}
          <aside className="cat-rail glass">
            <div className="cat-rail-head">Categorias</div>
            <ul className="cat-list">
              {noteCategories.map((c) => (
                <li key={c.id}>
                  <button
                    className={`cat-item ${c.id === activeId ? 'active' : ''}`}
                    onClick={() => setActiveId(c.id)}
                  >
                    <span className="cat-dot" style={{ background: c.color || '#0ea5e9' }} />
                    <span className="cat-name">{c.name || 'Sem nome'}</span>
                    <span className="cat-count">{countByCat[c.id] || 0}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* ---- Painel da categoria selecionada ---- */}
          {active && (
            <section className="cat-panel">
              <div className="cat-panel-head glass">
                <input
                  ref={nameRef}
                  className="cat-title-input"
                  value={active.name || ''}
                  placeholder="Nome da categoria"
                  onChange={(e) => store.updateCategory(active.id, { name: e.target.value })}
                />
                <div className="cat-tools">
                  <div className="swatches" role="group" aria-label="Cor da categoria">
                    {PALETTE.map((color) => (
                      <button
                        key={color}
                        className={`swatch ${active.color === color ? 'on' : ''}`}
                        style={{ background: color }}
                        title="Definir cor"
                        onClick={() => store.updateCategory(active.id, { color })}
                      />
                    ))}
                  </div>
                  <button className="icon-btn danger" onClick={() => removeCategory(active)}>
                    Excluir categoria
                  </button>
                </div>
              </div>

              <div className="notes-grid">
                {visibleNotes.map((n) => (
                  <NoteCard
                    key={n.id}
                    note={n}
                    onChange={store.updateNote}
                    onDelete={store.deleteNote}
                    onExpand={setFullId}
                  />
                ))}
                <button className="add-note glass" onClick={() => store.addNote(active.id)}>
                  <span className="add-note-plus">+</span>
                  Nova anotação
                </button>
              </div>
            </section>
          )}
        </div>
      )}

      {fullNote && (
        <FullNote note={fullNote} onChange={store.updateNote} onClose={() => setFullId(null)} />
      )}
    </div>
  )
}
