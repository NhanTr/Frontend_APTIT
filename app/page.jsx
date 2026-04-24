"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { RoleProvider, useRole } from "@/lib/role-context"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { AdminDashboard } from "@/components/dashboards/admin-dashboard"
import { OrganizerDashboard } from "@/components/dashboards/organizer-dashboard"
import { StudentDashboard } from "@/components/dashboards/student-dashboard"
import { ManagerDashboard } from "@/components/dashboards/manager-dashboard"

const dashboardConfig = {
  admin: { title: "Admin Dashboard", subtitle: "Manage user accounts and system settings", component: AdminDashboard, defaultSection: "dashboard" },
  manager: { title: "Manager Dashboard", subtitle: "Review activities and reports", component: ManagerDashboard, defaultSection: "dashboard" },
  organizer: { title: "Organizer Dashboard", subtitle: "Manage your activities and students", component: OrganizerDashboard, defaultSection: "dashboard" },
  student: { title: "Student Dashboard", subtitle: "Your activities and enrollments", component: StudentDashboard, defaultSection: "dashboard" },
}

function AppContent() {
  const { isAuthenticated, user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState(null)

  // Set default activeMenu based on user's role
  useEffect(() => {
    if (isAuthenticated && user) {
      const config = dashboardConfig[user.role]
      const sectionFromUrl = searchParams.get("section")
      setActiveMenu(sectionFromUrl || config?.defaultSection || "dashboard")
    }
  }, [isAuthenticated, user, searchParams])

  useEffect(() => {
    if (!loading && (!isAuthenticated || !user)) {
      router.replace("/guest")
    }
  }, [loading, isAuthenticated, user, router])

  useEffect(() => {
    if (loading || !isAuthenticated || !user) return

    const params = new URLSearchParams(searchParams.toString())
    const nextSection = activeMenu || dashboardConfig[user.role]?.defaultSection || "dashboard"

    params.set("role", user.role)
    params.set("section", nextSection)

    const nextQuery = params.toString()
    const currentQuery = searchParams.toString()
    if (nextQuery !== currentQuery) {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false })
    }
  }, [loading, isAuthenticated, user, activeMenu, pathname, router, searchParams])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-b-2 border-primary rounded-full"></div>
          <p className="mt-4 text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-b-2 border-primary rounded-full"></div>
          <p className="mt-4 text-muted-foreground">Đang chuyển hướng...</p>
        </div>
      </div>
    )
  }

  const config = dashboardConfig[user.role]

  if (!config) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Lỗi: Role không hợp lệ</h1>
          <p className="text-muted-foreground">Role: {user.role}</p>
          <p className="text-sm text-muted-foreground">Vui lòng liên hệ quản trị viên</p>
        </div>
      </div>
    )
  }

  const { title, subtitle, component: Dashboard } = config

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onMenuClick={setActiveMenu}
        activeMenu={activeMenu}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader 
          title={title} 
          subtitle={subtitle} 
          onMenuClick={() => setSidebarOpen(true)}
          isAuthenticated={true}
          onLogoutClick={logout}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Dashboard activeSection={activeMenu} />
        </main>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <AuthProvider>
      <RoleProvider>
        <AppContent />
      </RoleProvider>
    </AuthProvider>
  )
}
