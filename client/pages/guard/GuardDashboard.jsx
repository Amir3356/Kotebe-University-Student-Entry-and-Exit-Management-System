import { Link } from 'react-router-dom'
import { useStore } from '../../context/store'
import Icon from '../../components/Icon'
import { Card, EmptyState, PageHeader, StatCard, StatusBadge } from '../../components/ui'
import { formatDate, formatTime, isToday } from '../../utils/format'

export default function GuardDashboard() {
  const { currentUser, gateLogs, exitRequests, users } = useStore()
  const today = gateLogs.filter((g) => isToday(g.timestamp))
  const approved = exitRequests.filter((r) => r.status === 'approved')
  const nameOf = (id) => users.find((u) => u.id === id)?.name ?? 'Unknown'

  return (
    <>
      <PageHeader
        title="Gate dashboard"
        subtitle={`${currentUser.gate} · ${formatDate(new Date().toISOString())}`}
      />

      <div className="action-tiles">
        <Link to="/guard/belongings" className="action-tile tile-entry">
          <Icon name="entry" size={28} />
          <div>
            <div className="action-tile-title">Record entry</div>
            <div className="action-tile-text">Register a student's belongings as they come in</div>
          </div>
          <Icon name="arrowRight" />
        </Link>
        <Link to="/guard/exit" className="action-tile tile-exit">
          <Icon name="exit" size={28} />
          <div>
            <div className="action-tile-title">Verify exit</div>
            <div className="action-tile-text">Check an approved pass against the items leaving</div>
          </div>
          <Icon name="arrowRight" />
        </Link>
      </div>

      <div className="stats-grid">
        <StatCard label="Entries today" value={today.filter((g) => g.type === 'entry').length} icon="entry" tone="success" />
        <StatCard label="Exits today" value={today.filter((g) => g.type === 'exit').length} icon="exit" tone="info" />
        <StatCard label="Denied today" value={today.filter((g) => g.type === 'denied').length} icon="ban" tone="danger" />
        <StatCard label="Approved passes waiting" value={approved.length} icon="ticket" tone="warning" />
      </div>

      <div className="grid-2">
        <Card title="Approved passes" actions={<Link to="/guard/exit" className="link">Verify</Link>} flush>
          {approved.length === 0 ? (
            <EmptyState icon="ticket" title="No approved passes" text="Approved requests will show up here." />
          ) : (
            <ul className="row-list">
              {approved.map((r) => (
                <li key={r.id}>
                  <div>
                    <div className="row-title">{nameOf(r.studentId)}</div>
                    <div className="muted small">{r.code} · departs {formatDate(r.departureDate)} · {r.items.length} item(s)</div>
                  </div>
                  <Link to={`/guard/exit?code=${r.code}`} className="btn btn-ghost btn-sm">Check</Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Today's gate activity" actions={<Link to="/guard/logs" className="link">Full log</Link>} flush>
          {today.length === 0 ? (
            <EmptyState icon="clock" title="No activity yet today" />
          ) : (
            <ul className="row-list">
              {today.slice(0, 6).map((g) => (
                <li key={g.id}>
                  <div>
                    <div className="row-title">{nameOf(g.studentId)}</div>
                    <div className="muted small">{formatTime(g.timestamp)} · {g.gate} · {g.items.length} item(s)</div>
                  </div>
                  <StatusBadge status={g.type} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
