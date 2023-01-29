import { useState } from 'react'
import { useStore } from '../../context/store'
import { ROLES } from '../../data'
import Icon from '../../components/Icon'
import { Avatar, Callout, Card, EmptyState, Field, Modal, PageHeader, RoleBadge, StatusBadge } from '../../components/ui'
import { ROLE_LABELS } from '../../utils/format'

const EMPTY = {
  role: 'student',
  name: '',
  username: '',
  password: '',
  email: '',
  phone: '',
  studentId: '',
  year: 1,
  dorm: '',
  gate: '',
  assignedBlocks: '',
}

export default function ManageUsers() {
  const { users, currentUser, actions } = useStore()
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(null)

  const visible = users.filter((u) => u.role !== 'admin')

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  function openForm(user) {
    setForm(user ? { ...EMPTY, ...user } : { ...EMPTY, role: 'student' })
    setError('')
  }

  function save(e) {
    e.preventDefault()
    const required = ['name', 'username', 'password']
    if (required.some((f) => !String(form[f]).trim())) return setError('Please fill in all required fields.')

    // Only keep the fields that belong to the chosen role.
    const base = { id: form.id, role: form.role, name: form.name, username: form.username, password: form.password, email: form.email, phone: form.phone }
    const extra =
      form.role === 'student'
        ? { studentId: (form.studentId || '').trim().toUpperCase(), ...(form.department ? { department: form.department } : {}), year: form.year ? Number(form.year) : 1, dorm: form.dorm || '' }
        : form.role === 'guard'
          ? { gate: form.gate }
          : form.role === 'proctor'
            ? { assignedBlocks: form.assignedBlocks }
            : {}
    const result = actions.saveUser({ ...base, ...extra })
    if (!result.ok) return setError(result.error)
    setForm(null)
  }

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Manage student and staff accounts."
        center
        actions={
          <button type="button" className="btn btn-primary" onClick={() => openForm(null)}>
            <Icon name="plus" size={16} /> Create account
          </button>
        }
      />

      <Card flush>
        {visible.length === 0 ? (
          <EmptyState
            icon="users"
            title="No accounts found"
            text="Create an account to get started."
          />
        ) : (
          <div className="table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Full name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((u, index) => (
                  <tr key={u.id}>
                    <td className="cell-num">{index + 1}</td>
                    <td>
                      <div className="cell-item">
                        <Avatar name={u.name} size="sm" />
                        <span className="row-title">{u.name}</span>
                      </div>
                    </td>
                    <td>
                      <code>@{u.username}</code>
                    </td>
                    <td><RoleBadge role={u.role} /></td>
                    <td><StatusBadge status={u.status} /></td>
                    <td className="right nowrap">
                      <button type="button" className="icon-btn" onClick={() => openForm(u)} aria-label={`Edit ${u.name}`} title="Edit">
                        <Icon name="edit" size={16} />
                      </button>
                      {u.id !== currentUser.id && (
                        <button type="button" className="icon-btn danger" onClick={() => setDeleting(u)} aria-label={`Delete ${u.name}`} title="Delete">
                          <Icon name="trash" size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={!!form}
        title={form?.id ? 'Edit account' : 'Create account'}
        onClose={() => setForm(null)}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>Cancel</button>
            <button type="submit" form="user-form" className="btn btn-primary">{form?.id ? 'Save changes' : 'Create account'}</button>
          </>
        }
      >
        {form && (
          <form id="user-form" className="form-grid" onSubmit={save} noValidate>
            {error && <div className="field-full"><Callout tone="danger">{error}</Callout></div>}
            <Field label="Role">
              <select value={form.role} onChange={set('role')} disabled={!!form.id}>
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </Field>
            <Field label="Full name *">
              <input value={form.name} onChange={set('name')} />
            </Field>
            <Field label="Username *">
              <input value={form.username} onChange={set('username')} autoComplete="off" />
            </Field>
            <Field label="Password *">
              <input value={form.password} onChange={set('password')} autoComplete="new-password" />
            </Field>
          </form>
        )}
      </Modal>

      <Modal
        open={!!deleting}
        title="Delete account?"
        onClose={() => setDeleting(null)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                actions.deleteUser(deleting.id)
                setDeleting(null)
              }}
            >
              Delete
            </button>
          </>
        }
      >
        <p>
          <strong>{deleting?.name}</strong> will no longer be able to sign in. Their existing gate records and requests
          are kept. Consider deactivating the account instead.
        </p>
      </Modal>
    </>
  )
}
