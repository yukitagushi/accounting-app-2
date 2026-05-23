'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getPayments, updatePayment, deletePayment } from '@/lib/supabase/database'
import type { Payment, PaymentMethod } from '@/lib/types'
import { PAYMENT_METHODS } from '@/lib/constants'
import { useBranchStore } from '@/hooks/use-branch'
import { Plus, Banknote, Search, ArrowUpDown, Pencil, Trash2, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { CurrencyInput } from '@/components/shared/currency-input'
import { DeleteDialog } from '@/components/shared/delete-dialog'
import { toast } from 'sonner'

function formatCurrency(val: number): string {
  return '¥' + val.toLocaleString('ja-JP')
}

function getThisMonthRange(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [editTarget, setEditTarget] = useState<Payment | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { currentBranch } = useBranchStore()
  const branchId = currentBranch?.id === 'all' || !currentBranch ? undefined : currentBranch.id

  useEffect(() => {
    getPayments(branchId).then(setPayments)
  }, [branchId])

  async function refresh() {
    const data = await getPayments(branchId)
    setPayments(data)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const ok = await deletePayment(deleteTarget.id)
      if (ok) {
        toast.success('入金を削除しました')
        await refresh()
      } else {
        toast.error('削除に失敗しました')
      }
    } catch {
      toast.error('削除に失敗しました')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const { start: monthStart, end: monthEnd } = getThisMonthRange()

  const thisMonthPayments = payments.filter(
    (p) => p.payment_date >= monthStart && p.payment_date <= monthEnd
  )
  const thisMonthTotal = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0)
  const cashTotal = thisMonthPayments
    .filter((p) => p.payment_method === 'cash')
    .reduce((sum, p) => sum + p.amount, 0)
  const transferTotal = thisMonthPayments
    .filter((p) => p.payment_method === 'bank_transfer')
    .reduce((sum, p) => sum + p.amount, 0)

  const filtered = payments
    .filter((p) => {
      const customerName = p.invoice?.customer_name ?? ''
      if (
        search &&
        !customerName.includes(search) &&
        !p.payment_number.includes(search)
      )
        return false
      if (dateFrom && p.payment_date < dateFrom) return false
      if (dateTo && p.payment_date > dateTo) return false
      return true
    })
    .sort((a, b) =>
      sortOrder === 'newest'
        ? b.payment_date.localeCompare(a.payment_date)
        : a.payment_date.localeCompare(b.payment_date)
    )

  return (
    <div>
      <PageHeader
        title="入金管理"
        description="入金の記録・管理を行います"
        actions={
          <Link href="/payments/new">
            <Button className="gap-1.5">
              <Plus className="w-4 h-4" />
              入金登録
            </Button>
          </Link>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <p className="text-xs text-gray-500 mb-1">今月の入金件数</p>
          <p className="text-xl font-bold text-gray-700 tabular-nums">
            {thisMonthPayments.length}件
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <p className="text-xs text-gray-500 mb-1">今月の入金合計</p>
          <p className="text-xl font-bold text-blue-700 tabular-nums truncate">
            {formatCurrency(thisMonthTotal)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <p className="text-xs text-gray-500 mb-1">現金入金</p>
          <p className="text-xl font-bold text-emerald-700 tabular-nums truncate">
            {formatCurrency(cashTotal)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <p className="text-xs text-gray-500 mb-1">振込入金</p>
          <p className="text-xl font-bold text-violet-700 tabular-nums truncate">
            {formatCurrency(transferTotal)}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              placeholder="顧客名・入金番号で検索"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-8 text-sm w-36"
            />
            <span className="text-gray-400">〜</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-8 text-sm w-36"
            />
          </div>

          {/* Sort */}
          <button
            onClick={() =>
              setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')
            }
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {sortOrder === 'newest' ? '新しい順' : '古い順'}
          </button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Banknote className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">入金記録がありません</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    入金日
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    入金番号
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    顧客名
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                    金額
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    入金方法
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    摘要
                  </th>
                  <th className="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((payment) => (
                  <tr
                    key={payment.id}
                    className="group hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-600">
                      {payment.payment_date}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-gray-700">
                        {payment.payment_number}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {payment.invoice?.customer_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                          payment.payment_method === 'cash'
                            ? 'bg-emerald-100 text-emerald-700'
                            : payment.payment_method === 'bank_transfer'
                            ? 'bg-violet-100 text-violet-700'
                            : payment.payment_method === 'credit_card'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {PAYMENT_METHODS[payment.payment_method] ?? payment.payment_method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                      {payment.description}
                    </td>
                    <td className="px-2 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-gray-400 hover:text-gray-700"
                          onClick={() => setEditTarget(payment)}
                          aria-label="編集"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-gray-400 hover:text-red-600"
                          onClick={() => setDeleteTarget(payment)}
                          aria-label="削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden grid gap-3">
            {filtered.map((payment) => (
              <div
                key={payment.id}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {payment.invoice?.customer_name ?? '—'}
                    </p>
                    <p className="text-xs font-mono text-gray-500 mt-0.5">
                      {payment.payment_number}
                    </p>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-gray-900">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{payment.payment_date}</span>
                  <span>{PAYMENT_METHODS[payment.payment_method] ?? payment.payment_method}</span>
                </div>
                {payment.description && (
                  <p className="mt-1.5 text-xs text-gray-500 truncate">
                    {payment.description}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-gray-400 hover:text-gray-700"
                    onClick={() => setEditTarget(payment)}
                    aria-label="編集"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-gray-400 hover:text-red-600"
                    onClick={() => setDeleteTarget(payment)}
                    aria-label="削除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {editTarget && (
        <PaymentEditDialog
          payment={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={async () => {
            setEditTarget(null)
            await refresh()
          }}
        />
      )}

      {deleteTarget && (
        <DeleteDialog
          title="入金を削除"
          message={
            <>
              入金 <span className="font-medium text-gray-700">{deleteTarget.payment_number}</span> を削除しますか？
              <br />
              関連する請求書の入金額が再計算されます。
            </>
          }
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </div>
  )
}

// ── Edit Dialog ──────────────────────────────────────────────────────────────

interface EditDialogProps {
  payment: Payment
  onClose: () => void
  onSaved: () => void
}

function PaymentEditDialog({ payment, onClose, onSaved }: EditDialogProps) {
  const [date, setDate] = useState(payment.payment_date)
  const [amount, setAmount] = useState<number | ''>(payment.amount)
  const [method, setMethod] = useState<PaymentMethod>(payment.payment_method)
  const [description, setDescription] = useState(payment.description ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (amount === '' || amount <= 0) {
      toast.error('金額を入力してください')
      return
    }
    setSaving(true)
    try {
      const updated = await updatePayment(payment.id, {
        payment_date: date,
        amount: amount as number,
        payment_method: method,
        description,
      })
      if (updated) {
        toast.success('入金を更新しました')
        onSaved()
      } else {
        toast.error('更新に失敗しました')
        setSaving(false)
      }
    } catch {
      toast.error('更新に失敗しました')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">入金を編集</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-pay-date">入金日</Label>
            <Input
              id="edit-pay-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-pay-amount">金額</Label>
            <CurrencyInput value={amount} onChange={(v) => setAmount(v)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-pay-method">入金方法</Label>
            <select
              id="edit-pay-method"
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            >
              {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-pay-desc">摘要</Label>
            <Input
              id="edit-pay-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 p-5 border-t border-gray-100 bg-gray-50">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={saving}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            <Check className="w-4 h-4 mr-1" />
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
    </div>
  )
}
