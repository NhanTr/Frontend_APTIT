"use client"

import { cn } from "@/lib/utils"
import { useRole } from "@/lib/role-context"
import { useAuth } from "@/lib/auth-context"
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UserCog,
  Bell,
  Settings,
  LogOut,
  GraduationCap,
  BookOpen,
  ClipboardList,
  BarChart3,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

const navConfig = {
  admin: [
    { label: "Dashboard", icon: <LayoutDashboard className="size-4" /> },
    { label: "Activities", icon: <CalendarDays className="size-4" /> },
    { label: "Students", icon: <Users className="size-4" /> },
    { label: "Organizers", icon: <UserCog className="size-4" /> },
    { label: "Reports", icon: <BarChart3 className="size-4" /> },
    { label: "Announcements", icon: <Bell className="size-4" /> },
    { label: "Settings", icon: <Settings className="size-4" /> },
  ],
  organizer: [
    { label: "Dashboard", icon: <LayoutDashboard className="size-4" /> },
    { label: "My Activities", icon: <BookOpen className="size-4" /> },
    { label: "My Students", icon: <Users className="size-4" /> },
    { label: "Attendance", icon: <ClipboardList className="size-4" /> },
    { label: "Announcements", icon: <Bell className="size-4" /> },
  ],
  student: [
    { label: "Dashboard", icon: <LayoutDashboard className="size-4" /> },
    { label: "Browse Activities", icon: <CalendarDays className="size-4" /> },
    { label: "My Enrollments", icon: <GraduationCap className="size-4" /> },
    { label: "Announcements", icon: <Bell className="size-4" /> },
  ],
}

export function AppSidebar({ isOpen = true, onClose }) {
  const handleClose = () => {
    if (onClose) {
      onClose()
    }
  }
  const { currentUser } = useRole()
  const { logout } = useAuth()
  const items = navConfig[currentUser.role]
  const initials = currentUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-300 md:static md:z-auto md:w-64 md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <GraduationCap className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">EduActivity</span>
              <span className="text-xs text-sidebar-foreground/60 capitalize">{currentUser.role} Panel</span>
            </div>
          </div>
          {/* Mobile Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent md:hidden"
            onClick={handleClose}
            aria-label="Close menu"
          >
            <X className="size-5" />
          </Button>
        </div>

        <Separator className="bg-sidebar-border" />

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {items.map((item, index) => {
              const isActive = index === 0
              return (
                <li key={item.label}>
                  <button
                    onClick={handleClose}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <Separator className="bg-sidebar-border" />

        <div className="flex items-center gap-3 px-4 py-4">
          <Avatar className="size-9">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-medium">{currentUser.name}</span>
            <span className="truncate text-xs text-sidebar-foreground/60">{currentUser.email}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={logout}
            aria-label="Log out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </aside>
    </>
  )
}
