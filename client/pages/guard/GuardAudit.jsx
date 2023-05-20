import { useState } from 'react'
import { useStore } from '../../context/store'
import Icon from '../../components/Icon'
import RequestDetails from '../../components/RequestDetails'
import {
  Avatar,
  Card,
  EmptyState,
  Modal,
  PageHeader,
  SearchInput,
  StatCard,
  StatusBadge,
} from '../../components/ui'
import { resolveStudent } from '../../models/userModel'
import { formatDateTime, matches } from '../../utils/format'

export default function GuardAudit() {
  const { exitRequests, users } = useStore()
  const [query, setQuery] = useState('')
  const [viewingRequest, setViewingRequest] = useState(null)

  const studentOf = (r) => resolveStudent(r, users)

  const norm = (s) => (s || '').trim().toLowerCase()
  const isApproved = (r) => ['approved', 'approve', 'completed'].includes(norm(r.status))
  const isPending = (r) => norm(r.status) === 'pending'
  const isRejected = (r) => ['rejected', 'reject', 'denied'].includes(norm(r.status))

  const proctorOf = (r) => {
    if (r.reviewer) return r.reviewer
    const found = users.find(
      (u) =>
        u.id === r.reviewedBy ||
        (u.username && r.reviewedBy && u.username.toLowerCase() === r.reviewedBy.toLowerCase()) ||
        (u.name && r.reviewedBy && u.name.toLowerCase() === r.reviewedBy.toLowerCase()),
    )
    if (found) return found
    if (r.reviewedBy) return { name: r.reviewedBy }
    return null
  }

  const activeViewingRequest = viewingRequest
    ? exitRequests.find((r) => r.id === viewingRequest.id || (viewingRequest.code && r.code === viewingRequest.code)) || viewingRequest
    : null

  const searched = exitRequests.filter((r) => {
    const s = studentOf(r)
    const reviewer = proctorOf(r)
    return matches(
      query,
      r.code,
      r.destination,
      r.reason,
      r.status,
      r.reviewNote,
      s?.name,
      s?.studentId,
      s?.department,
      s?.phone,
      s?.address,
      s?.subcity,
      s?.woreda,
      reviewer?.name,
      r.reviewedBy,
      ...(r.items?.map((i) => i.description) ?? []),
    )
  })

  const visible = searched

  const approvedCount = exitRequests.filter(isApproved).length
  const pendingCount = exitRequests.filter(isPending).length
  const rejectedCount = exitRequests.filter(isRejected).length

  return (
    <>
      <PageHeader
        title="Audit"
        subtitle="Proctor review status (Approved, Rejected, or Pending) for student departure requests."
        center
      />

      <div className="stats-grid stats-grid-3">
        <StatCard
          label="Approved by Proctor"
          value={approvedCount}
          icon="approve"
          tone="success"
        />
        <StatCard
          label="Pending Review"
          value={pendingCount}
          icon="clock"
          tone="warning"
        />
        <StatCard
          label="Rejected by Proctor"
          value={rejectedCount}
          icon="reject"
          tone="danger"
        />
      </div>

      <div className="toolbar">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search by student name, ID, code, destination, proctor, status…"
        />
      </div>

      <Card flush>
        {visible.length === 0 ? (
          <EmptyState
            icon="clipboard"
            title="No audit records found"
            text="No student requests match the selected audit filter or search."
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
                  <th>Destination</th>
                  <th>Date & Time Registered</th>
                  <th>Proctor Status</th>
                  <th>Reviewed By</th>
                  <th className="right">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r, index) => {
                  const s = studentOf(r)
                  const reviewer = proctorOf(r)
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setViewingRequest(r)}
                      onKeyDown={(e) => e.key === 'Enter' && setViewingRequest(r)}
                      tabIndex={0}
                      title="Click to view full leave request audit details"
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
                      <td>{r.destination || 'Home'}</td>
                      <td className="nowrap">{formatDateTime(r.createdAt || s?.createdAt)}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td>
                        {reviewer ? (
                          <div>
                            <span className="row-title">{reviewer.name}</span>
                            {r.reviewNote && <div className="muted small">{r.reviewNote}</div>}
                          </div>
                        ) : r.reviewedBy ? (
                          <div>
                            <span className="row-title">{r.reviewedBy}</span>
                            {r.reviewNote && <div className="muted small">{r.reviewNote}</div>}
                          </div>
                        ) : r.status !== 'pending' ? (
                          <div>
                            <span className="row-title">Proctor Office</span>
                            {r.reviewNote && <div className="muted small">{r.reviewNote}</div>}
                          </div>
                        ) : (
                          <span className="muted">Awaiting Review</span>
                        )}
                      </td>
                      <td className="right nowrap">
                        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => setViewingRequest(r)}
                            aria-label={`View audit details for ${r.code}`}
                            title="View Details"
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
        open={!!activeViewingRequest}
        title="Leave Request Audit Details"
        onClose={() => setViewingRequest(null)}
        size="lg"
        footer={
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setViewingRequest(null)}
          >
            Close
          </button>
        }
      >
        {activeViewingRequest && <RequestDetails request={activeViewingRequest} />}
      </Modal>
    </>
  )
}
