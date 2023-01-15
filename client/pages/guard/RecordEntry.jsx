import { useState } from 'react'
import { useStore } from '../../context/store'
import { ITEM_CATEGORIES } from '../../data'
import Icon, { CategoryIcon } from '../../components/Icon'
import { StudentSummary } from '../../components/RequestDetails'
import { Avatar, Callout, Card, EmptyState, Field, PageHeader, SearchInput } from '../../components/ui'
import { matches, uid } from '../../utils/format'

const blankItem = { category: 'Laptop', description: '', brand: '', serialNumber: '', color: '' }

export default function RecordEntry() {
  const { users, belongings, actions } = useStore()
  const [query, setQuery] = useState('')
  const [studentId, setStudentId] = useState(null)
  const [returning, setReturning] = useState([])
  const [newItems, setNewItems] = useState([])
  const [draft, setDraft] = useState(blankItem)
  const [draftError, setDraftError] = useState('')
  const [note, setNote] = useState('')

  const students = users.filter((u) => u.role === 'student' && u.status === 'active')
  const results = query.trim() ? students.filter((s) => matches(query, s.name, s.studentId)).slice(0, 6) : []
  const student = students.find((s) => s.id === studentId)
  const offCampus = belongings.filter((b) => b.studentId === studentId && b.status === 'off_campus')
  const onCampus = belongings.filter((b) => b.studentId === studentId && b.status === 'on_campus')

  function pick(id) {
    setStudentId(id)
    setQuery('')
    setReturning([])
    setNewItems([])
    setNote('')
  }

  function addDraft(e) {
    e.preventDefault()
    if (!draft.description.trim()) return setDraftError('Describe the item (model, type…).')
    if (['Laptop', 'Desktop Computer', 'Mobile Phone', 'Tablet'].includes(draft.category) && !draft.serialNumber.trim())
      return setDraftError('Serial number is required for computers, phones and tablets.')
    setNewItems([...newItems, { ...draft, key: uid('new') }])
    setDraft(blankItem)
    setDraftError('')
  }

  function submit() {
    actions.recordEntry({ studentId, returningIds: returning, newItems, note })
    setStudentId(null)
  }

  const total = returning.length + newItems.length

  return (
    <>
      <PageHeader title="Record Entry" subtitle="Register the belongings a student is bringing onto campus." />

      {!student ? (
        <Card title="1. Find the student">
          <SearchInput value={query} onChange={setQuery} placeholder="Search by name or student ID (e.g. KU/0458/15)" autoFocus />
          {query.trim() && results.length === 0 && <p className="muted mt">No active student matches “{query}”.</p>}
          {results.length > 0 && (
            <ul className="pick-list">
              {results.map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => pick(s.id)}>
                    <Avatar name={s.name} />
                    <div>
                      <div className="row-title">{s.name}</div>
                      <div className="muted small"><code>{s.studentId}</code> · {s.department} · {s.dorm}</div>
                    </div>
                    <Icon name="arrowRight" size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!query.trim() && (
            <EmptyState icon="search" title="Search for a student" text="Ask for the student's ID card and search by ID or name." />
          )}
        </Card>
      ) : (
        <div className="layout-aside">
          <div className="stack">
            <Card
              title="Student"
              actions={<button type="button" className="btn btn-ghost btn-sm" onClick={() => setStudentId(null)}>Change</button>}
            >
              <StudentSummary student={student} />
              {onCampus.length > 0 && (
                <p className="muted small mt">Already on campus: {onCampus.map((b) => b.description).join(', ')}</p>
              )}
            </Card>

            {offCampus.length > 0 && (
              <Card title="Returning items">
                <p className="muted small mb">These items left campus with an approved pass. Tick the ones the student is bringing back.</p>
                <div className="check-list">
                  {offCampus.map((b) => (
                    <label key={b.id} className={`check-item ${returning.includes(b.id) ? 'checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={returning.includes(b.id)}
                        onChange={() => setReturning((r) => (r.includes(b.id) ? r.filter((x) => x !== b.id) : [...r, b.id]))}
                      />
                      <CategoryIcon category={b.category} />
                      <div className="item-main">
                        <div className="item-title">{b.description}</div>
                        <div className="item-meta">S/N <code>{b.serialNumber || '—'}</code></div>
                      </div>
                    </label>
                  ))}
                </div>
              </Card>
            )}

            <Card title="New items">
              <form className="form-grid" onSubmit={addDraft} noValidate>
                <Field label="Category">
                  <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                    {ITEM_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Description / model">
                  <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="e.g. HP EliteBook 840" />
                </Field>
                <Field label="Brand">
                  <input value={draft.brand} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} />
                </Field>
                <Field label="Serial number">
                  <input value={draft.serialNumber} onChange={(e) => setDraft({ ...draft, serialNumber: e.target.value.toUpperCase() })} />
                </Field>
                <Field label="Colour">
                  <input value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} />
                </Field>
                <div className="field field-end">
                  <button type="submit" className="btn btn-secondary btn-block">
                    <Icon name="plus" size={16} /> Add item
                  </button>
                </div>
                {draftError && <div className="field-full field-error">{draftError}</div>}
              </form>

              {newItems.length > 0 && (
                <ul className="item-list mt">
                  {newItems.map((item) => (
                    <li key={item.key} className="item-row">
                      <CategoryIcon category={item.category} />
                      <div className="item-main">
                        <div className="item-title">{item.description}</div>
                        <div className="item-meta">
                          {[item.category, item.brand, item.color].filter(Boolean).join(' · ')}
                          {item.serialNumber && <> · S/N <code>{item.serialNumber}</code></>}
                        </div>
                      </div>
                      <button type="button" className="icon-btn danger" onClick={() => setNewItems(newItems.filter((x) => x.key !== item.key))} aria-label="Remove">
                        <Icon name="trash" size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <aside className="aside-sticky">
            <Card title="Confirm entry">
              <dl className="summary">
                <div><dt>Returning items</dt><dd>{returning.length}</dd></div>
                <div><dt>New items</dt><dd>{newItems.length}</dd></div>
              </dl>
              <Field label="Note (optional)" full>
                <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything worth noting" />
              </Field>
              {total === 0 && <Callout>Add or tick at least one item to record.</Callout>}
              <button type="button" className="btn btn-primary btn-block btn-lg mt" disabled={total === 0} onClick={submit}>
                <Icon name="check" size={16} /> Record entry
              </button>
            </Card>
          </aside>
        </div>
      )}
    </>
  )
}
