"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { PersonalProfilePanel } from "@/components/profile/personal-profile-panel"
import { NotificationsPanel, SentNotificationsPanel } from "@/components/notifications/notifications-panel"
import { ImportUsersDialog } from "@/components/admin/import-users-dialog"
import { ListPagination, usePagination } from "@/components/list-pagination"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Activity,
  AlertCircle,
  Bell,
  Check,
  DatabaseBackup,
  Download,
  FileBarChart,
  FileText,
  History,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Settings,
  Shield,
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
        message = parsed.message || parsed.error || parsed.result?.message || text
      } catch {
        // Non-JSON error body — keep raw text
        if (!message || /^(undefined|null|<!doctype)/i.test(message.trim())) {
          message = `Yêu cầu thất bại (HTTP ${response.status})`
        }
      }
      throw new Error(message || `HTTP ${response.status}`)
    }

    if (response.status === 204 || response.status === 205) {
      return null
    }
    const contentType = response.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      const text = await response.text()
      if (!text) return null
      return JSON.parse(text)
    }
    return response.blob()
  }

  return { request }
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
  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Bảng điều khiển quản trị"
        description="Quản lý tài khoản, phân quyền, thông báo và cấu hình hệ thống."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AdminStatCard title="Người dùng" value="Quản lý" description="Tạo tài khoản, khóa tài khoản và gán vai trò" icon={Users} />
        <AdminStatCard title="Thông báo" value="Gửi tin" description="Phát thông báo đến các nhóm người dùng" icon={Bell} />
        <AdminStatCard title="Hệ thống" value="Cấu hình" description="Cấu hình, sao lưu và xem nhật ký hệ thống" icon={Settings} />
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
  const [importOpen, setImportOpen] = useState(false)
  const [form, setForm] = useState(emptyUserForm)
  const [busyId, setBusyId] = useState(null)

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

  async function toggleUserStatus(user) {
    setBusyId(user.id)
    try {
      const isInactive = String(user.status || "").toUpperCase() === "INACTIVE"
      if (isInactive) {
        await api.request(`/api/admin/users/${user.id}`, {
          method: "PUT",
          body: JSON.stringify({ status: "ACTIVE" }),
        })
      } else {
        await api.request(`/api/admin/users/${user.id}`, { method: "DELETE" })
      }
      users.refresh()
    } finally {
      setBusyId(null)
    }
  }

  function openImport() {
    setImportOpen(true)
  }

  const rows = Array.isArray(users.data) ? users.data : []
  const rowsPagination = usePagination(rows, [query, roleFilter, statusFilter])
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
            <Button variant="outline" onClick={openImport}><FileText className="mr-2 size-4" /> Import CSV</Button>
            <Button onClick={() => setFormOpen(true)}><Users className="mr-2 size-4" /> Thêm người dùng</Button>
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
            <SelectContent>{roleOptions.map((role) => <SelectItem key={role.id} value={String(role.id)}>{getRoleLabel(role)}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent><SelectItem value="active">Đang hoạt động</SelectItem><SelectItem value="inactive">Không hoạt động</SelectItem></SelectContent>
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
                {rowsPagination.items.map((user) => (
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
                      <Button
                        size="sm"
                        variant={String(user.status || "").toUpperCase() === "INACTIVE" ? "default" : "outline"}
                        disabled={busyId === user.id}
                        onClick={() => toggleUserStatus(user)}
                      >
                        {String(user.status || "").toUpperCase() === "INACTIVE" ? "Mở khóa" : "Khóa"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ListPagination pagination={rowsPagination} />
          </div>
          {users.loading && <div className="p-4 text-sm text-muted-foreground">Đang tải...</div>}
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
              <Label htmlFor="new-user-password">Mật khẩu</Label>
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
      <ImportUsersDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        api={api}
        onImported={() => users.refresh()}
      />
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
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("notifications:refresh"))
      }
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
  const configsPagination = usePagination(visibleConfigs, [visibleConfigs.length])

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
        <CardContent>
          <ErrorBanner message={configs.error} />
          {configs.loading ? "Đang tải..." : (
            <div>
              <div className="grid gap-3">{configsPagination.items.map((cfg) => <ConfigRow key={cfg.key} config={cfg} onSave={updateConfig} />)}</div>
              <ListPagination pagination={configsPagination} />
            </div>
          )}
        </CardContent>
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
  const rowsPagination = usePagination(rows, [rows.length])

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
              {rowsPagination.items.map((backup) => (
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
          <ListPagination pagination={rowsPagination} />
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
  const rowsPagination = usePagination(rows, [rows.length])
  return (
    <div className="grid gap-3">
      {title && <SectionHeader title={title} description={description} />}
      <ErrorBanner message={error} />
      {loading ? <div className="text-sm text-muted-foreground">Đang tải...</div> : rows.length === 0 ? <div className="text-sm text-muted-foreground">Không có dữ liệu.</div> : (
        <div className="overflow-x-auto"><Table><TableHeader><TableRow>{columns.map((col) => <TableHead key={col}>{col}</TableHead>)}</TableRow></TableHeader><TableBody>{rowsPagination.items.map((row, index) => <TableRow key={row.id || index}>{columns.map((col) => <TableCell key={col} className="max-w-64 truncate">{String(row[col] ?? "-")}</TableCell>)}</TableRow>)}</TableBody></Table><ListPagination pagination={rowsPagination} /></div>
      )}
    </div>
  )
}

export function AdminDashboard({ activeSection = "dashboard" }) {
  const normalizedSection = activeSection?.toLowerCase?.() || "dashboard"

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {(normalizedSection === "dashboard") && <AdminOverview />}
      {(["students", "users"].includes(normalizedSection)) && <UsersPanel />}
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
