"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Award,
  Ban,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Edit3,
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
  rejected: { label: "Bị từ chối", className: "bg-destructive/10 text-destructive border-destructive/20" },
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

function buildPayload(form) {
  const payload = {
    title: form.title.trim(),
    description: form.description.trim(),
    location: form.location.trim(),
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
    description: activity.description || "",
    location: activity.location || "",
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

function ActivityForm({ initialActivity, actionLoading, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => buildFormFromActivity(initialActivity))
  const isEditing = !!initialActivity

  useEffect(() => {
    setForm(buildFormFromActivity(initialActivity))
  }, [initialActivity])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const submit = async (event, submitAfterCreate = false) => {
    event.preventDefault()

    if (!form.title.trim() || !form.startTime || !form.endTime) {
      window.alert("Vui lòng nhập tiêu đề, thời gian bắt đầu và thời gian kết thúc.")
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
          <Label htmlFor="location">Địa điểm</Label>
          <Input id="location" name="location" value={form.location} onChange={handleChange} />
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
          <Button type="button" variant="outline" onClick={onCancel}>
            Hủy
          </Button>
        )}
        <Button type="submit" disabled={actionLoading}>
          {actionLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />}
          {isEditing ? "Lưu thay đổi" : "Lưu bản nháp"}
        </Button>
        {!isEditing && (
          <Button type="button" variant="secondary" disabled={actionLoading} onClick={(event) => submit(event, true)}>
            <Send className="mr-2 size-4" />
            Tạo và gửi duyệt
          </Button>
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

function ActivityCard({ activity, actionLoading, onEdit, onSubmit, onDelete, onCancelRequest }) {
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
            {canEdit && (
              <Button size="sm" variant="outline" onClick={() => onEdit(activity)} disabled={actionLoading}>
                <Edit3 className="mr-1 size-4" />
                Sửa
              </Button>
            )}
            {canSubmit && (
              <Button size="sm" onClick={() => onSubmit(activity.id)} disabled={actionLoading}>
                <Send className="mr-1 size-4" />
                Gửi duyệt
              </Button>
            )}
            {canCancel && (
              <Button size="sm" variant="outline" onClick={() => onCancelRequest(activity.id)} disabled={actionLoading}>
                <Ban className="mr-1 size-4" />
                Yêu cầu hủy
              </Button>
            )}
            {canDelete && (
              <Button
                size="sm"
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(activity.id)}
                disabled={actionLoading}
              >
                <Trash2 className="mr-1 size-4" />
                Xóa
              </Button>
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
              <Loader2 className="size-4 animate-spin" />
              Đang tải hoạt động...
            </div>
          ) : data.activities.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Chưa có hoạt động nào.</div>
          ) : (
            data.activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                actionLoading={data.actionLoading}
                onEdit={setEditingActivity}
                onSubmit={data.submitActivity}
                onDelete={handleDelete}
                onCancelRequest={handleCancelRequest}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingActivity} onOpenChange={(open) => !open && setEditingActivity(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Sửa hoạt động</DialogTitle>
            <DialogDescription>Chỉ có thể sửa các hoạt động Draft, Pending hoặc Rejected.</DialogDescription>
          </DialogHeader>
          <ActivityForm
            initialActivity={editingActivity}
            actionLoading={data.actionLoading}
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
        <ActivityForm actionLoading={data.actionLoading} onSubmit={data.createActivity} />
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

function AttendancePanel({ data }) {
  const [selectedActivityId, setSelectedActivityId] = useState("")
  const ongoingActivities = useMemo(() => data.activities.filter((activity) => activity.statusKey === "ongoing"), [data.activities])
  const registrations = selectedActivityId ? data.registrationsByActivity[selectedActivityId] || [] : []
  const approvedRegistrations = registrations.filter((registration) => getStatusKey(registration.status) === "approved")
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
          <CardDescription>Chỉ điểm danh các đăng ký đã duyệt của hoạt động đang diễn ra.</CardDescription>
        </div>
        <ActivitySelect
          activities={ongoingActivities}
          value={selectedActivityId}
          onChange={setSelectedActivityId}
          placeholder="Chọn hoạt động đang diễn ra"
        />
      </CardHeader>
      <CardContent>
        {ongoingActivities.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Không có hoạt động đang diễn ra.</div>
        ) : !selectedActivityId ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Chọn hoạt động để điểm danh.</div>
        ) : approvedRegistrations.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Chưa có đăng ký đã duyệt.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {approvedRegistrations.map((registration) => {
              const attendance = data.attendanceByRegistration[registration.id]
              const checked = attendance?.isPresent === true
              return (
                <div
                  key={registration.id}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-card-foreground">{registration.studentId}</p>
                    <p className="text-sm text-muted-foreground">Đăng ký: {registration.id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={checked}
                      disabled={data.actionLoading}
                      onCheckedChange={(value) => data.checkInRegistration(registration.id, !!value)}
                      aria-label={`Điểm danh ${registration.studentId}`}
                    />
                    <Badge variant="outline" className={checked ? "bg-success/10 text-success border-success/20" : "text-muted-foreground"}>
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
  const [report, setReport] = useState({
    fileUrl: "",
    originalFileName: "",
    contentType: "",
    fileSize: "",
    reviewNote: "",
  })
  const [pointsByRegistration, setPointsByRegistration] = useState({})
  const closedActivities = useMemo(() => data.activities.filter((activity) => activity.statusKey === "closed"), [data.activities])
  const selectedActivity = closedActivities.find((activity) => activity.id === selectedActivityId)
  const registrations = selectedActivityId ? data.registrationsByActivity[selectedActivityId] || [] : []
  const approvedRegistrations = registrations.filter((registration) => getStatusKey(registration.status) === "approved")
  const loadRegistrations = data.loadRegistrations

  useEffect(() => {
    if (selectedActivityId) {
      loadRegistrations(selectedActivityId)
    }
  }, [loadRegistrations, selectedActivityId])

  const submitReport = async (event) => {
    event.preventDefault()
    if (!selectedActivityId || !report.fileUrl.trim()) {
      window.alert("Vui lòng chọn hoạt động và nhập URL báo cáo.")
      return
    }

    await data.submitReport(selectedActivityId, {
      fileUrl: report.fileUrl.trim(),
      originalFileName: report.originalFileName.trim(),
      contentType: report.contentType.trim(),
      fileSize: report.fileSize === "" ? undefined : Number(report.fileSize),
      reviewNote: report.reviewNote.trim(),
    })
    setReport({ fileUrl: "", originalFileName: "", contentType: "", fileSize: "", reviewNote: "" })
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Báo cáo sau hoạt động</CardTitle>
          <CardDescription>Nộp báo cáo bằng URL file cho hoạt động đã kết thúc.</CardDescription>
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
              <Label htmlFor="fileUrl">URL file *</Label>
              <Input
                id="fileUrl"
                value={report.fileUrl}
                onChange={(event) => setReport((prev) => ({ ...prev, fileUrl: event.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="originalFileName">Tên file</Label>
                <Input
                  id="originalFileName"
                  value={report.originalFileName}
                  onChange={(event) => setReport((prev) => ({ ...prev, originalFileName: event.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="contentType">Content type</Label>
                <Input
                  id="contentType"
                  placeholder="application/pdf"
                  value={report.contentType}
                  onChange={(event) => setReport((prev) => ({ ...prev, contentType: event.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="fileSize">Dung lượng byte</Label>
                <Input
                  id="fileSize"
                  type="number"
                  min="0"
                  value={report.fileSize}
                  onChange={(event) => setReport((prev) => ({ ...prev, fileSize: event.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="reviewNote">Ghi chú</Label>
                <Textarea
                  id="reviewNote"
                  value={report.reviewNote}
                  onChange={(event) => setReport((prev) => ({ ...prev, reviewNote: event.target.value }))}
                />
              </div>
            </div>
            <Button type="submit" disabled={data.actionLoading || !selectedActivityId}>
              <FileText className="mr-2 size-4" />
              Nộp báo cáo
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cấp điểm</CardTitle>
          <CardDescription>{selectedActivity ? selectedActivity.title : "Chọn hoạt động đã kết thúc để cấp điểm."}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!selectedActivityId ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Chọn hoạt động ở khung báo cáo.</div>
          ) : approvedRegistrations.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Chưa có sinh viên đã duyệt.</div>
          ) : (
            approvedRegistrations.map((registration) => (
              <div key={registration.id} className="rounded-lg border border-border bg-secondary/30 p-3">
                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-card-foreground">{registration.studentId}</p>
                    <p className="text-sm text-muted-foreground">Đăng ký: {registration.id}</p>
                  </div>
                  <Badge variant="outline" className="w-fit">
                    Mặc định {selectedActivity?.trainingPoints ?? 0} điểm
                  </Badge>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    type="number"
                    min="0"
                    placeholder="Điểm"
                    value={pointsByRegistration[registration.id] ?? ""}
                    onChange={(event) =>
                      setPointsByRegistration((prev) => ({
                        ...prev,
                        [registration.id]: event.target.value,
                      }))
                    }
                  />
                  <Button
                    type="button"
                    disabled={data.actionLoading}
                    onClick={() => data.awardPoints(registration.id, pointsByRegistration[registration.id] ?? "")}
                  >
                    <Award className="mr-2 size-4" />
                    Cấp điểm
                  </Button>
                </div>
              </div>
            ))
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
      {activeSection === "my-students" && <StudentsPanel data={data} />}
      {activeSection === "attendance" && <AttendancePanel data={data} />}
      {activeSection === "reports-points" && <ReportsAndPointsPanel data={data} />}
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
