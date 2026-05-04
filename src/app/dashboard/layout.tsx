"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, LogOut, Settings, CreditCard, Users, FileText } from "lucide-react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(null)
  const [fullName, setFullName] = useState<string>("")
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("role, full_name")
          .eq("id", user.id)
          .single()

        if (profile) {
          setRole(profile.role)
          setFullName(profile.full_name)
        }
      }
    }
    fetchUser()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const navItems = [
    {
      title: "Koordinator",
      href: "/dashboard/coordinator",
      icon: <LayoutDashboard className="w-5 h-5" />,
      show: role === "coordinator",
    },
    {
      title: "Officer",
      href: "/dashboard/officer",
      icon: <FileText className="w-5 h-5" />,
      show: role === "officer",
    },
    {
      title: "Bendahara",
      href: "/dashboard/treasurer",
      icon: <CreditCard className="w-5 h-5" />,
      show: role === "treasurer",
    },
    {
      title: "Pengaturan",
      href: "/settings",
      icon: <Settings className="w-5 h-5" />,
      show: true,
    },
  ]

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Filkom Day</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Sistem Keuangan</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems
            .filter((item) => item.show)
            .map((item) => (
              <Link key={item.href} href={item.href}>
                <span
                  className={`flex items-center px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    pathname.startsWith(item.href)
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.title}</span>
                </span>
              </Link>
            ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center px-4 py-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold uppercase">
              {fullName ? fullName.charAt(0) : "U"}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-900 truncate w-32">{fullName || "Memuat..."}</p>
              <p className="text-xs text-slate-500 capitalize">{role || "..."}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Keluar
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Filkom Day</h2>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5 text-red-600" />
          </Button>
        </div>
        
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
