"use client"

import { useState } from "react"
import { Loader2, Lock } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function ChangePasswordDialog({ open, onOpenChange, accessToken }) {
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (error) setError("")
  }

  const validateForm = () => {
    if (!formData.oldPassword) {
      setError("Vui lòng nhập mật khẩu cũ")
      return false
    }
    if (!formData.newPassword) {
      setError("Vui lòng nhập mật khẩu mới")
      return false
    }
    if (formData.newPassword.length < 6) {
      setError("Mật khẩu mới phải chứa ít nhất 6 ký tự")
      return false
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Xác nhận mật khẩu không khớp")
      return false
    }
    if (formData.oldPassword === formData.newPassword) {
      setError("Mật khẩu mới phải khác mật khẩu cũ")
      return false
    }
    return true
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validateForm()) return

    if (!accessToken) {
      setError("Bạn chưa đăng nhập")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || "Thay đổi mật khẩu thất bại")
      }

      setSuccess("Mật khẩu đã được thay đổi thành công!")
      setFormData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      // Close dialog after 1.5 seconds
      setTimeout(() => {
        onOpenChange(false)
      }, 1500)
    } catch (err) {
      setError(err.message || "Thay đổi mật khẩu thất bại")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      // Reset form when closing
      setFormData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setError("")
      setSuccess("")
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="size-5" />
            Thay đổi mật khẩu
          </DialogTitle>
          <DialogDescription>Nhập mật khẩu cũ và mật khẩu mới của bạn để đảm bảo an toàn tài khoản</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="oldPassword">Mật khẩu cũ</Label>
            <Input
              id="oldPassword"
              name="oldPassword"
              type="password"
              placeholder="Nhập mật khẩu cũ"
              value={formData.oldPassword}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder="Nhập mật khẩu mới (ít nhất 8 ký tự)"
              value={formData.newPassword}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Xác nhận mật khẩu mới"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
