import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../../context/store'
import Icon, { CategoryIcon } from '../../components/Icon'
import { StudentSummary } from '../../components/RequestDetails'
import { Callout, Card, EmptyState, Field, Modal, PageHeader, SearchInput, StatusBadge } from '../../components/ui'
import { resolveStudent } from '../../models/userModel'
import { formatDate, isToday, matches, todayISODate } from '../../utils/format'

export default function VerifyExit() {
  const { users, exitRequests, actions } = useStore()
  const [params] = useSearchParams()
  const codeParam = params.get('code')
  const [query, setQuery] = useState(codeParam ?? '')
  const [selectedId, setSelectedId] = useState(
    () => exitRequests.find((r) => r.code === codeParam && (r.status === 'approved' || r.status === 'completed'))?.id ?? null,
  )
  const [checked, setChecked] = useState([])
  const [note, setNote] = useState('')
  const [denyOpen, setDenyOpen] = useState(false)
  const [denyReason, setDenyReason] = useState('')

  useEffect(() => {
    if (codeParam) {
      setQuery(codeParam)
      const found = exitRequests.find(
        (r) => r.code === codeParam && (r.status === 'approved' || r.status === 'completed'),
      )
      if (found) {
        setSelectedId(found.id)
      }
    }
  }, [codeParam, exitRequests])

  const studentOf = (r) => resolveStudent(r, users)
  const approved = exitRequests.filter((r) => r.status === 'approved')
  const results = approved.filter((r) => {
    const s = studentOf(r)
    return matches(query, r.code, s?.name, s?.studentId)
  })
  const selected = approved.find((r) => r.id === selectedId)
  const student = selected && studentOf(selected)

  // When nothing approved matches, tell the guard what the student's latest request looks like.
  const unmatchedStudent =
    query.trim() && results.length === 0
      ? users.find((u) => u.role === 'student' && matches(query, u.name, u.studentId))
      : null
  const latestOther = unmatchedStudent && exitRequests.find((r) => r.studentId === unmatchedStudent.id)

  function select(id) {
    setSelectedId(id)
    setChecked([])
    setNote('')
  }

  function allow() {
    actions.allowExit(selected.id, note)
    setSelectedId(null)
  }

  function deny() {
    actions.denyExit(selected.id, denyReason)
    setDenyOpen(false)
    setDenyReason('')
    setSelectedId(null)
  }

  const allChecked = selected && checked.length === selected.items.length
  const today = todayISODate()

  return (
    <>
      <PageHeader title="Verify Exit" subtitle="Match the student's approved pass against the items they are carrying." />

      <div className="layout-split">
        <Card title="Approved passes" flush>
          <div className="card-pad">
            <SearchInput value={query} onChange={setQuery} placeholder="Pass code, student ID or name" />
          </div>
          {results.length === 0 ? (
            <div className="card-pad">
              {unmatchedStudent ? (
                <Callout tone="danger">
                  <strong>{unmatchedStudent.name}</strong> has no approved pass.
                  {latestOther ? <> Latest request {latestOther.code} is <strong>{latestOther.status}</strong>.</> : ' They have never submitted a request.'}{' '}
                  Do not let them leave with registered items.
                </Callout>
              ) : (
                <EmptyState icon="ticket" title="No approved passes" text={query ? 'Nothing matches your search.' : 'There are no approved passes right now.'} />
              )}
            </div>
          ) : (
            <ul className="pass-list">
              {results.map((r) => {
                const s = studentOf(r)
                const early = r.departureDate > today
                return (
                  <li key={r.id}>
                    <button type="button" className={r.id === selectedId ? 'active' : ''} onClick={() => select(r.id)}>
                      <div>
                        <div className="row-title">{s?.name}</div>
                        <div className="muted small"><code>{r.code}</code> · {s?.studentId}</div>
                      </div>
                      <span className={`badge ${early ? 'badge-warning' : 'badge-info'}`}>
                        {isToday(`${r.departureDate}T12:00:00`) ? 'Today' : formatDate(r.departureDate)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {!selected ? (
          <Card>
            <EmptyState icon="shield" title="Select a pass" text="Choose an approved pass on the left to start verifying items." />
          </Card>
        ) : (
          <Card
            title={
              <span className="title-with-badge">
                Pass {selected.code} <StatusBadge status={selected.status} />
              </span>
            }
          >
            <div className="stack">
              <StudentSummary student={student} />

              {selected.departureDate > today && (
                <Callout tone="warning">
                  This pass is for {formatDate(selected.departureDate)}, not today. Confirm with the proctor before allowing exit.
                </Callout>
              )}

              <dl className="details-grid">
                <div><dt>Destination</dt><dd>{selected.destination}</dd></div>
                <div><dt>Return</dt><dd>{formatDate(selected.returnDate)}</dd></div>
                <div className="span-2"><dt>Reason</dt><dd>{selected.reason}</dd></div>
              </dl>

              <div>
                <h3 className="section-title">Check each item ({checked.length}/{selected.items.length})</h3>
                <div className="check-list">
                  {selected.items.map((item) => (
                    <label key={item.id} className={`check-item ${checked.includes(item.id) ? 'checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={checked.includes(item.id)}
                        onChange={() => setChecked((c) => (c.includes(item.id) ? c.filter((x) => x !== item.id) : [...c, item.id]))}
                      />
                      <CategoryIcon category={item.category} />
                      <div className="item-main">
                        <div className="item-title">
                          {item.description}
                          {item.quantity > 1 && <span className="qty">× {item.quantity}</span>}
                        </div>
                        <div className="item-meta">
                          {item.category}
                          {item.serialNumber && <> · S/N <code className="serial">{item.serialNumber}</code></>}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <Field label="Note (optional)" full>
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Checked laptop serial on sticker" />
              </Field>

              <div className="button-row">
                <button type="button" className="btn btn-danger-ghost" onClick={() => setDenyOpen(true)}>
                  <Icon name="ban" size={16} /> Deny exit
                </button>
                <button type="button" className="btn btn-success" disabled={!allChecked} onClick={allow}>
                  <Icon name="check" size={16} /> Allow exit
                </button>
              </div>
              {!allChecked && <p className="muted small right">Tick every item after physically checking it.</p>}
            </div>
          </Card>
        )}
      </div>

      <Modal
        open={denyOpen}
        title="Deny exit"
        onClose={() => setDenyOpen(false)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setDenyOpen(false)}>Cancel</button>
            <button type="button" className="btn btn-danger" disabled={!denyReason.trim()} onClick={deny}>Deny and log</button>
          </>
        }
      >
        <p className="muted mb">
          The attempt is logged. The pass stays approved so the student can return with the correct items.
        </p>
        <Field label="Reason" full>
          <textarea rows={3} value={denyReason} onChange={(e) => setDenyReason(e.target.value)} placeholder="e.g. Laptop serial number does not match the pass" autoFocus />
        </Field>
      </Modal>
    </>
  )
}
