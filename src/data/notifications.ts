/*
  Notifications for the bell in the header.

  MOCK DATA for now. Concept: the backend sends ONE notification per day with everything
  that expires within the next 7 days (see Notifications:ExpiryWindowDays). Later this list
  is filled from the backend instead of the mock below.
*/
import { computed, reactive } from 'vue'

export interface AppNotification {
  id: number
  title: string
  body: string
  daysAgo: number // 0 = today
  read: boolean
  url: string // where a tap leads
}

export const notifications = reactive<AppNotification[]>([
  {
    id: 1,
    title: '3 items expire within 7 days',
    body: 'Greek yogurt (in 7 days), Apples (in 6 days), Eggs (in 5 days)',
    daysAgo: 0,
    read: false,
    url: '/pantry',
  },
  {
    id: 2,
    title: '2 items expire within 7 days',
    body: 'Tomatoes (in 7 days), Wholegrain bread (in 3 days)',
    daysAgo: 1,
    read: false,
    url: '/pantry',
  },
  {
    id: 3,
    title: 'Milk expires soon',
    body: 'Milk expires in 3 days. Plan a recipe or freeze it.',
    daysAgo: 2,
    read: true,
    url: '/recipes',
  },
  {
    id: 4,
    title: '1 item expires within 7 days',
    body: 'Baby spinach (in 7 days)',
    daysAgo: 3,
    read: true,
    url: '/pantry',
  },
])

export const unreadCount = computed(() => notifications.filter((n) => !n.read).length)

export function markRead(id: number) {
  const n = notifications.find((x) => x.id === id)
  if (n) n.read = true
}

export function markAllRead() {
  for (const n of notifications) n.read = true
}

/** "Today", "Yesterday", "3 days ago" */
export function whenLabel(daysAgo: number): string {
  if (daysAgo === 0) return 'Today'
  if (daysAgo === 1) return 'Yesterday'
  return `${daysAgo} days ago`
}
