import { redirect } from "next/navigation"
import ProfileForm from "@/components/profile/profile-form"
import { getUserDetails } from "@/lib/supabase/server"

export default async function ProfilePage() {
  const userDetails = await getUserDetails()
  
  if (!userDetails) {
    redirect('/login')
  }
  
  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-3xl font-bold mb-6">Perfil de Usuario</h1>
      
      <ProfileForm user={userDetails} />
    </div>
  )
} 