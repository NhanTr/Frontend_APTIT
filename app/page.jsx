"use client"

import { useState } from "react"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { RoleProvider, useRole } from "@/lib/role-context"
import { LoginForm } from "@/components/login-form"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { AdminDashboard } from "@/components/dashboards/admin-dashboard"
import { OrganizerDashboard } from "@/components/dashboards/organizer-dashboard"
import { StudentDashboard } from "@/components/dashboards/student-dashboard"

const dashboardConfig = {
  admin: { title: "Admin Dashboard", subtitle: "System overview and management", component: AdminDashboard },
  organizer: { title: "Organizer Dashboard", subtitle: "Manage your activities and students", component: OrganizerDashboard },
  student: { title: "Student Dashboard", subtitle: "Your activities and enrollments", component: StudentDashboard },
}

function AppContent() {
  const { isAuthenticated, user, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
    return <LoginForm />
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
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader 
          title={title} 
          subtitle={subtitle} 
          onMenuClick={() => setSidebarOpen(true)} 
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Dashboard />
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
