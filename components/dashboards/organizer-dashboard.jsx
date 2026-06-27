"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Award,
  Ban,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Edit3,
  Eye,
  FileText,
  Loader2,
  MapPin,
  RefreshCw,
  Send,
  Trash2,
  Users,
  XCircle,
} from "lucide-react"
import { useOrganizerData } from "@/hooks/use-organizer-data"
import { PersonalProfilePanel } from "@/components/profile/personal-profile-panel"
import { NotificationsPanel } from "@/components/notifications/notifications-panel"
import { GuestDashboard } from "@/components/dashboards/guest-dashboard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

const statusMeta = {
  draft: { label: "Bản nháp", className: "bg-muted text-muted-foreground border-border" },
  pending: { label: "Chờ duyệt", className: "bg-warning/10 text-warning border-warning/20" },
  reviewing: { label: "Đang xem xét", className: "bg-primary/10 text-primary border-primary/20" },
  approved: { label: "Đã duyệt", className: "bg-success/10 text-success border-success/20" },
  ongoing: { label: "Đang diễn ra", className: "bg-success/10 text-success border-success/20" },
  closed: { label: "Đã kết thúc", className: "bg-secondary text-secondary-foreground border-border" },
  rejected: { label: "Từ chối", className: "bg-destructive/10 text-destructive border-destructive/20" },
  cancelled: { label: "Đã hủy", className: "bg-destructive/10 text-destructive border-destructive/20" },
}

const registrationMeta = {
  pending: { label: "Chờ duyệt", className: "bg-warning/10 text-warning border-warning/20" },
  approved: { label: "Đã duyệt", className: "bg-success/10 text-success border-success/20" },
  rejected: { label: "Từ chối", className: "bg-destructive/10 text-destructive border-destructive/20" },
  cancelled: { label: "Đã hủy", className: "bg-muted text-muted-foreground border-border" },
}

const emptyForm = {
  title: "",
  description: "",
  roomId: "",
  location: "",
  startTime: "",
  endTime: "",
  registrationDeadline: "",
  maxParticipants: "",
  budget: "",
  sponsor: "",
  targetAudience: "",
  purpose: "",
  trainingPoints: "",
}

function getStatusKey(value) {
  return String(value || "").trim().toLowerCase()
}

