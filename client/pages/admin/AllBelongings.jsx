import { useState } from 'react'
import { useStore } from '../../context/store'
import { ITEM_CATEGORIES } from '../../data'
import { CategoryIcon } from '../../components/Icon'
import { Card, EmptyState, PageHeader, SearchInput, StatusBadge, Tabs } from '../../components/ui'
import { formatDate, matches } from '../../utils/format'

export default function AllBelongings() {
  const { belongings, users } = useStore()
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')

  const userOf = (id) => users.find((u) => u.id === id)
  const searched = belongings.filter((b) => {
    const s = userOf(b.studentId)
    return (category === 'all' || b.category === category) && matches(query, b.description, b.serialNumber, b.brand, s?.name, s?.studentId)
  })
  const visible =
    status === 'all'
      ? searched
      : searched.filter((b) =>
          status === 'active'
            ? b.status === 'active' || b.status === 'on_campus'
            : b.status === 'inactive' || b.status === 'off_campus',
        )
  const tabs = [
    { value: 'all', label: 'All', count: searched.length },
    { value: 'active', label: 'Active', count: searched.filter((b) => b.status === 'active' || b.status === 'on_campus').length },
    { value: 'inactive', label: 'Inactive', count: searched.filter((b) => b.status === 'inactive' || b.status === 'off_campus').length },
  ]

  return (
    <>
      <PageHeader title="Belongings" subtitle="Every item registered at the gates, and where it is now." />

      <div className="toolbar">
        <Tabs tabs={tabs} value={status} onChange={setStatus} />
        <div className="toolbar-right">
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
            <option value="all">All categories</option>
            {ITEM_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <SearchInput value={query} onChange={setQuery} placeholder="Serial, model, student…" />
        </div>
      </div>

      <Card flush>
        {visible.length === 0 ? (
          <EmptyState icon="box" title="No belongings found" />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Serial number</th>
                  <th>Owner</th>
                  <th>Registered</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((b) => {
                  const s = userOf(b.studentId)
                  return (
                    <tr key={b.id}>
                      <td>
                        <div className="cell-item">
                          <CategoryIcon category={b.category} />
                          <div>
                            <div className="row-title">{b.description}</div>
                            <div className="muted small">{[b.category, b.color].filter(Boolean).join(' · ')}</div>
                          </div>
                        </div>
                      </td>
                      <td><code>{b.serialNumber || '—'}</code></td>
                      <td>
                        <div className="row-title">{s?.name ?? 'Deleted user'}</div>
                        <div className="muted small">{s?.studentId}</div>
                      </td>
                      <td className="nowrap">
                        {formatDate(b.registeredAt)}
                        <div className="muted small">by {userOf(b.registeredBy)?.name ?? '—'}</div>
                      </td>
                      <td><StatusBadge status={b.status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
