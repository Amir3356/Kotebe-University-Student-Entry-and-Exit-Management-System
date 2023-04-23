import { NavLink } from 'react-router-dom'
import Icon from '../components/Icon'
import logo from '../asset/images.png'
import { Avatar } from '../components/ui'
import { ROLE_LABELS } from '../models'

function navFor(role, counts) {
  switch (role) {
    case 'student':
      return [
        { to: '/student/belongings', label: 'My Belongings', icon: 'box' },
      ]
    case 'guard':
      return [
        { to: '/guard/belongings', label: 'Student Belongings', icon: 'box' },
        { to: '/guard/audit', label: 'Audit', icon: 'clipboard', badge: counts.pending },
      ]
    case 'proctor':
      return [
        { to: '/proctor/requests', label: 'Student Leave Request', icon: 'clipboard', badge: counts.pending },
        { to: '/proctor/users', label: 'Account Provision', icon: 'users' },
      ]
    default:
      return []
  }
}

export default function Sidebar({ currentUser, counts, onLogout }) {
  if (!currentUser) return null

  const nav = navFor(currentUser.role, counts)
  const subtitle =
    currentUser.role === 'student'
      ? currentUser.studentId
      : currentUser.role === 'guard'
        ? currentUser.gate
        : ROLE_LABELS[currentUser.role]

  return (
    <aside className="sidebar">
      <div className="brand">
        <img className="brand-logo" src={logo} alt="Kotebe University of Education logo" />
        <div>
          <div className="brand-name">Kotebe University of Education</div>
          <div className="brand-sub">Entry &amp; Exit Management</div>
        </div>
      </div>

      <div className="nav-section">{ROLE_LABELS[currentUser.role]} portal</div>
      <nav className="nav">
        {nav.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className="nav-link">
            <Icon name={item.icon} />
            <span>{item.label}</span>
            {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-chip">
          <Avatar name={currentUser.name} />
          <div className="user-chip-text">
            <div className="user-chip-name">{currentUser.name}</div>
            <div className="user-chip-sub">{subtitle}</div>
          </div>
        </div>
        <button type="button" className="btn btn-ghost btn-block" onClick={onLogout}>
          <Icon name="logout" size={16} /> Sign out
        </button>
      </div>
    </aside>
  )
}
