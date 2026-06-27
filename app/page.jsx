"use client"

import { Suspense, useState, useEffect } from "react"
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
  admin: { title: "Bảng điều khiển quản trị", subtitle: "Quản lý tài khoản người dùng và cấu hình hệ thống", component: AdminDashboard, defaultSection: "dashboard" },
  manager: { title: "Bảng điều khiển quản lý", subtitle: "Duyệt hoạt động và báo cáo", component: ManagerDashboard, defaultSection: "dashboard" },
  organizer: { title: "Bảng điều khiển ban tổ chức", subtitle: "Quản lý hoạt động, sinh viên và điểm danh", component: OrganizerDashboard, defaultSection: "dashboard" },
  student: { title: "Bảng điều khiển sinh viên", subtitle: "Xem hoạt động và quản lý đăng ký", component: StudentDashboard, defaultSection: "browse-activities" },
}

const validSectionsByRole = {
  admin: [
    "dashboard",
    "users",
    "statistics",
    "categories",
    "academic-periods",
    "permissions",
    "settings",
    "personal-profile",
  ],
  manager: ["dashboard", "activity-approvals", "student-statistics", "reports", "manage-notifications", "notifications", "personal-profile"],
  organizer: ["dashboard", "my-activities", "create-activity", "my-students", "attendance", "reports-points", "notifications", "personal-profile"],
  student: ["browse-activities", "my-enrollments", "my-points", "announcements", "personal-profile"],
}

const legacySectionAliases = {
  "tổng-quan": "dashboard",
  "xem-hoạt-động": "browse-activities",
  "người-dùng": "users",
  "cài-đặt": "settings",
  "hồ-sơ-cá-nhân": "personal-profile",
  "duyệt-hoạt-động": "activity-approvals",
  "báo-cáo": "reports",
  "đăng-ký-của-tôi": "my-enrollments",
  "thông-báo": "notifications",
}

function normalizeSectionForRole(role, section) {
  const defaultSection = dashboardConfig[role]?.defaultSection || "dashboard"
  const normalized = section?.toLowerCase?.() || defaultSection
  const roleAlias = role === "student" && normalized === "thông-báo" ? "announcements" : null
  const aliased = roleAlias || legacySectionAliases[normalized] || normalized
  const validSections = validSectionsByRole[role] || []
  return validSections.includes(aliased) ? aliased : defaultSection
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
      setActiveMenu(normalizeSectionForRole(user.role, sectionFromUrl || config?.defaultSection))
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
    const nextSection = normalizeSectionForRole(user.role, activeMenu)

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
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin inline-block w-8 h-8 border-b-2 border-primary rounded-full"></div>
            <p className="mt-4 text-muted-foreground">Đang tải...</p>
          </div>
        </div>
      }
    >
      <AuthProvider>
        <RoleProvider>
          <AppContent />
        </RoleProvider>
      </AuthProvider>
    </Suspense>
  )
}
