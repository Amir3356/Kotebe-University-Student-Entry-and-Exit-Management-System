import { useStore } from '../../context/store'
import { CategoryIcon } from '../../components/Icon'
import { Callout, Card, EmptyState, PageHeader, StatusBadge } from '../../components/ui'
import { formatDateTime } from '../../utils/format'

export default function MyBelongings() {
  const { currentUser, belongings, users } = useStore()
  const mine = belongings.filter((b) => b.studentId === currentUser.id)

  return (
    <>
      <PageHeader title="My Belongings" subtitle="Items recorded under your name at the university gate." />

      <Callout>
        Belongings are registered by the guard when you enter campus. To take an item out, include it in an exit
        request and wait for the proctor's approval.
      </Callout>

      <Card flush>
        {mine.length === 0 ? (
          <EmptyState icon="box" title="No belongings recorded" text="Nothing has been registered under your name yet." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Serial number</th>
                  <th>Colour</th>
                  <th>Registered</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="cell-item">
                        <CategoryIcon category={b.category} />
                        <div>
                          <div className="row-title">{b.description}</div>
                          <div className="muted small">{b.category}</div>
                        </div>
                      </div>
                    </td>
                    <td><code>{b.serialNumber || '—'}</code></td>
                    <td>{b.color || '—'}</td>
                    <td>
                      <div>{formatDateTime(b.registeredAt)}</div>
                      <div className="muted small">by {users.find((u) => u.id === b.registeredBy)?.name ?? 'Guard'}</div>
                    </td>
                    <td><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
