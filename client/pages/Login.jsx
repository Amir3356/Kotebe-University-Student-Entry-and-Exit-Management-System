import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useStore } from '../context/store'
import Icon from '../components/Icon'
import logo from '../asset/images.png'

const ROLE_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'proctor', label: 'Proctor' },
  { value: 'guard', label: 'Guard' },
  { value: 'admin', label: 'Admin' },
]

const STEPS = [
  { icon: 'entry', title: 'Entry', text: 'Guards record laptops, PCs and other valuables at the gate.' },
  { icon: 'send', title: 'Request', text: 'Students list the belongings they want to take out.' },
  { icon: 'clipboard', title: 'Approval', text: 'Proctors review and approve departure requests.' },
  { icon: 'exit', title: 'Exit check', text: 'Guards verify items against the approved pass.' },
]

export default function Login() {
  const { currentUser, actions } = useStore()
  const [form, setForm] = useState({ role: 'student', username: '', password: '' })
  const [error, setError] = useState('')

  if (currentUser) return <Navigate to={`/${currentUser.role}`} replace />

  function submit(e) {
    e.preventDefault()
    const result = actions.login(form.username.trim(), form.password, form.role)
    if (!result.ok) setError(result.error)
  }

  return (
    <div className="login">
      <section className="login-hero">
        <div className="brand brand-light">
          <img className="brand-logo" src={logo} alt="Kotebe University of Education logo" />
          <div>
            <div className="brand-name">Kotebe University of Education</div>
            <div className="brand-sub">Student Entry &amp; Exit Management</div>
          </div>
        </div>

        <div className="login-hero-copy">
          <h1>Every item in, every item out, on record.</h1>
          <p>
            A single place for guards, proctors and students to keep track of belongings at the campus gates.
          </p>
        </div>

        <ol className="steps">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <span className="step-icon">
                <Icon name={step.icon} size={18} />
              </span>
              <div>
                <div className="step-title">
                  {i + 1}. {step.title}
                </div>
                <div className="step-text">{step.text}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="login-panel">
        <form className="login-form" onSubmit={submit}>
          <h2>Sign in</h2>
          <p className="muted">Use your university account to continue.</p>

          {error && (
            <div className="callout callout-danger">
              <Icon name="alert" size={18} />
              <div>{error}</div>
            </div>
          )}

          <label className="field">
            <span className="field-label">Username</span>
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Username"
              autoComplete="username"
              autoFocus
              required
            />
          </label>
          <label className="field">
            <span className="field-label">Sign in as</span>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit" className="btn btn-primary btn-block btn-lg">
            Sign in
          </button>
        </form>
      </section>
    </div>
  )
}
