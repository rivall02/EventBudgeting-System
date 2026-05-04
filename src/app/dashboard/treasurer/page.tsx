"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react"

type BudgetRequest = {
  id: number
  item_name: string
  qty: number
  unit: string
  price_unit: number
  total: number
  category: string
  status: string
  divisions: { name: string }
}

type CashFlow = {
  id: number
  trans_date: string
  source_target: string
  description: string
  type: string
  nominal: number
}

export default function TreasurerDashboard() {
  const [requests, setRequests] = useState<BudgetRequest[]>([])
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Cash Flow Form
  const [transDate, setTransDate] = useState("")
  const [sourceTarget, setSourceTarget] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState("debit")
  const [nominal, setNominal] = useState(0)

  const supabase = createClient()
  const { toast } = useToast()

  const fetchData = async () => {
    // Fetch Budget Requests
    const { data: reqData } = await supabase
      .from("budget_requests")
      .select("*, divisions(name)")
      .order("created_at", { ascending: false })

    if (reqData) setRequests(reqData as any[])

    // Fetch Cash Flow
    const { data: cfData } = await supabase
      .from("cash_flow")
      .select("*")
      .order("trans_date", { ascending: false })

    if (cfData) setCashFlows(cfData)

    setIsLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [supabase])

  const handleApprove = async (id: number) => {
    if (!confirm("Yakin ingin menyetujui anggaran ini? Data akan dikunci.")) return
    const { error } = await supabase.from("budget_requests").update({ status: "approved" }).eq("id", id)
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message })
    } else {
      toast({ title: "Approved", description: "Anggaran telah disetujui." })
      fetchData()
    }
  }

  const handleReject = async (id: number) => {
    const reason = prompt("Masukkan alasan penolakan:")
    if (reason === null) return // Cancelled

    const { error } = await supabase.from("budget_requests").update({ status: "rejected", rejection_reason: reason }).eq("id", id)
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message })
    } else {
      toast({ title: "Rejected", description: "Anggaran ditolak." })
      fetchData()
    }
  }

  const handleCashFlowSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await supabase.from("cash_flow").insert({
      trans_date: transDate,
      source_target: sourceTarget,
      description,
      type,
      nominal
    })

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message })
    } else {
      toast({ title: "Sukses", description: "Arus kas ditambahkan." })
      fetchData()
      setTransDate("")
      setSourceTarget("")
      setDescription("")
      setNominal(0)
    }
  }

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(angka)
  }

  if (isLoading) return <div className="p-8">Memuat data...</div>

  const totalInflow = cashFlows.filter(c => c.type === 'debit').reduce((acc, curr) => acc + curr.nominal, 0)
  const totalOutflow = cashFlows.filter(c => c.type === 'kredit').reduce((acc, curr) => acc + curr.nominal, 0)
  const balance = totalInflow - totalOutflow

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Bendahara</h1>
        <p className="text-slate-500">Persetujuan anggaran dan manajemen arus kas.</p>
      </div>

      {/* Auto Balance Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Saldo Riil</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatRupiah(balance)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Total Pemasukan</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatRupiah(totalInflow)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Total Pengeluaran</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatRupiah(totalOutflow)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Persetujuan Anggaran */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Persetujuan Anggaran</CardTitle>
            <CardDescription>Menunggu persetujuan Bendahara.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Divisi</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.filter(r => r.status === 'pending').map(req => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.divisions?.name}</TableCell>
                    <TableCell>{req.item_name} ({req.qty} {req.unit})</TableCell>
                    <TableCell>{formatRupiah(req.total || 0)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleApprove(req.id)}>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleReject(req.id)}>
                          <XCircle className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {requests.filter(r => r.status === 'pending').length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-500">Tidak ada pengajuan tertunda.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Input Cash Flow */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Input Arus Kas</CardTitle>
            <CardDescription>Catat pemasukan atau pengeluaran.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCashFlowSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal</Label>
                  <Input type="date" value={transDate} onChange={e => setTransDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Tipe</Label>
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={type}
                    onChange={e => setType(e.target.value)}
                  >
                    <option value="debit">Pemasukan (Debit)</option>
                    <option value="kredit">Pengeluaran (Kredit)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Sumber / Tujuan</Label>
                <Input value={sourceTarget} onChange={e => setSourceTarget(e.target.value)} required placeholder="Contoh: Sponsorship, Divisi Acara" />
              </div>
              <div className="space-y-2">
                <Label>Keterangan</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Nominal</Label>
                <Input type="number" min="0" value={nominal} onChange={e => setNominal(Number(e.target.value))} required />
              </div>
              <Button type="submit" className="w-full bg-slate-900">Simpan Arus Kas</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* History Cash Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Arus Kas</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Sumber/Tujuan</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="text-right">Nominal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashFlows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500">Belum ada riwayat arus kas.</TableCell>
                </TableRow>
              ) : cashFlows.map(cf => (
                <TableRow key={cf.id}>
                  <TableCell>{cf.trans_date}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cf.type === 'debit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {cf.type === 'debit' ? 'Pemasukan' : 'Pengeluaran'}
                    </span>
                  </TableCell>
                  <TableCell>{cf.source_target}</TableCell>
                  <TableCell>{cf.description}</TableCell>
                  <TableCell className="text-right font-medium">{formatRupiah(cf.nominal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
