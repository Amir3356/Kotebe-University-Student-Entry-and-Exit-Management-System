import Icon from '../components/Icon'

export default function Topbar({ onMenuOpen }) {
  return (
    <header className="topbar">
      <button
        type="button"
        className="icon-btn menu-btn"
        onClick={onMenuOpen}
        aria-label="Open menu"
      >
        <Icon name="menu" />
      </button>
    </header>
  )
}
