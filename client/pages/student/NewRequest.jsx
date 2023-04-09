import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../context/store'
import { ITEM_CATEGORIES } from '../../models'
import Icon, { CategoryIcon } from '../../components/Icon'
import { Callout, Card, Field, PageHeader } from '../../components/ui'
import { formatDate, todayISODate, uid } from '../../utils/format'

const blankItem = () => ({ key: uid('row'), category: 'Clothing', description: '', quantity: 1, serialNumber: '' })

export default function NewRequest() {
  const { currentUser, belongings, exitRequests, actions } = useStore()
  const navigate = useNavigate()
  const today = todayISODate()

  const [form, setForm] = useState({ reason: '', destination: '', departureDate: today, returnDate: today })
  const [selected, setSelected] = useState([])
  const [extras, setExtras] = useState([])
  const [errors, setErrors] = useState({})

  const mine = belongings.filter((b) => b.studentId === currentUser.id && (b.status === 'active' || b.status === 'on_campus'))
  // A belonging already in a pending/approved request can't be requested twice.
  const lockedBy = {}
  exitRequests
    .filter((r) => r.studentId === currentUser.id && (r.status === 'pending' || r.status === 'approved'))
    .forEach((r) => r.items.forEach((i) => i.belongingId && (lockedBy[i.belongingId] = r.code)))

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const updateExtra = (key, field, value) =>
    setExtras((list) => list.map((item) => (item.key === key ? { ...item, [field]: value } : item)))

  const filledExtras = extras.filter((e) => e.description.trim())
  const totalItems = selected.length + filledExtras.length

  function submit(e) {
    e.preventDefault()
    const next = {}
    if (!form.reason.trim()) next.reason = 'Tell the proctor why you are leaving.'
    if (!form.destination.trim()) next.destination = 'Where are you going?'
    if (form.departureDate < today) next.departureDate = 'Departure cannot be in the past.'
    if (form.returnDate < form.departureDate) next.returnDate = 'Return must be on or after departure.'
    if (totalItems === 0) next.items = 'Add at least one item you want to take out.'
    setErrors(next)
    if (Object.keys(next).length) return

    const items = [
      ...mine.filter((b) => selected.includes(b.id)).map((b) => ({ ...b, belongingId: b.id, quantity: 1 })),
      ...filledExtras.map((x) => ({ ...x, belongingId: null })),
    ]
    actions.createExitRequest({ ...form, items })
    navigate('/student/requests')
  }

  return (
    <form onSubmit={submit} noValidate>
      <PageHeader
        title="New Exit Request"
        subtitle="List the belongings you will take outside. A proctor must approve before you leave."
      />

      <div className="layout-aside">
        <div className="stack">
          <Card title="Trip details">
            <div className="form-grid">
              <Field label="Reason for leaving" error={errors.reason} full>
                <textarea rows={3} value={form.reason} onChange={update('reason')} placeholder="e.g. Visiting family for the weekend" />
              </Field>
              <Field label="Destination" error={errors.destination} full>
                <input value={form.destination} onChange={update('destination')} placeholder="City / area" />
              </Field>
              <Field label="Departure date" error={errors.departureDate}>
                <input type="date" min={today} value={form.departureDate} onChange={update('departureDate')} />
              </Field>
              <Field label="Expected return date" error={errors.returnDate}>
                <input type="date" min={form.departureDate} value={form.returnDate} onChange={update('returnDate')} />
              </Field>
            </div>
          </Card>

          <Card title="Registered belongings">
            <p className="muted small mb">Select items recorded at the gate that you will take with you.</p>
            {mine.length === 0 ? (
              <p className="muted">You have no registered belongings on campus.</p>
            ) : (
              <div className="check-list">
                {mine.map((b) => {
                  const locked = lockedBy[b.id]
                  return (
                    <label key={b.id} className={`check-item ${locked ? 'disabled' : ''} ${selected.includes(b.id) ? 'checked' : ''}`}>
                      <input type="checkbox" checked={selected.includes(b.id)} disabled={!!locked} onChange={() => toggle(b.id)} />
                      <CategoryIcon category={b.category} />
                      <div className="item-main">
                        <div className="item-title">{b.description}</div>
                        <div className="item-meta">
                          {b.category} · S/N <code>{b.serialNumber || '—'}</code>
                        </div>
                      </div>
                      {locked && <span className="badge badge-warning">In {locked}</span>}
                    </label>
                  )
                })}
              </div>
            )}
          </Card>

          <Card
            title="Other items"
            actions={
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setExtras([...extras, blankItem()])}>
                <Icon name="plus" size={14} /> Add item
              </button>
            }
          >
            <p className="muted small mb">Clothing, bags, books or anything else not registered at the gate.</p>
            {extras.length === 0 ? (
              <button type="button" className="dashed-btn" onClick={() => setExtras([blankItem()])}>
                <Icon name="plus" size={16} /> Add clothing, bags or other items
              </button>
            ) : (
              <div className="extra-rows">
                {extras.map((item) => (
                  <div key={item.key} className="extra-row">
                    <select value={item.category} onChange={(e) => updateExtra(item.key, 'category', e.target.value)} aria-label="Category">
                      {ITEM_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <input
                      value={item.description}
                      onChange={(e) => updateExtra(item.key, 'description', e.target.value)}
                      placeholder="Description, e.g. 3 shirts"
                      aria-label="Description"
                    />
                    <input
                      value={item.serialNumber}
                      onChange={(e) => updateExtra(item.key, 'serialNumber', e.target.value)}
                      placeholder="Serial (optional)"
                      aria-label="Serial number"
                    />
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateExtra(item.key, 'quantity', Math.max(1, Number(e.target.value)))}
                      aria-label="Quantity"
                      className="qty-input"
                    />
                    <button type="button" className="icon-btn danger" onClick={() => setExtras(extras.filter((x) => x.key !== item.key))} aria-label="Remove item">
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <aside className="aside-sticky">
          <Card title="Summary">
            <dl className="summary">
              <div><dt>Destination</dt><dd>{form.destination || '—'}</dd></div>
              <div><dt>Departure</dt><dd>{formatDate(form.departureDate)}</dd></div>
              <div><dt>Return</dt><dd>{formatDate(form.returnDate)}</dd></div>
              <div><dt>Registered items</dt><dd>{selected.length}</dd></div>
              <div><dt>Other items</dt><dd>{filledExtras.length}</dd></div>
            </dl>
            {errors.items && <Callout tone="danger">{errors.items}</Callout>}
            <button type="submit" className="btn btn-primary btn-block btn-lg">
              <Icon name="send" size={16} /> Submit request
            </button>
            <p className="muted small center mt">The guard will check these exact items at the gate.</p>
          </Card>
        </aside>
      </div>
    </form>
  )
}
