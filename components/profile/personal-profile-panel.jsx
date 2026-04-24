"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Lock, Save, UserCircle2 } from "lucide-react"
import { ChangePasswordDialog } from "./change-password-dialog"

const defaultProfile = {
  id: "",
  userId: "",
  fullName: "",
  studentCode: "",
  department: "",
  phone: "",
  avatarUrl: "",
}

export function PersonalProfilePanel() {
  const { user, accessToken } = useAuth()

  const [profile, setProfile] = useState(defaultProfile)
  const [formData, setFormData] = useState(defaultProfile)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  
  // Track ongoing fetch request to prevent duplicate calls in StrictMode
  const fetchControllerRef = useRef(null)

  const displayName = useMemo(() => {
    return formData.fullName || user?.name || user?.username || "User"
  }, [formData.fullName, user])

  const avatarFallback = useMemo(() => {
    return displayName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }, [displayName])

  useEffect(() => {
    const loadProfile = async () => {
      if (!accessToken) return

      setLoading(true)
      setError("")

      // Abort previous request if still in progress (prevents duplicate requests in StrictMode)
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort()
      }

      // Create new AbortController for this request
      const abortController = new AbortController()
      fetchControllerRef.current = abortController

      try {
        const response = await fetch("/api/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          signal: abortController.signal,
        })

        // Only process response if request wasn't aborted
        if (abortController.signal.aborted) {
          return
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const error = new Error(errorData.error || "Không thể tải thông tin cá nhân")
          // Attach status code to error object for detection
          error.status = response.status
          throw error
        }

        const data = await response.json()
        const result = data?.result || data

        const normalized = {
          ...defaultProfile,
          ...result,
          fullName: result?.fullName || user?.name || user?.username || "",
        }

        setProfile(normalized)
        setFormData(normalized)
      } catch (err) {
        // Ignore abort errors
        if (err.name !== "AbortError") {
          // If 404 status or profile not found, auto-create empty profile
          if (err.status === 404 || err.message.includes("không tìm thấy")) {
            console.log("📝 Profile not found (404), auto-creating empty profile...")
            await createEmptyProfile()
          } else {
            setError(err.message || "Không thể tải thông tin cá nhân")
            console.error("❌ Load profile error:", err)
          }
        }
      } finally {
        setLoading(false)
      }
    }

    loadProfile()

    // Cleanup: cancel fetch request when effect re-runs or unmounts
    return () => {
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort()
      }
    }
  }, [user, accessToken])

  // Auto-create empty profile when 404
  const createEmptyProfile = async () => {
    if (!accessToken) return

    try {
      // Create empty profile with null/empty values
      const emptyProfile = {
        fullName: "",
        studentCode: "",
        department: "",
        phone: "",
        avatarUrl: "",
      }

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emptyProfile),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("❌ Failed to create empty profile:", errorData)
        setProfile(defaultProfile)
        setFormData(defaultProfile)
        return
      }

      const data = await response.json()
      const result = data?.result || data

      const normalized = {
        ...defaultProfile,
        ...result,
        fullName: result?.fullName || user?.name || user?.username || "",
      }

      setProfile(normalized)
      setFormData(normalized)
      console.log("✅ Empty profile created successfully")
    } catch (err) {
      console.error("❌ Create empty profile error:", err)
      // Fallback to default profile
      setProfile(defaultProfile)
      setFormData(defaultProfile)
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async (event) => {
    event.preventDefault()

    if (!accessToken) {
      setError("Bạn chưa đăng nhập")
      return
    }

    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const payload = {
        fullName: formData.fullName,
        studentCode: formData.studentCode,
        department: formData.department,
        phone: formData.phone,
        avatarUrl: formData.avatarUrl,
      }

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Cập nhật thông tin thất bại")
      }

      const data = await response.json()
      const result = data?.result || data
      const normalized = { ...formData, ...result }

      setProfile(normalized)
      setFormData(normalized)
      setSuccess("Cập nhật thông tin cá nhân thành công")
    } catch (err) {
      setError(err.message || "Cập nhật thông tin thất bại")
    } finally {
      setSaving(false)
    }
  }

  const isDirty = JSON.stringify(profile) !== JSON.stringify(formData)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-card-foreground">Personal Profile</CardTitle>
            <CardDescription>Xem và thay đổi thông tin cá nhân của bạn</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setPasswordDialogOpen(true)} className="gap-2">
            <Lock className="size-4" />
            Change Password
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Đang tải thông tin hồ sơ...
            </div>
          ) : (
            <form onSubmit={handleSave} className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Avatar className="size-16">
                  <AvatarImage src={formData.avatarUrl || ""} alt={displayName} />
                  <AvatarFallback>{avatarFallback || <UserCircle2 className="size-6" />}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium text-card-foreground">{displayName}</p>
                  <p className="text-sm text-muted-foreground truncate">{user?.email || "No email"}</p>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="studentCode">Student Code</Label>
                  <Input
                    id="studentCode"
                    name="studentCode"
                    value={formData.studentCode}
                    onChange={handleChange}
                    placeholder="Nhập mã số"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="department">Department / Class</Label>
                  <Input
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Nhập khoa/lớp"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="avatarUrl">Avatar URL</Label>
                  <Input
                    id="avatarUrl"
                    name="avatarUrl"
                    value={formData.avatarUrl}
                    onChange={handleChange}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={!isDirty || saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 size-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <ChangePasswordDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} accessToken={accessToken} />
    </div>
  )
}
