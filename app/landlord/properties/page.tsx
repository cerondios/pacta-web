'use client'
import { AuthGuard } from '@/components/AuthGuard'
import { AppNav } from '@/components/organisms/AppNav'
import { LandlordPropertiesList } from '@/components/organisms/LandlordPropertiesList'
import { Toast } from '@/components/atoms/Toast'

export default function LandlordPropertiesPage() {
  return (
    <AuthGuard requiredRole="LANDLORD">
      <div className="h-screen flex flex-col overflow-hidden bg-sand">
        <AppNav minimal />
        <LandlordPropertiesList />
      </div>
      <Toast />
    </AuthGuard>
  )
}
