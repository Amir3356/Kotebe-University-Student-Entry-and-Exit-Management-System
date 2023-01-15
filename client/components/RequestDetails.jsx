import { useStore } from '../context/store'
import Icon from './Icon'
import ItemList from './ItemList'
import { Avatar, StatusBadge } from './ui'
import { formatDate, formatDateTime } from '../utils/format'

export function StudentSummary({ student }) {
  if (!student) return null
  return (
    <div className="student-summary">
      <Avatar name={student.name} size="lg" />
      <div>
        <div className="student-name">{student.name}</div>
        <div className="muted">
          <code>{student.studentId}</code> · {student.department} · Year {student.year}
        </div>
        <div className="muted small">{student.dorm} · {student.phone}</div>
      </div>
    </div>
  )
}

// Full read-only view of an exit request, shared by every role.
export default function RequestDetails({ request, showStudent = true }) {
  const { users } = useStore()
  const student = users.find((u) => u.id === request.studentId)
  const reviewer = users.find((u) => u.id === request.reviewedBy)
  const verifier = users.find((u) => u.id === request.verifiedBy)

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
          <dt><Icon name="pin" size={14} /> Destination</dt>
          <dd>{request.destination}</dd>
        </div>
        <div>
          <dt><Icon name="calendar" size={14} /> Departure → Return</dt>
          <dd>{formatDate(request.departureDate)} → {formatDate(request.returnDate)}</dd>
        </div>
        <div className="span-2">
          <dt><Icon name="info" size={14} /> Reason</dt>
          <dd>{request.reason}</dd>
        </div>
        <div>
          <dt><Icon name="clock" size={14} /> Submitted</dt>
          <dd>{formatDateTime(request.createdAt)}</dd>
        </div>
        {reviewer && (
          <div>
            <dt><Icon name="clipboard" size={14} /> Reviewed by</dt>
            <dd>{reviewer.name}, {formatDateTime(request.reviewedAt)}</dd>
          </div>
        )}
        {verifier && (
          <div>
            <dt><Icon name="exit" size={14} /> Exit verified by</dt>
            <dd>{verifier.name}, {formatDateTime(request.exitedAt)}</dd>
          </div>
        )}
      </dl>

      {request.reviewNote && (
        <div className={`note note-${request.status === 'rejected' ? 'danger' : 'neutral'}`}>
          <strong>Proctor note:</strong> {request.reviewNote}
        </div>
      )}

      <div>
        <h3 className="section-title">Items to take out ({request.items.length})</h3>
        <ItemList items={request.items} showSource />
      </div>
    </div>
  )
}
