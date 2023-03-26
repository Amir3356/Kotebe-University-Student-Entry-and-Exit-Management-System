import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useStore } from '../context/store'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout() {
  const { currentUser, exitRequests, actions } = useStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const [lastPath, setLastPath] = useState(location.pathname)

  // Close mobile drawer when route changes
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    setMenuOpen(false)
  }

  const counts = {
    pending: (exitRequests || []).filter((r) => r.status === 'pending').length,
    approved: (exitRequests || []).filter((r) => r.status === 'approved').length,
  }

  return (
    <div className={`shell ${menuOpen ? 'menu-open' : ''}`}>
      <Sidebar
        currentUser={currentUser}
        counts={counts}
        onLogout={actions.logout}
      />

      <div className="scrim" onClick={() => setMenuOpen(false)} />

      <div className="main">
        <Topbar onMenuOpen={() => setMenuOpen(true)} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
