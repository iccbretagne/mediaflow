"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import type { Permission, Role } from "@/lib/permissions"

// ============================================
// PERMISSION CONTEXT
// ============================================

interface PermissionContextValue {
  role: Role
  permissions: Permission[]
  can: (permission: Permission) => boolean
  canAny: (permissions: Permission[]) => boolean
  canAll: (permissions: Permission[]) => boolean
  isAdmin: boolean
  isMedia: boolean
}

const PermissionContext = createContext<PermissionContextValue | null>(null)

// ============================================
// PROVIDER COMPONENT
// ============================================

interface PermissionProviderProps {
  role: Role
  permissions: Permission[]
  children: ReactNode
}

export function PermissionProvider({
  role,
  permissions,
  children,
}: PermissionProviderProps) {
  const value = useMemo<PermissionContextValue>(() => ({
    role,
    permissions,
    can: (permission: Permission) => permissions.includes(permission),
    canAny: (perms: Permission[]) => perms.some(p => permissions.includes(p)),
    canAll: (perms: Permission[]) => perms.every(p => permissions.includes(p)),
    isAdmin: role === "ADMIN",
    isMedia: role === "MEDIA",
  }), [role, permissions])

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  )
}

// ============================================
// HOOK
// ============================================

export function usePermissions() {
  const context = useContext(PermissionContext)

  if (!context) {
    throw new Error("usePermissions must be used within a PermissionProvider")
  }

  return context
}
