import { useState } from 'react'
import { useStore } from '../../context/store'
import ItemList from '../../components/ItemList'
import { Avatar, Card, EmptyState, Modal, PageHeader, SearchInput, StatusBadge, Tabs } from '../../components/ui'
import { formatDateTime, isToday, isWithinDays, matches } from '../../utils/format'

const PERIODS = { today: 'Today', week: 'Last 7 days', month: 'Last 30 days', all: 'All time' }

// Entry / exit log, used by guards ("Gate Log") and admins ("Gate Records").
export default function GateRecords({ title }) {
  const { gateLogs, users, exitRequests } = useStore()
  const [type, setType] = useState('all')
  const [period, setPeriod] = useState('week')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState(null)

  const userOf = (id) => users.find((u) => u.id === id)
  const inPeriod = gateLogs.filter((g) =>
    period === 'today' ? isToday(g.timestamp) : period === 'week' ? isWithinDays(g.timestamp, 7) : period === 'month' ? isWithinDays(g.timestamp, 30) : true,
  )
  const searched = inPeriod.filter((g) => {
    const s = userOf(g.studentId)
    return matches(query, s?.name, s?.studentId, g.gate, ...g.items.map((i) => i.serialNumber), ...g.items.map((i) => i.description))
  })
  const visible = (type === 'all' ? searched : searched.filter((g) => g.type === type)).sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  const open = gateLogs.find((g) => g.id === openId)

  const tabs = [
    { value: 'all', label: 'All', count: searched.length },
    { value: 'entry', label: 'Entries', count: searched.filter((g) => g.type === 'entry').length },
    { value: 'exit', label: 'Exits', count: searched.filter((g) => g.type === 'exit').length },
    { value: 'denied', label: 'Denied', count: searched.filter((g) => g.type === 'denied').length },
  ]

  return (
    <>
      <PageHeader title={title} subtitle="Every entry and exit recorded at the university gates." />

      <div className="toolbar">
        <Tabs tabs={tabs} value={type} onChange={setType} />
        <div className="toolbar-right">
          <select value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Period">
            {Object.entries(PERIODS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <SearchInput value={query} onChange={setQuery} placeholder="Student, ID, serial…" />
        </div>
      </div>

      <Card flush>
        {visible.length === 0 ? (
          <EmptyState icon="clock" title="No records" text="Try a different period or search." />
        ) : (
          <div className="table-wrap">
            <table className="table-click">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Student</th>
                  <th>Type</th>
                  <th>Items</th>
                  <th>Gate / guard</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((g) => {
                  const s = userOf(g.studentId)
                  return (
                    <tr key={g.id} onClick={() => setOpenId(g.id)}>
                      <td className="nowrap">{formatDateTime(g.timestamp)}</td>
                      <td>
                        <div className="cell-item">
                          <Avatar name={s?.name ?? '?'} size="sm" />
                          <div>
                            <div className="row-title">{s?.name ?? 'Deleted user'}</div>
                            <div className="muted small">{s?.studentId}</div>
                          </div>
                        </div>
                      </td>
                      <td><StatusBadge status={g.type} /></td>
                      <td className="truncate">{g.items.map((i) => i.description).join(', ')}</td>
                      <td>
                        <div>{g.gate}</div>
                        <div className="muted small">{userOf(g.guardId)?.name}</div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!open} title="Gate record" onClose={() => setOpenId(null)}>
        {open && (
          <div className="stack">
            <div className="request-head">
              <div>
                <div className="eyebrow">{formatDateTime(open.timestamp)} · {open.gate}</div>
                <div className="student-name">{userOf(open.studentId)?.name}</div>
              </div>
              <StatusBadge status={open.type} />
            </div>
            <dl className="details-grid">
              <div><dt>Student ID</dt><dd>{userOf(open.studentId)?.studentId ?? '—'}</dd></div>
              <div><dt>Guard</dt><dd>{userOf(open.guardId)?.name ?? '—'}</dd></div>
              {open.requestId && (
                <div><dt>Exit pass</dt><dd>{exitRequests.find((r) => r.id === open.requestId)?.code ?? '—'}</dd></div>
              )}
              {open.note && <div className="span-2"><dt>Note</dt><dd>{open.note}</dd></div>}
            </dl>
            <ItemList items={open.items} />
          </div>
        )}
      </Modal>
    </>
  )
}
