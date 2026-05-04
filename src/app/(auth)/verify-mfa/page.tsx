"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function VerifyMFAPage() {
  const [token, setToken] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    // Ambil user profil untuk validasi token
    const { data: userProfile, error } = await supabase
      .from("users")
      .select("mfa_token")
      .eq("id", user.id)
      .single()

    if (error || !userProfile || userProfile.mfa_token !== token) {
      toast({
        variant: "destructive",
        title: "Token Tidak Valid",
        description: "Kode verifikasi yang Anda masukkan salah.",
      })
      setIsLoading(false)
      return
    }

    // Jika berhasil, null-kan token agar tidak bisa dipakai lagi (opsional)
    await supabase
      .from("users")
      .update({ mfa_token: null })
      .eq("id", user.id)

    toast({
      title: "Verifikasi Berhasil",
      description: "Selamat datang di Dashboard Bendahara.",
    })
    
    router.push("/dashboard/treasurer")
    router.refresh()
  }

  const handleResend = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Panggil RPC Supabase untuk generate ulang token
    const { error } = await supabase.rpc('generate_treasurer_token', { user_id: user.id })
    if (error) {
       toast({
         variant: "destructive",
         title: "Gagal mengirim ulang token",
         description: error.message
       })
       return
    }
    toast({
      title: "Token Dikirim Ulang",
      description: "Silakan periksa email Anda.",
    })
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            Verifikasi Keamanan
          </CardTitle>
          <CardDescription className="text-slate-500">
            Silakan masukkan kode 6-digit yang telah dikirimkan ke email Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Kode Verifikasi</Label>
              <Input
                id="token"
                type="text"
                maxLength={6}
                placeholder="000000"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                className="bg-slate-50 border-slate-200 tracking-widest text-center text-lg font-mono"
              />
            </div>
            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={isLoading}>
              {isLoading ? "Memverifikasi..." : "Verifikasi"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col text-center text-sm text-slate-500 space-y-2">
          <span>Belum menerima email?</span>
          <Button variant="link" onClick={handleResend} className="p-0 h-auto">Kirim Ulang Token</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
