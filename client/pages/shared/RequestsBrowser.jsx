import { useState } from 'react'
import { useStore } from '../../context/store'
import RequestDetails from '../../components/RequestDetails'
import { Avatar, Card, EmptyState, Field, Modal, PageHeader, SearchInput, StatusBadge, Tabs } from '../../components/ui'
import { formatDate, matches, timeAgo } from '../../utils/format'

// Proctors review requests here (canReview); admins get the same list read-only.
export default function RequestsBrowser({ canReview = false }) {
  const { exitRequests, users, actions } = useStore()
  const [tab, setTab] = useState(canReview ? 'pending' : 'all')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState(null)
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState('')

  const studentOf = (r) => users.find((u) => u.id === r.studentId)
  const searched = exitRequests.filter((r) => {
    const s = studentOf(r)
    return matches(query, r.code, r.destination, s?.name, s?.studentId)
  })
  const visible = (tab === 'all' ? searched : searched.filter((r) => r.status === tab)).sort((a, b) =>
    // Pending: oldest first (first come, first served). Others: newest first.
    tab === 'pending' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt),
  )
  const open = exitRequests.find((r) => r.id === openId)

  const count = (status) => searched.filter((r) => r.status === status).length
  const tabs = [
    { value: 'pending', label: 'Pending', count: count('pending') },
    { value: 'approved', label: 'Approved', count: count('approved') },
    { value: 'completed', label: 'Exited', count: count('completed') },
    { value: 'rejected', label: 'Rejected', count: count('rejected') },
    { value: 'all', label: 'All', count: searched.length },
  ]

  function openRequest(id) {
    setOpenId(id)
    setNote('')
    setNoteError('')
  }

  function decide(decision) {
    if (decision === 'rejected' && !note.trim()) return setNoteError('Give the student a reason for rejecting.')
    actions.reviewRequest(open.id, decision, note)
    setOpenId(null)
  }

  return (
    <>
      <PageHeader
        title={canReview ? 'Review Requests' : 'Exit Requests'}
        subtitle={canReview ? 'Approve or reject students’ requests to leave campus with their belongings.' : 'All departure requests submitted by students.'}
      />

      <div className="toolbar">
        <Tabs tabs={tabs} value={tab} onChange={setTab} />
        <div className="toolbar-right">
          <SearchInput value={query} onChange={setQuery} placeholder="Code, student, destination…" />
        </div>
      </div>

      <Card flush>
        {visible.length === 0 ? (
          <EmptyState icon="clipboard" title={tab === 'pending' ? 'All caught up' : 'No requests'} text={tab === 'pending' ? 'There are no requests waiting for review.' : 'Nothing matches this filter.'} />
        ) : (
          <div className="table-wrap">
            <table className="table-click">
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Student</th>
                  <th>Destination</th>
                  <th>Dates</th>
                  <th>Items</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const s = studentOf(r)
                  return (
                    <tr key={r.id} onClick={() => openRequest(r.id)}>
                      <td>
                        <div className="row-title"><code>{r.code}</code></div>
                        <div className="muted small">{timeAgo(r.createdAt)}</div>
                      </td>
                      <td>
                        <div className="cell-item">
                          <Avatar name={s?.name ?? '?'} size="sm" />
                          <div>
                            <div className="row-title">{s?.name ?? 'Deleted user'}</div>
                            <div className="muted small">{s?.studentId}</div>
                          </div>
                        </div>
                      </td>
                      <td>{r.destination}</td>
                      <td className="nowrap">{formatDate(r.departureDate)}<div className="muted small">to {formatDate(r.returnDate)}</div></td>
                      <td>{r.items.length}</td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={!!open}
        title={canReview && open?.status === 'pending' ? 'Review request' : 'Request details'}
        onClose={() => setOpenId(null)}
        size="lg"
        footer={
          canReview && open?.status === 'pending' && (
            <>
              <button type="button" className="btn btn-danger-ghost" onClick={() => decide('rejected')}>Reject</button>
              <button type="button" className="btn btn-success" onClick={() => decide('approved')}>Approve</button>
            </>
          )
        }
      >
        {open && (
          <div className="stack">
            <RequestDetails request={open} />
            {canReview && open.status === 'pending' && (
              <Field label="Note to student" hint="Optional when approving, required when rejecting." error={noteError} full>
                <textarea rows={2} value={note} onChange={(e) => { setNote(e.target.value); setNoteError('') }} />
              </Field>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
