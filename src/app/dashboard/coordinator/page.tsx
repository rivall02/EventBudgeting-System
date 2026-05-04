"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { PlusCircle, Trash2, Edit2, Upload } from "lucide-react"

type BudgetRequest = {
  id: number
  item_name: string
  qty: number
  unit: string
  price_unit: number
  total: number
  category: string
  status: string
  rejection_reason: string | null
}

export default function CoordinatorDashboard() {
  const [requests, setRequests] = useState<BudgetRequest[]>([])
  const [divisionName, setDivisionName] = useState("")
  const [divisionId, setDivisionId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Form State
  const [itemName, setItemName] = useState("")
  const [qty, setQty] = useState<number>(1)
  const [unit, setUnit] = useState("")
  const [priceUnit, setPriceUnit] = useState<number>(0)
  const [category, setCategory] = useState("Lainnya")
  
  const supabase = createClient()
  const { toast } = useToast()

  const fetchRequests = async (divId: number) => {
    const { data } = await supabase
      .from("budget_requests")
      .select("*")
      .eq("division_id", divId)
      .order("created_at", { ascending: false })
      
    if (data) setRequests(data)
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("division_id, divisions(name)")
          .eq("id", user.id)
          .single()
        
        if (profile?.division_id) {
          setDivisionId(profile.division_id)
          // @ts-ignore
          setDivisionName(profile.divisions?.name || "Divisi")
          await fetchRequests(profile.division_id)
        }
      }
      setIsLoading(false)
    }
    init()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!divisionId) return

    const total = qty * priceUnit

    const { error } = await supabase.from("budget_requests").insert({
      division_id: divisionId,
      item_name: itemName,
      qty,
      unit,
      price_unit: priceUnit,
      total,
      category,
      status: "pending"
    })

    if (error) {
      toast({ variant: "destructive", title: "Gagal", description: error.message })
    } else {
      toast({ title: "Berhasil", description: "Pengajuan anggaran ditambahkan." })
      fetchRequests(divisionId)
      // Reset form
      setItemName("")
      setQty(1)
      setUnit("")
      setPriceUnit(0)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus item ini?")) return
    const { error } = await supabase.from("budget_requests").delete().eq("id", id)
    if (error) {
      toast({ variant: "destructive", title: "Gagal", description: error.message })
    } else {
      toast({ title: "Terhapus", description: "Item berhasil dihapus." })
      if (divisionId) fetchRequests(divisionId)
    }
  }

  const handleEvidenceUpload = async (requestId: number, file: File) => {
    if (!file) return;
    toast({ title: "Mengunggah...", description: "Sedang mengunggah ke Google Drive." })
    
    // Convert file to base64 for Edge Function
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64File = reader.result?.toString().split(',')[1];
      
      const { data, error } = await supabase.functions.invoke('upload-to-gdrive', {
        body: {
          requestId,
          divisionName,
          fileName: file.name,
          mimeType: file.type,
          fileData: base64File
        }
      })

      if (error) {
        toast({ variant: "destructive", title: "Upload Gagal", description: error.message })
      } else {
        toast({ title: "Upload Sukses", description: "Bukti berhasil diunggah." })
        // Update local status or trigger refetch
      }
    };
  }

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(angka)
  }

  if (isLoading) return <div className="p-8">Memuat data...</div>

  const totalApproved = requests.filter(r => r.status === 'approved').reduce((acc, curr) => acc + (curr.total || 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard {divisionName}</h1>
        <p className="text-slate-500">Kelola pengajuan anggaran dan realisasi pengeluaran.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Anggaran Disetujui</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatRupiah(totalApproved)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Item Pengajuan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{requests.length} Item</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ajukan Anggaran Baru</CardTitle>
          <CardDescription>Masukkan detail item yang ingin diajukan.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-5 items-end">
            <div className="space-y-2 md:col-span-2">
              <Label>Nama Item</Label>
              <Input value={itemName} onChange={e => setItemName(e.target.value)} required placeholder="Contoh: Kertas HVS" />
            </div>
            <div className="space-y-2">
              <Label>Qty</Label>
              <Input type="number" min="1" value={qty} onChange={e => setQty(Number(e.target.value))} required />
            </div>
            <div className="space-y-2">
              <Label>Satuan</Label>
              <Input value={unit} onChange={e => setUnit(e.target.value)} required placeholder="Rim, Box, dll" />
            </div>
            <div className="space-y-2">
              <Label>Harga Satuan</Label>
              <Input type="number" min="0" value={priceUnit} onChange={e => setPriceUnit(Number(e.target.value))} required />
            </div>
            <Button type="submit" className="md:col-span-5 w-full bg-slate-900">
              <PlusCircle className="w-4 h-4 mr-2" /> Tambah Pengajuan
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengajuan Anggaran</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Harga Satuan</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500">Belum ada pengajuan.</TableCell>
                </TableRow>
              ) : requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">
                    {req.item_name}
                    {req.status === 'rejected' && req.rejection_reason && (
                      <p className="text-xs text-red-500 mt-1">Alasan ditolak: {req.rejection_reason}</p>
                    )}
                  </TableCell>
                  <TableCell>{req.qty} {req.unit}</TableCell>
                  <TableCell>{formatRupiah(req.price_unit)}</TableCell>
                  <TableCell>{formatRupiah(req.total || 0)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      req.status === 'approved' ? 'bg-green-100 text-green-700' :
                      req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {req.status?.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {req.status !== 'approved' ? (
                        <>
                          <Button variant="outline" size="icon" onClick={() => {/* Handle Edit */}}>
                            <Edit2 className="w-4 h-4 text-slate-600" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleDelete(req.id)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </>
                      ) : (
                        <div>
                          <Label htmlFor={`upload-${req.id}`} className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 h-9 w-9">
                            <Upload className="w-4 h-4 text-blue-600" />
                          </Label>
                          <Input 
                            id={`upload-${req.id}`} 
                            type="file" 
                            className="hidden" 
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleEvidenceUpload(req.id, e.target.files[0])
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
