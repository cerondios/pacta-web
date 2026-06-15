import { AuthGuard } from '@/components/AuthGuard'
import { NotificationList } from '@/components/organisms/NotificationList'
import { Toast } from '@/components/atoms/Toast'

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <NotificationList />
      <Toast />
    </AuthGuard>
  )
}
