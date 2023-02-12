import { useState } from 'react'
import { useStore } from '../../context/store'
import { DEPARTMENTS } from '../../data'
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
import { formatDateTime, matches } from '../../utils/format'

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

const blankStudent = {
  name: '',
  studentId: '',
  department: DEPARTMENTS[0] || 'Computer Science',
  phone: '',
  address: '',
  subcity: '',
  woreda: '',
  approvalStatus: 'pending',
}

export default function MyBelongings() {
  const { currentUser, users, actions } = useStore()
  const [query, setQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [newStudent, setNewStudent] = useState(blankStudent)
  const [addError, setAddError] = useState('')
  const [editingStudent, setEditingStudent] = useState(null)
  const [deletingStudent, setDeletingStudent] = useState(null)

  const students = users.filter((u) => u.role === 'student')
  const visible = students.filter((s, index) => {
    const status = resolveStatus(s, index)
    return matches(query, s.name, s.studentId, s.department, s.phone, s.address, s.subcity, s.woreda, status)
  })

  function openAddModal() {
    setNewStudent(blankStudent)
    setAddError('')
    setAddOpen(true)
  }

  function handleAddStudent(e) {
    e.preventDefault()
    if (!newStudent.name.trim()) return setAddError('Please enter Student Name.')
    if (!newStudent.studentId.trim()) return setAddError('Please enter Student ID.')
    const username =
      newStudent.studentId.trim().toLowerCase().replace(/[^a-z0-9]/g, '') ||
      newStudent.name.trim().toLowerCase().replace(/\s+/g, '.')
    const res = actions.saveUser({
      role: 'student',
      username,
      name: newStudent.name.trim(),
      studentId: newStudent.studentId.trim(),
      department: newStudent.department,
      phone: newStudent.phone.trim(),
      address: newStudent.address.trim(),
      subcity: newStudent.subcity.trim(),
      woreda: newStudent.woreda.trim(),
      approvalStatus: newStudent.approvalStatus,
      status: 'active',
      email: `${username}@student.kotebe.edu.et`,
    })
    if (res?.ok === false) {
      setAddError(res.error)
      return
    }
    setAddOpen(false)
    setNewStudent(blankStudent)
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

      <div className="toolbar">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search by student name, ID, department, address, subcity, status…"
        />
      </div>

      <Card flush>
        {visible.length === 0 ? (
          <EmptyState
            icon="box"
            title="No records found"
            text="No students match your search."
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
                  <th>Status</th>
                  <th>Date & Time Registered</th>
                  <th className="right">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((s, index) => {
                  const status = resolveStatus(s, index)
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
        title="Add Item / Student Record"
        onClose={() => setAddOpen(false)}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="add-student-form" className="btn btn-primary">
              Add item
            </button>
          </>
        }
      >
        <form id="add-student-form" className="form-grid" onSubmit={handleAddStudent}>
          {addError && (
            <div className="field-full">
              <Callout tone="danger">{addError}</Callout>
            </div>
          )}

          <Field label="Student Name *">
            <input
              value={newStudent.name}
              onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
              placeholder="e.g. Abebe Kebede"
              required
            />
          </Field>

          <Field label="Student ID *">
            <input
              value={newStudent.studentId}
              onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
              placeholder="e.g. KU/0458/15"
              required
            />
          </Field>

          <Field label="Department">
            <select
              value={newStudent.department}
              onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
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
              value={newStudent.phone}
              onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
              placeholder="e.g. +251 920 118 447"
            />
          </Field>

          <Field label="Address">
            <input
              value={newStudent.address}
              onChange={(e) => setNewStudent({ ...newStudent, address: e.target.value })}
              placeholder="e.g. Kotebe, Addis Ababa"
            />
          </Field>

          <Field label="Subcity">
            <input
              value={newStudent.subcity}
              onChange={(e) => setNewStudent({ ...newStudent, subcity: e.target.value })}
              placeholder="e.g. Yeka"
            />
          </Field>

          <Field label="Woreda">
            <input
              value={newStudent.woreda}
              onChange={(e) => setNewStudent({ ...newStudent, woreda: e.target.value })}
              placeholder="e.g. 08"
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
