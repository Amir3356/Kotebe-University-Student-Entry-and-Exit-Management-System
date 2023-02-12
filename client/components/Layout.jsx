import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useStore } from '../context/store'
import Icon from './Icon'
import logo from '../asset/images.png'
import { Avatar } from './ui'
import { ROLE_LABELS } from '../utils/format'

function navFor(role, counts) {
  switch (role) {
    case 'student':
      return [
        { to: '/student/belongings', label: 'My Belongings', icon: 'box' },
      ]
    case 'guard':
      return [
        { to: '/guard/belongings', label: 'Student Belongings', icon: 'box' },
      ]
    case 'proctor':
      return [
        { to: '/proctor/requests', label: 'Student Leave Request', icon: 'clipboard', badge: counts.pending },
      ]
    case 'admin':
      return [
        { to: '/admin/users', label: 'Account Provision', icon: 'users' },
      ]
    default:
      return []
  }
}

export default function Layout() {
  const { currentUser, exitRequests, actions } = useStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const [lastPath, setLastPath] = useState(location.pathname)

  // Close the mobile drawer whenever the route changes.
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    setMenuOpen(false)
  }

  const counts = {
    pending: exitRequests.filter((r) => r.status === 'pending').length,
    approved: exitRequests.filter((r) => r.status === 'approved').length,
  }
  const nav = navFor(currentUser.role, counts)
  const subtitle =
    currentUser.role === 'student'
      ? currentUser.studentId
      : currentUser.role === 'guard'
        ? currentUser.gate
        : ROLE_LABELS[currentUser.role]

  return (
    <div className={`shell ${menuOpen ? 'menu-open' : ''}`}>
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
          <button type="button" className="btn btn-ghost btn-block" onClick={actions.logout}>
            <Icon name="logout" size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="scrim" onClick={() => setMenuOpen(false)} />

      <div className="main">
        <header className="topbar">
          <button type="button" className="icon-btn menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Icon name="menu" />
          </button>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
