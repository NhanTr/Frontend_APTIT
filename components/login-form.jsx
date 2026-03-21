"use client"

import { useState } from "react"
import { useRole } from "@/lib/role-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap, Shield, BookOpen, Users, ChevronRight, ArrowLeft } from "lucide-react"

const roles = [
  {
    role: "admin",
    label: "Administrator",
    description: "Full system access, user management, and configuration controls",
    icon: <Shield className="size-5 sm:size-6" />,
    color: "bg-primary/10 text-primary",
  },
  {
    role: "organizer",
    label: "Organizer",
    description: "Manage activities, track attendance, and publish announcements",
    icon: <BookOpen className="size-5 sm:size-6" />,
    color: "bg-accent/10 text-accent",
  },
  {
    role: "student",
    label: "Student",
    description: "Browse activities, enroll in courses, and track your progress",
    icon: <Users className="size-5 sm:size-6" />,
    color: "bg-chart-3/10 text-chart-3",
  },
]

export function LoginForm() {
  const { setRole } = useRole()
  const [selectedRole, setSelectedRole] = useState(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  function handleSelectRole(role) {
    setSelectedRole(role)
    setEmail(`${role}@eduactivity.com`)
    setPassword("demo123")
  }

  function handleLogin(e) {
    e.preventDefault()
    if (selectedRole) {
      setRole(selectedRole)
    }
  }

  function handleBack() {
    setSelectedRole(null)
    setEmail("")
    setPassword("")
  }

  const selectedRoleData = roles.find(r => r.role === selectedRole)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 p-4 sm:p-6">
        <div className="flex size-10 sm:size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <GraduationCap className="size-5 sm:size-6" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">EduActivity</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Student Management</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-8">
        {!selectedRole ? (
          <div className="w-full max-w-md">
            <div className="mb-6 sm:mb-8 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Welcome back</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Select your role to sign in
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {roles.map(({ role, label, description, icon, color }) => (
                <button
                  key={role}
                  onClick={() => handleSelectRole(role)}
                  className="flex items-center gap-4 w-full p-4 rounded-xl border border-border bg-card text-left transition-all hover:border-primary hover:shadow-md active:scale-[0.98]"
                >
                  <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${color}`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-card-foreground">{label}</p>
                    <p className="text-sm text-muted-foreground truncate">{description}</p>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              This is a demo application. Select any role to explore.
            </p>
          </div>
        ) : (
          <Card className="w-full max-w-md border-border">
            <CardHeader className="pb-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 -ml-1"
              >
                <ArrowLeft className="size-4" />
                Back to roles
              </button>
              <div className="flex items-center gap-3">
                <div className={`flex size-12 items-center justify-center rounded-xl ${selectedRoleData?.color}`}>
                  {selectedRoleData?.icon}
                </div>
                <div>
                  <CardTitle className="text-xl text-card-foreground">{selectedRoleData?.label}</CardTitle>
                  <CardDescription className="text-sm">Sign in to continue</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-foreground">
                      Password
                    </Label>
                    <button type="button" className="text-xs text-primary hover:underline">
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11"
                    required
                  />
                </div>
                <Button type="submit" className="h-11 mt-2 w-full">
                  Sign In
                </Button>
              </form>

              <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground text-center">
                  Demo credentials are pre-filled. Click Sign In to continue.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-muted-foreground">
        2024 EduActivity Manager. All rights reserved.
      </footer>
    </div>
  )
}
