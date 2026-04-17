"use client"

import { Search, Menu, LogIn, LogOut } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function DashboardHeader({ title, subtitle, onMenuClick, onLoginClick, isAuthenticated, onLogoutClick }) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="size-9 text-muted-foreground hover:text-foreground md:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-card-foreground">{title}</h1>
          {subtitle && <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="w-64 pl-9 bg-secondary border-border text-secondary-foreground placeholder:text-muted-foreground"
          />
        </div>
        {isAuthenticated && onLogoutClick ? (
          <Button
            onClick={onLogoutClick}
            size="sm"
            className="flex gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        ) : onLoginClick ? (
          <Button
            onClick={onLoginClick}
            size="sm"
            className="flex gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <LogIn className="size-4" />
            Sign in
          </Button>
        ) : null}
      </div>
    </header>
  )
}
