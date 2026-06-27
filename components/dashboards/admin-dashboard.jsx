"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { PersonalProfilePanel } from "@/components/profile/personal-profile-panel"
import { NotificationsPanel, SentNotificationsPanel } from "@/components/notifications/notifications-panel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bell,
  Calendar,
  Check,
  DatabaseBackup,
  Download,
  FileBarChart,
  FileText,
  History,
  Loader2,
  MessageSquare,
  RefreshCw,
  Save,
  Search,
  Settings,
  Shield,
  Tags,
  Users,
  X,
} from "lucide-react"

const emptyActivityFilters = {
  statuses: "",
  keyword: "",
  location: "",
  fromTime: "",
  toTime: "",
}

const emptyUserForm = {
  username: "",
  email: "",
  password: "",
  fullName: "",
  studentCode: "",
  className: "",
  department: "",
  phone: "",
  roleId: "4",
}

const notificationRoleOptions = [
  { value: "all", label: "Tất cả vai trò", roleId: null },
  { value: "1", label: "admin", roleId: 1 },
  { value: "2", label: "manager", roleId: 2 },
  { value: "3", label: "organizer", roleId: 3 },
  { value: "4", label: "student", roleId: 4 },
]

function unwrapApi(data) {
  return data?.result ?? data
}

function getPageItems(result) {
  if (Array.isArray(result)) return result
  return result?.content ?? []
}

function normalizeDateTime(value) {
  if (!value) return ""
  return value.length === 16 ? `${value}:00` : value
}

function formatDateTime(value) {
  if (!value) return "-"
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value))
  } catch {
    return value
  }
}

function getStatusClass(status = "") {
  const normalized = status.toLowerCase()
  if (["approved", "done", "active"].includes(normalized)) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
  if (["pending", "reviewing", "processing"].includes(normalized)) return "bg-amber-500/10 text-amber-600 border-amber-500/20"
  if (["rejected", "cancelled", "inactive"].includes(normalized)) return "bg-destructive/10 text-destructive border-destructive/20"
  return "bg-muted text-muted-foreground border-border"
}

function getRoleLabel(role) {
  return role?.displayNameVi || role?.roleDisplayName || role?.roleName || role?.name || "-"
}

function SectionHeader({ title, description, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}

function AdminStatCard({ title, value, description, icon: Icon }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className="rounded-xl bg-primary/10 p-3 text-primary">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  )
}

function useAdminApi() {
  const { accessToken, refreshAccessToken, logout } = useAuth()

  async function request(path, options = {}, retry = true) {
    if (!accessToken) throw new Error("Bạn chưa đăng nhập")

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    }

    if (options.body && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json"
    }

    const response = await fetch(path, {
      ...options,
      headers,
    })

    if (response.status === 401 && retry) {
      const refreshed = await refreshAccessToken()
      if (refreshed) return request(path, options, false)
      await logout()
      throw new Error("Phiên đăng nhập đã hết hạn")
    }

    if (!response.ok) {
      const text = await response.text()
      let message = text
      try {
        const parsed = JSON.parse(text)
        message = parsed.message || parsed.error || text
      } catch {}
      throw new Error(message || `HTTP ${response.status}`)
    }

    const contentType = response.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      return response.json()
    }
    return response.blob()
  }

  return { request }
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function useAdminResource(loader, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await loader()
        if (active) setData(result)
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [...deps, version])

  return { data, loading, error, refresh: () => setVersion((value) => value + 1), setData }
}

function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

function AdminOverview() {
  const api = useAdminApi()
  const stats = useAdminResource(async () => unwrapApi(await api.request("/api/admin/system-statistics")), [])

  const items = [
    {
      title: "Người dùng",
      value: stats.data?.totalUsers ?? "—",
      description: "Tạo tài khoản, khóa tài khoản và gán vai trò",
      icon: Users,
    },
    {
      title: "Hoạt động",
      value: stats.data?.totalActivities ?? "—",
      description: "Tổng số hoạt động đã tạo trong hệ thống",
      icon: Activity,
    },
    {
      title: "Lượt đăng ký",
      value: stats.data?.totalRegistrations ?? "—",
      description: "Tổng lượt sinh viên đăng ký hoạt động",
      icon: BarChart3,
    },
    {
      title: "Lượt tham gia",
      value: stats.data?.totalAttendance ?? "—",
      description: "Tổng lượt điểm danh có mặt",
      icon: Check,
    },
    {
      title: "Tổng điểm",
      value: stats.data?.totalEarnedPoints ?? "—",
      description: "Tổng điểm hoạt động đã cấp",
      icon: FileBarChart,
    },
    {
      title: "Hệ thống",
      value: "Cấu hình",
      description: "Cấu hình, sao lưu, danh mục và nhật ký",
      icon: Settings,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Bảng điều khiển quản trị"
        description="Quản lý tài khoản, phân quyền, thông báo và cấu hình hệ thống."
      />
      <ErrorBanner message={stats.error} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <AdminStatCard key={item.title} {...item} />
        ))}
      </div>
    </div>
  )
}

