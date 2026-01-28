"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { usePermissions } from "@/components/providers/PermissionProvider"
import type { Permission } from "@/lib/permissions"

type NavItem = {
  href: string
  label: string
  match: string[]
  permission?: Permission
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Événements", match: ["/dashboard", "/events"] },
  { href: "/projects", label: "Projets", match: ["/projects"] },
  { href: "/churches", label: "Églises", match: ["/churches"], permission: "churches:manage" },
  { href: "/users", label: "Utilisateurs", match: ["/users"], permission: "users:view" },
  { href: "/settings", label: "Paramètres", match: ["/settings"], permission: "settings:view" },
]

function isActive(pathname: string, item: NavItem) {
  return item.match.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function AuthNav() {
  const pathname = usePathname() || ""
  const { can } = usePermissions()

  // Filter nav items based on permissions
  const visibleNavItems = navItems.filter(
    (item) => !item.permission || can(item.permission)
  )

  return (
    <>
      <nav className="hidden md:flex items-center gap-2 bg-white/10 rounded-full p-1">
        {visibleNavItems.map((item) => {
          const active = isActive(pathname, item)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-colors ${
                active
                  ? "bg-white text-icc-violet"
                  : "text-white/90 hover:bg-white/15 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
      <nav className="md:hidden flex items-center gap-2 bg-white/10 rounded-full p-1 overflow-x-auto no-scrollbar w-full">
        {visibleNavItems.map((item) => {
          const active = isActive(pathname, item)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                active
                  ? "bg-white text-icc-violet"
                  : "text-white/90 hover:bg-white/15 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
