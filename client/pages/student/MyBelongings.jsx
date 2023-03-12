import { useState } from 'react'
import { useStore } from '../../context/store'
import { DEPARTMENTS, ITEM_CATEGORIES } from '../../data'
import Icon from '../../components/Icon'
import {
  Avatar,
  Callout,
  Card,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  SearchInput,
  StatusBadge,
} from '../../components/ui'
import { formatDateTime, matches, todayISODate, uid } from '../../utils/format'

const STUDENT_STATUS_MAP = {
  'u-stu-1': 'approve',
  'u-stu-2': 'pending',
  'u-stu-3': 'approve',
  'u-stu-4': 'reject',
  'u-stu-5': 'pending',
  'u-stu-6': 'reject',
  'u-stu-7': 'approve',
  'u-stu-8': 'reject',
}

function resolveStatus(s, index) {
  if (s.approvalStatus === 'approve' || s.approvalStatus === 'reject' || s.approvalStatus === 'pending') {
    return s.approvalStatus
  }
  if (s.approvalStatus === 'approved') return 'approve'
  if (s.approvalStatus === 'rejected') return 'reject'
  if (STUDENT_STATUS_MAP[s.id]) return STUDENT_STATUS_MAP[s.id]
  const pattern = ['approve', 'pending', 'reject']
  return pattern[index % pattern.length]
}

// Suggestions for the item name field; the student can still type anything.
const ITEM_SUGGESTIONS = ['Clothes', 'T-shirt', 'Shirt', 'Trousers', 'Jacket', 'Dress', 'Shoes', 'Bag', 'Blanket', 'Books']

const blankItem = () => ({ key: uid('item'), name: '', quantity: 1 })

const STUDENT_FIELDS = ['name', 'studentId', 'department', 'phone', 'address', 'subcity', 'woreda']

// Pre-fill the student section with the signed-in student's details.
function studentDetailsOf(user) {
  return {
    name: user?.name ?? '',
    studentId: user?.studentId ?? '',
    department: user?.department || DEPARTMENTS[0] || 'Computer Science',
    phone: user?.phone ?? '',
    address: user?.address ?? '',
    subcity: user?.subcity ?? '',
    woreda: user?.woreda ?? '',
  }
}

