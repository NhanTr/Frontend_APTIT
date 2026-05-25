"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { PersonalProfilePanel } from "@/components/profile/personal-profile-panel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
  roleId: "4",
}

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
  const overview = useAdminResource(async () => unwrapApi(await api.request("/api/admin/statistics")), [])

  const stats = overview.data || {}
  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Admin Dashboard"
        description="Tổng quan vận hành hệ thống quản lý hoạt động sinh viên."
        action={
          <Button variant="outline" size="sm" onClick={overview.refresh} disabled={overview.loading}>
            <RefreshCw className="mr-2 size-4" /> Làm mới
          </Button>
        }
      />
      <ErrorBanner message={overview.error} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard title="Người dùng" value={stats.totalUsers ?? "-"} description="Tài khoản toàn hệ thống" icon={Users} />
        <AdminStatCard title="Hoạt động" value={stats.totalActivities ?? "-"} description="Tổng số hoạt động" icon={Activity} />
        <AdminStatCard title="Đăng ký" value={stats.totalRegistrations ?? "-"} description="Lượt đăng ký tham gia" icon={FileText} />
        <AdminStatCard title="Điểm đã cấp" value={stats.totalPoints ?? "-"} description="Điểm hoạt động sinh viên" icon={FileBarChart} />
      </div>
      {overview.loading && <div className="text-sm text-muted-foreground">Đang tải thống kê...</div>}
    </div>
  )
}

