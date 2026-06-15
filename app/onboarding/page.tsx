import { AuthGuard } from '@/components/AuthGuard'
import { AppNav } from '@/components/organisms/AppNav'
import { OnboardingFlow } from '@/components/organisms/OnboardingFlow'
import { Toast } from '@/components/atoms/Toast'

export default function OnboardingPage() {
  return (
    <AuthGuard skipOnboardingCheck>
      <AppNav minimal />
      <OnboardingFlow />
      <Toast />
    </AuthGuard>
  )
}
