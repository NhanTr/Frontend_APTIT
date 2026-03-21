"use client"

import { useState } from "react"
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
  const { isAuthenticated, currentUser } = useRole()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!isAuthenticated) {
    return <LoginForm />
  }

  const { title, subtitle, component: Dashboard } = dashboardConfig[currentUser.role]

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
    <RoleProvider>
      <AppContent />
    </RoleProvider>
  )
}