function formatDateTime(value) {
  if (!value) return "Chưa có"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

function toDateTimeLocal(value) {
  return value ? String(value).slice(0, 16) : ""
}

function getProgress(activity) {
  if (!activity?.capacity) return 0
  return Math.min(100, (Number(activity.enrolled || 0) / Number(activity.capacity)) * 100)
}

function statusBadge(status) {
  const key = getStatusKey(status)
  const meta = statusMeta[key] || { label: status || "Không rõ", className: "bg-muted text-muted-foreground" }
  return (
    <Badge variant="outline" className={meta.className}>
      {meta.label}
    </Badge>
  )
}

function registrationBadge(status) {
  const key = getStatusKey(status)
  const meta = registrationMeta[key] || { label: status || "Không rõ", className: "bg-muted text-muted-foreground" }
  return (
    <Badge variant="outline" className={meta.className}>
      {meta.label}
    </Badge>
  )
}

function getStudentName(registration) {
  return registration.studentName || registration.studentCode || registration.studentId
}

function attendanceBadge(registration) {
  if (registration.isPresent === true) {
    return <Badge variant="outline" className="bg-success/10 text-success border-success/20">Có mặt</Badge>
  }
  if (registration.isPresent === false) {
    return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Vắng</Badge>
  }
  return <Badge variant="outline" className="bg-muted text-muted-foreground border-border">Chưa điểm danh</Badge>
}

function buildPayload(form) {
  const payload = {
    title: form.title.trim(),
    description: form.description.trim(),
    roomId: form.roomId || "",
    startTime: form.startTime,
    endTime: form.endTime,
    registrationDeadline: form.registrationDeadline || null,
    sponsor: form.sponsor.trim(),
    targetAudience: form.targetAudience.trim(),
    purpose: form.purpose.trim(),
  }

  if (form.maxParticipants !== "") payload.maxParticipants = Number(form.maxParticipants)
  if (form.budget !== "") payload.budget = Number(form.budget)
  if (form.trainingPoints !== "") payload.trainingPoints = Number(form.trainingPoints)

  return payload
}

function buildFormFromActivity(activity) {
  if (!activity) return emptyForm
  return {
    title: activity.title || "",
    description: activity.description || "Chưa có mô tả",
    roomId: activity.roomId || "",
    location: activity.location || "Chưa có địa điểm",
    startTime: toDateTimeLocal(activity.startTime),
    endTime: toDateTimeLocal(activity.endTime),
    registrationDeadline: toDateTimeLocal(activity.registrationDeadline),
    maxParticipants: activity.maxParticipants ?? "",
    budget: activity.budget ?? "",
    sponsor: activity.sponsor || "",
    targetAudience: activity.targetAudience || "",
    purpose: activity.purpose || "",
    trainingPoints: activity.trainingPoints ?? "",
  }
}

function ActivityForm({ initialActivity, actionLoading, rooms = [], onCheckScheduleConflicts, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => buildFormFromActivity(initialActivity))
  const [scheduleConflicts, setScheduleConflicts] = useState([])
  const [checkingSchedule, setCheckingSchedule] = useState(false)
  const isEditing = !!initialActivity

  useEffect(() => {
    setForm(buildFormFromActivity(initialActivity))
  }, [initialActivity])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const roomsByFloor = useMemo(() => {
    return rooms.reduce((groups, room) => {
      const key = `Tang ${room.floor}`
      groups[key] = [...(groups[key] || []), room]
      return groups
    }, {})
  }, [rooms])

  useEffect(() => {
    if (!onCheckScheduleConflicts || !form.roomId || !form.startTime || !form.endTime) {
      setScheduleConflicts([])
      setCheckingSchedule(false)
      return
    }

    let cancelled = false
    const timeoutId = window.setTimeout(async () => {
      setCheckingSchedule(true)
      try {
        const conflicts = await onCheckScheduleConflicts({
          roomId: form.roomId,
          startTime: form.startTime,
          endTime: form.endTime,
        })
        if (!cancelled) {
          setScheduleConflicts(conflicts)
        }
      } catch {
        if (!cancelled) {
          setScheduleConflicts([])
        }
      } finally {
        if (!cancelled) {
          setCheckingSchedule(false)
        }
      }
    }, 350)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [form.endTime, form.roomId, form.startTime, onCheckScheduleConflicts])

  const submit = async (event, submitAfterCreate = false) => {
    event.preventDefault()

    if (!form.title.trim() || !form.roomId || !form.startTime || !form.endTime) {
      window.alert("Vui lòng nhập tiêu đề, phòng học, thời gian bắt đầu và thời gian kết thúc.")
      return
    }

    await onSubmit(buildPayload(form), { submitAfterCreate })
    if (!isEditing) {
      setForm(emptyForm)
    }
  }

  return (
    <form onSubmit={(event) => submit(event, false)} className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="title">Tên hoạt động *</Label>
          <Input id="title" name="title" value={form.title} onChange={handleChange} />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="description">Mô tả</Label>
          <Textarea id="description" name="description" value={form.description} onChange={handleChange} rows={3} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="startTime">Bắt đầu *</Label>
          <Input id="startTime" name="startTime" type="datetime-local" value={form.startTime} onChange={handleChange} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="endTime">Kết thúc *</Label>
          <Input id="endTime" name="endTime" type="datetime-local" value={form.endTime} onChange={handleChange} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="registrationDeadline">Hạn đăng ký</Label>
          <Input
            id="registrationDeadline"
            name="registrationDeadline"
            type="datetime-local"
            value={form.registrationDeadline}
            onChange={handleChange}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="roomId">Phòng học</Label>
          <Select
            value={form.roomId || undefined}
            onValueChange={(value) => setForm((prev) => ({ ...prev, roomId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chon phong hoc" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(roomsByFloor).map(([floor, floorRooms]) => (
                <div key={floor}>
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">{floor}</div>
                  {floorRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.code} - Toa {room.building}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
          {checkingSchedule && <p className="text-xs text-muted-foreground">Dang kiem tra trung lich...</p>}
          {!checkingSchedule && scheduleConflicts.length > 0 && (
            <div className="rounded-md border border-warning/20 bg-warning/5 p-3 text-sm">
              <p className="mb-2 font-medium text-card-foreground">Phong nay dang trung lich</p>
              <div className="flex flex-col gap-1 text-muted-foreground">
                {scheduleConflicts.map((conflict) => (
                  <p key={`${conflict.activityId}-${conflict.startTime}`}>
                    {conflict.title || conflict.activityId}: {formatDateTime(conflict.startTime)} - {formatDateTime(conflict.endTime)}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="maxParticipants">Số lượng tối đa</Label>
          <Input
            id="maxParticipants"
            name="maxParticipants"
            type="number"
            min="1"
            value={form.maxParticipants}
            onChange={handleChange}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="trainingPoints">Điểm rèn luyện</Label>
          <Input
            id="trainingPoints"
            name="trainingPoints"
            type="number"
            min="0"
            value={form.trainingPoints}
            onChange={handleChange}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="budget">Kinh phí</Label>
          <Input id="budget" name="budget" type="number" min="0" value={form.budget} onChange={handleChange} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="sponsor">Đơn vị tài trợ</Label>
          <Input id="sponsor" name="sponsor" value={form.sponsor} onChange={handleChange} />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="targetAudience">Đối tượng tham gia</Label>
          <Input id="targetAudience" name="targetAudience" value={form.targetAudience} onChange={handleChange} />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="purpose">Mục đích</Label>
          <Textarea id="purpose" name="purpose" value={form.purpose} onChange={handleChange} rows={2} />
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Hủy</Button>
        )}
        <Button type="submit" disabled={actionLoading}>
          {actionLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />}
          {isEditing ? "Lưu thay đổi" : "Lưu bản nháp"}
        </Button>
        {!isEditing && (
          <Button type="button" variant="secondary" disabled={actionLoading} onClick={(event) => submit(event, true)}>
            <Send className="mr-2 size-4" />Tạo và gửi duyệt</Button>
        )}
      </div>
    </form>
  )
}

function StatisticsCards({ activities, statistics }) {
  const pending = activities.filter((activity) => activity.statusKey === "pending").length
  const approved = activities.filter((activity) => activity.statusKey === "approved").length
  const participants = statistics?.totalParticipants ?? activities.reduce((sum, activity) => sum + Number(activity.enrolled || 0), 0)

  const items = [
    { label: "Hoạt động", value: statistics?.organizedActivities ?? activities.length, icon: Calendar },
    { label: "Người tham gia", value: participants, icon: Users },
    { label: "Chờ duyệt", value: pending, icon: ClipboardList },
    { label: "Đã duyệt", value: approved, icon: CheckCircle2 },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.label}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-2xl font-semibold text-card-foreground">{item.value}</p>
              </div>
              <Icon className="size-5 text-muted-foreground" />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function ActivityDetailDialog({ activity, open, onOpenChange }) {
  if (!activity) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Sửa hoạt động</DialogTitle>
            <DialogDescription>Chỉ có thể sửa các hoạt động Draft, Pending hoặc Rejected.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {statusBadge(activity.status)}
            {activity.trainingPoints != null && <Badge variant="outline">{activity.trainingPoints} diem</Badge>}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border p-3">
              <p className="text-xs font-medium text-muted-foreground">Thoi gian</p>
              <p className="mt-1 text-sm text-card-foreground">
                {formatDateTime(activity.startTime)} - {formatDateTime(activity.endTime)}
              </p>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="text-xs font-medium text-muted-foreground">Han dang ky</p>
              <p className="mt-1 text-sm text-card-foreground">{formatDateTime(activity.registrationDeadline)}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="text-xs font-medium text-muted-foreground">Phong hoc</p>
              <p className="mt-1 text-sm text-card-foreground">{activity.location || activity.roomCode || "Chua co"}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="text-xs font-medium text-muted-foreground">Dang ky</p>
              <p className="mt-1 text-sm text-card-foreground">
                {activity.enrolled}/{activity.capacity || 0}
              </p>
              <Progress value={getProgress(activity)} className="mt-2 h-2" />
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="text-xs font-medium text-muted-foreground">Kinh phi</p>
              <p className="mt-1 text-sm text-card-foreground">{activity.budget ?? "Chua co"}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="text-xs font-medium text-muted-foreground">Don vi tai tro</p>
              <p className="mt-1 text-sm text-card-foreground">{activity.sponsor || "Chua co"}</p>
            </div>
            <div className="rounded-md border border-border p-3 sm:col-span-2">
              <p className="text-xs font-medium text-muted-foreground">Doi tuong tham gia</p>
              <p className="mt-1 text-sm text-card-foreground">{activity.targetAudience || "Chua co"}</p>
            </div>
          </div>

          <div className="rounded-md border border-border p-3">
            <p className="text-xs font-medium text-muted-foreground">Mo ta</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-card-foreground">{activity.description || "Chưa có mô tả"}</p>
          </div>

          <div className="rounded-md border border-border p-3">
            <p className="text-xs font-medium text-muted-foreground">Muc dich</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-card-foreground">{activity.purpose || "Chua co"}</p>
          </div>

          {activity.cancelReason && (
            <div className="rounded-md border border-warning/20 bg-warning/5 p-3">
              <p className="text-xs font-medium text-muted-foreground">Ly do huy</p>
              <p className="mt-1 text-sm text-card-foreground">{activity.cancelReason}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ActivityParticipantsDialog({ activity, data, open, onOpenChange }) {
  const registrations = activity ? data.registrationsByActivity[activity.id] || [] : []
  const loadRegistrations = data.loadRegistrations

  useEffect(() => {
    if (open && activity?.id) {
      loadRegistrations(activity.id)
    }
  }, [activity?.id, loadRegistrations, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Danh sách sinh viên tham gia</DialogTitle>
          <DialogDescription>{activity?.title || "Hoạt động"}</DialogDescription>
        </DialogHeader>

        {registrations.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Chưa có sinh viên đăng ký.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sinh viên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Lớp / Khoa</TableHead>
                  <TableHead>Đăng ký</TableHead>
                  <TableHead>Điểm danh</TableHead>
                  <TableHead className="text-right">Điểm đã cấp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{getStudentName(registration)}</span>
                        <span className="text-xs text-muted-foreground">
                          {registration.studentCode || registration.studentId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{registration.studentEmail || "Chưa có"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {[registration.className, registration.department].filter(Boolean).join(" / ") || "Chưa có"}
                    </TableCell>
                    <TableCell>{registrationBadge(registration.status)}</TableCell>
                    <TableCell>{attendanceBadge(registration)}</TableCell>
                    <TableCell className="text-right font-semibold">{registration.earnedPoints ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ActivityCard({ activity, actionLoading, onView, onViewParticipants, onEdit, onSubmit, onDelete, onCancelRequest }) {
  const statusKey = activity.statusKey
  const canEdit = ["draft", "pending", "rejected"].includes(statusKey)
  const canDelete = ["draft", "pending"].includes(statusKey)
  const canSubmit = statusKey === "draft"
  const canCancel = statusKey === "approved"

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-2">{statusBadge(activity.status)}</div>
            <h3 className="truncate text-base font-semibold text-card-foreground">{activity.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{activity.description || "Chưa có mô tả"}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => onView(activity)}>
              <Eye className="mr-1 size-4" />
              Chi tiet
            </Button>
            <Button size="sm" variant="outline" onClick={() => onViewParticipants(activity)} disabled={actionLoading}>
              <Users className="mr-1 size-4" />
              Sinh viên
            </Button>
            {canEdit && (
              <Button size="sm" variant="outline" onClick={() => onEdit(activity)} disabled={actionLoading}>
                <Edit3 className="mr-1 size-4" />Sửa</Button>
            )}
            {canSubmit && (
              <Button size="sm" onClick={() => onSubmit(activity.id)} disabled={actionLoading}>
                <Send className="mr-1 size-4" />Gửi duyệt</Button>
            )}
            {canCancel && (
              <Button size="sm" variant="outline" onClick={() => onCancelRequest(activity.id)} disabled={actionLoading}>
                <Ban className="mr-1 size-4" />Yêu cầu hủy</Button>
            )}
            {canDelete && (
              <Button
                size="sm"
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(activity.id)}
                disabled={actionLoading}
              >
                <Trash2 className="mr-1 size-4" />Xóa</Button>
            )}
          </div>
        </div>
        <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
          <div className="flex items-center gap-2">
            <Calendar className="size-4" />
            <span>{formatDateTime(activity.startTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="size-4" />
            <span className="truncate">{activity.location || "Chưa có địa điểm"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="size-4" />
            <span>{activity.trainingPoints ?? 0} điểm</span>
          </div>
        </div>

        {activity.cancelReason && (
          <p className="rounded-md border border-warning/20 bg-warning/5 px-3 py-2 text-sm text-muted-foreground">
            Lý do hủy: {activity.cancelReason}
          </p>
        )}

        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Đăng ký</span>
            <span className="font-medium text-card-foreground">
              {activity.enrolled}/{activity.capacity || 0}
            </span>
          </div>
          <Progress value={getProgress(activity)} className="h-2" />
        </div>
      </div>
    </div>
  )
}

function MyActivitiesPanel({ data }) {
  const [editingActivity, setEditingActivity] = useState(null)
  const [viewingActivity, setViewingActivity] = useState(null)
  const [participantsActivity, setParticipantsActivity] = useState(null)

  const handleDelete = async (activityId) => {
    if (!window.confirm("Xóa hoạt động này?")) return
    await data.deleteActivity(activityId)
  }

  const handleCancelRequest = async (activityId) => {
    const reason = window.prompt("Nhập lý do hủy hoạt động")
    if (!reason?.trim()) return
    await data.requestCancelActivity(activityId, reason.trim())
  }

  return (
    <div className="flex flex-col gap-4">
      <StatisticsCards activities={data.activities} statistics={data.statistics} />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Hoạt động của tôi</CardTitle>
            <CardDescription>Quản lý vòng đời hoạt động theo trạng thái backend</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={data.refreshAll} disabled={data.loading || data.actionLoading}>
            <RefreshCw className="mr-2 size-4" />
            Tải lại
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {data.loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />Đang tải hoạt động...</div>
          ) : data.activities.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Chưa có hoạt động nào.</div>
          ) : (
            data.activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                actionLoading={data.actionLoading}
                onView={setViewingActivity}
                onViewParticipants={setParticipantsActivity}
                onEdit={setEditingActivity}
                onSubmit={data.submitActivity}
                onDelete={handleDelete}
                onCancelRequest={handleCancelRequest}
              />
            ))
          )}
        </CardContent>
      </Card>

      <ActivityDetailDialog
        activity={viewingActivity}
        open={!!viewingActivity}
        onOpenChange={(open) => !open && setViewingActivity(null)}
      />

      <ActivityParticipantsDialog
        activity={participantsActivity}
        data={data}
        open={!!participantsActivity}
        onOpenChange={(open) => !open && setParticipantsActivity(null)}
      />

      <Dialog open={!!editingActivity} onOpenChange={(open) => !open && setEditingActivity(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Sửa hoạt động</DialogTitle>
            <DialogDescription>Chỉ có thể sửa các hoạt động Draft, Pending hoặc Rejected.</DialogDescription>
          </DialogHeader>
          <ActivityForm
            initialActivity={editingActivity}
            actionLoading={data.actionLoading}
            rooms={data.rooms}
            onCheckScheduleConflicts={data.checkScheduleConflicts}
            onCancel={() => setEditingActivity(null)}
            onSubmit={async (payload) => {
              await data.updateActivity(editingActivity.id, payload)
              setEditingActivity(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CreateActivityPanel({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tạo hoạt động</CardTitle>
        <CardDescription>Lưu thành bản nháp hoặc tạo xong gửi duyệt ngay.</CardDescription>
      </CardHeader>
      <CardContent>
        <ActivityForm
          actionLoading={data.actionLoading}
          rooms={data.rooms}
          onCheckScheduleConflicts={data.checkScheduleConflicts}
          onSubmit={data.createActivity}
        />
      </CardContent>
    </Card>
  )
}

function ActivitySelect({ activities, value, onChange, placeholder = "Chọn hoạt động", filter }) {
  const options = filter ? activities.filter(filter) : activities

  return (
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-80">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((activity) => (
          <SelectItem key={activity.id} value={activity.id}>
            {activity.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function StudentsPanel({ data }) {
  const [selectedActivityId, setSelectedActivityId] = useState("")
  const registrations = selectedActivityId ? data.registrationsByActivity[selectedActivityId] || [] : []
  const loadRegistrations = data.loadRegistrations

  useEffect(() => {
    if (selectedActivityId) {
      loadRegistrations(selectedActivityId)
    }
  }, [loadRegistrations, selectedActivityId])

  const reject = async (registration) => {
    const reason = window.prompt("Nhập lý do từ chối đăng ký")
    if (!reason?.trim()) return
    await data.rejectRegistration(registration.activityId, registration.studentId, reason.trim())
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Sinh viên đăng ký</CardTitle>
          <CardDescription>Xem, duyệt hoặc từ chối đăng ký theo từng hoạt động.</CardDescription>
        </div>
        <ActivitySelect activities={data.activities} value={selectedActivityId} onChange={setSelectedActivityId} />
      </CardHeader>
      <CardContent>
        {!selectedActivityId ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Chọn một hoạt động để xem danh sách.</div>
        ) : registrations.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Chưa có đăng ký.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã sinh viên</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày đăng ký</TableHead>
                  <TableHead className="w-44">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((registration) => {
                  const isPending = getStatusKey(registration.status) === "pending"
                  return (
                    <TableRow key={registration.id}>
                      <TableCell className="font-medium">{registration.studentId}</TableCell>
                      <TableCell>{registrationBadge(registration.status)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(registration.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={!isPending || data.actionLoading}
                            onClick={() => data.approveRegistration(registration.activityId, registration.studentId)}
                          >
                            <CheckCircle2 className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-destructive text-destructive hover:bg-destructive/10"
                            disabled={!isPending || data.actionLoading}
                            onClick={() => reject(registration)}
                          >
                            <XCircle className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StudentsPanelV2({ data }) {
  const [selectedActivityId, setSelectedActivityId] = useState("all")
  const isAllActivities = selectedActivityId === "all"
  const activityById = useMemo(
    () => Object.fromEntries(data.activities.map((activity) => [activity.id, activity])),
    [data.activities],
  )
  const withActivityTitle = (registration) => ({
    ...registration,
    activityTitle: activityById[registration.activityId]?.title || registration.activityId || "Chua co",
  })
  const registrations = isAllActivities
    ? data.activities.flatMap((activity) =>
        (data.registrationsByActivity[activity.id] || []).map((registration) => ({
          ...registration,
          activityTitle: activity.title || registration.activityId,
        })),
      )
    : selectedActivityId
      ? (data.registrationsByActivity[selectedActivityId] || []).map(withActivityTitle)
      : []
  const selectedActivity = data.activities.find((activity) => activity.id === selectedActivityId)
  const loadRegistrations = data.loadRegistrations

  const pendingRegistrations = registrations.filter((registration) => {
    const status = getStatusKey(registration.status)
    return status === "pending" || status === "registered"
  })
  const approvedRegistrations = registrations.filter((registration) => getStatusKey(registration.status) === "approved")
  const rejectedRegistrations = registrations.filter((registration) => getStatusKey(registration.status) === "rejected")

  useEffect(() => {
    if (isAllActivities) {
      data.activities.forEach((activity) => {
        if (!data.registrationsByActivity[activity.id]) {
          loadRegistrations(activity.id)
        }
      })
      return
    }

    if (selectedActivityId) {
      loadRegistrations(selectedActivityId)
    }
  }, [data.activities, data.registrationsByActivity, isAllActivities, loadRegistrations, selectedActivityId])

  const reject = async (registration) => {
    const reason = window.prompt("Nhap ly do tu choi dang ky")
    if (!reason?.trim()) return
    await data.rejectRegistration(registration.activityId, registration.studentId, reason.trim())
  }

  const renderRegistrationTable = (items, { showActions = false, showActivity = false, showRejectReason = false } = {}) => {
    if (items.length === 0) {
      return <div className="py-8 text-center text-sm text-muted-foreground">Khong co sinh vien trong nhom nay.</div>
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ma sinh vien</TableHead>
              {showActivity && <TableHead>Hoat dong</TableHead>}
              <TableHead>Trang thai dang ky</TableHead>
              <TableHead>Ngay dang ky</TableHead>
              <TableHead>Nguoi duyet</TableHead>
              {showRejectReason && <TableHead>Ly do</TableHead>}
              {showActions && <TableHead className="w-44">Thao tac</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((registration) => (
              <TableRow key={registration.id}>
                <TableCell className="font-medium">{registration.studentId}</TableCell>
                {showActivity && (
                  <TableCell className="max-w-72">
                    <span className="line-clamp-2 text-card-foreground">{registration.activityTitle}</span>
                  </TableCell>
                )}
                <TableCell>{registrationBadge(registration.status)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDateTime(registration.createdAt)}</TableCell>
                <TableCell className="text-muted-foreground">{registration.approvedBy || "Chua co"}</TableCell>
                {showRejectReason && (
                  <TableCell className="max-w-96 text-muted-foreground">
                    <span className="line-clamp-2">{registration.rejectReason || "Chua co ly do"}</span>
                  </TableCell>
                )}
                {showActions && (
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={data.actionLoading}
                        onClick={() => data.approveRegistration(registration.activityId, registration.studentId)}
                      >
                        <CheckCircle2 className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        disabled={data.actionLoading}
                        onClick={() => reject(registration)}
                      >
                        <XCircle className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Sinh vien dang ky</CardTitle>
            <CardDescription>
              {isAllActivities
                ? "Hoạt động: Tất cả hoạt động"
                : selectedActivity
                ? `Hoat dong: ${selectedActivity.title}`
                : "Chon hoat dong de xem sinh vien cho duyet va da duyet."}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={selectedActivityId} onValueChange={setSelectedActivityId}>
              <SelectTrigger className="w-full sm:w-80">
                <SelectValue placeholder="Chon hoat dong" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả hoạt động</SelectItem>
                {data.activities.map((activity) => (
                  <SelectItem key={activity.id} value={activity.id}>
                    {activity.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedActivityId || data.actionLoading}
              onClick={() => {
                if (isAllActivities) {
                  data.activities.forEach((activity) => loadRegistrations(activity.id))
                  return
                }
                loadRegistrations(selectedActivityId)
              }}
            >
              <RefreshCw className="mr-2 size-4" />Tải lại</Button>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedActivityId ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Chon mot hoat dong de xem danh sach.</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
                <p className="text-sm text-muted-foreground">Cho duyet</p>
                <p className="text-2xl font-semibold text-card-foreground">{pendingRegistrations.length}</p>
              </div>
              <div className="rounded-lg border border-success/20 bg-success/5 p-4">
                <p className="text-sm text-muted-foreground">Da duyet</p>
                <p className="text-2xl font-semibold text-card-foreground">{approvedRegistrations.length}</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <p className="text-sm text-muted-foreground">Da tu choi</p>
                <p className="text-2xl font-semibold text-card-foreground">{rejectedRegistrations.length}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedActivityId && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Danh sach cho duyet</CardTitle>
              <CardDescription>Sinh vien moi dang ky, can BTC/CLB duyet hoac tu choi.</CardDescription>
            </CardHeader>
            <CardContent>{renderRegistrationTable(pendingRegistrations, { showActions: true })}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danh sach da duyet</CardTitle>
              <CardDescription>Sinh vien da duoc xac nhan tham gia hoat dong.</CardDescription>
            </CardHeader>
            <CardContent>{renderRegistrationTable(approvedRegistrations, { showActivity: true })}</CardContent>
          </Card>

          {rejectedRegistrations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Danh sach da tu choi</CardTitle>
                <CardDescription>Cac dang ky da bi tu choi kem ly do.</CardDescription>
              </CardHeader>
              <CardContent>{renderRegistrationTable(rejectedRegistrations, { showRejectReason: true })}</CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

function AttendancePanel({ data }) {
  const [selectedActivityId, setSelectedActivityId] = useState("")
  const attendanceActivities = useMemo(
    () => data.activities.filter((activity) => ["ongoing", "closed"].includes(activity.statusKey)),
    [data.activities],
  )
  const registrations = selectedActivityId ? data.registrationsByActivity[selectedActivityId] || [] : []
  const approvedRegistrations = registrations.filter((registration) => getStatusKey(registration.status) === "approved")
  const getAttendance = (registration) => data.attendanceByRegistration[registration.id] || {
    id: registration.attendanceId,
    registrationId: registration.id,
    isPresent: registration.isPresent,
    checkInTime: registration.checkInTime,
    earnedPoints: registration.earnedPoints,
  }
  const checkedInCount = approvedRegistrations.filter((registration) => Boolean(getAttendance(registration)?.checkInTime)).length
  const presentCount = approvedRegistrations.filter((registration) => getAttendance(registration)?.isPresent === true).length
  const loadRegistrations = data.loadRegistrations

  useEffect(() => {
    if (selectedActivityId) {
      loadRegistrations(selectedActivityId)
    }
  }, [loadRegistrations, selectedActivityId])

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Điểm danh</CardTitle>
          <CardDescription>Điểm danh các đăng ký đã duyệt của hoạt động đang diễn ra hoặc đã kết thúc.</CardDescription>
        </div>
        <ActivitySelect
          activities={attendanceActivities}
          value={selectedActivityId}
          onChange={setSelectedActivityId}
          placeholder="Chọn hoạt động"
        />
      </CardHeader>
      <CardContent>
        {attendanceActivities.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Không có hoạt động đang diễn ra hoặc đã kết thúc.</div>
        ) : !selectedActivityId ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Chọn hoạt động để điểm danh.</div>
        ) : approvedRegistrations.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Chưa có đăng ký đã duyệt.</div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-background px-3 py-2">
                <p className="text-xs text-muted-foreground">Tong da duyet</p>
                <p className="text-xl font-semibold text-card-foreground">{approvedRegistrations.length}</p>
              </div>
              <div className="rounded-lg border border-success/20 bg-success/5 px-3 py-2">
                <p className="text-xs text-muted-foreground">Da check-in</p>
                <p className="text-xl font-semibold text-success">{checkedInCount}</p>
              </div>
              <div className="rounded-lg border border-border bg-background px-3 py-2">
                <p className="text-xs text-muted-foreground">Co mat</p>
                <p className="text-xl font-semibold text-card-foreground">{presentCount}</p>
              </div>
            </div>
            {approvedRegistrations.map((registration) => {
              const attendance = getAttendance(registration)
              const checkedIn = Boolean(attendance?.checkInTime)
              const present = attendance?.isPresent === true
              const checked = present
              return (
                <div
                  key={registration.id}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-card-foreground">{registration.studentId}</p>
                    <p className="text-sm text-muted-foreground">Đăng ký: {registration.id}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge
                      variant="outline"
                      className={checkedIn ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border"}
                    >
                      {checkedIn ? "Da check-in" : "Chua check-in"}
                    </Badge>
                    <Checkbox
                      checked={present}
                      disabled={data.actionLoading}
                      onCheckedChange={(value) => data.checkInRegistration(registration.id, !!value)}
                      aria-label={`Điểm danh ${registration.studentId}`}
                    />
                    <Badge variant="outline" className={present ? "bg-success/10 text-success border-success/20" : "text-muted-foreground"}>
                      {checked ? "Có mặt" : "Chưa điểm danh"}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ReportsAndPointsPanel({ data }) {
  const [selectedActivityId, setSelectedActivityId] = useState("")
  const [reportFile, setReportFile] = useState(null)
  const closedActivities = useMemo(() => data.activities.filter((activity) => activity.statusKey === "closed"), [data.activities])
  const activitiesById = useMemo(() => Object.fromEntries(data.activities.map((activity) => [activity.id, activity])), [data.activities])
  const submittedReports = useMemo(() => {
    if (!selectedActivityId) return data.reports
    return data.reports.filter((report) => report.activityId === selectedActivityId)
  }, [data.reports, selectedActivityId])

  const submitReport = async (event) => {
    event.preventDefault()
    if (!selectedActivityId || !reportFile) {
      window.alert("Vui lòng chọn hoạt động và file Excel báo cáo.")
      return
    }

    await data.submitReport(selectedActivityId, reportFile)
    setReportFile(null)
    event.currentTarget.reset()
  }

  const cancelReport = async (report) => {
    if (!window.confirm("Hủy nộp báo cáo này?")) return
    await data.cancelReport(report.id)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Báo cáo sau hoạt động</CardTitle>
          <CardDescription>Chọn file Excel từ máy tính để nộp báo cáo cho hoạt động đã kết thúc.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitReport} className="flex flex-col gap-4">
            <ActivitySelect
              activities={closedActivities}
              value={selectedActivityId}
              onChange={setSelectedActivityId}
              placeholder="Chọn hoạt động đã kết thúc"
            />
            <div className="flex flex-col gap-2">
              <Label htmlFor="reportFile">File Excel *</Label>
              <Input
                id="reportFile"
                type="file"
                accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(event) => setReportFile(event.target.files?.[0] || null)}
              />
            </div>
            <Button type="submit" disabled={data.actionLoading || !selectedActivityId || !reportFile}>
              <FileText className="mr-2 size-4" />
              Nộp báo cáo
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Báo cáo đã nộp</CardTitle>
            <CardDescription>
              {selectedActivityId ? "Đang lọc theo hoạt động đang chọn." : "Tất cả báo cáo của các hoạt động bạn quản lý."}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={data.refreshAll} disabled={data.loading || data.actionLoading}>
            <RefreshCw className="mr-2 size-4" />
            Tải lại
          </Button>
        </CardHeader>
        <CardContent>
          {submittedReports.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Chưa có báo cáo đã nộp.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Báo cáo</TableHead>
                    <TableHead>Hoạt động</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày nộp</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead className="w-32">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submittedReports.map((report) => {
                    const activity = activitiesById[report.activityId]
                    const statusKey = getStatusKey(report.reportStatus)
                    const canCancelReport = statusKey === "pending" || statusKey === "approved"
                    return (
                      <TableRow key={report.id}>
                        <TableCell>
                          <a className="font-medium text-primary underline-offset-4 hover:underline" href={report.fileUrl} target="_blank" rel="noreferrer">
                            {report.originalFileName || report.fileUrl || report.id}
                          </a>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span>{activity?.title || report.activityId}</span>
                            <span className="text-xs text-muted-foreground">{report.activityId}</span>
                          </div>
                        </TableCell>
                        <TableCell>{statusBadge(report.reportStatus)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDateTime(report.uploadedAt)}</TableCell>
                        <TableCell className="text-muted-foreground">{report.reviewNote || "Chưa có"}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-destructive text-destructive hover:bg-destructive/10"
                            disabled={!canCancelReport || data.actionLoading}
                            onClick={() => cancelReport(report)}
                          >
                            <Ban className="mr-1 size-4" />
                            Hủy
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
function OrganizerManagementDashboard({ activeSection }) {
  const data = useOrganizerData()

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {data.error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {data.error}
        </div>
      )}

      {activeSection === "my-activities" && <MyActivitiesPanel data={data} />}
      {activeSection === "create-activity" && <CreateActivityPanel data={data} />}
      {activeSection === "my-students" && <StudentsPanelV2 data={data} />}
      {activeSection === "attendance" && <AttendancePanel data={data} />}
      {activeSection === "reports-points" && <ReportsAndPointsPanel data={data} />}
      {activeSection === "notifications" && (
        <NotificationsPanel title="Thông báo" description="Cập nhật về hoạt động, báo cáo và đăng ký của bạn" />
      )}
      {activeSection === "personal-profile" && <PersonalProfilePanel />}
    </div>
  )
}

export function OrganizerDashboard({ activeSection = "dashboard" }) {
  if (activeSection === "dashboard") {
    return <GuestDashboard />
  }

  return <OrganizerManagementDashboard activeSection={activeSection} />
}
