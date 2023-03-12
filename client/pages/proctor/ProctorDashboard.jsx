import { Link } from 'react-router-dom'
import { useStore } from '../../context/store'
import Icon from '../../components/Icon'
import { Avatar, Card, EmptyState, PageHeader, StatCard, StatusBadge } from '../../components/ui'
import { formatDate, isToday, timeAgo } from '../../utils/format'

export default function ProctorDashboard() {
  const { currentUser, exitRequests, users, belongings } = useStore()
  const nameOf = (id) => users.find((u) => u.id === id)?.name ?? 'Unknown'
  const pending = exitRequests.filter((r) => r.status === 'pending').sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const myReviews = exitRequests.filter((r) => r.reviewedBy === currentUser.id).sort((a, b) => b.reviewedAt.localeCompare(a.reviewedAt))
  const reviewedToday = exitRequests.filter((r) => isToday(r.reviewedAt))

  return (
    <>
      <PageHeader
        title={`Welcome, ${currentUser.name.split(' ')[0]}`}
        subtitle={currentUser.assignedBlocks}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/proctor/requests" className="btn btn-primary">
              <Icon name="clipboard" size={16} /> Review requests
            </Link>
            <Link to="/proctor/users" className="btn btn-ghost">
              <Icon name="users" size={16} /> Account Provision
            </Link>
          </div>
        }
      />

      <div className="stats-grid">
        <StatCard label="Waiting for review" value={pending.length} icon="clock" tone="warning" />
        <StatCard label="Reviewed today" value={reviewedToday.length} icon="clipboard" tone="primary" />
        <StatCard label="Approved, not yet exited" value={exitRequests.filter((r) => r.status === 'approved').length} icon="ticket" tone="success" />
        <StatCard label="Inactive items" value={belongings.filter((b) => b.status === 'inactive' || b.status === 'off_campus').length} icon="exit" tone="info" />
      </div>

      <div className="grid-2">
        <Card title="Oldest pending requests" actions={<Link to="/proctor/requests" className="link">Open queue</Link>} flush>
          {pending.length === 0 ? (
            <EmptyState icon="check" title="All caught up" text="No requests are waiting for review." />
          ) : (
            <ul className="row-list">
              {pending.slice(0, 5).map((r) => (
                <li key={r.id}>
                  <div className="cell-item">
                    <Avatar name={nameOf(r.studentId)} size="sm" />
                    <div>
                      <div className="row-title">{nameOf(r.studentId)}</div>
                      <div className="muted small">{r.code} · {r.destination} · departs {formatDate(r.departureDate)}</div>
                    </div>
                  </div>
                  <span className="muted small nowrap">{timeAgo(r.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="My recent decisions" flush>
          {myReviews.length === 0 ? (
            <EmptyState icon="clipboard" title="No decisions yet" />
          ) : (
            <ul className="row-list">
              {myReviews.slice(0, 5).map((r) => (
                <li key={r.id}>
                  <div>
                    <div className="row-title">{nameOf(r.studentId)}</div>
                    <div className="muted small">{r.code} · {timeAgo(r.reviewedAt)}</div>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