export default function MyBelongings() {
  const { currentUser, users, exitRequests, actions } = useStore()
  const [query, setQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [studentDetails, setStudentDetails] = useState(() => studentDetailsOf(currentUser))
  const [leaveItems, setLeaveItems] = useState([blankItem()])
  const [reason, setReason] = useState('')
  const [addError, setAddError] = useState('')
  const [editingStudent, setEditingStudent] = useState(null)
  const [deletingStudent, setDeletingStudent] = useState(null)

  const students = users.filter((u) => u.role === 'student')
  // Item, Quantity and Reason columns come from the student's most recent leave request.
  const latestRequestOf = (studentId) =>
    exitRequests
      .filter((r) => r.studentId === studentId && r.status !== 'cancelled')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

  // Offer every known department plus any department already present in the data.
  const departments = [...new Set([...DEPARTMENTS, ...students.map((s) => s.department).filter(Boolean)])].sort()

  const visible = students.filter((s, index) => {
    const status = resolveStatus(s, index)
    const request = latestRequestOf(s.id)
    return (
      (departmentFilter === 'all' || s.department === departmentFilter) &&
      (statusFilter === 'all' || status === statusFilter) &&
      matches(
        query,
        s.name, s.studentId, s.department, s.phone, s.address, s.subcity, s.woreda, status,
        request?.reason, ...(request?.items.map((i) => i.description) ?? []),
      )
    )
  })
  const filtered = query.trim() !== '' || departmentFilter !== 'all' || statusFilter !== 'all'

  function clearFilters() {
    setQuery('')
    setDepartmentFilter('all')
    setStatusFilter('all')
  }

  function openAddModal() {
    setStudentDetails(studentDetailsOf(currentUser))
    setLeaveItems([blankItem()])
    setReason('')
    setAddError('')
    setAddOpen(true)
  }

  function updateLeaveItem(key, field, value) {
    setLeaveItems((list) => list.map((item) => (item.key === key ? { ...item, [field]: value } : item)))
  }

  const setDetail = (field) => (e) => setStudentDetails({ ...studentDetails, [field]: e.target.value })

  // Saves the student's details, then sends the items and reason to the
  // proctor as a leave (exit) request for that student.
  function handleAddItem(e) {
    e.preventDefault()
    if (!studentDetails.name.trim()) return setAddError('Please enter Student Full Name.')
    if (!studentDetails.studentId.trim()) return setAddError('Please enter Student ID.')
    const items = leaveItems.filter((item) => item.name.trim())
    if (items.length === 0) return setAddError('Please enter at least one item, e.g. Clothes.')
    if (items.some((item) => !(Number(item.quantity) >= 1))) return setAddError('Quantity must be at least 1.')
    if (!reason.trim()) return setAddError('Please enter the reason for leaving.')

    const details = Object.fromEntries(STUDENT_FIELDS.map((f) => [f, studentDetails[f].trim()]))
    const existing = students.find((s) => s.studentId?.toLowerCase() === details.studentId.toLowerCase())
    let saved
    if (existing) {
      saved = actions.saveUser({ ...existing, ...details }, { silent: true })
    } else {
      const username =
        details.studentId.toLowerCase().replace(/[^a-z0-9]/g, '') || details.name.toLowerCase().replace(/\s+/g, '.')
      saved = actions.saveUser(
        { role: 'student', username, ...details, status: 'active', email: `${username}@student.kotebe.edu.et` },
        { silent: true },
      )
    }
    if (!saved.ok) return setAddError(saved.error)

    const today = todayISODate()
    actions.createExitRequest({
      studentId: saved.user.id,
      reason,
      destination: '',
      departureDate: today,
      returnDate: today,
      items: items.map((item) => {
        const name = item.name.trim()
        return {
          category: ITEM_CATEGORIES.find((c) => c.toLowerCase() === name.toLowerCase()) ?? 'Other',
          description: name,
          quantity: Number(item.quantity),
        }
      }),
    })
    setAddOpen(false)
  }

  function handleSaveEdit(e) {
    e.preventDefault()
    if (!editingStudent) return
    if (actions.saveUser) {
      actions.saveUser({
        ...editingStudent,
        name: editingStudent.name.trim(),
        approvalStatus: editingStudent.approvalStatus,
      })
    }
    setEditingStudent(null)
  }

  function handleDelete() {
    if (!deletingStudent) return
    if (actions.deleteUser) {
      actions.deleteUser(deletingStudent.id)
    }
    setDeletingStudent(null)
  }

  return (
    <>
      <PageHeader
        title="My Belongings"
        subtitle="Student records and demographic information."
        center
        actions={
          <button type="button" className="btn btn-primary" onClick={openAddModal}>
            <Icon name="plus" size={16} /> Add item
          </button>
        }
      />

      <div className="toolbar filter-toolbar">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search by student name, ID, item, reason…"
        />
        <div className="toolbar-right">
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} aria-label="Filter by department">
            <option value="all">All departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
            <option value="all">All statuses</option>
            <option value="approve">Approve</option>
            <option value="pending">Pending</option>
            <option value="reject">Reject</option>
          </select>
          {filtered && (
            <button type="button" className="btn btn-ghost" onClick={clearFilters}>
              <Icon name="x" size={14} /> Clear
            </button>
          )}
        </div>
      </div>
      <p className="muted small results-count">
        Showing {visible.length} of {students.length} students
      </p>

      <Card flush>
        {visible.length === 0 ? (
          <EmptyState
            icon="box"
            title="No records found"
            text={filtered ? 'No students match your search or filters.' : 'No student records yet.'}
            action={filtered && <button type="button" className="btn btn-ghost" onClick={clearFilters}>Clear filters</button>}
          />
        ) : (
          <div className="table-wrap">
            <table className="belongings-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Student Name</th>
                  <th>Student ID</th>
                  <th>Department</th>
                  <th>Phone Number</th>
                  <th>Address</th>
                  <th>Subcity</th>
                  <th>Woreda</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Reason for Leaving</th>
                  <th>Status</th>
                  <th>Date & Time Registered</th>
                  <th className="right">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((s, index) => {
                  const status = resolveStatus(s, index)
                  const request = latestRequestOf(s.id)
                  return (
                    <tr key={s.id}>
                      <td className="cell-num">{index + 1}</td>
                      <td>
                        <div className="cell-item">
                          <Avatar name={s.name} size="sm" />
                          <span className="row-title">{s.name}</span>
                          {s.id === currentUser?.id && (
                            <span className="badge badge-primary small">You</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <code>{s.studentId || '—'}</code>
                      </td>
                      <td>{s.department || '—'}</td>
                      <td className="nowrap">{s.phone || '—'}</td>
                      <td>{s.address || '—'}</td>
                      <td>{s.subcity || '—'}</td>
                      <td>{s.woreda || '—'}</td>
                      <td>
                        {request?.items.length ? (
                          <ul className="cell-lines">
                            {request.items.map((item) => <li key={item.id}>{item.description}</li>)}
                          </ul>
                        ) : '—'}
                      </td>
                      <td>
                        {request?.items.length ? (
                          <ul className="cell-lines">
                            {request.items.map((item) => <li key={item.id}>{item.quantity}</li>)}
                          </ul>
                        ) : '—'}
                      </td>
                      <td className="cell-reason">{request?.reason || '—'}</td>
                      <td>
                        <StatusBadge status={status} />
                      </td>
                      <td className="nowrap">{formatDateTime(s.registeredAt || s.createdAt)}</td>
                      <td className="right nowrap">
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => setEditingStudent({ ...s, approvalStatus: status })}
                          aria-label={`Edit ${s.name}`}
                          title="Edit"
                        >
                          <Icon name="edit" size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn danger"
                          onClick={() => setDeletingStudent(s)}
                          aria-label={`Delete ${s.name}`}
                          title="Delete"
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Item Modal */}
      <Modal
        open={addOpen}
        title="Add Item"
        onClose={() => setAddOpen(false)}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="add-item-form" className="btn btn-primary">
              Submit
            </button>
          </>
        }
      >
        <form id="add-item-form" className="stack" onSubmit={handleAddItem} noValidate>
          {addError && <Callout tone="danger">{addError}</Callout>}

          <h3 className="section-title">Student details</h3>
          <div className="form-grid">
            <Field label="Student Full Name *">
              <input value={studentDetails.name} onChange={setDetail('name')} placeholder="e.g. Abebe Kebede" />
            </Field>
            <Field label="Student ID *">
              <input value={studentDetails.studentId} onChange={setDetail('studentId')} placeholder="e.g. KU/0458/15" />
            </Field>
            <Field label="Department">
              <select value={studentDetails.department} onChange={setDetail('department')}>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Phone Number">
              <input value={studentDetails.phone} onChange={setDetail('phone')} placeholder="e.g. +251 920 118 447" />
            </Field>
            <Field label="Address">
              <input value={studentDetails.address} onChange={setDetail('address')} placeholder="e.g. Kotebe, Addis Ababa" />
            </Field>
            <Field label="Subcity">
              <input value={studentDetails.subcity} onChange={setDetail('subcity')} placeholder="e.g. Yeka" />
            </Field>
            <Field label="Woreda">
              <input value={studentDetails.woreda} onChange={setDetail('woreda')} placeholder="e.g. 08" />
            </Field>
          </div>

          <h3 className="section-title">Items to take out</h3>
          <div className="leave-items">
            <div className="leave-item-row leave-item-head">
              <span className="field-label">Item *</span>
              <span className="field-label">Quantity *</span>
              <span />
            </div>
            {leaveItems.map((item) => (
              <div key={item.key} className="leave-item-row">
                <input
                  value={item.name}
                  onChange={(e) => updateLeaveItem(item.key, 'name', e.target.value)}
                  placeholder="e.g. Clothes, T-shirt"
                  list="item-suggestions"
                  aria-label="Item"
                />
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateLeaveItem(item.key, 'quantity', e.target.value)}
                  aria-label="Quantity"
                />
                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={() => setLeaveItems((list) => list.filter((x) => x.key !== item.key))}
                  disabled={leaveItems.length === 1}
                  aria-label="Remove item"
                  title="Remove item"
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            ))}
            <datalist id="item-suggestions">
              {ITEM_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
            </datalist>
            <button type="button" className="btn btn-ghost btn-sm add-row-btn" onClick={() => setLeaveItems((list) => [...list, blankItem()])}>
              <Icon name="plus" size={14} /> Add another item
            </button>
          </div>

          <Field label="Reason for leaving *" full>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. To visit my family"
            />
          </Field>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        open={!!editingStudent}
        title="Edit Student Record"
        onClose={() => setEditingStudent(null)}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setEditingStudent(null)}>
              Cancel
            </button>
            <button type="submit" form="edit-student-form" className="btn btn-primary">
              Save changes
            </button>
          </>
        }
      >
        {editingStudent && (
          <form id="edit-student-form" className="form-grid" onSubmit={handleSaveEdit}>
            <Field label="Student Name *">
              <input
                value={editingStudent.name}
                onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                required
              />
            </Field>

            <Field label="Student ID *">
              <input
                value={editingStudent.studentId || ''}
                onChange={(e) => setEditingStudent({ ...editingStudent, studentId: e.target.value })}
                required
              />
            </Field>

            <Field label="Department">
              <select
                value={editingStudent.department || ''}
                onChange={(e) => setEditingStudent({ ...editingStudent, department: e.target.value })}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Phone Number">
              <input
                value={editingStudent.phone || ''}
                onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
              />
            </Field>

            <Field label="Address">
              <input
                value={editingStudent.address || ''}
                onChange={(e) => setEditingStudent({ ...editingStudent, address: e.target.value })}
              />
            </Field>

            <Field label="Subcity">
              <input
                value={editingStudent.subcity || ''}
                onChange={(e) => setEditingStudent({ ...editingStudent, subcity: e.target.value })}
              />
            </Field>

            <Field label="Woreda">
              <input
                value={editingStudent.woreda || ''}
                onChange={(e) => setEditingStudent({ ...editingStudent, woreda: e.target.value })}
              />
            </Field>

            <Field label="Status">
              <select
                value={editingStudent.approvalStatus || 'approve'}
                onChange={(e) => setEditingStudent({ ...editingStudent, approvalStatus: e.target.value })}
              >
                <option value="approve">Approve</option>
                <option value="pending">Pending</option>
                <option value="reject">Reject</option>
              </select>
            </Field>
          </form>
        )}
      </Modal>

      {/* Delete Student Modal */}
      <Modal
        open={!!deletingStudent}
        title="Remove Student Record?"
        onClose={() => setDeletingStudent(null)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setDeletingStudent(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={handleDelete}>
              Delete
            </button>
          </>
        }
      >
        {deletingStudent && (
          <p>
            Are you sure you want to delete the record for <strong>{deletingStudent.name}</strong> (
            <code>{deletingStudent.studentId}</code>)? This action cannot be undone.
          </p>
        )}
      </Modal>
    </>
  )
}
