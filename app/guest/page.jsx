"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { RoleProvider } from "@/lib/role-context"
import { LoginForm } from "@/components/login-form"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { GuestDashboard } from "@/components/dashboards/guest-dashboard"

function GuestPageContent() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState("browse-activities")
  const [showLoginForm, setShowLoginForm] = useState(false)

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/")
      // Fallback to ensure URL updates immediately in all cases.
      window.location.replace("/")
    }
  }, [loading, isAuthenticated, router])

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

  if (isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-b-2 border-primary rounded-full"></div>
          <p className="mt-4 text-muted-foreground">Đang chuyển hướng...</p>
        </div>
      </div>
    )
  }

  if (showLoginForm) {
    return <LoginForm onLoginSuccess={() => window.location.replace("/")} />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onMenuClick={setActiveMenu}
        activeMenu={activeMenu}
        role="guest"
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          title="Browse Activities"
          subtitle="Explore all available activities"
          onMenuClick={() => setSidebarOpen(true)}
          isAuthenticated={false}
          onLoginClick={() => setShowLoginForm(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <GuestDashboard />
        </main>
      </div>
    </div>
  )
}

export default function GuestPage() {
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
          <GuestPageContent />
        </RoleProvider>
      </AuthProvider>
    </Suspense>
  )
}
