import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../context/store'
import Icon from '../../components/Icon'
import RequestDetails from '../../components/RequestDetails'
import { Card, EmptyState, Modal, PageHeader, StatusBadge, Tabs } from '../../components/ui'
import { formatDate, timeAgo } from '../../utils/format'

export default function MyRequests() {
  const { currentUser, exitRequests, actions } = useStore()
  const [tab, setTab] = useState('all')
  const [openId, setOpenId] = useState(null)

  const mine = exitRequests.filter(
    (r) =>
      r.studentId === currentUser?.id ||
      (currentUser?.studentId && r.studentId && r.studentId.toLowerCase() === currentUser.studentId.toLowerCase()),
  )
  const isStatusMatch = (r, tabValue) => {
    if (tabValue === 'all') return true
    if (tabValue === 'approved') return r.status === 'approved' || r.status === 'approve'
    if (tabValue === 'rejected') return r.status === 'rejected' || r.status === 'reject'
    return r.status === tabValue
  }
  const visible = tab === 'all' ? mine : mine.filter((r) => isStatusMatch(r, tab))
  const open = mine.find((r) => r.id === openId)

  const tabs = [
    { value: 'all', label: 'All', count: mine.length },
    { value: 'pending', label: 'Pending', count: mine.filter((r) => r.status === 'pending').length },
    { value: 'approved', label: 'Approved', count: mine.filter((r) => r.status === 'approved' || r.status === 'approve').length },
    { value: 'completed', label: 'Exited', count: mine.filter((r) => r.status === 'completed').length },
    { value: 'rejected', label: 'Rejected', count: mine.filter((r) => r.status === 'rejected' || r.status === 'reject').length },
  ]

  return (
    <>
      <PageHeader
        title="My Requests"
        subtitle="Track the status of your departure requests."
        actions={
          <Link to="/student/requests/new" className="btn btn-primary">
            <Icon name="plus" size={16} /> New request
          </Link>
        }
      />

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {visible.length === 0 ? (
        <Card>
          <EmptyState icon="send" title="No requests here" text="Requests you submit will appear in this list." />
        </Card>
      ) : (
        <div className="card-grid">
          {visible.map((r) => (
            <button key={r.id} type="button" className={`request-card status-${r.status}`} onClick={() => setOpenId(r.id)}>
              <div className="request-card-top">
                <span className="request-code-sm">{r.code}</span>
                <StatusBadge status={r.status} />
              </div>
              <div className="request-card-dest">
                <Icon name="pin" size={15} /> {r.destination}
              </div>
              <div className="muted small">
                {formatDate(r.departureDate)} → {formatDate(r.returnDate)}
              </div>
              <div className="request-card-foot">
                <span>{r.items.length} item(s)</span>
                <span className="muted">{timeAgo(r.createdAt)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal
        open={!!open}
        title="Request details"
        onClose={() => setOpenId(null)}
        size="lg"
        footer={
          open?.status === 'pending' && (
            <button
              type="button"
              className="btn btn-danger-ghost"
              onClick={() => {
                actions.cancelRequest(open.id)
                setOpenId(null)
              }}
            >
              Cancel request
            </button>
          )
        }
      >
        {open && (
          <>
            {(open.status === 'approved' || open.status === 'approve') && (
              <div className="callout callout-success mb">
                <Icon name="ticket" size={18} />
                <div>
                  Approved. Show code <strong>{open.code}</strong> at the gate with the items listed below.
                </div>
              </div>
            )}
            <RequestDetails request={open} showStudent={false} />
          </>
        )}
      </Modal>
    </>
  )
}
