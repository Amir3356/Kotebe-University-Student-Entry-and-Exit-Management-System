import { useState } from 'react'
import { useStore } from '../../context/store'
import Icon from '../../components/Icon'
import RequestDetails from '../../components/RequestDetails'
import {
  Avatar,
  Card,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  SearchInput,
  StatusBadge,
  Tabs,
} from '../../components/ui'
import { formatDateTime, matches } from '../../utils/format'

export default function StudentLeaveRequests() {
  const { exitRequests, users, actions } = useStore()
  const [tab, setTab] = useState('all')
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

  const visible = tab === 'all' ? searched : searched.filter((r) => r.status === tab)

  const count = (status) => searched.filter((r) => r.status === status).length
  const tabs = [
    { value: 'all', label: 'All', count: searched.length },
    { value: 'pending', label: 'Pending', count: count('pending') },
    { value: 'approved', label: 'Approved', count: count('approved') },
    { value: 'rejected', label: 'Rejected', count: count('rejected') },
  ]

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
      />

      <div className="toolbar">
        <Tabs tabs={tabs} value={tab} onChange={setTab} />
        <div className="toolbar-right">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by student, department, address, subcity…"
          />
        </div>
      </div>

      <Card flush>
        {visible.length === 0 ? (
          <EmptyState
            icon="clipboard"
            title={tab === 'pending' ? 'No pending leave requests' : 'No requests found'}
            text={tab === 'pending' ? 'All student departure requests have been processed.' : 'No student leave requests match your search.'}
          />
        ) : (
          <div className="table-wrap">
            <table className="belongings-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Student Name</th>
                  <th>Department</th>
                  <th>Phone Number</th>
                  <th>Address</th>
                  <th>Subcity</th>
                  <th>Woreda</th>
                  <th>Date & Time Registered</th>
                  <th>Status</th>
                  <th className="right">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r, index) => {
                  const s = studentOf(r)
                  return (
                    <tr key={r.id}>
                      <td className="cell-num">{index + 1}</td>
                      <td>
                        <div className="cell-item">
                          <Avatar name={s?.name ?? 'Unknown'} size="sm" />
                          <div>
                            <span className="row-title">{s?.name ?? 'Unknown'}</span>
                            {s?.studentId && (
                              <div className="muted small">
                                <code>{s.studentId}</code>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{s?.department || '—'}</td>
                      <td className="nowrap">{s?.phone || '—'}</td>
                      <td>{s?.address || '—'}</td>
                      <td>{s?.subcity || '—'}</td>
                      <td>{s?.woreda || '—'}</td>
                      <td className="nowrap">{formatDateTime(r.createdAt || s?.createdAt)}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="right nowrap">
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-success"
                            onClick={() => handleApprove(r)}
                            title="Approve leave request"
                            disabled={r.status === 'approved'}
                          >
                            <Icon name="check" size={14} /> Approve
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger-ghost"
                            onClick={() => openReject(r)}
                            title="Reject leave request"
                            disabled={r.status === 'rejected'}
                          >
                            <Icon name="x" size={14} /> Reject
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => setViewingRequest(r)}
                            aria-label={`View details for ${r.code}`}
                            title="View request details"
                          >
                            <Icon name="eye" size={16} />
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
        {viewingRequest && <RequestDetails request={viewingRequest} />}
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