function ActivityApprovalsPanel() {
  const api = useAdminApi()
  const [filters, setFilters] = useState(emptyActivityFilters)
  const [rejecting, setRejecting] = useState(null)
  const [rejectReason, setRejectReason] = useState("")
  const [conflictReview, setConflictReview] = useState(null)
  const [conflicts, setConflicts] = useState([])
  const [conflictLoading, setConflictLoading] = useState(false)
  const [assigning, setAssigning] = useState(null)
  const [reviewerId, setReviewerId] = useState("")
  const [busyId, setBusyId] = useState(null)

  const activities = useAdminResource(async () => {
    const params = new URLSearchParams({ page: "0", size: "50" })
    if (filters.statuses) params.append("statuses", filters.statuses)
    if (filters.keyword) params.append("keyword", filters.keyword)
    if (filters.location) params.append("location", filters.location)
    if (filters.fromTime) params.append("fromTime", normalizeDateTime(filters.fromTime))
    if (filters.toTime) params.append("toTime", normalizeDateTime(filters.toTime))
    return unwrapApi(await api.request(`/api/admin/activities?${params.toString()}`))
  }, [filters])

  const rows = getPageItems(activities.data)

  async function openConflictReview(activity) {
    setConflictReview(activity)
    setConflictLoading(true)
    try {
      const response = unwrapApi(await api.request(`/api/admin/activities/${activity.id}/schedule-conflicts`))
      setConflicts(Array.isArray(response) ? response : [])
    } finally {
      setConflictLoading(false)
    }
  }

  async function assignReviewer(activity) {
    if (!reviewerId) return
    setAssigning(activity.id)
    try {
      await api.request(`/api/admin/activities/${activity.id}/assign`, {
        method: "PUT",
        body: JSON.stringify({ reviewerId }),
      })
      setReviewerId("")
      activities.refresh()
    } finally {
      setAssigning(null)
    }
  }

  async function approve(id) {
    setBusyId(id)
    try {
      await api.request(`/api/admin/activities/${id}/approve`, { method: "PUT" })
      setConflictReview(null)
      setConflicts([])
      activities.refresh()
    } finally {
      setBusyId(null)
    }
  }

  async function reject() {
    if (!rejecting) return
    setBusyId(rejecting.id)
    try {
      await api.request(`/api/admin/activities/${rejecting.id}/reject`, {
        method: "PUT",
        body: JSON.stringify({ rejectReason: rejectReason || "Không đạt yêu cầu phê duyệt" }),
      })
      setRejecting(null)
      setRejectReason("")
      activities.refresh()
    } finally {
      setBusyId(null)
    }
  }

  async function approveCancel(id) {
    setBusyId(id)
    try {
      await api.request(`/api/admin/activities/${id}/approve-cancel`, { method: "PUT" })
      activities.refresh()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title="Duyệt hoạt động" description="Lọc, kiểm tra và phê duyệt vòng đời hoạt động." />
      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-5">
          <div className="md:col-span-5 flex flex-col gap-2 rounded-lg border bg-muted/30 p-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium">Phân công người duyệt</p>
              <p className="text-xs text-muted-foreground">Chọn reviewer để xử lý hoạt động trước khi duyệt.</p>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Reviewer ID" value={reviewerId} onChange={(e) => setReviewerId(e.target.value)} className="w-full lg:w-72" />
              {assigning && <Button disabled><Loader2 className="mr-2 size-4 animate-spin" /> Đang phân công</Button>}
            </div>
          </div>
          <Select value={filters.statuses} onValueChange={(value) => setFilters((prev) => ({ ...prev, statuses: value }))}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Chờ duyệt</SelectItem>
              <SelectItem value="Approved">Đã duyệt</SelectItem>
              <SelectItem value="Rejected">Bị từ chối</SelectItem>
              <SelectItem value="Cancelled">Đã hủy</SelectItem>
              <SelectItem value="Ongoing">Đang diễn ra</SelectItem>
              <SelectItem value="Closed">Đã đóng</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Từ khóa" value={filters.keyword} onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))} />
          <Input placeholder="Địa điểm" value={filters.location} onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))} />
          <Input type="datetime-local" value={filters.fromTime} onChange={(e) => setFilters((prev) => ({ ...prev, fromTime: e.target.value }))} />
          <Button variant="outline" onClick={() => setFilters(emptyActivityFilters)}>Xóa lọc</Button>
        </CardContent>
      </Card>
      <ErrorBanner message={activities.error} />
      <Card>
        <CardHeader>
          <CardTitle>Danh sách hoạt động</CardTitle>
          <CardDescription>Duyệt/từ chối đề xuất, duyệt yêu cầu hủy và theo dõi trạng thái.</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Đang tải...</div>
          ) : rows.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Không có hoạt động phù hợp.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hoạt động</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Địa điểm</TableHead>
                    <TableHead>Điểm</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div className="font-medium">{activity.title}</div>
                        <div className="text-xs text-muted-foreground">BTC: {activity.organizerId || "-"}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDateTime(activity.startTime)}</TableCell>
                      <TableCell>{activity.location || "-"}</TableCell>
                      <TableCell>{activity.trainingPoints ?? "-"}</TableCell>
                      <TableCell><Badge variant="outline" className={getStatusClass(activity.status)}>{activity.status || "-"}</Badge></TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" disabled={busyId === activity.id} onClick={() => openConflictReview(activity)}>
                            <Check className="mr-1 size-4" /> Kiểm tra & duyệt
                          </Button>
                          <Button size="sm" variant="outline" disabled={busyId === activity.id} onClick={() => setRejecting(activity)}>
                            <X className="mr-1 size-4" /> Từ chối
                          </Button>
                          {String(activity.status).toLowerCase().includes("review") && activity.cancelReason && (
                            <Button size="sm" disabled={busyId === activity.id} onClick={() => approveCancel(activity.id)}>Duyệt hủy</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={!!conflictReview} onOpenChange={(open) => !open && setConflictReview(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kiểm tra trùng lịch trước khi duyệt</DialogTitle>
            <DialogDescription>{conflictReview?.title}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium">Thông tin phân công</div>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input placeholder="Reviewer ID" value={reviewerId} onChange={(e) => setReviewerId(e.target.value)} />
                <Button variant="outline" onClick={() => assignReviewer(conflictReview)} disabled={!reviewerId || assigning === conflictReview?.id || conflictLoading}>
                  <Users className="mr-2 size-4" /> Phân công
                </Button>
              </div>
            </div>
            {conflictLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Đang kiểm tra lịch...</div>
            ) : conflicts.length === 0 ? (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-600">Không phát hiện trùng phòng hoặc trùng khung giờ với hoạt động đã duyệt/đang diễn ra.</div>
            ) : (
              <div className="grid gap-3">
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-700">Có {conflicts.length} xung đột lịch. Vui lòng kiểm tra kỹ trước khi tiếp tục duyệt.</div>
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader><TableRow><TableHead>Hoạt động</TableHead><TableHead>Địa điểm</TableHead><TableHead>Bắt đầu</TableHead><TableHead>Kết thúc</TableHead></TableRow></TableHeader>
                    <TableBody>{conflicts.map((item) => <TableRow key={item.activityId}><TableCell>{item.title}</TableCell><TableCell>{item.location}</TableCell><TableCell>{formatDateTime(item.startTime)}</TableCell><TableCell>{formatDateTime(item.endTime)}</TableCell></TableRow>)}</TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConflictReview(null)}>Đóng</Button>
            <Button onClick={() => approve(conflictReview.id)} disabled={busyId === conflictReview?.id || conflictLoading}>Vẫn duyệt hoạt động</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối hoạt động</DialogTitle>
            <DialogDescription>Nhập lý do để BTC/CLB có thể chỉnh sửa và gửi lại.</DialogDescription>
          </DialogHeader>
          <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Lý do từ chối" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>Hủy</Button>
            <Button variant="destructive" onClick={reject} disabled={busyId === rejecting?.id}>Xác nhận từ chối</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

  const users = useAdminResource(async () => {
    const params = new URLSearchParams()
    if (query) params.append("q", query)
    if (roleFilter) params.append("roleId", roleFilter)
    if (statusFilter) params.append("status", statusFilter)
    return unwrapApi(await api.request(`/api/admin/users?${params.toString()}`))
  }, [query, roleFilter, statusFilter])

  const roles = useAdminResource(async () => unwrapApi(await api.request("/api/admin/roles")), [])
  const roleOptions = Array.isArray(roles.data) ? roles.data : []

  async function createUser() {
    await api.request("/api/admin/users", { method: "POST", body: JSON.stringify({ ...form, roleId: Number(form.roleId) }) })
    setForm(emptyUserForm)
    setFormOpen(false)
    users.refresh()
  }

  async function assignRole(userId, roleId) {
    setBusyId(userId)
    try {
      await api.request(`/api/admin/users/${userId}/role`, { method: "PUT", body: JSON.stringify({ roleId: Number(roleId) }) })
      users.refresh()
    } finally {
      setBusyId(null)
    }
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

  const rows = Array.isArray(users.data) ? users.data : []

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Quản lý người dùng"
        description="Tạo tài khoản, lọc người dùng, phân quyền và khóa tài khoản."
        action={<Button onClick={() => setFormOpen(true)}><Users className="mr-2 size-4" /> Thêm người dùng</Button>}
      />
      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Tìm username/email" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Vai trò" /></SelectTrigger>
            <SelectContent>{roleOptions.map((role) => <SelectItem key={role.id} value={String(role.id)}>{role.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
          </Select>
        </CardContent>
      </Card>
      <ErrorBanner message={users.error || roles.error} />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Username</TableHead><TableHead>Email</TableHead><TableHead>Vai trò</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell><div className="font-medium">{user.username}</div><div className="text-xs text-muted-foreground">{user.id}</div></TableCell>
                    <TableCell>{user.email || "-"}</TableCell>
                    <TableCell>
                      <Select value={String(user.roleId || "")} onValueChange={(value) => assignRole(user.id, value)} disabled={busyId === user.id}>
                        <SelectTrigger className="w-40"><SelectValue placeholder={user.roleName || "Chọn role"} /></SelectTrigger>
                        <SelectContent>{roleOptions.map((role) => <SelectItem key={role.id} value={String(role.id)}>{role.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell><Badge variant="outline" className={getStatusClass(user.status)}>{user.status || "-"}</Badge></TableCell>
                    <TableCell className="text-right"><Button size="sm" variant="outline" disabled={busyId === user.id} onClick={() => deactivateUser(user.id)}>Khóa</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {users.loading && <div className="p-4 text-sm text-muted-foreground">Đang tải...</div>}
        </CardContent>
      </Card>
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tạo người dùng</DialogTitle><DialogDescription>Tạo tài khoản mới và gán vai trò chính.</DialogDescription></DialogHeader>
          <div className="grid gap-3">
            <Label>Username</Label><Input value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} />
            <Label>Email</Label><Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            <Label>Mật khẩu</Label><Input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
            <Label>Họ tên</Label><Input value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} />
            <Label>Vai trò</Label>
            <Select value={form.roleId} onValueChange={(value) => setForm((p) => ({ ...p, roleId: value }))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{roleOptions.map((role) => <SelectItem key={role.id} value={String(role.id)}>{role.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setFormOpen(false)}>Hủy</Button><Button onClick={createUser}>Tạo</Button></DialogFooter>
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
          <div className="grid gap-2"><Label>Vai trò nhận</Label><Select value={form.roleId} onValueChange={(value) => setForm((p) => ({ ...p, roleId: value }))}><SelectTrigger className="w-full"><SelectValue placeholder="Tất cả" /></SelectTrigger><SelectContent>{(roles.data || []).map((role) => <SelectItem key={role.id} value={String(role.id)}>{role.name}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <Button className="w-fit" onClick={send}><Bell className="mr-2 size-4" /> Gửi thông báo</Button>
      </CardContent>
    </Card>
  )
}

function ReportsPanel() {
  const api = useAdminApi()
  const [status, setStatus] = useState("Pending")
  const [rejecting, setRejecting] = useState(null)
  const [reason, setReason] = useState("")
  const [busyId, setBusyId] = useState(null)
  const reports = useAdminResource(async () => {
    const params = new URLSearchParams()
    if (status) params.append("reportStatus", status)
    return unwrapApi(await api.request(`/api/admin/reports?${params.toString()}`))
  }, [status])

  const rows = Array.isArray(reports.data) ? reports.data : []

  async function approveReport(reportId) {
    setBusyId(reportId)
    try {
      await api.request(`/api/admin/reports/${reportId}/approve`, { method: "PATCH" })
      reports.refresh()
    } finally {
      setBusyId(null)
    }
  }

  async function rejectReport() {
    if (!rejecting) return
    setBusyId(rejecting.id)
    try {
      await api.request(`/api/admin/reports/${rejecting.id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ rejectReason: reason || "Báo cáo chưa đạt yêu cầu" }),
      })
      setRejecting(null)
      setReason("")
      reports.refresh()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="grid gap-4">
      <SectionHeader title="Duyệt báo cáo sau hoạt động" description="Xem, duyệt hoặc từ chối báo cáo sau khi hoạt động kết thúc." />
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Trạng thái báo cáo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Chờ duyệt</SelectItem>
              <SelectItem value="Approved">Đã duyệt</SelectItem>
              <SelectItem value="Rejected">Bị từ chối</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={reports.refresh}><RefreshCw className="mr-2 size-4" /> Làm mới</Button>
        </CardContent>
      </Card>
      <ErrorBanner message={reports.error} />
      <Card>
        <CardContent className="p-0">
          {reports.loading ? <div className="p-4 text-sm text-muted-foreground">Đang tải...</div> : rows.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Không có báo cáo phù hợp.</div> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Báo cáo</TableHead><TableHead>Hoạt động</TableHead><TableHead>Người nộp</TableHead><TableHead>Trạng thái</TableHead><TableHead>Ngày nộp</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader>
                <TableBody>{rows.map((report) => <TableRow key={report.id}><TableCell><div className="font-medium">{report.originalFileName || report.fileUrl || report.id}</div><div className="text-xs text-muted-foreground">{report.contentType || report.fileType}</div></TableCell><TableCell>{report.activityId}</TableCell><TableCell>{report.uploadedBy || "-"}</TableCell><TableCell><Badge variant="outline" className={getStatusClass(report.reportStatus)}>{report.reportStatus || "-"}</Badge></TableCell><TableCell>{formatDateTime(report.uploadedAt)}</TableCell><TableCell><div className="flex justify-end gap-2"><Button size="sm" variant="outline" asChild disabled={!report.fileUrl}><a href={report.fileUrl || "#"} target="_blank" rel="noreferrer">Mở file</a></Button><Button size="sm" disabled={busyId === report.id} onClick={() => approveReport(report.id)}>Duyệt</Button><Button size="sm" variant="outline" disabled={busyId === report.id} onClick={() => setRejecting(report)}>Từ chối</Button></div></TableCell></TableRow>)}</TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Từ chối báo cáo</DialogTitle><DialogDescription>Nhập lý do để BTC/CLB nộp lại báo cáo.</DialogDescription></DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Lý do từ chối" />
          <DialogFooter><Button variant="outline" onClick={() => setRejecting(null)}>Hủy</Button><Button variant="destructive" onClick={rejectReport}>Từ chối báo cáo</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatisticsPanel() {
  const api = useAdminApi()
  const activityStats = useAdminResource(async () => unwrapApi(await api.request("/api/admin/statistics/activities")), [])
  const studentStats = useAdminResource(async () => unwrapApi(await api.request("/api/admin/statistics/students")), [])
  const activityRows = activityStats.data?.activities || []
  const studentRows = studentStats.data?.students || []

  return (
    <div className="grid gap-4">
      <SectionHeader title="Thống kê và báo cáo" description="Báo cáo hoạt động và điểm hoạt động sinh viên theo yêu cầu QLHĐ_BM 2, QLHĐ_BM 3." />
      <div className="grid gap-4 md:grid-cols-4">
        <AdminStatCard title="Tổng hoạt động" value={activityStats.data?.totalActivities ?? "-"} description="Trong kỳ lọc" icon={Activity} />
        <AdminStatCard title="Chờ duyệt" value={activityStats.data?.pendingCount ?? "-"} description="Pending" icon={FileText} />
        <AdminStatCard title="Đã duyệt" value={activityStats.data?.approvedCount ?? "-"} description="Approved" icon={Check} />
        <AdminStatCard title="Sinh viên có điểm" value={studentRows.length} description="Theo bộ lọc hiện tại" icon={Users} />
      </div>
      <Card>
        <CardHeader><CardTitle>Báo cáo thống kê hoạt động</CardTitle><CardDescription>Danh sách hoạt động, số sinh viên đăng ký/tham gia và trạng thái.</CardDescription></CardHeader>
        <CardContent><ErrorBanner message={activityStats.error} />{activityStats.loading ? <div className="text-sm text-muted-foreground">Đang tải...</div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Tên hoạt động</TableHead><TableHead>Ban tổ chức</TableHead><TableHead>SV đăng ký</TableHead><TableHead>SV tham gia</TableHead><TableHead>Trạng thái</TableHead></TableRow></TableHeader><TableBody>{activityRows.map((item) => <TableRow key={item.activityId}><TableCell>{item.title}</TableCell><TableCell>{item.organizerName || "-"}</TableCell><TableCell>{item.registeredStudentCount ?? 0}</TableCell><TableCell>{item.attendedStudentCount ?? 0}</TableCell><TableCell><Badge variant="outline" className={getStatusClass(item.status)}>{item.status}</Badge></TableCell></TableRow>)}</TableBody></Table>{activityRows.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">Không có dữ liệu.</div>}</div>}</CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Báo cáo điểm hoạt động sinh viên</CardTitle><CardDescription>Mã sinh viên, lớp/khoa, số hoạt động và tổng điểm.</CardDescription></CardHeader>
        <CardContent><ErrorBanner message={studentStats.error} />{studentStats.loading ? <div className="text-sm text-muted-foreground">Đang tải...</div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Mã SV</TableHead><TableHead>Họ tên</TableHead><TableHead>Lớp</TableHead><TableHead>Khoa</TableHead><TableHead>Số hoạt động</TableHead><TableHead>Tổng điểm</TableHead></TableRow></TableHeader><TableBody>{studentRows.map((item) => <TableRow key={item.studentId}><TableCell>{item.studentCode || item.studentId}</TableCell><TableCell>{item.fullName || "-"}</TableCell><TableCell>{item.className || "-"}</TableCell><TableCell>{item.department || "-"}</TableCell><TableCell>{item.participatedActivityCount ?? 0}</TableCell><TableCell>{item.totalEarnedPoints ?? 0}</TableCell></TableRow>)}</TableBody></Table>{studentRows.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">Không có dữ liệu.</div>}</div>}</CardContent>
      </Card>
    </div>
  )
}

function SettingsPanel() {
  const api = useAdminApi()
  const configs = useAdminResource(async () => unwrapApi(await api.request("/api/admin/system-configs")), [])
  const logs = useAdminResource(async () => unwrapApi(await api.request("/api/admin/system-logs?page=0&size=20")), [])
  const backups = useAdminResource(async () => unwrapApi(await api.request("/api/admin/backups")), [])

  async function updateConfig(key, value) {
    await api.request(`/api/admin/system-configs/${encodeURIComponent(key)}`, { method: "PUT", body: JSON.stringify({ value }) })
    configs.refresh()
  }

  async function createBackup() {
    await api.request("/api/admin/backups/export", { method: "POST" })
    backups.refresh()
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="size-5" /> Cấu hình hệ thống</CardTitle><CardDescription>Cập nhật quy định vận hành mà không cần sửa mã nguồn.</CardDescription></CardHeader>
        <CardContent><ErrorBanner message={configs.error} />{configs.loading ? "Đang tải..." : <div className="grid gap-3">{(configs.data || []).map((cfg) => <ConfigRow key={cfg.key} config={cfg} onSave={updateConfig} />)}</div>}</CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="flex items-center gap-2"><DatabaseBackup className="size-5" /> Sao lưu dữ liệu</CardTitle><CardDescription>Tạo và xem danh sách bản sao lưu.</CardDescription></div><Button onClick={createBackup}>Tạo backup</Button></CardHeader>
        <CardContent><GenericTable rows={Array.isArray(backups.data) ? backups.data : []} loading={backups.loading} error={backups.error} /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><History className="size-5" /> System Logs</CardTitle><CardDescription>Theo dõi thao tác hệ thống gần đây.</CardDescription></CardHeader>
        <CardContent><GenericTable rows={getPageItems(logs.data)} loading={logs.loading} error={logs.error} /></CardContent>
      </Card>
    </div>
  )
}

function ConfigRow({ config, onSave }) {
  const [value, setValue] = useState(config.value ?? "")
  return (
    <div className="grid gap-2 rounded-lg border p-3 md:grid-cols-[1fr_2fr_auto] md:items-center">
      <div><div className="font-medium">{config.key}</div><div className="text-xs text-muted-foreground">{config.description || config.type || "System config"}</div></div>
      <Input value={value} onChange={(e) => setValue(e.target.value)} />
      <Button size="sm" onClick={() => onSave(config.key, value)}><Save className="mr-1 size-4" /> Lưu</Button>
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

export function AdminDashboard({ activeSection = "dashboard" }) {
  const normalizedSection = activeSection?.toLowerCase?.() || "dashboard"

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {(normalizedSection === "dashboard") && <AdminOverview />}
      {(["students", "users"].includes(normalizedSection)) && <UsersPanel />}
      {(["activity-approvals", "activities"].includes(normalizedSection)) && <ActivityApprovalsPanel />}
      {normalizedSection === "announcements" && <AnnouncementsPanel />}
      {normalizedSection === "reports" && <ReportsPanel />}
      {normalizedSection === "statistics" && <StatisticsPanel />}
      {normalizedSection === "settings" && <SettingsPanel />}
      {normalizedSection === "personal-profile" && <PersonalProfilePanel />}
    </div>
  )
}
