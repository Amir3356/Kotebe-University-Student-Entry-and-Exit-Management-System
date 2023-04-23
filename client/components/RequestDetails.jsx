import { useStore } from '../context/store'
import { resolveStudent } from '../models/userModel'
import Icon from './Icon'
import ItemList from './ItemList'
import { Avatar, StatusBadge } from './ui'
import { formatDate, formatDateTime } from '../utils/format'

export function StudentSummary({ student }) {
  if (!student) return null
  return (
    <div className="student-summary">
      <Avatar name={student.name || 'Unknown'} size="lg" />
      <div>
        <div className="student-name">{student.name || 'Unknown'}</div>
        <div className="muted">
          <code>{student.studentId || '—'}</code> · {student.department || '—'}{student.year ? ` · Year ${student.year}` : ''}
        </div>
      </div>
    </div>
  )
}

// Full read-only view of an exit request, shared by every role.
export default function RequestDetails({ request, showStudent = true }) {
  const { users } = useStore()
  const student = resolveStudent(request, users)

  const reviewer = users.find(
    (u) =>
      u.id === request.reviewedBy ||
      (u.username && request.reviewedBy && u.username.toLowerCase() === request.reviewedBy.toLowerCase()),
  )
  const verifier = users.find(
    (u) =>
      u.id === request.verifiedBy ||
      (u.username && request.verifiedBy && u.username.toLowerCase() === request.verifiedBy.toLowerCase()),
  )

  const isApproved = request.status === 'approved' || request.status === 'approve' || request.status === 'completed'
  const isPending = request.status === 'pending'
  const isRejected = request.status === 'rejected' || request.status === 'reject' || request.status === 'denied'

  return (
    <div className="stack">
      <div className="request-head">
        <div>
          <div className="eyebrow">Exit request</div>
          <div className="request-code">{request.code}</div>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {showStudent && <StudentSummary student={student} />}

      <dl className="details-grid">
        <div>
          <dt><Icon name="phone" size={14} /> Phone Number</dt>
          <dd>{student?.phone || '—'}</dd>
        </div>
        <div>
          <dt><Icon name="clock" size={14} /> Date &amp; Time Registered</dt>
          <dd>{formatDateTime(request.createdAt || student?.createdAt)}</dd>
        </div>
        <div>
          <dt><Icon name="pin" size={14} /> Address</dt>
          <dd>{student?.address || '—'}</dd>
        </div>
        <div>
          <dt><Icon name="building" size={14} /> Subcity</dt>
          <dd>{student?.subcity || '—'}</dd>
        </div>
        <div>
          <dt><Icon name="map" size={14} /> Woreda</dt>
          <dd>{student?.woreda || '—'}</dd>
        </div>
        <div>
          <dt><Icon name="pin" size={14} /> Destination</dt>
          <dd>{request.destination || 'Home'}</dd>
        </div>
        <div className="span-2">
          <dt><Icon name="info" size={14} /> Reason for Leaving</dt>
          <dd>{request.reason || '—'}</dd>
        </div>
        <div>
          <dt><Icon name="calendar" size={14} /> Departure → Return</dt>
          <dd>{formatDate(request.departureDate)} → {formatDate(request.returnDate)}</dd>
        </div>
        <div>
          <dt><Icon name="clipboard" size={14} /> Proctor Review</dt>
          <dd>
            {isPending ? (
              <span className="muted">Awaiting Proctor Review</span>
            ) : (
              <span>
                <strong>{reviewer?.name || request.reviewedBy || 'Proctor Office'}</strong>
                {request.reviewedAt ? ` (${formatDateTime(request.reviewedAt)})` : ''}
              </span>
            )}
          </dd>
        </div>
        {(verifier || request.verifiedBy || request.status === 'completed') && (
          <div>
            <dt><Icon name="exit" size={14} /> Exit verified by</dt>
            <dd>
              {verifier?.name || request.verifiedBy || 'Gate Guard'}
              {request.exitedAt ? `, ${formatDateTime(request.exitedAt)}` : ''}
            </dd>
          </div>
        )}
      </dl>

      {request.reviewNote && (
        <div className={`note note-${isRejected ? 'danger' : 'neutral'}`}>
          <strong>Proctor note:</strong> {request.reviewNote}
        </div>
      )}

      <div>
        <h3 className="section-title">Items to take out ({request.items?.length || 0})</h3>
        {(!request.items || request.items.length === 0) ? (
          <p className="muted">No items declared.</p>
        ) : (
          <div className="table-wrap detail-items">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Serial Number</th>
                  <th className="right">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {request.items.map((item, idx) => (
                  <tr key={item.id ?? idx}>
                    <td>
                      <strong>{item.description || item.name || 'Item'}</strong>
                    </td>
                    <td>{item.category || '—'}</td>
                    <td>
                      {item.serialNumber ? <code>{item.serialNumber}</code> : '—'}
                    </td>
                    <td className="right">
                      <span className="qty-badge">{item.quantity || 1}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
