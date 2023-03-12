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
  Tabs,
} from '../../components/ui'
import { formatDateTime, matches } from '../../utils/format'

export default function GuardAudit() {
  const { exitRequests, users } = useStore()
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [viewingRequest, setViewingRequest] = useState(null)

  const studentOf = (r) => users.find((u) => u.id === r.studentId)
  const proctorOf = (r) => users.find((u) => u.id === r.reviewedBy)

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
      reviewer?.name,
    )
  })

  const visible = tab === 'all' ? searched : searched.filter((r) => r.status === tab)

  const count = (status) => searched.filter((r) => r.status === status).length
  const tabs = [
    { value: 'all', label: 'All', count: searched.length },
    { value: 'approved', label: 'Approved', count: count('approved') },
    { value: 'pending', label: 'Pending', count: count('pending') },
    { value: 'rejected', label: 'Rejected', count: count('rejected') },
  ]

  const approvedCount = exitRequests.filter((r) => r.status === 'approved' || r.status === 'completed').length
  const pendingCount = exitRequests.filter((r) => r.status === 'pending').length
  const rejectedCount = exitRequests.filter((r) => r.status === 'rejected').length

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
        <Tabs tabs={tabs} value={tab} onChange={setTab} />
        <div className="toolbar-right">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by student name, ID, code, destination, proctor…"
          />
        </div>
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
            <table className="belongings-table">
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
                    <tr key={r.id}>
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
                      <td>{r.destination || '—'}</td>
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
                        ) : (
                          <span className="muted">Awaiting Review</span>
                        )}
                      </td>
                      <td className="right nowrap">
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => setViewingRequest(r)}
                          aria-label={`View audit details for ${r.code}`}
                          title="View Details"
                        >
                          <Icon name="eye" size={16} />
                        </button>
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
        {viewingRequest && <RequestDetails request={viewingRequest} />}
      </Modal>
    </>
  )
}
