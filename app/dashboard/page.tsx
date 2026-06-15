import { AuthGuard } from '@/components/AuthGuard'
import { DashboardView } from '@/components/organisms/DashboardView'
import { Toast } from '@/components/atoms/Toast'

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardView />
      <Toast />
    </AuthGuard>
  )
}
