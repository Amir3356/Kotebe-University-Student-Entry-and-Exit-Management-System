import users from './users.json'
import belongings from './belongings.json'
import exitRequests from './exitRequests.json'
import gateLogs from './gateLogs.json'

export { users, belongings, exitRequests, gateLogs }

export {
  ITEM_CATEGORIES,
  ROLES,
  ROLE_LABELS,
  GATES,
  DEPARTMENTS,
} from '../models'

export function createMockData() {
  return structuredClone({ users, belongings, exitRequests, gateLogs })
}
