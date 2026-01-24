"use client"

import type { ReactNode } from "react"
import { usePermissions } from "@/components/providers/PermissionProvider"
import type { Permission } from "@/lib/permissions"

// ============================================
// CANACCESS COMPONENT
// ============================================

interface CanAccessProps {
  permission?: Permission
  permissions?: Permission[]
  mode?: "any" | "all"
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Conditionally renders children based on user permissions
 *
 * @example
 * // Single permission
 * <CanAccess permission="users:view">
 *   <UserList />
 * </CanAccess>
 *
 * @example
 * // Multiple permissions (any)
 * <CanAccess permissions={["users:view", "users:manage"]} mode="any">
 *   <UserSection />
 * </CanAccess>
 *
 * @example
 * // Multiple permissions (all)
 * <CanAccess permissions={["users:view", "users:manage"]} mode="all">
 *   <AdminUserSection />
 * </CanAccess>
 *
 * @example
 * // With fallback
 * <CanAccess permission="settings:manage" fallback={<p>Access denied</p>}>
 *   <SettingsForm />
 * </CanAccess>
 */
export function CanAccess({
  permission,
  permissions,
  mode = "any",
  children,
  fallback = null,
}: CanAccessProps) {
  const { can, canAny, canAll } = usePermissions()

  let hasAccess = false

  if (permission) {
    hasAccess = can(permission)
  } else if (permissions && permissions.length > 0) {
    hasAccess = mode === "all" ? canAll(permissions) : canAny(permissions)
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>
}

// ============================================
// SPECIALIZED COMPONENTS
// ============================================

interface AdminOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Only renders children for ADMIN users
 */
export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  const { isAdmin } = usePermissions()
  return isAdmin ? <>{children}</> : <>{fallback}</>
}

interface MediaOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Only renders children for MEDIA users (not ADMIN)
 */
export function MediaOnly({ children, fallback = null }: MediaOnlyProps) {
  const { isMedia } = usePermissions()
  return isMedia ? <>{children}</> : <>{fallback}</>
}
