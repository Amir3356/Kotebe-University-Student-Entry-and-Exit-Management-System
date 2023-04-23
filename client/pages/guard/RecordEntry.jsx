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
import { formatDate, formatDateTime, matches } from '../../utils/format'

const blankItem = {
  category: 'Laptop',
  description: '',
  brand: '',
}

export default function RecordEntry() {
  const { belongings, users, actions } = useStore()
  const [selectedItem, setSelectedItem] = useState(null)
  const [deletingItem, setDeletingItem] = useState(null)

  // Registration modal state
  const [registerOpen, setRegisterOpen] = useState(false)
  const [studentIdInput, setStudentIdInput] = useState('')
  const [studentNameInput, setStudentNameInput] = useState('')
  const [newItem, setNewItem] = useState(blankItem)
  const [registerError, setRegisterError] = useState('')

  const userOf = (id) => users.find((u) => u.id === id || (u.studentId && u.studentId.toLowerCase() === String(id).toLowerCase()))
  const students = users.filter((u) => u.role === 'student' && u.status === 'active')

  // Search and dropdown filters for the belongings table
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Offer every known category plus any category already present in the data.
  const categories = [...new Set([...ITEM_CATEGORIES, ...belongings.map((b) => b.category)])]

  const visible = belongings.filter((b) => {
    const s = userOf(b.studentId)
    return (
      (categoryFilter === 'all' || b.category === categoryFilter) &&
      matches(query, s?.name, b.studentName, s?.studentId, b.studentIdCode, b.description, b.brand)
    )
  })
  const filtered = query.trim() !== '' || categoryFilter !== 'all'

  function clearFilters() {
    setQuery('')
    setCategoryFilter('all')
  }

  function handleStudentIdChange(e) {
    const val = e.target.value
    setStudentIdInput(val)
    const found = students.find((s) => s.studentId && s.studentId.toLowerCase() === val.trim().toLowerCase())
    if (found) {
      setStudentNameInput(found.name)
    }
  }

  function handleStudentNameChange(e) {
    const val = e.target.value
    setStudentNameInput(val)
    const found = students.find((s) => s.name.toLowerCase() === val.trim().toLowerCase())
    if (found && !studentIdInput) {
      setStudentIdInput(found.studentId)
    }
  }

  function openRegister() {
    setStudentIdInput('')
    setStudentNameInput('')
    setNewItem(blankItem)
    setRegisterError('')
    setRegisterOpen(true)
  }

  function handleRegister(e) {
    e.preventDefault()
    const idVal = studentIdInput.trim()
    const nameVal = studentNameInput.trim()
    if (!idVal) return setRegisterError('Please enter Student ID.')
    if (!nameVal) return setRegisterError('Please enter Student Name.')
    if (!newItem.description.trim()) return setRegisterError('Please enter a model.')

    const matched =
      students.find((s) => s.studentId && s.studentId.toLowerCase() === idVal.toLowerCase()) ||
      students.find((s) => s.name.toLowerCase() === nameVal.toLowerCase()) ||
      students.find((s) => s.studentId && s.studentId.toLowerCase().includes(idVal.toLowerCase()))

    const targetStudentId = matched ? matched.id : idVal

    actions.recordEntry({
      studentId: targetStudentId,
      returningIds: [],
      newItems: [
        {
          category: newItem.category,
          description: newItem.description.trim(),
          brand: newItem.brand.trim(),
          studentName: nameVal,
          studentIdCode: idVal,
        },
      ],
      note: 'Registered at gate',
    })
    setRegisterOpen(false)
  }

  return (
    <>
      <PageHeader
        title="Student Belongings"
        subtitle="Manage and track all student belongings registered on campus."
        center
        actions={
          <button type="button" className="btn btn-primary" onClick={openRegister}>
            <Icon name="plus" size={16} /> Register item
          </button>
        }
      />

      <div className="toolbar filter-toolbar">
        <SearchInput value={query} onChange={setQuery} placeholder="Search by student name, ID, model or brand…" />
        <div className="toolbar-right">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Filter by item type">
            <option value="all">All item types</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {filtered && (
            <button type="button" className="btn btn-ghost" onClick={clearFilters}>
              <Icon name="x" size={14} /> Clear
            </button>
          )}
        </div>
      </div>
      <p className="muted small results-count">
        Showing {visible.length} of {belongings.length} items
      </p>

      <Card flush>
        {visible.length === 0 ? (
          <EmptyState
            icon="box"
            title="No belongings found"
            text={filtered ? 'No items match your search or filters.' : 'No belongings have been registered yet.'}
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
                  <th>Item Type</th>
                  <th>Brand</th>
                  <th>Registered Date</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((b, index) => {
                  const s = userOf(b.studentId)
                  const studentName = s?.name || b.studentName || 'Unknown'
                  const studentIdText = s?.studentId || b.studentIdCode || (b.studentId?.startsWith('u-') ? '—' : b.studentId)
                  return (
                    <tr key={b.id}>
                      <td className="cell-num">{index + 1}</td>
                      <td>
                        <div className="cell-item">
                          <Avatar name={studentName} size="sm" />
                          <span className="row-title">{studentName}</span>
                        </div>
                      </td>
                      <td>
                        <code>{studentIdText}</code>
                      </td>
                      <td>
                        <div className="row-title">{b.category}</div>
                        {b.description && b.description !== b.category && (
                          <div className="muted small">{b.description}</div>
                        )}
                      </td>
                      <td>{b.brand || '—'}</td>
                      <td className="nowrap">{formatDate(b.registeredAt)}</td>
                      <td className="right nowrap">
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => setSelectedItem(b)}
                          aria-label={`View details for ${b.description}`}
                          title="View details"
                        >
                          <Icon name="eye" size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn danger"
                          onClick={() => setDeletingItem(b)}
                          aria-label={`Delete ${b.description}`}
                          title="Delete item"
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Item Details Modal */}
      <Modal
        open={!!selectedItem}
        title="Belonging Details"
        onClose={() => setSelectedItem(null)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                if (actions.toggleBelongingStatus && selectedItem) {
                  actions.toggleBelongingStatus(selectedItem.id)
                  setSelectedItem((prev) => ({
                    ...prev,
                    status: prev.status === 'active' || prev.status === 'on_campus' ? 'inactive' : 'active',
                  }))
                }
              }}
            >
              {selectedItem && (selectedItem.status === 'active' || selectedItem.status === 'on_campus')
                ? 'Mark as Inactive'
                : 'Mark as Active'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setSelectedItem(null)}>
              Close
            </button>
          </>
        }
      >
        {selectedItem && (() => {
          const s = userOf(selectedItem.studentId)
          const studentName = s?.name || selectedItem.studentName || 'Unknown'
          const studentIdText = s?.studentId || selectedItem.studentIdCode || (selectedItem.studentId?.startsWith('u-') ? '—' : selectedItem.studentId)
          const guard = userOf(selectedItem.registeredBy)
          return (
            <div className="stack">
              <div className="card-header-inner">
                <div className="cell-item">
                  <Avatar name={studentName} size="md" />
                  <div>
                    <h3 className="detail-name">{studentName}</h3>
                    <div className="muted small">
                      <code>{studentIdText}</code> {s?.department && `· ${s.department}`} {s?.dorm && `· ${s.dorm}`}
                    </div>
                  </div>
                </div>
                <StatusBadge status={selectedItem.status} />
              </div>

              <dl className="summary">
                <div>
                  <dt>Item Type</dt>
                  <dd>{selectedItem.category}</dd>
                </div>
                <div>
                  <dt>Model</dt>
                  <dd>{selectedItem.description}</dd>
                </div>
                <div>
                  <dt>Brand</dt>
                  <dd>{selectedItem.brand || '—'}</dd>
                </div>
                <div>
                  <dt>Serial Number</dt>
                  <dd><code>{selectedItem.serialNumber || '—'}</code></dd>
                </div>
                <div>
                  <dt>Colour</dt>
                  <dd>{selectedItem.color || '—'}</dd>
                </div>
                <div>
                  <dt>Registered Date</dt>
                  <dd>{formatDateTime(selectedItem.registeredAt)}</dd>
                </div>
                {guard && (
                  <div>
                    <dt>Registered By</dt>
                    <dd>{guard.name}</dd>
                  </div>
                )}
              </dl>
            </div>
          )
        })()}
      </Modal>

      {/* Delete Belonging Modal */}
      <Modal
        open={!!deletingItem}
        title="Remove Belonging Record?"
        onClose={() => setDeletingItem(null)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setDeletingItem(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                if (actions.deleteBelonging) {
                  actions.deleteBelonging(deletingItem.id)
                }
                setDeletingItem(null)
              }}
            >
              Delete
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to remove <strong>{deletingItem?.description}</strong> (
          <code>{deletingItem?.serialNumber || 'No S/N'}</code>) for{' '}
          <strong>{userOf(deletingItem?.studentId)?.name ?? 'the student'}</strong>? This action cannot be undone.
        </p>
      </Modal>

      {/* Register Belonging Modal */}
      <Modal
        open={registerOpen}
        title="Register Student Belonging"
        onClose={() => setRegisterOpen(false)}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setRegisterOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="register-item-form" className="btn btn-primary">
              Register Item
            </button>
          </>
        }
      >
        <form id="register-item-form" className="form-grid" onSubmit={handleRegister} noValidate>
          {registerError && (
            <div className="field-full">
              <Callout tone="danger">{registerError}</Callout>
            </div>
          )}

          <Field label="Student ID *">
            <input
              list="student-ids-list"
              value={studentIdInput}
              onChange={handleStudentIdChange}
              placeholder="e.g. KU/0458/15"
              autoComplete="off"
              required
            />
            <datalist id="student-ids-list">
              {students.map((s) => (
                <option key={s.id} value={s.studentId}>
                  {s.name}
                </option>
              ))}
            </datalist>
          </Field>

          <Field label="Student Name *">
            <input
              list="student-names-list"
              value={studentNameInput}
              onChange={handleStudentNameChange}
              placeholder="e.g. Abel Kebede"
              autoComplete="off"
              required
            />
            <datalist id="student-names-list">
              {students.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.studentId}
                </option>
              ))}
            </datalist>
          </Field>

          <Field label="Item Type *">
            <select
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
            >
              {ITEM_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Model *">
            <input
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              placeholder="e.g. HP EliteBook 840 G5"
              required
            />
          </Field>
        </form>
      </Modal>
    </>
  )
}
