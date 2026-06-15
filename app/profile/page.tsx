import { AuthGuard } from '@/components/AuthGuard'
import { AppNav } from '@/components/organisms/AppNav'
import { ProfileView } from '@/components/organisms/ProfileView'
import { Toast } from '@/components/atoms/Toast'

export default function ProfilePage() {
  return (
    <AuthGuard>
      <AppNav minimal />
      <main>
        <ProfileView />
      </main>
      <Toast />
    </AuthGuard>
  )
}