function UsersPanel() {
  const api = useAdminApi()
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(emptyUserForm)
  const [busyId, setBusyId] = useState(null)
  const [roleTarget, setRoleTarget] = useState(null)
  const [roleValue, setRoleValue] = useState("")

  const users = useAdminResource(async () => {
    const params = new URLSearchParams()
    if (query) params.append("q", query)
    if (roleFilter) params.append("roleId", roleFilter)
    if (statusFilter) params.append("status", statusFilter)
    return unwrapApi(await api.request(`/api/admin/users?${params.toString()}`))
  }, [query, roleFilter, statusFilter])

  const roles = useAdminResource(async () => unwrapApi(await api.request("/api/admin/roles")), [])
  const roleOptions = Array.isArray(roles.data) ? roles.data : []
  const selectedRoleId = Number(form.roleId)
  const isStudentRole = selectedRoleId === 4
  const isOrganizerRole = selectedRoleId === 3

  async function createUser() {
    const identity = {
      fullName: form.fullName.trim(),
      studentCode: isStudentRole ? form.studentCode.trim() : null,
      className: isStudentRole ? form.className.trim() : null,
      department: form.department.trim(),
      phone: form.phone.trim() || null,
    }
    const payload = {
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      roleId: selectedRoleId,
      identity: isStudentRole || isOrganizerRole ? identity : null,
    }
    await api.request("/api/admin/users", { method: "POST", body: JSON.stringify(payload) })
    setForm(emptyUserForm)
    setFormOpen(false)
    users.refresh()
  }

  async function deactivateUser(userId) {
    setBusyId(userId)
    try {
      await api.request(`/api/admin/users/${userId}`, { method: "DELETE" })
      users.refresh()
    } finally {
      setBusyId(null)
    }
  }

  async function changeRole() {
    if (!roleTarget || !roleValue) return
    setBusyId(roleTarget.id)
    try {
      await api.request(`/api/admin/users/${roleTarget.id}/assign-role`, {
        method: "POST",
        body: JSON.stringify({ roleId: Number(roleValue) }),
      })
      setRoleTarget(null)
      setRoleValue("")
      users.refresh()
    } finally {
      setBusyId(null)
    }
  }

  async function exportCsv() {
    try {
      const params = new URLSearchParams()
      if (query) params.append("q", query)
      if (roleFilter) params.append("roleId", roleFilter)
      if (statusFilter) params.append("status", statusFilter)
      const blob = await api.request(`/api/admin/users/export/csv?${params.toString()}`)
      downloadBlob(blob, `users_${Date.now()}.csv`)
    } catch (err) {
      alert(err.message || "Xuất CSV thất bại")
    }
  }

  const rows = Array.isArray(users.data) ? users.data : []
  const canCreateUser =
    form.username.trim() &&
    form.email.trim() &&
    form.password.trim() &&
    form.fullName.trim() &&
    form.roleId &&
    (!isStudentRole || (form.studentCode.trim() && form.className.trim() && form.department.trim())) &&
    (!isOrganizerRole || form.department.trim())

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Quản lý người dùng"
        description="Tạo tài khoản, lọc người dùng, phân quyền và khóa tài khoản."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCsv}>
              <Download className="mr-2 size-4" /> Xuất CSV
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Users className="mr-2 size-4" /> Thêm người dùng
            </Button>
          </div>
        }
      />
      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Tìm username/email" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Vai trò" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              {roleOptions.map((role) => <SelectItem key={role.id} value={String(role.id)}>{getRoleLabel(role)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="inactive">Không hoạt động</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      <ErrorBanner message={users.error || roles.error} />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Tên đăng nhập</TableHead><TableHead>Email</TableHead><TableHead>Vai trò</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell><div className="font-medium">{user.username}</div><div className="text-xs text-muted-foreground">{user.id}</div></TableCell>
                    <TableCell>{user.email || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                        {user.roleDisplayName || user.roleName || user.roleId || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell><Badge variant="outline" className={getStatusClass(user.status)}>{user.status || "-"}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" disabled={busyId === user.id} onClick={() => { setRoleTarget(user); setRoleValue(String(user.roleId || "")) }}>
                          <Shield className="mr-1 size-3" /> Đổi vai trò
                        </Button>
                        <Button size="sm" variant="outline" disabled={busyId === user.id} onClick={() => deactivateUser(user.id)}>
                          Khóa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {users.loading && <div className="p-4 text-sm text-muted-foreground">Đang tải...</div>}
          {!users.loading && rows.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">Không có người dùng nào.</div>
          )}
        </CardContent>
      </Card>
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo người dùng</DialogTitle>
            <DialogDescription>Tạo tài khoản mới với mật khẩu ban đầu và vai trò cố định.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="new-user-username">Tên đăng nhập</Label>
              <Input id="new-user-username" value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-user-email">Email</Label>
              <Input id="new-user-email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-user-password">Mật khẩu (tối thiểu 8 ký tự)</Label>
              <Input
                id="new-user-password"
                type="password"
                autoComplete="new-password"
                placeholder="Nhập mật khẩu ban đầu"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-user-full-name">Họ tên</Label>
              <Input id="new-user-full-name" value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Vai trò</Label>
              <Select value={form.roleId} onValueChange={(value) => setForm((p) => ({ ...p, roleId: value }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Chọn vai trò" /></SelectTrigger>
                <SelectContent>{roleOptions.map((role) => <SelectItem key={role.id} value={String(role.id)}>{getRoleLabel(role)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {isStudentRole && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="new-user-student-code">Mã sinh viên</Label>
                  <Input
                    id="new-user-student-code"
                    value={form.studentCode}
                    onChange={(e) => setForm((p) => ({ ...p, studentCode: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-user-class-name">Lớp</Label>
                  <Input
                    id="new-user-class-name"
                    value={form.className}
                    onChange={(e) => setForm((p) => ({ ...p, className: e.target.value }))}
                  />
                </div>
              </div>
            )}
            {(isStudentRole || isOrganizerRole) && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="new-user-department">Khoa/Đơn vị</Label>
                  <Input
                    id="new-user-department"
                    value={form.department}
                    onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-user-phone">Số điện thoại</Label>
                  <Input
                    id="new-user-phone"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Hủy</Button>
            <Button onClick={createUser} disabled={!canCreateUser}>Tạo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(roleTarget)} onOpenChange={(open) => !open && setRoleTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi vai trò</DialogTitle>
            <DialogDescription>
              Gán vai trò mới cho <span className="font-medium">{roleTarget?.username}</span>.
              Hệ thống sẽ ghi log thao tác này.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label>Vai trò mới</Label>
            <Select value={roleValue} onValueChange={setRoleValue}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Chọn vai trò" /></SelectTrigger>
              <SelectContent>{roleOptions.map((role) => <SelectItem key={role.id} value={String(role.id)}>{getRoleLabel(role)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleTarget(null)}>Hủy</Button>
            <Button onClick={changeRole} disabled={!roleValue || busyId === roleTarget?.id}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AnnouncementsPanel() {
  const api = useAdminApi()
  const [form, setForm] = useState({ title: "", content: "", type: "System", roleId: "" })
  const [result, setResult] = useState(null)
  const roles = useAdminResource(async () => unwrapApi(await api.request("/api/admin/roles")), [])

  async function send() {
    const payload = { ...form, roleId: form.roleId ? Number(form.roleId) : null }
    const response = unwrapApi(await api.request("/api/admin/notifications/broadcast", { method: "POST", body: JSON.stringify(payload) }))
    setResult(response)
    setForm({ title: "", content: "", type: "System", roleId: "" })
  }

  return (
    <Card>
      <CardHeader><CardTitle>Gửi thông báo thủ công</CardTitle><CardDescription>Gửi thông báo đến sinh viên/CLB theo vai trò hoặc toàn hệ thống.</CardDescription></CardHeader>
      <CardContent className="grid gap-4">
        <ErrorBanner message={roles.error} />
        {result && <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-600">Đã gửi thông báo thành công.</div>}
        <div className="grid gap-2"><Label>Tiêu đề</Label><Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></div>
        <div className="grid gap-2"><Label>Nội dung</Label><Textarea value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} /></div>
        <div className="grid gap-2 md:grid-cols-2">
          <div className="grid gap-2"><Label>Loại</Label><Input value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} /></div>
          <div className="grid gap-2"><Label>Vai trò nhận</Label><Select value={form.roleId} onValueChange={(value) => setForm((p) => ({ ...p, roleId: value }))}><SelectTrigger className="w-full"><SelectValue placeholder="Tất cả" /></SelectTrigger><SelectContent>{(roles.data || []).map((role) => <SelectItem key={role.id} value={String(role.id)}>{getRoleLabel(role)}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <Button className="w-fit" onClick={send}><Bell className="mr-2 size-4" /> Gửi thông báo</Button>
      </CardContent>
    </Card>
  )
}

function AdminNotificationSenderPanel() {
  const api = useAdminApi()
  const [form, setForm] = useState({
    title: "",
    content: "",
    recipientMode: "roles",
    roleId: "all",
    userIds: "",
    className: "",
    department: "",
  })
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  function resetForm() {
    setForm({
      title: "",
      content: "",
      recipientMode: "roles",
      roleId: "all",
      userIds: "",
      className: "",
      department: "",
    })
  }

  async function send() {
    setError(null)
    setResult(null)

    if (!form.title.trim() || !form.content.trim()) {
      setError("Vui lòng nhập tiêu đề và nội dung")
      return
    }

    const userIds = form.userIds
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)

    try {
      let response
      if (form.recipientMode === "manual") {
        if (userIds.length === 0) {
          setError("Nhập ít nhất một user ID")
          return
        }

        response = unwrapApi(await api.request("/api/notifications", {
          method: "POST",
          body: JSON.stringify({
            title: form.title.trim(),
            content: form.content.trim(),
            type: "System",
            userIds,
          }),
        }))
      } else {
        const selectedRole = notificationRoleOptions.find((role) => role.value === form.roleId)
        response = unwrapApi(await api.request("/api/admin/notifications/broadcast", {
          method: "POST",
          body: JSON.stringify({
            title: form.title.trim(),
            content: form.content.trim(),
            roleId: selectedRole?.roleId ?? null,
            className: form.className.trim() || null,
            department: form.department.trim() || null,
          }),
        }))
      }

      setResult(response)
      resetForm()
    } catch (err) {
      setError(err.message || "Gửi thông báo thất bại")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gửi thông báo</CardTitle>
        <CardDescription>Gửi thông báo theo vai trò hoặc nhập trực tiếp user ID.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <ErrorBanner message={error} />
        {result && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-600">
            Đã gửi thông báo thành công.
          </div>
        )}
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="grid gap-2">
            <Label>Tiêu đề</Label>
            <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label>Người nhận</Label>
            <RadioGroup
              value={form.recipientMode}
              onValueChange={(value) => setForm((p) => ({ ...p, recipientMode: value }))}
              className="grid grid-cols-2 gap-3"
            >
              <Label className="flex h-9 items-center gap-2 rounded-md border border-input px-3 text-sm font-normal">
                <RadioGroupItem value="roles" />
                Vai trò
              </Label>
              <Label className="flex h-9 items-center gap-2 rounded-md border border-input px-3 text-sm font-normal">
                <RadioGroupItem value="manual" />
                Tự nhập
              </Label>
            </RadioGroup>
          </div>
        </div>
        {form.recipientMode === "roles" ? (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label>Vai trò nhận</Label>
              <Select value={form.roleId} onValueChange={(value) => setForm((p) => ({ ...p, roleId: value }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {notificationRoleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Khoa</Label>
              <Input value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} placeholder="CNTT" />
            </div>
            <div className="grid gap-2">
              <Label>Lớp</Label>
              <Input value={form.className} onChange={(e) => setForm((p) => ({ ...p, className: e.target.value }))} placeholder="D20CQCN01-B" />
            </div>
          </div>
        ) : (
          <div className="grid gap-2">
            <Label>Recipient user IDs</Label>
            <Input value={form.userIds} onChange={(e) => setForm((p) => ({ ...p, userIds: e.target.value }))} placeholder="id1, id2, id3" />
          </div>
        )}
        <div className="grid gap-2">
          <Label>Nội dung</Label>
          <Textarea value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} />
        </div>
        <Button className="w-fit" onClick={send}><Bell className="mr-2 size-4" /> Gửi thông báo</Button>
      </CardContent>
    </Card>
  )
}

function SettingsPanel() {
  const api = useAdminApi()
  const configs = useAdminResource(async () => unwrapApi(await api.request("/api/admin/system-configs")), [])
  const logs = useAdminResource(async () => unwrapApi(await api.request("/api/admin/system-logs?page=0&size=20")), [])
  const backups = useAdminResource(async () => unwrapApi(await api.request("/api/admin/backups")), [])
  const [restoreTarget, setRestoreTarget] = useState(null)
  const [backupActionError, setBackupActionError] = useState(null)
  const [restoring, setRestoring] = useState(false)
  const visibleConfigs = (configs.data || []).filter((cfg) => !HIDDEN_SYSTEM_CONFIG_KEYS.has(cfg.key))

  async function updateConfig(key, value) {
    await api.request(`/api/admin/system-configs/${encodeURIComponent(key)}`, { method: "PUT", body: JSON.stringify({ value }) })
    configs.refresh()
  }

  async function createBackup() {
    setBackupActionError(null)
    await api.request("/api/admin/backups/export", { method: "POST" })
    backups.refresh()
  }

  async function restoreBackup() {
    if (!restoreTarget) return

    setRestoring(true)
    setBackupActionError(null)
    try {
      await api.request("/api/admin/backups/restore", {
        method: "POST",
        body: JSON.stringify({
          fileName: restoreTarget.fileName,
          confirmation: "RESTORE",
        }),
      })
      setRestoreTarget(null)
      backups.refresh()
      logs.refresh()
    } catch (err) {
      setBackupActionError(err.message || "Khôi phục bản sao lưu thất bại")
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="size-5" /> Cấu hình hệ thống</CardTitle><CardDescription>Cập nhật quy định vận hành mà không cần sửa mã nguồn.</CardDescription></CardHeader>
        <CardContent><ErrorBanner message={configs.error} />{configs.loading ? "Đang tải..." : <div className="grid gap-3">{visibleConfigs.map((cfg) => <ConfigRow key={cfg.key} config={cfg} onSave={updateConfig} />)}</div>}</CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="flex items-center gap-2"><DatabaseBackup className="size-5" /> Sao lưu dữ liệu</CardTitle><CardDescription>Tạo và xem danh sách bản sao lưu.</CardDescription></div><Button onClick={createBackup}>Tạo bản sao lưu</Button></CardHeader>
        <CardContent>
          <BackupTable
            rows={Array.isArray(backups.data) ? backups.data : []}
            loading={backups.loading}
            error={backups.error || backupActionError}
            onRestore={setRestoreTarget}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><History className="size-5" /> Nhật ký hệ thống</CardTitle><CardDescription>Theo dõi thao tác hệ thống gần đây.</CardDescription></CardHeader>
        <CardContent><GenericTable rows={getPageItems(logs.data)} loading={logs.loading} error={logs.error} /></CardContent>
      </Card>
      <Dialog open={Boolean(restoreTarget)} onOpenChange={(open) => !open && setRestoreTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Khôi phục bản sao lưu</DialogTitle>
            <DialogDescription>
              Hanh dong nay se xoa du lieu hien tai va phuc hoi toan bo du lieu tu file backup da chon.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            Tệp: <span className="font-medium">{restoreTarget?.fileName}</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreTarget(null)} disabled={restoring}>Hủy</Button>
            <Button variant="destructive" onClick={restoreBackup} disabled={restoring}>
              {restoring ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
              Khôi phục
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const HIDDEN_SYSTEM_CONFIG_KEYS = new Set(["ACTIVITY_LIFECYCLE_STATUSES"])

function ConfigRow({ config, onSave }) {
  const [value, setValue] = useState(config.value ?? "")
  return (
    <div className="grid gap-2 rounded-lg border p-3 md:grid-cols-[1fr_2fr_auto] md:items-center">
      <div>
        <div className="font-medium">{config.key}</div>
        <div className="text-xs text-muted-foreground">
          {config.description || config.type || "Cấu hình hệ thống"}
        </div>
      </div>
      <Input value={value} onChange={(e) => setValue(e.target.value)} />
      <Button size="sm" onClick={() => onSave(config.key, value)}>
        <Save className="mr-1 size-4" /> Lưu
      </Button>
    </div>
  )
}

function BackupTable({ rows = [], loading, error, onRestore }) {
  return (
    <div className="grid gap-3">
      <ErrorBanner message={error} />
      {loading ? <div className="text-sm text-muted-foreground">Đang tải...</div> : rows.length === 0 ? <div className="text-sm text-muted-foreground">Không có dữ liệu.</div> : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên file</TableHead>
                <TableHead>Dung lượng</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tac</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((backup) => (
                <TableRow key={backup.fileName}>
                  <TableCell className="font-medium">{backup.fileName}</TableCell>
                  <TableCell>{backup.size}</TableCell>
                  <TableCell>{backup.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => onRestore(backup)}>
                      <RefreshCw className="mr-2 size-4" /> Khôi phục
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function GenericJsonCard({ title, description, data, loading, error }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader>
      <CardContent><ErrorBanner message={error} />{loading ? <div className="text-sm text-muted-foreground">Đang tải...</div> : <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(data || {}, null, 2)}</pre>}</CardContent>
    </Card>
  )
}

function GenericTable({ title, description, rows = [], loading, error }) {
  const columns = useMemo(() => Array.from(new Set(rows.flatMap((row) => Object.keys(row || {})))).slice(0, 6), [rows])
  return (
    <div className="grid gap-3">
      {title && <SectionHeader title={title} description={description} />}
      <ErrorBanner message={error} />
      {loading ? <div className="text-sm text-muted-foreground">Đang tải...</div> : rows.length === 0 ? <div className="text-sm text-muted-foreground">Không có dữ liệu.</div> : (
        <div className="overflow-x-auto"><Table><TableHeader><TableRow>{columns.map((col) => <TableHead key={col}>{col}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.map((row, index) => <TableRow key={row.id || index}>{columns.map((col) => <TableCell key={col} className="max-w-64 truncate">{String(row[col] ?? "-")}</TableCell>)}</TableRow>)}</TableBody></Table></div>
      )}
    </div>
  )
}

// ============================================================
// QTHT-7: Categories (Khoa/Lớp, Loại hoạt động, Loại điểm, Nhà tài trợ)
// ============================================================

const CATEGORY_TYPE_OPTIONS = [
  { value: "DEPARTMENT", label: "Khoa/Lớp" },
  { value: "ACTIVITY_TYPE", label: "Loại hoạt động" },
  { value: "POINT_TYPE", label: "Loại điểm" },
  { value: "SPONSOR", label: "Đối tác / Nhà tài trợ" },
]

const emptyCategoryForm = { type: "DEPARTMENT", code: "", name: "", description: "", status: "ACTIVE" }

function CategoriesPanel() {
  const api = useAdminApi()
  const [typeFilter, setTypeFilter] = useState("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyCategoryForm)
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState(null)

  const categories = useAdminResource(async () => {
    const params = new URLSearchParams()
    if (typeFilter && typeFilter !== "all") params.append("type", typeFilter)
    return unwrapApi(await api.request(`/api/admin/categories?${params.toString()}`))
  }, [typeFilter])

  function openCreate() {
    setEditing(null)
    setForm(emptyCategoryForm)
    setActionError(null)
    setFormOpen(true)
  }

  function openEdit(row) {
    setEditing(row)
    setForm({
      type: row.type || "DEPARTMENT",
      code: row.code || "",
      name: row.name || "",
      description: row.description || "",
      status: row.status || "ACTIVE",
    })
    setActionError(null)
    setFormOpen(true)
  }

  async function save() {
    setActionError(null)
    try {
      const payload = {
        type: form.type,
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        status: form.status,
      }
      if (editing) {
        await api.request(`/api/admin/categories/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) })
      } else {
        await api.request(`/api/admin/categories`, { method: "POST", body: JSON.stringify(payload) })
      }
      setFormOpen(false)
      categories.refresh()
    } catch (err) {
      setActionError(err.message)
    }
  }

  async function deactivate(row) {
    if (!confirm(`Vô hiệu hóa danh mục "${row.name}"?`)) return
    setBusyId(row.id)
    try {
      await api.request(`/api/admin/categories/${row.id}`, { method: "DELETE" })
      categories.refresh()
    } finally {
      setBusyId(null)
    }
  }

  const rows = Array.isArray(categories.data) ? categories.data : []
  const canSave = form.type && form.code.trim() && form.name.trim()

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Quản lý danh mục"
        description="Khoa/Lớp, loại hoạt động, loại điểm và nhà tài trợ."
        action={<Button onClick={openCreate}><Tags className="mr-2 size-4" /> Thêm danh mục</Button>}
      />
      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger><SelectValue placeholder="Tất cả loại" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              {CATEGORY_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      <ErrorBanner message={categories.error || actionError} />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loại</TableHead>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{(CATEGORY_TYPE_OPTIONS.find((o) => o.value === row.type) || {}).label || row.type}</TableCell>
                    <TableCell className="font-mono text-xs">{row.code}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{row.description || "-"}</TableCell>
                    <TableCell><Badge variant="outline" className={getStatusClass(row.status)}>{row.status || "-"}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(row)}>Sửa</Button>
                        <Button size="sm" variant="outline" disabled={busyId === row.id} onClick={() => deactivate(row)}>Vô hiệu</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {categories.loading && <div className="p-4 text-sm text-muted-foreground">Đang tải...</div>}
          {!categories.loading && rows.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">Chưa có danh mục nào.</div>
          )}
        </CardContent>
      </Card>
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Sửa danh mục" : "Thêm danh mục"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Loại danh mục</Label>
              <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Mã danh mục</Label>
              <Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="VD: CNTT, THE_THAO, ..." />
            </div>
            <div className="grid gap-2">
              <Label>Tên danh mục</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Mô tả</Label>
              <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Trạng thái</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                  <SelectItem value="INACTIVE">Không hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Hủy</Button>
            <Button onClick={save} disabled={!canSave}>{editing ? "Cập nhật" : "Tạo"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// QTHT-8: Notification Channels & Templates
// ============================================================

const emptyChannelForm = { code: "", name: "", description: "", status: "ACTIVE" }

function NotificationChannelsPanel() {
  const api = useAdminApi()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyChannelForm)
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState(null)

  const channels = useAdminResource(async () => unwrapApi(await api.request("/api/admin/notification-channels")), [])

  function openCreate() { setEditing(null); setForm(emptyChannelForm); setActionError(null); setFormOpen(true) }
  function openEdit(row) {
    setEditing(row)
    setForm({ code: row.code || "", name: row.name || "", description: row.description || "", status: row.status || "ACTIVE" })
    setActionError(null)
    setFormOpen(true)
  }

  async function save() {
    setActionError(null)
    try {
      const payload = { ...form, description: form.description.trim() || null }
      if (editing) {
        await api.request(`/api/admin/notification-channels/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) })
      } else {
        await api.request(`/api/admin/notification-channels`, { method: "POST", body: JSON.stringify(payload) })
      }
      setFormOpen(false)
      channels.refresh()
    } catch (err) { setActionError(err.message) }
  }

  async function deactivate(row) {
    if (!confirm(`Vô hiệu hóa kênh "${row.name}"?`)) return
    setBusyId(row.id)
    try {
      await api.request(`/api/admin/notification-channels/${row.id}`, { method: "DELETE" })
      channels.refresh()
    } finally { setBusyId(null) }
  }

  const rows = Array.isArray(channels.data) ? channels.data : []
  const canSave = form.code.trim() && form.name.trim()

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Kênh thông báo"
        description="Quản lý các kênh gửi thông báo: Email, SMS, Push, In-App."
        action={<Button onClick={openCreate}><MessageSquare className="mr-2 size-4" /> Thêm kênh</Button>}
      />
      <ErrorBanner message={channels.error || actionError} />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">{row.code}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="max-w-md truncate text-muted-foreground">{row.description || "-"}</TableCell>
                    <TableCell><Badge variant="outline" className={getStatusClass(row.status)}>{row.status || "-"}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(row)}>Sửa</Button>
                        <Button size="sm" variant="outline" disabled={busyId === row.id} onClick={() => deactivate(row)}>Vô hiệu</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {channels.loading && <div className="p-4 text-sm text-muted-foreground">Đang tải...</div>}
          {!channels.loading && rows.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">Chưa có kênh nào.</div>
          )}
        </CardContent>
      </Card>
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Sửa kênh" : "Thêm kênh"}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2"><Label>Mã kênh</Label><Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="EMAIL, SMS, PUSH, IN_APP" /></div>
            <div className="grid gap-2"><Label>Tên kênh</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Mô tả</Label><Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></div>
            <div className="grid gap-2">
              <Label>Trạng thái</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ACTIVE">Hoạt động</SelectItem><SelectItem value="INACTIVE">Không hoạt động</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Hủy</Button>
            <Button onClick={save} disabled={!canSave}>{editing ? "Cập nhật" : "Tạo"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const emptyTemplateForm = { channelCode: "", code: "", subject: "", body: "", status: "ACTIVE" }

function NotificationTemplatesPanel() {
  const api = useAdminApi()
  const [channelFilter, setChannelFilter] = useState("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyTemplateForm)
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState(null)

  const channels = useAdminResource(async () => unwrapApi(await api.request("/api/admin/notification-channels")), [])
  const channelOptions = Array.isArray(channels.data) ? channels.data : []

  const templates = useAdminResource(async () => {
    const params = new URLSearchParams()
    if (channelFilter && channelFilter !== "all") params.append("channelCode", channelFilter)
    return unwrapApi(await api.request(`/api/admin/notification-templates?${params.toString()}`))
  }, [channelFilter])

  function openCreate() { setEditing(null); setForm(emptyTemplateForm); setActionError(null); setFormOpen(true) }
  function openEdit(row) {
    setEditing(row)
    setForm({
      channelCode: row.channelCode || "",
      code: row.code || "",
      subject: row.subject || "",
      body: row.body || "",
      status: row.status || "ACTIVE",
    })
    setActionError(null)
    setFormOpen(true)
  }

  async function save() {
    setActionError(null)
    try {
      if (editing) {
        await api.request(`/api/admin/notification-templates/${editing.id}`, { method: "PUT", body: JSON.stringify(form) })
      } else {
        await api.request(`/api/admin/notification-templates`, { method: "POST", body: JSON.stringify(form) })
      }
      setFormOpen(false)
      templates.refresh()
    } catch (err) { setActionError(err.message) }
  }

  async function deactivate(row) {
    if (!confirm(`Vô hiệu hóa template "${row.code}"?`)) return
    setBusyId(row.id)
    try {
      await api.request(`/api/admin/notification-templates/${row.id}`, { method: "DELETE" })
      templates.refresh()
    } finally { setBusyId(null) }
  }

  const rows = Array.isArray(templates.data) ? templates.data : []
  const canSave = form.channelCode && form.code.trim() && form.subject.trim() && form.body.trim()

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Template thông báo"
        description="Mẫu nội dung thông báo cho từng kênh gửi."
        action={<Button onClick={openCreate} disabled={channelOptions.length === 0} title={channelOptions.length === 0 ? "Cần tạo kênh trước" : ""}><FileText className="mr-2 size-4" /> Thêm template</Button>}
      />
      {channelOptions.length === 0 && !channels.loading && (
        <Card><CardContent className="p-4 text-sm text-muted-foreground">Bạn cần tạo ít nhất một kênh thông báo trước khi tạo template.</CardContent></Card>
      )}
      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger><SelectValue placeholder="Tất cả kênh" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả kênh</SelectItem>
              {channelOptions.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      <ErrorBanner message={templates.error || channels.error || actionError} />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kênh</TableHead>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">{row.channelCode}</TableCell>
                    <TableCell className="font-mono text-xs">{row.code}</TableCell>
                    <TableCell className="font-medium">{row.subject}</TableCell>
                    <TableCell><Badge variant="outline" className={getStatusClass(row.status)}>{row.status || "-"}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(row)}>Sửa</Button>
                        <Button size="sm" variant="outline" disabled={busyId === row.id} onClick={() => deactivate(row)}>Vô hiệu</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {templates.loading && <div className="p-4 text-sm text-muted-foreground">Đang tải...</div>}
          {!templates.loading && rows.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">Chưa có template nào.</div>
          )}
        </CardContent>
      </Card>
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Sửa template" : "Thêm template"}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Kênh</Label>
              <Select value={form.channelCode} onValueChange={(v) => setForm((p) => ({ ...p, channelCode: v }))}>
                <SelectTrigger><SelectValue placeholder="Chọn kênh" /></SelectTrigger>
                <SelectContent>{channelOptions.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>Mã template</Label><Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="VD: ACTIVITY_APPROVED" /></div>
            <div className="grid gap-2"><Label>Tiêu đề</Label><Input value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Nội dung</Label><Textarea rows={5} value={form.body} onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))} placeholder="Có thể dùng biến: {{username}}, {{activityName}}, ..." /></div>
            <div className="grid gap-2">
              <Label>Trạng thái</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ACTIVE">Hoạt động</SelectItem><SelectItem value="INACTIVE">Không hoạt động</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Hủy</Button>
            <Button onClick={save} disabled={!canSave}>{editing ? "Cập nhật" : "Tạo"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// QTHT-9: Academic Periods (Năm học / Học kỳ)
// ============================================================

const emptyPeriodForm = { academicYear: "", semester: 1, startDate: "", endDate: "", status: "CLOSED" }

function toLocalDateTime(value) {
  if (!value) return null
  return value.length === 16 ? `${value}:00` : value
}

function AcademicPeriodsPanel() {
  const api = useAdminApi()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyPeriodForm)
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState(null)

  const periods = useAdminResource(async () => unwrapApi(await api.request("/api/admin/academic-periods")), [])

  function openCreate() { setEditing(null); setForm(emptyPeriodForm); setActionError(null); setFormOpen(true) }
  function openEdit(row) {
    setEditing(row)
    setForm({
      academicYear: row.academicYear || "",
      semester: row.semester || 1,
      startDate: row.startDate ? row.startDate.slice(0, 16) : "",
      endDate: row.endDate ? row.endDate.slice(0, 16) : "",
      status: row.status || "CLOSED",
    })
    setActionError(null)
    setFormOpen(true)
  }

  async function save() {
    setActionError(null)
    try {
      const payload = {
        academicYear: form.academicYear.trim(),
        semester: Number(form.semester),
        startDate: toLocalDateTime(form.startDate),
        endDate: toLocalDateTime(form.endDate),
        status: form.status,
      }
      if (editing) {
        await api.request(`/api/admin/academic-periods/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) })
      } else {
        await api.request(`/api/admin/academic-periods`, { method: "POST", body: JSON.stringify(payload) })
      }
      setFormOpen(false)
      periods.refresh()
    } catch (err) { setActionError(err.message) }
  }

  async function setStatus(row, status) {
    setBusyId(row.id)
    try {
      await api.request(`/api/admin/academic-periods/${row.id}/status?status=${status}`, { method: "PATCH" })
      periods.refresh()
    } finally { setBusyId(null) }
  }

  const rows = Array.isArray(periods.data) ? periods.data : []
  const canSave = form.academicYear.trim() && form.semester

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Năm học / Học kỳ"
        description="Quản lý năm học và học kỳ. Chỉ một học kỳ được mở tại một thời điểm."
        action={<Button onClick={openCreate}><Calendar className="mr-2 size-4" /> Thêm năm học</Button>}
      />
      <ErrorBanner message={periods.error || actionError} />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Năm học</TableHead>
                  <TableHead>Học kỳ</TableHead>
                  <TableHead>Bắt đầu</TableHead>
                  <TableHead>Kết thúc</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.academicYear}</TableCell>
                    <TableCell>{row.semester}</TableCell>
                    <TableCell>{formatDateTime(row.startDate)}</TableCell>
                    <TableCell>{formatDateTime(row.endDate)}</TableCell>
                    <TableCell><Badge variant="outline" className={getStatusClass(row.status)}>{row.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(row)}>Sửa</Button>
                        {row.status === "CLOSED" ? (
                          <Button size="sm" disabled={busyId === row.id} onClick={() => setStatus(row, "OPEN")}>Mở</Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled={busyId === row.id} onClick={() => setStatus(row, "CLOSED")}>Đóng</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {periods.loading && <div className="p-4 text-sm text-muted-foreground">Đang tải...</div>}
          {!periods.loading && rows.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">Chưa có năm học/học kỳ nào.</div>
          )}
        </CardContent>
      </Card>
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Sửa năm học" : "Thêm năm học"}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Năm học</Label>
              <Input value={form.academicYear} onChange={(e) => setForm((p) => ({ ...p, academicYear: e.target.value }))} placeholder="2025-2026" />
            </div>
            <div className="grid gap-2">
              <Label>Học kỳ</Label>
              <Select value={String(form.semester)} onValueChange={(v) => setForm((p) => ({ ...p, semester: Number(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="1">1</SelectItem><SelectItem value="2">2</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Ngày bắt đầu</Label>
                <Input type="datetime-local" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Ngày kết thúc</Label>
                <Input type="datetime-local" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Trạng thái</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLOSED">Đóng</SelectItem>
                  <SelectItem value="OPEN">Mở (đóng các học kỳ khác)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Hủy</Button>
            <Button onClick={save} disabled={!canSave}>{editing ? "Cập nhật" : "Tạo"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// QTHT-5: System Statistics + Export
// ============================================================

function StatisticsPanel() {
  const api = useAdminApi()
  const stats = useAdminResource(async () => unwrapApi(await api.request("/api/admin/system-statistics")), [])
  const [exporting, setExporting] = useState(null)

  async function exportFile(kind) {
    setExporting(kind)
    try {
      const blob = await api.request(`/api/admin/system-statistics/export/${kind}`)
      downloadBlob(blob, `system-statistics-${Date.now()}.${kind === "excel" ? "xlsx" : "pdf"}`)
    } catch (err) {
      alert(err.message || `Xuất ${kind.toUpperCase()} thất bại`)
    } finally {
      setExporting(null)
    }
  }

  const data = stats.data || {}
  const hasPeriod = !!data.periodLabel

  // Tính % thay đổi so với kỳ trước
  function delta(current, previous) {
    if (current == null || previous == null || previous === 0) return null
    const diff = ((current - previous) / previous) * 100
    return Math.round(diff * 10) / 10
  }

  function DeltaBadge({ current, previous }) {
    const pct = delta(current, previous)
    if (pct === null) return null
    const isUp = pct >= 0
    return (
      <span className={`ml-2 inline-flex items-center text-xs ${isUp ? "text-emerald-600" : "text-destructive"}`}>
        {isUp ? "▲" : "▼"} {Math.abs(pct)}%
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Thống kê toàn hệ thống"
        description="Số liệu tổng hợp người dùng, hoạt động, đăng ký và điểm."
        action={
          <div className="flex gap-2">
            <Button variant="outline" disabled={exporting !== null} onClick={() => exportFile("excel")}>
              {exporting === "excel" ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
              Xuất Excel
            </Button>
            <Button variant="outline" disabled={exporting !== null} onClick={() => exportFile("pdf")}>
              {exporting === "pdf" ? <Loader2 className="mr-2 size-4 animate-spin" /> : <FileBarChart className="mr-2 size-4" />}
              Xuất PDF
            </Button>
          </div>
        }
      />
      <ErrorBanner message={stats.error} />

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Tổng toàn hệ thống</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <AdminStatCard title="Người dùng" value={data.totalUsers ?? "—"} description="Tổng tài khoản" icon={Users} />
          <AdminStatCard title="Hoạt động" value={data.totalActivities ?? "—"} description="Tổng hoạt động" icon={Activity} />
          <AdminStatCard title="Lượt đăng ký" value={data.totalRegistrations ?? "—"} description="Tổng lượt đăng ký" icon={BarChart3} />
          <AdminStatCard title="Lượt tham gia" value={data.totalAttendance ?? "—"} description="Tổng điểm danh có mặt" icon={Check} />
          <AdminStatCard title="Tổng điểm" value={data.totalEarnedPoints ?? "—"} description="Điểm đã cấp" icon={FileBarChart} />
        </div>
      </div>

      {hasPeriod && (
        <div>
          <h3 className="mb-3 mt-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Học kỳ hiện tại: {data.periodLabel}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <AdminStatCard
              title="Hoạt động trong kỳ"
              value={data.periodActivities ?? 0}
              description="Số hoạt động đã tổ chức"
              icon={Activity}
            />
            <AdminStatCard
              title="Lượt đăng ký trong kỳ"
              value={data.periodRegistrations ?? 0}
              description="Sinh viên đăng ký"
              icon={BarChart3}
            />
            <AdminStatCard
              title="Lượt tham gia trong kỳ"
              value={data.periodAttendance ?? 0}
              description="Điểm danh có mặt"
              icon={Check}
            />
            <AdminStatCard
              title="Điểm cấp trong kỳ"
              value={data.periodEarnedPoints ?? 0}
              description="Tổng điểm trong kỳ"
              icon={FileBarChart}
            />
          </div>

          {data.previousPeriodActivities != null && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">So sánh với kỳ trước</CardTitle>
                <CardDescription>Phần trăm thay đổi so với học kỳ liền trước</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Hoạt động</p>
                  <p className="mt-1 text-lg font-semibold">
                    {data.periodActivities ?? 0}
                    <DeltaBadge current={data.periodActivities} previous={data.previousPeriodActivities} />
                  </p>
                  <p className="text-xs text-muted-foreground">Kỳ trước: {data.previousPeriodActivities}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Lượt đăng ký</p>
                  <p className="mt-1 text-lg font-semibold">
                    {data.periodRegistrations ?? 0}
                    <DeltaBadge current={data.periodRegistrations} previous={data.previousPeriodRegistrations} />
                  </p>
                  <p className="text-xs text-muted-foreground">Kỳ trước: {data.previousPeriodRegistrations}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Lượt tham gia</p>
                  <p className="mt-1 text-lg font-semibold">
                    {data.periodAttendance ?? 0}
                    <DeltaBadge current={data.periodAttendance} previous={data.previousPeriodAttendance} />
                  </p>
                  <p className="text-xs text-muted-foreground">Kỳ trước: {data.previousPeriodAttendance}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Điểm cấp</p>
                  <p className="mt-1 text-lg font-semibold">
                    {data.periodEarnedPoints ?? 0}
                    <DeltaBadge current={data.periodEarnedPoints} previous={data.previousPeriodEarnedPoints} />
                  </p>
                  <p className="text-xs text-muted-foreground">Kỳ trước: {data.previousPeriodEarnedPoints}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!hasPeriod && !stats.loading && (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Chưa có học kỳ nào ở trạng thái <span className="font-medium">Mở</span>. Vào mục "Năm học / Học kỳ" để mở một học kỳ — hệ thống sẽ tự động tính thống kê cho kỳ đó.
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================================
// QTHT-10: Phân quyền động (QTHT_BM 5)
// ============================================================

const PERMISSION_ROLE_OPTIONS = [
  { value: 1, label: "ADMIN - Quản trị hệ thống" },
  { value: 2, label: "MANAGER - Quản lý hoạt động" },
  { value: 3, label: "ORGANIZER - BTC/CLB" },
  { value: 4, label: "STUDENT - Sinh viên" },
]

function PermissionsPanel() {
  const api = useAdminApi()
  const [selectedRole, setSelectedRole] = useState(1)
  const [dirty, setDirty] = useState({}) // { [permissionKey]: boolean }
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [actionSuccess, setActionSuccess] = useState(null)

  // Load tất cả permission + mapping của role hiện tại
  const allPermissions = useAdminResource(async () => unwrapApi(await api.request("/api/admin/permissions")), [])

  const rolePermissions = useAdminResource(async () => {
    const result = unwrapApi(await api.request(`/api/admin/permissions/role/${selectedRole}`))
    return Array.isArray(result) ? result : []
  }, [selectedRole])

  // Khi đổi role, reset dirty state
  useEffect(() => {
    setDirty({})
    setActionError(null)
    setActionSuccess(null)
  }, [selectedRole])

  // Map từ API sang state dễ dùng
  const currentMapping = useMemo(() => {
    const map = {}
    if (Array.isArray(rolePermissions.data)) {
      for (const row of rolePermissions.data) {
        map[row.permissionKey] = row.enabled !== false
      }
    }
    return map
  }, [rolePermissions.data])

  function toggle(key, currentValue) {
    const newValue = !(dirty[key] ?? currentValue)
    setDirty((d) => ({ ...d, [key]: newValue }))
  }

  const dirtyCount = Object.keys(dirty).length

  async function save() {
    setSaving(true)
    setActionError(null)
    setActionSuccess(null)
    try {
      const items = Object.entries(dirty).map(([permissionKey, enabled]) => ({ permissionKey, enabled }))
      await api.request(`/api/admin/permissions/role/${selectedRole}`, {
        method: "PUT",
        body: JSON.stringify(items),
      })
      setDirty({})
      rolePermissions.refresh()
      setActionSuccess("Đã lưu phân quyền.")
    } catch (err) {
      setActionError(err.message || "Lưu thất bại")
    } finally {
      setSaving(false)
    }
  }

  async function resetToDefault() {
    if (!confirm(`Reset về phân quyền mặc định cho role ${selectedRole}? Mọi thay đổi sẽ bị mất.`)) return
    setResetting(true)
    setActionError(null)
    setActionSuccess(null)
    try {
      await api.request(`/api/admin/permissions/role/${selectedRole}/reset`, { method: "POST" })
      setDirty({})
      rolePermissions.refresh()
      setActionSuccess("Đã reset về phân quyền mặc định.")
    } catch (err) {
      setActionError(err.message || "Reset thất bại")
    } finally {
      setResetting(false)
    }
  }

  function discardChanges() {
    setDirty({})
    setActionError(null)
    setActionSuccess(null)
  }

  // Nhóm permission theo groupLabel để hiển thị
  const grouped = useMemo(() => {
    const list = Array.isArray(allPermissions.data) ? allPermissions.data : []
    const groups = {}
    for (const p of list) {
      const g = p.groupLabel || "Khác"
      if (!groups[g]) groups[g] = []
      groups[g].push(p)
    }
    return groups
  }, [allPermissions.data])

  const selectedRoleLabel = (PERMISSION_ROLE_OPTIONS.find((r) => r.value === selectedRole) || {}).label

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Phân quyền chức năng"
        description="Bật/tắt quyền truy cập chức năng cho từng vai trò (QTHT_BM 5)."
        action={
          <Button variant="outline" disabled={resetting} onClick={resetToDefault}>
            {resetting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
            Reset mặc định
          </Button>
        }
      />

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Vai trò</Label>
            <Select value={String(selectedRole)} onValueChange={(v) => setSelectedRole(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PERMISSION_ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={String(r.value)}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end justify-end gap-2">
            <Button variant="outline" disabled={dirtyCount === 0 || saving} onClick={discardChanges}>Hủy thay đổi</Button>
            <Button disabled={dirtyCount === 0 || saving} onClick={save}>
              {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
              Lưu ({dirtyCount})
            </Button>
          </div>
        </CardContent>
      </Card>

      <ErrorBanner message={allPermissions.error || rolePermissions.error || actionError} />
      {actionSuccess && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-600">{actionSuccess}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{selectedRoleLabel}</CardTitle>
          <CardDescription>
            Tick vào ô để cấp quyền. Thay đổi chưa được lưu cho đến khi bấm "Lưu".
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {allPermissions.loading && <div className="text-sm text-muted-foreground">Đang tải...</div>}
          {Object.entries(grouped).map(([groupName, perms]) => (
            <div key={groupName} className="rounded-lg border">
              <div className="border-b bg-muted/30 px-4 py-2 text-sm font-semibold">{groupName}</div>
              <div className="divide-y">
                {perms.map((p) => {
                  const baseline = currentMapping[p.key] ?? false
                  const effective = dirty[p.key] ?? baseline
                  const isDirty = p.key in dirty
                  return (
                    <label key={p.key} className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/30">
                      <Checkbox
                        checked={effective}
                        onCheckedChange={() => toggle(p.key, baseline)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{p.label}</div>
                        <div className="text-xs text-muted-foreground font-mono">{p.key}</div>
                      </div>
                      {isDirty && <Badge variant="outline" className="text-amber-600 border-amber-500/30">Chưa lưu</Badge>}
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function AdminDashboard({ activeSection = "dashboard" }) {
  const normalizedSection = activeSection?.toLowerCase?.() || "dashboard"

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {normalizedSection === "dashboard" && <AdminOverview />}
      {normalizedSection === "users" && <UsersPanel />}
      {normalizedSection === "statistics" && <StatisticsPanel />}
      {normalizedSection === "categories" && <CategoriesPanel />}
      {normalizedSection === "notification-channels" && <NotificationChannelsPanel />}
      {normalizedSection === "notification-templates" && <NotificationTemplatesPanel />}
      {normalizedSection === "academic-periods" && <AcademicPeriodsPanel />}
      {normalizedSection === "permissions" && <PermissionsPanel />}
      {(["announcements", "manage-notifications"].includes(normalizedSection)) && (
        <div className="grid gap-4">
          <AdminNotificationSenderPanel />
          <SentNotificationsPanel title="Thông báo đã gửi" description="Các thông báo được gửi từ tài khoản admin của bạn" />
        </div>
      )}
      {normalizedSection === "notifications" && (
        <NotificationsPanel title="Thông báo" description="Các thông báo admin đã nhận" />
      )}
      {normalizedSection === "settings" && <SettingsPanel />}
      {normalizedSection === "personal-profile" && <PersonalProfilePanel />}
    </div>
  )
}
