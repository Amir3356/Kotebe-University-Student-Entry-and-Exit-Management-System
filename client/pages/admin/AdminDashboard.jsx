import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../context/store'
import Icon from '../../components/Icon'
import { Card, Modal, PageHeader, StatCard, StatusBadge } from '../../components/ui'
import { formatTime, isToday, timeAgo, ROLE_LABELS } from '../../utils/format'

export default function AdminDashboard() {
  const { users, belongings, exitRequests, gateLogs, actions } = useStore()
  const [confirmReset, setConfirmReset] = useState(false)
  const nameOf = (id) => users.find((u) => u.id === id)?.name ?? 'Unknown'

  const students = users.filter((u) => u.role === 'student')
  const staff = users.filter((u) => u.role !== 'student')
  const today = gateLogs.filter((g) => isToday(g.timestamp))
  const recent = [...gateLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 7)
  const byRole = ['student', 'guard', 'proctor', 'admin'].map((role) => ({
    role,
    total: users.filter((u) => u.role === role).length,
    active: users.filter((u) => u.role === role && u.status === 'active').length,
  }))
  const requestStatuses = ['pending', 'approved', 'completed', 'rejected', 'cancelled'].map((status) => ({
    status,
    count: exitRequests.filter((r) => r.status === status).length,
  }))

  return (
    <>
      <PageHeader
        title="System overview"
        subtitle="Accounts, belongings and gate activity across the university."
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(true)}>
              <Icon name="refresh" size={16} /> Reset demo data
            </button>
            <Link to="/admin/users" className="btn btn-primary">
              <Icon name="users" size={16} /> Manage users
            </Link>
          </>
        }
      />

      <div className="stats-grid stats-grid-6">
        <StatCard label="Active students" value={students.filter((s) => s.status === 'active').length} icon="user" tone="primary" hint={`${students.length} total`} />
        <StatCard label="Staff accounts" value={staff.length} icon="users" tone="neutral" />
        <StatCard label="Items on campus" value={belongings.filter((b) => b.status === 'on_campus').length} icon="box" tone="success" hint={`${belongings.length} registered`} />
        <StatCard label="Pending requests" value={exitRequests.filter((r) => r.status === 'pending').length} icon="clock" tone="warning" />
        <StatCard label="Entries today" value={today.filter((g) => g.type === 'entry').length} icon="entry" tone="success" />
        <StatCard label="Exits today" value={today.filter((g) => g.type === 'exit').length} icon="exit" tone="info" hint={`${today.filter((g) => g.type === 'denied').length} denied`} />
      </div>

      <div className="grid-2-1">
        <Card title="Recent gate activity" actions={<Link to="/admin/records" className="link">All records</Link>} flush>
          <ul className="row-list">
            {recent.map((g) => (
              <li key={g.id}>
                <div>
                  <div className="row-title">{nameOf(g.studentId)}</div>
                  <div className="muted small">
                    {isToday(g.timestamp) ? `Today ${formatTime(g.timestamp)}` : timeAgo(g.timestamp)} · {g.gate} · {g.items.length} item(s) · by {nameOf(g.guardId)}
                  </div>
                </div>
                <StatusBadge status={g.type} />
              </li>
            ))}
          </ul>
        </Card>

        <div className="stack">
          <Card title="Accounts by role" flush>
            <ul className="row-list compact">
              {byRole.map((r) => (
                <li key={r.role}>
                  <span>{ROLE_LABELS[r.role]}s</span>
                  <span className="muted small">
                    <strong className="text-strong">{r.active}</strong> active / {r.total}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Requests by status" actions={<Link to="/admin/requests" className="link">View</Link>} flush>
            <ul className="row-list compact">
              {requestStatuses.map((r) => (
                <li key={r.status}>
                  <StatusBadge status={r.status} />
                  <strong className="text-strong">{r.count}</strong>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Modal
        open={confirmReset}
        title="Reset demo data?"
        onClose={() => setConfirmReset(false)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                actions.resetDemoData()
                setConfirmReset(false)
              }}
            >
              Reset
            </button>
          </>
        }
      >
        <p>All changes made in this browser (new users, requests, gate records) will be replaced with the original mock data.</p>
      </Modal>
    </>
  )
}
