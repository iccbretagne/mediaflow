// ============================================
// PERMISSIONS DEFINITIONS
// ============================================

export const PERMISSIONS = {
  'events:view': 'Voir les événements',
  'events:create': 'Créer des événements',
  'events:edit': 'Modifier ses événements',
  'events:delete': 'Supprimer ses événements',
  'events:share': 'Créer des tokens de partage',
  'photos:upload': 'Uploader des photos',
  'photos:delete': 'Supprimer des photos',
  'photos:download': 'Télécharger des photos',
  'users:view': 'Voir la liste des utilisateurs',
  'users:manage': 'Gérer les utilisateurs',
  'churches:view': 'Voir les églises',
  'churches:manage': 'Gérer les églises',
  'settings:view': 'Voir les paramètres',
  'settings:manage': 'Gérer les paramètres',
} as const

export type Permission = keyof typeof PERMISSIONS

export type Role = 'ADMIN' | 'MEDIA'

// ============================================
// ROLE-PERMISSION MAPPING
// ============================================

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: Object.keys(PERMISSIONS) as Permission[],
  MEDIA: [
    'events:view',
    'events:create',
    'events:edit',
    'events:delete',
    'events:share',
    'photos:upload',
    'photos:delete',
    'photos:download',
    'churches:view',
  ],
}

// ============================================
// PERMISSION HELPERS
// ============================================

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => ROLE_PERMISSIONS[role].includes(permission))
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => ROLE_PERMISSIONS[role].includes(permission))
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role]
}

/**
 * Get permission description
 */
export function getPermissionDescription(permission: Permission): string {
  return PERMISSIONS[permission]
}
