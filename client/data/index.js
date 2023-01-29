import users from './users.json'
import belongings from './belongings.json'
import exitRequests from './exitRequests.json'
import gateLogs from './gateLogs.json'

export { users, belongings, exitRequests, gateLogs }

export const ITEM_CATEGORIES = [
  'Laptop',
  'Desktop Computer',
  'Tablet',
  'Electronics',
  'Other',
]

export const ROLES = ['student', 'guard', 'proctor', 'admin']

export const GATES = ['Main Gate', 'Back Gate']

export const DEPARTMENTS = [
  'Accounting',
  'Biology',
  'Civil Engineering',
  'Computer Science',
  'English Language',
  'Information Systems',
  'Mathematics Education',
  'Physics',
]

export function createMockData() {
  return structuredClone({ users, belongings, exitRequests, gateLogs })
}
