import { redirect } from 'next/navigation'

export default async function LandlordPropertyRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/properties/${id}`)
}
