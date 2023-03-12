import { useState } from 'react'
import { useStore } from '../../context/store'
import Icon from '../../components/Icon'
import {
  Avatar,
  Card,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  SearchInput,
  StatusBadge,
} from '../../components/ui'
import { formatDateTime, matches } from '../../utils/format'

export default function StudentLeaveRequests() {
  const { exitRequests, users, actions } = useStore()
  const [query, setQuery] = useState('')
  const [viewingRequest, setViewingRequest] = useState(null)
  const [rejectingRequest, setRejectingRequest] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const studentOf = (r) => users.find((u) => u.id === r.studentId)

  const searched = exitRequests.filter((r) => {
    const s = studentOf(r)
    return matches(
      query,
      r.code,
      r.destination,
      r.reason,
      r.status,
      s?.name,
      s?.studentId,
      s?.department,
      s?.phone,
      s?.address,
      s?.subcity,
      s?.woreda,
    )
  })

  const visible = searched

  function openReject(r) {
    setRejectingRequest(r)
    setRejectReason('')
  }

  function confirmReject() {
    if (!rejectingRequest) return
    actions.reviewRequest(rejectingRequest.id, 'rejected', rejectReason || 'Rejected by Proctor')
    setRejectingRequest(null)
    if (viewingRequest?.id === rejectingRequest.id) {
      setViewingRequest(null)
    }
  }

  function handleApprove(r) {
    actions.reviewRequest(r.id, 'approved', 'Approved by Proctor')
    if (viewingRequest?.id === r.id) {
      setViewingRequest(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Student Leave Request"
        subtitle="Review, approve, or reject student departure and leave requests."
        center
      />

      <div className="toolbar">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search by student name, ID, department, phone…"
        />
      </div>

      <Card flush>
        {visible.length === 0 ? (
          <EmptyState
            icon="clipboard"
            title="No requests found"
            text="No student leave requests match your search."
          />
        ) : (
          <div className="table-wrap">
            <table className="belongings-table table-click">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Student Name</th>
                  <th>Student ID</th>
                  <th>Department</th>
                  <th>Phone Number</th>
                  <th>Date & Time Registered</th>
                  <th className="right">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r, index) => {
                  const s = studentOf(r)
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setViewingRequest(r)}
                      onKeyDown={(e) => e.key === 'Enter' && setViewingRequest(r)}
                      tabIndex={0}
                      title="View leave request details"
                    >
                      <td className="cell-num">{index + 1}</td>
                      <td>
                        <div className="cell-item">
                          <Avatar name={s?.name ?? 'Unknown'} size="sm" />
                          <span className="row-title">{s?.name ?? 'Unknown'}</span>
                        </div>
                      </td>
                      <td>
                        <code>{s?.studentId || '—'}</code>
                      </td>
                      <td>{s?.department || '—'}</td>
                      <td className="nowrap">{s?.phone || '—'}</td>
                      <td className="nowrap">{formatDateTime(r.createdAt || s?.createdAt)}</td>
                      <td className="right nowrap">
                        <div className="row-actions">
                          <button
                            type="button"
                            className="icon-btn approve"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleApprove(r)
                            }}
                            aria-label={`Approve ${r.code}`}
                            title="Approve leave request"
                            disabled={r.status === 'approved'}
                          >
                            <Icon name="approve" size={18} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn reject"
                            onClick={(e) => {
                              e.stopPropagation()
                              openReject(r)
                            }}
                            aria-label={`Reject ${r.code}`}
                            title="Reject leave request"
                            disabled={r.status === 'rejected'}
                          >
                            <Icon name="reject" size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* View Request Details Modal */}
      <Modal
        open={!!viewingRequest}
        title="Leave Request Details"
        onClose={() => setViewingRequest(null)}
        size="lg"
        footer={
          <>
            {viewingRequest && viewingRequest.status !== 'approved' && (
              <button
                type="button"
                className="btn btn-success"
                onClick={() => handleApprove(viewingRequest)}
              >
                <Icon name="check" size={14} /> Approve Request
              </button>
            )}
            {viewingRequest && viewingRequest.status !== 'rejected' && (
              <button
                type="button"
                className="btn btn-danger-ghost"
                onClick={() => openReject(viewingRequest)}
              >
                <Icon name="x" size={14} /> Reject Request
              </button>
            )}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setViewingRequest(null)}
            >
              Close
            </button>
          </>
        }
      >
        {viewingRequest && (() => {
          const s = studentOf(viewingRequest)
          return (
            <div className="stack">
              <div className="card-header-inner">
                <div className="cell-item">
                  <Avatar name={s?.name ?? 'Unknown'} size="md" />
                  <div>
                    <h3 className="detail-name">{s?.name ?? 'Unknown'}</h3>
                    <div className="muted small">
                      <code>{s?.studentId || '—'}</code> · {s?.department || '—'}
                    </div>
                  </div>
                </div>
                <StatusBadge status={viewingRequest.status} />
              </div>

              <dl className="details-grid">
                <div><dt>Phone Number</dt><dd>{s?.phone || '—'}</dd></div>
                <div><dt>Date &amp; Time Registered</dt><dd>{formatDateTime(viewingRequest.createdAt)}</dd></div>
                <div><dt>Address</dt><dd>{s?.address || '—'}</dd></div>
                <div><dt>Subcity</dt><dd>{s?.subcity || '—'}</dd></div>
                <div><dt>Woreda</dt><dd>{s?.woreda || '—'}</dd></div>
                <div className="span-2"><dt>Reason for Leaving</dt><dd>{viewingRequest.reason || '—'}</dd></div>
              </dl>

              <div>
                <h3 className="section-title">Items ({viewingRequest.items.length})</h3>
                {viewingRequest.items.length === 0 ? (
                  <p className="muted">No items listed.</p>
                ) : (
                  <div className="table-wrap detail-items">
                    <table>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th className="right">Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingRequest.items.map((item) => (
                          <tr key={item.id}>
                            <td>{item.description}</td>
                            <td className="right">{item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* Reject Confirmation Modal */}
      <Modal
        open={!!rejectingRequest}
        title="Reject Leave Request"
        onClose={() => setRejectingRequest(null)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setRejectingRequest(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={confirmReject}
            >
              Confirm Reject
            </button>
          </>
        }
      >
        {rejectingRequest && (
          <div className="stack">
            <p>
              Are you sure you want to reject the leave request for{' '}
              <strong>{studentOf(rejectingRequest)?.name ?? 'this student'}</strong> (
              <code>{rejectingRequest.code}</code>)?
            </p>
            <Field label="Reason for rejection (optional)">
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Incomplete belongings verification or unauthorized departure"
              />
            </Field>
          </div>
        )}
      </Modal>
    </>
  )
}
