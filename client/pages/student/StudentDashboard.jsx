import { Link } from 'react-router-dom'
import { useStore } from '../../context/store'
import Icon from '../../components/Icon'
import ItemList from '../../components/ItemList'
import { Card, EmptyState, PageHeader, StatCard, StatusBadge } from '../../components/ui'
import { formatDate, timeAgo } from '../../utils/format'

export default function StudentDashboard() {
  const { currentUser, belongings, exitRequests } = useStore()
  const mine = belongings.filter((b) => b.studentId === currentUser.id)
  const requests = exitRequests.filter((r) => r.studentId === currentUser.id)
  const activePass = requests.find((r) => r.status === 'approved')
  const firstName = currentUser.name.split(' ')[0]

  return (
    <>
      <PageHeader
        title={`Selam, ${firstName}`}
        subtitle={`${currentUser.studentId} · ${currentUser.department} · ${currentUser.dorm}`}
        actions={
          <Link to="/student/requests/new" className="btn btn-primary">
            <Icon name="plus" size={16} /> New exit request
          </Link>
        }
      />

      <div className="stats-grid">
        <StatCard label="Registered belongings" value={mine.length} icon="box" tone="primary" />
        <StatCard label="Active items" value={mine.filter((b) => b.status === 'active' || b.status === 'on_campus').length} icon="shield" tone="success" />
        <StatCard label="Pending requests" value={requests.filter((r) => r.status === 'pending').length} icon="clock" tone="warning" />
        <StatCard label="Approved passes" value={requests.filter((r) => r.status === 'approved').length} icon="ticket" tone="info" />
      </div>

      {activePass && (
        <section className="pass">
          <div className="pass-main">
            <div className="eyebrow">Approved exit pass</div>
            <div className="pass-code">{activePass.code}</div>
            <p>
              Show this code to the guard at the gate. Departure {formatDate(activePass.departureDate)} to{' '}
              {activePass.destination}.
            </p>
          </div>
          <div className="pass-items">
            <ItemList items={activePass.items} />
          </div>
        </section>
      )}

      <div className="grid-2">
        <Card
          title="Recent requests"
          actions={<Link to="/student/requests" className="link">View all</Link>}
          flush
        >
          {requests.length === 0 ? (
            <EmptyState icon="send" title="No requests yet" text="Create one when you plan to leave campus." />
          ) : (
            <ul className="row-list">
              {requests.slice(0, 4).map((r) => (
                <li key={r.id}>
                  <div>
                    <div className="row-title">{r.code} · {r.destination}</div>
                    <div className="muted small">{r.items.length} item(s) · submitted {timeAgo(r.createdAt)}</div>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="My belongings"
          actions={<Link to="/student/belongings" className="link">View all</Link>}
          flush
        >
          {mine.length === 0 ? (
            <EmptyState icon="box" title="No belongings recorded" text="Guards record your items when you enter campus." />
          ) : (
            <ul className="row-list">
              {mine.slice(0, 4).map((b) => (
                <li key={b.id}>
                  <div>
                    <div className="row-title">{b.description}</div>
                    <div className="muted small">{b.category} · S/N {b.serialNumber || '—'}</div>
                  </div>
                  <StatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
