import { useState } from 'react'
import { useStore } from '../../context/store'
import { ROLES } from '../../models'
import Icon from '../../components/Icon'
import { Avatar, Callout, Card, EmptyState, Field, Modal, PageHeader, RoleBadge, StatusBadge } from '../../components/ui'
import { ROLE_LABELS } from '../../utils/format'

const EMPTY = {
  role: 'student',
  name: '',
  username: '',
  password: '',
  studentId: '',
}

export default function AccountProvision() {
  const { users, currentUser, actions } = useStore()
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const visible = users.filter((u) => u.role !== 'admin')

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  function openForm(user) {
    const idempotencyKey = user
      ? null
      : `idem_user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    setForm(user ? { ...user } : { ...EMPTY, role: 'student', idempotencyKey })
    setError('')
    setIsSubmitting(false)
  }

  async function save(e) {
    e.preventDefault()
    if (isSubmitting) return

    const required = ['name', 'username', 'password']
    if (form.role === 'student') required.push('studentId')
    if (required.some((f) => !String(form[f] || '').trim())) {
      return setError('Please fill in all required fields.')
    }

    setIsSubmitting(true)
    setError('')

    // Only keep the fields that belong to the chosen role.
    const base = {
      id: form.id,
      role: form.role,
      name: form.name.trim(),
      username: form.username.trim(),
      password: form.password,
      idempotencyKey: form.idempotencyKey,
    }
    const extra =
      form.role === 'student'
        ? { studentId: (form.studentId || '').trim().toUpperCase() }
        : {}

    try {
      const result = await actions.saveUser({ ...base, ...extra })
      if (!result.ok) {
        setIsSubmitting(false)
        return setError(result.error)
      }
      setForm(null)
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Account Provision"
        subtitle="Provision and manage student, guard, and proctor accounts."
        center
        actions={
          <button type="button" className="btn btn-primary" onClick={() => openForm(null)}>
            <Icon name="plus" size={16} /> Create account
          </button>
        }
      />

      <Card flush>
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
              {visible.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '36px 16px', textAlign: 'center' }}>
                    <EmptyState
                      icon="users"
                      title="No accounts found"
                      text="Create an account to get started."
                    />
                  </td>
                </tr>
              ) : (
                visible.map((u, index) => (
                  <tr key={u.id}>
                    <td className="cell-num">{index + 1}</td>
                    <td>
                      <div className="cell-item">
                        <Avatar name={u.name} size="sm" />
                        <div>
                          <span className="row-title">{u.name}</span>
                          {u.studentId && <div className="muted small"><code>{u.studentId}</code></div>}
                        </div>
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
                      {u.id !== currentUser?.id && (
                        <button type="button" className="icon-btn danger" onClick={() => setDeleting(u)} aria-label={`Delete ${u.name}`} title="Delete">
                          <Icon name="trash" size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={!!form}
        title={form?.id ? 'Edit account' : 'Create account'}
        onClose={() => setForm(null)}
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setForm(null)} disabled={isSubmitting}>Cancel</button>
            <button type="submit" form="user-form" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (form?.id ? 'Saving...' : 'Creating...') : (form?.id ? 'Save changes' : 'Create account')}
            </button>
          </>
        }
      >
        {form && (
          <form id="user-form" className="form-grid" onSubmit={save} noValidate>
            {error && <div className="field-full"><Callout tone="danger">{error}</Callout></div>}
            <Field label="Role" full={form.role !== 'student'}>
              <select value={form.role} onChange={set('role')}>
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </Field>

            {form.role === 'student' && (
              <Field label="Student ID *">
                <input value={form.studentId} onChange={set('studentId')} placeholder="KU/XXXX/YY" required />
              </Field>
            )}

            <Field label="Full name *" full>
              <input value={form.name} onChange={set('name')} placeholder="Full name" required />
            </Field>
            <Field label="Username *">
              <input value={form.username} onChange={set('username')} autoComplete="off" placeholder="Username" required />
            </Field>
            <Field label="Password *">
              <input value={form.password} onChange={set('password')} autoComplete="new-password" placeholder="Password" required />
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
          are kept.
        </p>
      </Modal>
    </>
  )
}
