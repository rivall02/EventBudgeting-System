"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function OfficerDashboard() {
  const [cashFlows, setCashFlows] = useState<any[]>([])
  const [budgetRequests, setBudgetRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: cfData } = await supabase.from("cash_flow").select("*")
      if (cfData) setCashFlows(cfData)

      const { data: brData } = await supabase.from("budget_requests").select("*, divisions(name)")
      if (brData) setBudgetRequests(brData)

      setIsLoading(false)
    }
    fetchData()
  }, [supabase])

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(angka)
  }

  if (isLoading) return <div className="p-8">Memuat data analitik...</div>

  const totalInflow = cashFlows.filter(c => c.type === 'debit').reduce((acc, curr) => acc + curr.nominal, 0)
  const totalOutflow = cashFlows.filter(c => c.type === 'kredit').reduce((acc, curr) => acc + curr.nominal, 0)
  const balance = totalInflow - totalOutflow

  // Prepare data for Burn Rate Chart
  // We'll group outflows by trans_date
  const burnRateData: { [key: string]: number } = {}
  cashFlows.filter(c => c.type === 'kredit').forEach(c => {
    const date = c.trans_date
    if (burnRateData[date]) {
      burnRateData[date] += c.nominal
    } else {
      burnRateData[date] = c.nominal
    }
  })

  const chartData = Object.keys(burnRateData)
    .sort() // sort by date
    .map(date => ({
      date,
      Pengeluaran: burnRateData[date]
    }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Executive Dashboard</h1>
        <p className="text-slate-500">Monitoring real-time anggaran Filkom Day 2026.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Saldo Tersedia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatRupiah(balance)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Pemasukan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatRupiah(totalInflow)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatRupiah(totalOutflow)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Burn Rate Pengeluaran</CardTitle>
          <CardDescription>Grafik pengeluaran harian</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp ${value / 1000}k`} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  formatter={(value: number) => formatRupiah(value)}
                  labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                />
                <Legend />
                <Bar dataKey="Pengeluaran" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-slate-400">Belum ada data pengeluaran</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transparansi Anggaran</CardTitle>
          <CardDescription>Daftar semua pengajuan (Approved)</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Divisi</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgetRequests.filter(r => r.status === 'approved').length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-slate-500">Belum ada anggaran yang disetujui.</TableCell>
                </TableRow>
              ) : budgetRequests.filter(r => r.status === 'approved').map(req => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.divisions?.name}</TableCell>
                  <TableCell>{req.item_name}</TableCell>
                  <TableCell>{req.qty} {req.unit}</TableCell>
                  <TableCell className="font-medium">{formatRupiah(req.total || 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
