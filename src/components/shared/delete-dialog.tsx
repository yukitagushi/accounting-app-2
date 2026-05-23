'use client'

import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface DeleteDialogProps {
  title: string
  message: React.ReactNode
  onClose: () => void
  onConfirm: () => void
  deleting?: boolean
}

export function DeleteDialog({ title, message, onClose, onConfirm, deleting }: DeleteDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-5 space-y-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <h2 className="text-base font-bold text-gray-900 text-center">{title}</h2>
          <div className="text-sm text-gray-500 text-center">
            {message}
            <br />
            この操作は取り消せません。
          </div>
        </div>
        <div className="flex gap-2 p-5 border-t border-gray-100 bg-gray-50">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={deleting}>
            キャンセル
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting} className="flex-1">
            <Trash2 className="w-4 h-4 mr-1" />
            {deleting ? '削除中...' : '削除'}
          </Button>
        </div>
      </div>
    </div>
  )
}
