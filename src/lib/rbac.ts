export type UserRole = 'admin' | 'manager' | 'staff'

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: '管理者',
  manager: 'マネージャー',
  staff: 'スタッフ',
}

// サンプルアプリ用: 全ロールに全権限を付与（RBACロックを実質無効化）
// 本番運用する場合は staff/manager の権限を絞ること
const ALL_PERMISSIONS = {
  canManageUsers: true,
  canManageSettings: true,
  canDeleteVouchers: true,
  canExportData: true,
  canViewAllBranches: true,
  canManageMFA: true,
  canCreateInvoices: true,
  canCreateEstimates: true,
  canManageJournal: true,
  canManageCustomers: true,
  canManageVehicleInspections: true,
  canViewAccounting: true,
} as const

export const ROLE_PERMISSIONS = {
  admin: ALL_PERMISSIONS,
  manager: ALL_PERMISSIONS,
  staff: ALL_PERMISSIONS,
} as const

export type Permission = keyof typeof ROLE_PERMISSIONS.admin

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false
}

export function getRolePermissions(role: UserRole) {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.staff
}
