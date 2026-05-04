import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardRootPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role === "treasurer") {
    redirect("/dashboard/treasurer")
  } else if (profile?.role === "coordinator") {
    redirect("/dashboard/coordinator")
  } else if (profile?.role === "officer") {
    redirect("/dashboard/officer")
  } else {
    redirect("/login")
  }
}
