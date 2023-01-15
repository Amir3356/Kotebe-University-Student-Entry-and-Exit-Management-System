import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui'

export default function NotFound() {
  return (
    <div className="center-page">
      <EmptyState
        icon="alert"
        title="Page not found"
        text="The page you are looking for does not exist."
        action={
          <Link to="/" className="btn btn-primary">
            Go to dashboard
          </Link>
        }
      />
    </div>
  )
}
