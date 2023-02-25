import { createElement } from 'react'
import {
  LayoutDashboard,
  Package,
  Send,
  List,
  LogIn,
  LogOut,
  Shield,
  Users,
  ClipboardCheck,
  Check,
  X,
  Search,
  Plus,
  Trash2,
  Pencil,
  Clock,
  Laptop,
  Monitor,
  Smartphone,
  Tablet,
  Shirt,
  ShoppingBag,
  BookOpen,
  Plug,
  Menu,
  AlertTriangle,
  Info,
  Ban,
  RefreshCw,
  Calendar,
  MapPin,
  Ticket,
  User,
  ArrowRight,
  Eye,
  CircleCheck,
  CircleX,
} from 'lucide-react'

const ICON_MAP = {
  dashboard: LayoutDashboard,
  box: Package,
  send: Send,
  list: List,
  entry: LogIn,
  exit: LogOut,
  eye: Eye,
  shield: Shield,
  users: Users,
  clipboard: ClipboardCheck,
  check: Check,
  approve: CircleCheck,
  reject: CircleX,
  x: X,
  search: Search,
  plus: Plus,
  trash: Trash2,
  edit: Pencil,
  clock: Clock,
  laptop: Laptop,
  desktop: Monitor,
  phone: Smartphone,
  tablet: Tablet,
  shirt: Shirt,
  bag: ShoppingBag,
  book: BookOpen,
  plug: Plug,
  menu: Menu,
  logout: LogOut,
  alert: AlertTriangle,
  info: Info,
  ban: Ban,
  refresh: RefreshCw,
  calendar: Calendar,
  pin: MapPin,
  ticket: Ticket,
  user: User,
  arrowRight: ArrowRight,
  'arrow-right': ArrowRight,
}

function resolveIcon(name) {
  if (!name) return Package
  if (typeof name === 'function' || typeof name === 'object') return name
  if (typeof name === 'string') {
    if (ICON_MAP[name]) return ICON_MAP[name]
    const lower = name.toLowerCase()
    if (ICON_MAP[lower]) return ICON_MAP[lower]
  }
  return Package
}

export default function Icon({ name, size = 18, className = '', strokeWidth = 1.8, ...props }) {
  const iconComponent = resolveIcon(name)
  return createElement(iconComponent, {
    size,
    strokeWidth,
    className: `icon ${className}`.trim(),
    'aria-hidden': 'true',
    ...props,
  })
}

const CATEGORY_ICONS = {
  Laptop: 'laptop',
  'Desktop Computer': 'desktop',
  'Mobile Phone': 'phone',
  Tablet: 'tablet',
  Electronics: 'plug',
  Clothing: 'shirt',
  Bag: 'bag',
  Books: 'book',
  Other: 'box',
}

export function CategoryIcon({ category, size = 18, className = '' }) {
  return (
    <span className={`category-icon ${className}`.trim()}>
      <Icon name={CATEGORY_ICONS[category] ?? 'box'} size={size} />
    </span>
  )
}
