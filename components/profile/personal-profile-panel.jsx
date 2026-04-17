"use client"

import { useEffect, useMemo, useState } from "react"
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

      try {
        const response = await fetch("/api/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Không thể tải thông tin cá nhân")
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
        setError(err.message || "Không thể tải thông tin cá nhân")
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user, accessToken])

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
