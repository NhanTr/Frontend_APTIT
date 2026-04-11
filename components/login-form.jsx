"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GraduationCap, AlertCircle, Loader2 } from "lucide-react"

export function LoginForm({ onLoginSuccess }) {
  const { login, loading, error } = useAuth()
  const [username, setUsername] = useState("N23DCCN047")
  const [password, setPassword] = useState("12345678")
  const [loginError, setLoginError] = useState("")

  async function handleLogin(e) {
    e.preventDefault()
    setLoginError("")
    
    if (!username || !password) {
      setLoginError("Vui lòng nhập tên đăng nhập và mật khẩu")
      return
    }

    try {
      const result = await login(username, password)
      if (result && onLoginSuccess) {
        onLoginSuccess()
      }
    } catch (err) {
      setLoginError(err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.")
    }
  }

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
        <Card className="w-full max-w-md border-border">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl sm:text-3xl text-card-foreground">Welcome</CardTitle>
            <CardDescription className="text-sm">Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {(loginError || error) && (
                <Alert className="border-destructive/50 bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">
                    {loginError || error}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-foreground">
                  Tên đăng nhập
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Nhập tên đăng nhập"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-11"
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Mật khẩu
                  </Label>
                  <button type="button" className="text-xs text-primary hover:underline">
                    Quên mật khẩu?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                  disabled={loading}
                  required
                />
              </div>
              <Button type="submit" className="h-11 mt-2 w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  "Đăng nhập"
                )}
              </Button>
            </form>

            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground text-center">
                Các thông tin đăng nhập mặc định đã được điền sẵn. Nhấp vào Đăng nhập để tiếp tục.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-muted-foreground">
        2024 EduActivity Manager. All rights reserved.
      </footer>
    </div>
  )
}
