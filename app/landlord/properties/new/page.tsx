import { AuthGuard } from '@/components/AuthGuard'
import { CreatePropertyFlow } from '@/components/organisms/CreatePropertyFlow'
import { Toast } from '@/components/atoms/Toast'

export default async function NewPropertyPage({
  searchParams,
}: {
  searchParams: Promise<{ draftId?: string }>
}) {
  const { draftId } = await searchParams

  return (
    <AuthGuard requiredRole="LANDLORD" requiredStatus="COMPLETED">
      <div className="flex h-screen overflow-hidden bg-sand">
        <CreatePropertyFlow draftId={draftId} />
      </div>
      <Toast />
    </AuthGuard>
  )
}
