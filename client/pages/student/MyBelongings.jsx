import { useState } from 'react'
import { useStore } from '../../context/store'
import { ITEM_CATEGORIES } from '../../models'
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

// The Status column reflects the student's leave request, not their account's
// default approval flag. With no request there is nothing for the proctor to
// review, so no "Pending" status should be shown.
function resolveStatus(request) {
  const status = request?.status
  if (!status) return null
  if (status === 'approved' || status === 'approve') return 'approved'
  if (status === 'rejected' || status === 'reject') return 'rejected'
  return status
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
    department: user?.department || '',
    phone: user?.phone ?? '',
    address: user?.address ?? '',
    subcity: user?.subcity ?? '',
    woreda: user?.woreda ?? '',
  }
}

export default function MyBelongings() {
  const { currentUser, users, exitRequests, actions } = useStore()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [studentDetails, setStudentDetails] = useState(() => studentDetailsOf(currentUser))
  const [leaveItems, setLeaveItems] = useState([blankItem()])
  const [reason, setReason] = useState('')
  const [addError, setAddError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [editError, setEditError] = useState('')
  const [isEditSubmitting, setIsEditSubmitting] = useState(false)
  const [deletingStudent, setDeletingStudent] = useState(null)
  const [deletedIds, setDeletedIds] = useState(() => new Set())

  // Item, Quantity and Reason columns come from the student's most recent leave request.
  const latestRequestOf = (student) => {
    if (!student) return null
    return (
      exitRequests
        .filter(
          (r) =>
            (r.studentId === student.id ||
              (student.studentId && r.studentId?.toLowerCase() === student.studentId.toLowerCase()) ||
              (currentUser?.id === student.id && r.studentId === currentUser.id)) &&
            r.status !== 'cancelled',
        )
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))[0] || null
    )
  }

  const allStudents = users.filter((u) => u.role === 'student')

  // When logged in as a student, scope to the current user's belongings only.
  const baseStudents =
    currentUser?.role === 'student'
      ? [
          users.find(
            (u) =>
              u.id === currentUser.id ||
              (u.studentId && currentUser.studentId && u.studentId.toLowerCase() === currentUser.studentId.toLowerCase()),
          ) || currentUser,
        ]
      : allStudents

  // A student record only appears in "My Belongings" if they have actually added items
  const students = baseStudents
    .filter((s) => Boolean(s) && !deletedIds.has(s.id) && !deletedIds.has(s.studentId))
    .filter((s) => {
      const request = latestRequestOf(s)
      return Boolean(request && request.items && request.items.length > 0)
    })

  const visible = students.filter((s) => {
    const request = latestRequestOf(s)
    const status = resolveStatus(request)
    const matchesStatus =
      statusFilter === 'all' ||
      status === statusFilter ||
      ((statusFilter === 'approved' || statusFilter === 'approve') && (status === 'approved' || status === 'approve')) ||
      ((statusFilter === 'rejected' || statusFilter === 'reject') && (status === 'rejected' || status === 'reject'))

    return (
      matchesStatus &&
      matches(
        query,
        s.name, s.studentId, s.department, s.phone, s.address, s.subcity, s.woreda, status,
        request?.reason, ...(request?.items?.map((i) => i.description) ?? []),
      )
    )
  })
  const filtered = query.trim() !== '' || statusFilter !== 'all'

  function clearFilters() {
    setQuery('')
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
  async function handleAddItem(e) {
    e.preventDefault()
    if (!studentDetails.name.trim()) return setAddError('Please enter Student Full Name.')
    if (!studentDetails.studentId.trim()) return setAddError('Please enter Student ID.')
    const items = leaveItems.filter((item) => item.name.trim())
    if (items.length === 0) return setAddError('Please enter at least one item, e.g. Clothes.')
    if (items.some((item) => !(Number(item.quantity) >= 1))) return setAddError('Quantity must be at least 1.')
    if (!reason.trim()) return setAddError('Please enter the reason for leaving.')

    setIsSubmitting(true)
    setAddError('')

    try {
      const details = Object.fromEntries(STUDENT_FIELDS.map((f) => [f, studentDetails[f].trim()]))

      let matchedUser = null
      if (currentUser?.role === 'student') {
        matchedUser = currentUser
      } else {
        matchedUser =
          users.find(
            (s) =>
              (s.studentId && s.studentId.trim().toLowerCase() === details.studentId.toLowerCase()) ||
              s.id === currentUser?.id,
          ) || null
      }

      let targetStudentId = matchedUser?.id

      if (matchedUser) {
        const updateResult = await actions.saveUser(
          {
            ...matchedUser,
            role: matchedUser.role || 'student',
            approvalStatus: 'pending',
            username:
              matchedUser.username ||
              details.studentId.toLowerCase().replace(/[^a-z0-9]/g, '') ||
              details.name.toLowerCase().replace(/\s+/g, '.'),
            ...details,
          },
          { silent: true },
        )
        if (!updateResult.ok) {
          setAddError(updateResult.error)
          return
        }
        targetStudentId = updateResult.user?.id || matchedUser.id
      } else {
        const baseUsername =
          details.studentId.toLowerCase().replace(/[^a-z0-9]/g, '') ||
          details.name.toLowerCase().replace(/\s+/g, '.') ||
          uid('student')
        let username = baseUsername
        let count = 1
        while (users.some((u) => u.username && u.username.toLowerCase() === username.toLowerCase())) {
          username = `${baseUsername}${count++}`
        }

        const saveResult = await actions.saveUser(
          {
            role: 'student',
            username,
            password: 'password123',
            ...details,
            status: 'active',
            approvalStatus: 'pending',
            email: `${username}@student.kotebe.edu.et`,
            registeredAt: new Date().toISOString(),
          },
          { silent: true },
        )
        if (!saveResult.ok) {
          setAddError(saveResult.error)
          return
        }
        targetStudentId = saveResult.user.id
      }

      const destination =
        [details.address, details.subcity, details.woreda ? `Woreda ${details.woreda}` : '']
          .filter(Boolean)
          .join(', ')
          .trim() ||
        details.address ||
        details.subcity ||
        reason.trim() ||
        'Home'

      const today = todayISODate()
      await actions.createExitRequest({
        studentId: targetStudentId,
        student: {
          name: details.name,
          studentId: details.studentId,
          department: details.department,
          phone: details.phone,
          address: details.address,
          subcity: details.subcity,
          woreda: details.woreda,
        },
        reason: reason.trim(),
        destination,
        departureDate: today,
        returnDate: today,
        items: items.map((item) => {
          const name = item.name.trim()
          return {
            category: ITEM_CATEGORIES.find((c) => c.toLowerCase() === name.toLowerCase()) ?? 'Other',
            description: name,
            quantity: Number(item.quantity) || 1,
          }
        }),
      })

      setDeletedIds((prev) => {
        const next = new Set(prev)
        if (targetStudentId) next.delete(targetStudentId)
        if (details.studentId) next.delete(details.studentId)
        return next
      })
      setAddError('')
      setAddOpen(false)
      setReason('')
      setLeaveItems([blankItem()])
    } catch (err) {
      setAddError(err?.message || 'Failed to submit request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function openEditModal(student, request) {
    setEditingStudent({
      ...student,
      requestId: request?.id || null,
      reason: request?.reason || '',
      items: request?.items?.length
        ? request.items.map((i) => ({
            key: uid('item'),
            name: i.description || '',
            quantity: Number(i.quantity) || 1,
          }))
        : [blankItem()],
      approvalStatus: student.approvalStatus || request?.status || 'pending',
    })
    setEditError('')
    setIsEditSubmitting(false)
  }

  function updateEditingItem(key, field, value) {
    setEditingStudent((prev) => {
      if (!prev) return null
      return {
        ...prev,
        items: prev.items.map((it) => (it.key === key ? { ...it, [field]: value } : it)),
      }
    })
  }

  function addEditingItem() {
    setEditingStudent((prev) => {
      if (!prev) return null
      return {
        ...prev,
        items: [...prev.items, blankItem()],
      }
    })
  }

  function removeEditingItem(key) {
    setEditingStudent((prev) => {
      if (!prev || prev.items.length <= 1) return prev
      return {
        ...prev,
        items: prev.items.filter((it) => it.key !== key),
      }
    })
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    if (!editingStudent) return

    if (!editingStudent.name?.trim()) return setEditError('Please enter Student Full Name.')
    if (!editingStudent.studentId?.trim()) return setEditError('Please enter Student ID.')

    const validItems = (editingStudent.items || []).filter((item) => item.name && item.name.trim())
    if (validItems.length === 0) return setEditError('Please enter at least one item.')
    if (validItems.some((item) => !(Number(item.quantity) >= 1))) return setEditError('Quantity must be at least 1.')
    if (!editingStudent.reason?.trim()) return setEditError('Please enter the reason for leaving.')

    setIsEditSubmitting(true)
    setEditError('')

    try {
      // 1. Update user demographic data in database
      if (actions.saveUser) {
        await actions.saveUser(
          {
            ...editingStudent,
            name: editingStudent.name.trim(),
            studentId: editingStudent.studentId.trim(),
            department: editingStudent.department?.trim() || '',
            phone: editingStudent.phone?.trim() || '',
            address: editingStudent.address?.trim() || '',
            subcity: editingStudent.subcity?.trim() || '',
            woreda: editingStudent.woreda?.trim() || '',
            approvalStatus: editingStudent.approvalStatus,
          },
          { silent: true },
        )
      }

      // 2. Update exit request and belonging items in database
      if (editingStudent.requestId && actions.updateRequest) {
        const destination =
          [editingStudent.address, editingStudent.subcity, editingStudent.woreda ? `Woreda ${editingStudent.woreda}` : '']
            .filter(Boolean)
            .join(', ')
            .trim() || 'Home'

        await actions.updateRequest(editingStudent.requestId, {
          reason: editingStudent.reason.trim(),
          destination,
          items: validItems.map((item) => ({
            category: ITEM_CATEGORIES.find((c) => c.toLowerCase() === item.name.trim().toLowerCase()) ?? 'Other',
            description: item.name.trim(),
            quantity: Number(item.quantity) || 1,
          })),
          student: {
            name: editingStudent.name.trim(),
            studentId: editingStudent.studentId.trim(),
            department: editingStudent.department?.trim() || '',
            phone: editingStudent.phone?.trim() || '',
            address: editingStudent.address?.trim() || '',
            subcity: editingStudent.subcity?.trim() || '',
            woreda: editingStudent.woreda?.trim() || '',
          },
        })
      }

      setEditingStudent(null)
    } catch (err) {
      setEditError(err?.message || 'Failed to save changes.')
    } finally {
      setIsEditSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deletingStudent) return
    const idToDelete = deletingStudent.id
    const studentIdCode = deletingStudent.studentId

    // Find and delete all belongings/exit requests for this student from the backend
    const studentRequests = exitRequests.filter(
      (r) =>
        r.studentId === idToDelete ||
        (studentIdCode && r.studentId?.toLowerCase() === studentIdCode.toLowerCase()) ||
        (currentUser?.id === idToDelete && r.studentId === currentUser.id),
    )

    if (actions.deleteRequest) {
      for (const r of studentRequests) {
        await actions.deleteRequest(r.id)
      }
    }

    setDeletedIds((prev) => {
      const next = new Set(prev)
      if (idToDelete) next.add(idToDelete)
      if (studentIdCode) next.add(studentIdCode)
      return next
    })

    if (currentUser?.role !== 'student' && actions.deleteUser) {
      actions.deleteUser({ id: idToDelete, studentId: studentIdCode })
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
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
            <option value="all">All statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          {filtered && (
            <button type="button" className="btn btn-ghost" onClick={clearFilters}>
              <Icon name="x" size={14} /> Clear
            </button>
          )}
        </div>
      </div>
      <p className="muted small results-count">
        Showing {visible.length} {visible.length === 1 ? 'record' : 'records'}
      </p>

      <Card flush>
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
              {visible.length === 0 ? (
                <tr>
                  <td colSpan="14" style={{ padding: '36px 16px', textAlign: 'center' }}>
                    <EmptyState
                      icon="box"
                      title="No records found"
                      text={filtered ? 'No records match your search or filters.' : 'No belongings records yet.'}
                      action={filtered && <button type="button" className="btn btn-ghost" onClick={clearFilters}>Clear filters</button>}
                    />
                  </td>
                </tr>
              ) : (
                visible.map((s, index) => {
                  const request = latestRequestOf(s)
                  const status = resolveStatus(request)
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
                        {request?.items?.length ? (
                          <ul className="cell-lines">
                            {request.items.map((item, idx) => (
                              <li key={item.id || `${item.description}-${idx}`}>{item.description}</li>
                            ))}
                          </ul>
                        ) : '—'}
                      </td>
                      <td>
                        {request?.items?.length ? (
                          <ul className="cell-lines">
                            {request.items.map((item, idx) => (
                              <li key={item.id || `${item.quantity}-${idx}`}>{item.quantity}</li>
                            ))}
                          </ul>
                        ) : '—'}
                      </td>
                      <td className="cell-reason">{request?.reason || '—'}</td>
                      <td>
                        {status ? (
                          <StatusBadge status={status} />
                        ) : (
                          <span className="muted">No request</span>
                        )}
                      </td>
                      <td className="nowrap">{formatDateTime(request?.createdAt || s.registeredAt || s.createdAt)}</td>
                      <td className="right nowrap">
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => openEditModal(s, request)}
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
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Item Modal */}
      <Modal
        open={addOpen}
        title="Add Item"
        onClose={() => setAddOpen(false)}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setAddOpen(false)} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" form="add-item-form" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
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
              <input
                value={studentDetails.department}
                onChange={setDetail('department')}
                placeholder="e.g. Computer Science"
              />
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

      {/* Edit Student / Belongings Modal */}
      <Modal
        open={!!editingStudent}
        title="Edit Belongings Record"
        onClose={() => setEditingStudent(null)}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setEditingStudent(null)} disabled={isEditSubmitting}>
              Cancel
            </button>
            <button type="submit" form="edit-student-form" className="btn btn-primary" disabled={isEditSubmitting}>
              {isEditSubmitting ? 'Saving...' : 'Save changes'}
            </button>
          </>
        }
      >
        {editingStudent && (
          <form id="edit-student-form" className="form-grid" onSubmit={handleSaveEdit}>
            {editError && <Callout tone="danger">{editError}</Callout>}

            <div className="section-title">Student Details</div>

            <Field label="Student Full Name *">
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
              <input
                value={editingStudent.department || ''}
                onChange={(e) => setEditingStudent({ ...editingStudent, department: e.target.value })}
                placeholder="e.g. Computer Science"
              />
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

            <div className="section-title">Belongings &amp; Items</div>

            <div className="field-full">
              <div className="items-header">
                <span className="field-label">Items leaving campus *</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={addEditingItem}>
                  <Icon name="plus" size={14} /> Add item
                </button>
              </div>

              {(editingStudent.items || []).map((item, idx) => (
                <div key={item.key || idx} className="item-row">
                  <div className="item-row-name">
                    <input
                      value={item.name}
                      onChange={(e) => updateEditingItem(item.key, 'name', e.target.value)}
                      placeholder="e.g. Clothes, Laptop, Books"
                      required
                    />
                  </div>
                  <div className="item-row-qty">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateEditingItem(item.key, 'quantity', e.target.value)}
                      aria-label="Quantity"
                      required
                    />
                  </div>
                  {editingStudent.items.length > 1 && (
                    <button
                      type="button"
                      className="icon-btn danger"
                      onClick={() => removeEditingItem(item.key)}
                      aria-label="Remove item"
                      title="Remove"
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <Field label="Reason for leaving *" full>
              <textarea
                rows={3}
                value={editingStudent.reason || ''}
                onChange={(e) => setEditingStudent({ ...editingStudent, reason: e.target.value })}
                placeholder="e.g. To visit my family"
                required
              />
            </Field>

            {currentUser?.role !== 'student' && (
              <Field label="Status">
                <select
                  value={editingStudent.approvalStatus || 'pending'}
                  onChange={(e) => setEditingStudent({ ...editingStudent, approvalStatus: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="approve">Approve</option>
                  <option value="reject">Reject</option>
                </select>
              </Field>
            )}
          </form>
        )}
      </Modal>

      {/* Delete Student Modal */}
      <Modal
        open={!!deletingStudent}
        title={currentUser?.role === 'student' ? 'Remove Belongings Record?' : 'Remove Student Record?'}
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
            {currentUser?.role === 'student' ? (
              <>Are you sure you want to remove your belongings record? This action cannot be undone.</>
            ) : (
              <>
                Are you sure you want to delete the record for <strong>{deletingStudent.name}</strong> (
                <code>{deletingStudent.studentId}</code>)? This action cannot be undone.
              </>
            )}
          </p>
        )}
      </Modal>
    </>
  )
}
