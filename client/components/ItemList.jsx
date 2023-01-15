import { CategoryIcon } from './Icon'

// Read-only list of belongings (from a request, a gate log, or the registry).
export default function ItemList({ items, showSource = false }) {
  return (
    <ul className="item-list">
      {items.map((item, index) => {
        const registered = showSource && item.belongingId !== undefined
        return (
          <li key={item.id ?? index} className="item-row">
            <CategoryIcon category={item.category} />
            <div className="item-main">
              <div className="item-title">
                {item.description}
                {item.quantity > 1 && <span className="qty">× {item.quantity}</span>}
              </div>
              <div className="item-meta">
                {item.category}
                {item.serialNumber && (
                  <>
                    {' · S/N '}
                    <code>{item.serialNumber}</code>
                  </>
                )}
              </div>
            </div>
            {registered && (
              <span className={`badge ${item.belongingId ? 'badge-success' : 'badge-neutral'}`}>
                {item.belongingId ? 'Matches entry record' : 'Declared item'}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
