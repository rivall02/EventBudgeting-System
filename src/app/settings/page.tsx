"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isDefaultPassword, setIsDefaultPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("is_default_password")
          .eq("id", user.id)
          .single()
        
        if (profile?.is_default_password) {
          setIsDefaultPassword(true)
        }
      } else {
        router.push("/login")
      }
    }
    checkUser()
  }, [supabase, router])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password tidak cocok.",
      })
      return
    }

    if (newPassword === "filkomday2026") {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Anda tidak boleh menggunakan password default.",
      })
      return
    }

    setIsLoading(true)

    // Update password auth supabase
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      toast({
        variant: "destructive",
        title: "Gagal Update",
        description: error.message,
      })
      setIsLoading(false)
      return
    }

    // Jika berhasil, update is_default_password di tabel users menjadi false
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from("users")
        .update({ is_default_password: false })
        .eq("id", user.id)
    }

    toast({
      title: "Sukses",
      description: "Password berhasil diperbarui.",
    })
    
    setIsDefaultPassword(false)
    setNewPassword("")
    setConfirmPassword("")
    setIsLoading(false)
    router.push("/dashboard")
  }

  return (
    <div className="container mx-auto max-w-2xl p-6 py-12">
      {isDefaultPassword && (
        <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200 text-red-900 font-medium">
          ⚠️ Peringatan: Anda masih menggunakan password default. Wajib ganti password sekarang untuk alasan keamanan.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Akun</CardTitle>
          <CardDescription>Ubah kata sandi Anda di sini.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Password Baru</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Konfirmasi Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
