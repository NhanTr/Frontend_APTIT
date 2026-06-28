"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Award,
  Ban,
  Bell,
  CalendarDays,
  Check,
  Download,
  Eye,
  FileText,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react"
import { useManagerData } from "@/hooks/use-manager-data"
import { PersonalProfilePanel } from "@/components/profile/personal-profile-panel"
import { NotificationsPanel, SentNotificationsPanel } from "@/components/notifications/notifications-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

const statusMeta = {
  draft: { label: "Bản nháp", className: "bg-muted text-muted-foreground border-border" },
  pending: { label: "Chờ duyệt", className: "bg-warning/10 text-warning border-warning/20" },
  reviewing: { label: "Đang duyệt", className: "bg-primary/10 text-primary border-primary/20" },
  cancellationrequested: { label: "Yêu cầu hủy", className: "bg-warning/10 text-warning border-warning/20" },
  approved: { label: "Đã duyệt", className: "bg-success/10 text-success border-success/20" },
  ongoing: { label: "Đang diễn ra", className: "bg-success/10 text-success border-success/20" },
  closed: { label: "Đã kết thúc", className: "bg-secondary text-secondary-foreground border-border" },
  rejected: { label: "Đã từ chối", className: "bg-destructive/10 text-destructive border-destructive/20" },
  cancelled: { label: "Đã hủy", className: "bg-destructive/10 text-destructive border-destructive/20" },
}

const reportMeta = {
  pending: { label: "Chờ duyệt", className: "bg-warning/10 text-warning border-warning/20" },
  reviewing: { label: "Đang duyệt", className: "bg-primary/10 text-primary border-primary/20" },
  approved: { label: "Đã duyệt", className: "bg-success/10 text-success border-success/20" },
  rejected: { label: "Đã từ chối", className: "bg-destructive/10 text-destructive border-destructive/20" },
  cancelled: { label: "Đã hủy", className: "bg-muted text-muted-foreground border-border" },
}

const statusOptions = [
  { value: "Draft", label: "Bản nháp" },
  { value: "Pending", label: "Chờ duyệt" },
  { value: "Reviewing", label: "Đang duyệt" },
  { value: "CancellationRequested", label: "Yêu cầu hủy" },
  { value: "Approved", label: "Đã duyệt" },
  { value: "Ongoing", label: "Đang diễn ra" },
  { value: "Closed", label: "Đã kết thúc" },
  { value: "Rejected", label: "Đã từ chối" },
  { value: "Cancelled", label: "Đã hủy" },
]
const reportStatusOptions = [
  { value: "Pending", label: "Chờ duyệt" },
  { value: "Reviewing", label: "Đang duyệt" },
  { value: "Approved", label: "Đã duyệt" },
  { value: "Rejected", label: "Đã từ chối" },
  { value: "Cancelled", label: "Đã hủy" },
]
const notificationRoleOptions = [
  { value: "all", label: "Tất cả vai trò", roleId: null },
  { value: "1", label: "admin", roleId: 1 },
  { value: "2", label: "manager", roleId: 2 },
  { value: "3", label: "organizer", roleId: 3 },
  { value: "4", label: "student", roleId: 4 },
]

function getStatusKey(value) {
  return String(value || "").trim().toLowerCase()
}

function formatDateTime(value) {
  if (!value) return "Chưa thiết lập"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function sanitizeFileName(value) {
  return String(value || "thong-ke-sinh-vien")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80) || "thong-ke-sinh-vien"
}

function getColumnName(index) {
  let name = ""
  let current = index + 1

  while (current > 0) {
    const remainder = (current - 1) % 26
    name = String.fromCharCode(65 + remainder) + name
    current = Math.floor((current - 1) / 26)
  }

  return name
}

function createCrc32Table() {
  return Array.from({ length: 256 }, (_, index) => {
    let value = index
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    }
    return value >>> 0
  })
}

const crc32Table = createCrc32Table()

function crc32(bytes) {
  let crc = 0xffffffff
  bytes.forEach((byte) => {
    crc = crc32Table[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  })
  return (crc ^ 0xffffffff) >>> 0
}

function writeUint16(bytes, value) {
  bytes.push(value & 0xff, (value >>> 8) & 0xff)
}

function writeUint32(bytes, value) {
  bytes.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff)
}

function concatBytes(chunks) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0

  chunks.forEach((chunk) => {
    result.set(chunk, offset)
    offset += chunk.length
  })

  return result
}

function createZip(entries) {
  const encoder = new TextEncoder()
  const fileChunks = []
  const centralDirectoryChunks = []
  let offset = 0

  entries.forEach((entry) => {
    const nameBytes = encoder.encode(entry.name)
    const dataBytes = encoder.encode(entry.content)
    const checksum = crc32(dataBytes)
    const localHeader = []

    writeUint32(localHeader, 0x04034b50)
    writeUint16(localHeader, 20)
    writeUint16(localHeader, 0x0800)
    writeUint16(localHeader, 0)
    writeUint16(localHeader, 0)
    writeUint16(localHeader, 0)
    writeUint32(localHeader, checksum)
    writeUint32(localHeader, dataBytes.length)
    writeUint32(localHeader, dataBytes.length)
    writeUint16(localHeader, nameBytes.length)
    writeUint16(localHeader, 0)

    const localHeaderBytes = new Uint8Array([...localHeader, ...nameBytes])
    fileChunks.push(localHeaderBytes, dataBytes)

    const centralHeader = []
    writeUint32(centralHeader, 0x02014b50)
    writeUint16(centralHeader, 20)
    writeUint16(centralHeader, 20)
    writeUint16(centralHeader, 0x0800)
    writeUint16(centralHeader, 0)
    writeUint16(centralHeader, 0)
    writeUint16(centralHeader, 0)
    writeUint32(centralHeader, checksum)
    writeUint32(centralHeader, dataBytes.length)
    writeUint32(centralHeader, dataBytes.length)
    writeUint16(centralHeader, nameBytes.length)
    writeUint16(centralHeader, 0)
    writeUint16(centralHeader, 0)
    writeUint16(centralHeader, 0)
    writeUint16(centralHeader, 0)
    writeUint32(centralHeader, 0)
    writeUint32(centralHeader, offset)

    centralDirectoryChunks.push(new Uint8Array([...centralHeader, ...nameBytes]))
    offset += localHeaderBytes.length + dataBytes.length
  })

  const centralDirectory = concatBytes(centralDirectoryChunks)
  const endRecord = []

  writeUint32(endRecord, 0x06054b50)
  writeUint16(endRecord, 0)
  writeUint16(endRecord, 0)
  writeUint16(endRecord, entries.length)
  writeUint16(endRecord, entries.length)
  writeUint32(endRecord, centralDirectory.length)
  writeUint32(endRecord, offset)
  writeUint16(endRecord, 0)

  return concatBytes([...fileChunks, centralDirectory, new Uint8Array(endRecord)])
}

function downloadXlsxFile(fileName, sheetName, rows) {
  const sheetRows = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((cell, columnIndex) => {
          const ref = `${getColumnName(columnIndex)}${rowIndex + 1}`
          return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(cell)}</t></is></c>`
        })
        .join("")
      return `<row r="${rowIndex + 1}">${cells}</row>`
    })
    .join("")
  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`
  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`
  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`
  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${sheetRows}</sheetData>
</worksheet>`
  const xlsxBytes = createZip([
    { name: "[Content_Types].xml", content: contentTypesXml },
    { name: "_rels/.rels", content: rootRelsXml },
    { name: "xl/workbook.xml", content: workbookXml },
    { name: "xl/_rels/workbook.xml.rels", content: workbookRelsXml },
    { name: "xl/worksheets/sheet1.xml", content: sheetXml },
  ])
  const blob = new Blob([xlsxBytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = `${sanitizeFileName(fileName)}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function downloadStudentStatisticsExcel(students, filters) {
  const rows = [
    ["Thống kê sinh viên tham gia hoạt động"],
    [`Từ: ${filters.fromTime ? formatDateTime(filters.fromTime) : "Tất cả"}`],
    [`Đến: ${filters.toTime ? formatDateTime(filters.toTime) : "Tất cả"}`],
    [`Lớp: ${filters.className || "Tất cả"}`],
    [`Khoa: ${filters.department || "Tất cả"}`],
    [],
    ["STT", "Mã số sinh viên", "Họ tên", "Lớp", "Khoa", "Số hoạt động đã tham gia", "Điểm"],
    ...students.map((student, index) => [
      index + 1,
      student.studentCode || student.studentId || "",
      student.fullName || "",
      student.className || "",
      student.department || "",
      student.participatedActivityCount ?? 0,
      student.totalEarnedPoints ?? 0,
    ]),
  ]

  downloadXlsxFile("thong-ke-sinh-vien", "Thống kê sinh viên", rows)
}

function getProgress(activity) {
  const capacity = Number(activity?.capacity || 0)
  if (!capacity) return 0
  return Math.min(100, (Number(activity.enrolled || 0) / capacity) * 100)
}

function getAttendedCount(activity) {
  return Number(activity?.attended || activity?.attendedStudentCount || activity?.attendedStudents || 0)
}

function isEndedActivity(activity) {
  const statusKey = activity?.statusKey || getStatusKey(activity?.status)
  const endTime = activity?.endTime ? new Date(activity.endTime).getTime() : null

  return ["closed", "completed"].includes(statusKey) || (Number.isFinite(endTime) && endTime <= Date.now())
}

function sortActivitiesWithEndedLast(activities) {
  return activities
    .map((activity, index) => ({ activity, index }))
    .sort((left, right) => {
      const leftEnded = isEndedActivity(left.activity)
      const rightEnded = isEndedActivity(right.activity)

      if (leftEnded !== rightEnded) return leftEnded ? 1 : -1
      return left.index - right.index
    })
    .map(({ activity }) => activity)
}

function statusBadge(status) {
  const key = getStatusKey(status)
  const meta = statusMeta[key] || { label: status || "Không rõ", className: "bg-muted text-muted-foreground border-border" }
  return (
    <Badge variant="outline" className={meta.className}>
      {meta.label}
    </Badge>
  )
}

function reportBadge(status) {
  const key = getStatusKey(status)
  const meta = reportMeta[key] || { label: status || "Không rõ", className: "bg-muted text-muted-foreground border-border" }
  return (
    <Badge variant="outline" className={meta.className}>
      {meta.label}
    </Badge>
  )
}

function StatGrid({ data }) {
  const items = [
    { label: "Hoạt động", value: data.statistics?.totalActivities ?? data.activities.length, icon: CalendarDays },
    { label: "Đã đăng ký", value: data.statistics?.registeredStudents ?? 0, icon: Users },
    { label: "Đã tham gia", value: data.statistics?.attendedStudents ?? 0, icon: Check },
    { label: "Điểm đạt được", value: data.statistics?.totalEarnedPoints ?? 0, icon: FileText },
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

function ActivityFilters({ data }) {
  const [filters, setFilters] = useState(data.activityFilters)

  useEffect(() => {
    setFilters(data.activityFilters)
  }, [data.activityFilters])

  const update = (event) => {
    const { name, value } = event.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    await data.searchActivities(filters)
  }

  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_180px_1fr_auto]">
      <Input name="keyword" value={filters.keyword || ""} onChange={update} placeholder="Tìm theo tên hoặc mô tả" />
      <select
        name="status"
        value={filters.status || ""}
        onChange={update}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">Tất cả trạng thái</option>
        {statusOptions.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>
      <Input name="location" value={filters.location || ""} onChange={update} placeholder="Địa điểm" />
      <Button type="submit" disabled={data.loading}>
        <Search className="mr-2 size-4" />
        Tìm kiếm
      </Button>
    </form>
  )
}

function ConflictList({ conflicts }) {
  if (!conflicts?.length) return null

  return (
    <div className="rounded-md border border-warning/20 bg-warning/5 p-3 text-sm">
      <p className="mb-2 font-medium text-card-foreground">Cảnh báo lịch</p>
      <div className="flex flex-col gap-2">
        {conflicts.map((conflict) => (
          <div key={`${conflict.activityId}-${conflict.startTime}`} className="text-muted-foreground">
            {conflict.warning}: {conflict.title} tại {conflict.location || "địa điểm chưa rõ"} ({formatDateTime(conflict.startTime)})
          </div>
        ))}
      </div>
    </div>
  )
}

function ActivityRow({ activity, data, onViewDetails }) {
  const statusKey = getStatusKey(activity.status)
  const isCancellationRequested = statusKey === "cancellationrequested"
  const conflicts = data.conflictsByActivity[activity.id]
  const attended = getAttendedCount(activity)

  const rejectCancel = async () => {
    const reason = window.prompt("Lý do từ chối yêu cầu hủy")
    if (!reason?.trim()) return
    await data.rejectCancelRequest(activity.id, reason.trim())
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {statusBadge(activity.status)}
              {activity.trainingPoints != null && <Badge variant="outline">{activity.trainingPoints} điểm</Badge>}
            </div>
            <h3 className="truncate text-base font-semibold text-card-foreground">{activity.title || "Hoạt động chưa có tên"}</h3>
            <div className="mt-2 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4" />
                <span>{formatDateTime(activity.startTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="size-4" />
                <span className="truncate">{activity.location || "Chưa có địa điểm"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="size-4" />
                <span className="truncate">{activity.organizerName}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => onViewDetails(activity)} disabled={data.actionLoading}>
              <Eye className="mr-1 size-4" />
              Xem chi tiết
            </Button>
            <Button size="sm" variant="outline" onClick={() => data.loadScheduleConflicts(activity.id)} disabled={data.actionLoading}>
              <AlertCircle className="mr-1 size-4" />
              Kiểm tra lịch
            </Button>
            {isCancellationRequested && (
              <>
                <Button size="sm" onClick={() => data.approveCancelRequest(activity.id)} disabled={data.actionLoading}>
                  <Check className="mr-1 size-4" />
                  Duyệt hủy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/10"
                  onClick={rejectCancel}
                  disabled={data.actionLoading}
                >
                  <X className="mr-1 size-4" />
                  Giữ hoạt động
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-md border border-border bg-background px-3 py-2">
            <p className="text-xs text-muted-foreground">Sức chứa</p>
            <p className="text-sm font-semibold text-card-foreground">{activity.capacity || 0}</p>
          </div>
          <div className="rounded-md border border-border bg-background px-3 py-2">
            <p className="text-xs text-muted-foreground">Sinh viên đăng ký</p>
            <p className="text-sm font-semibold text-card-foreground">{activity.enrolled || 0}</p>
          </div>
          <div className="rounded-md border border-success/20 bg-success/5 px-3 py-2">
            <p className="text-xs text-muted-foreground">Sinh viên tham gia</p>
            <p className="text-sm font-semibold text-success">{attended}</p>
          </div>
        </div>

        {activity.cancelReason && (
          <p className="rounded-md border border-warning/20 bg-warning/5 px-3 py-2 text-sm text-muted-foreground">
            Lý do hủy: {activity.cancelReason}
          </p>
        )}

        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tỷ lệ đăng ký</span>
            <span className="font-medium text-card-foreground">
              {activity.enrolled}/{activity.capacity || 0}
            </span>
          </div>
          <Progress value={getProgress(activity)} className="h-2" />
        </div>

        <ConflictList conflicts={conflicts} />
      </div>
    </div>
  )
}

function ActivityDetailPanel({ activity, data, onClose }) {
  if (!activity) return null

  const statusKey = getStatusKey(activity.status)
  const canReviewDecision = statusKey === "reviewing"
  const canCancelApproved = statusKey === "approved" || statusKey === "ongoing"

  const rejectActivity = async () => {
    const reason = window.prompt("Lý do từ chối")
    if (!reason?.trim()) return
    await data.rejectActivity(activity.id, reason.trim())
    onClose()
  }

  const approveActivity = async () => {
    await data.approveActivity(activity.id)
    onClose()
  }

  const cancelApprovedActivity = async () => {
    const reason = window.prompt("Lý do hủy")
    if (!reason?.trim()) return
    await data.cancelApprovedActivity(activity.id, reason.trim())
    onClose()
  }

  return (
    <Dialog open={Boolean(activity)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <DialogTitle>{activity.title || "Hoạt động chưa có tên"}</DialogTitle>
              <DialogDescription>
                {activity.id} - {activity.organizerName}
              </DialogDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusBadge(activity.status)}
            </div>
          </div>
        </DialogHeader>
        <div className="grid gap-4">
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Địa điểm</p>
            <p className="font-medium text-card-foreground">{activity.location || "Chưa có địa điểm"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Lịch diễn ra</p>
            <p className="font-medium text-card-foreground">
              {formatDateTime(activity.startTime)} - {formatDateTime(activity.endTime)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Hạn đăng ký</p>
            <p className="font-medium text-card-foreground">{formatDateTime(activity.registrationDeadline)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Đăng ký</p>
            <p className="font-medium text-card-foreground">
              {activity.enrolled}/{activity.capacity || 0}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Sinh viên tham gia</p>
            <p className="font-medium text-card-foreground">{getAttendedCount(activity)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Điểm rèn luyện</p>
            <p className="font-medium text-card-foreground">{activity.trainingPoints ?? "Chưa thiết lập"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Nhà tài trợ</p>
            <p className="font-medium text-card-foreground">{activity.sponsor || "Chưa thiết lập"}</p>
          </div>
        </div>

        <div className="grid gap-2">
          <p className="text-sm text-muted-foreground">Mô tả</p>
          <p className="rounded-md border border-border bg-background p-3 text-sm text-card-foreground">
            {activity.description || "Chưa có mô tả"}
          </p>
        </div>

        <div className="grid gap-2">
          <p className="text-sm text-muted-foreground">Mục đích</p>
          <p className="rounded-md border border-border bg-background p-3 text-sm text-card-foreground">
            {activity.purpose || "Chưa có mục đích"}
          </p>
        </div>

        {activity.cancelReason && (
          <p className="rounded-md border border-warning/20 bg-warning/5 px-3 py-2 text-sm text-muted-foreground">
            Lý do hủy: {activity.cancelReason}
          </p>
        )}

        </div>
        <DialogFooter className="flex flex-wrap justify-end gap-2 sm:justify-end">
          {canCancelApproved && (
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10"
              onClick={cancelApprovedActivity}
              disabled={data.actionLoading}
            >
              <Ban className="mr-2 size-4" />
              Hủy hoạt động
            </Button>
          )}
          {canReviewDecision && (
            <>
              <Button onClick={approveActivity} disabled={data.actionLoading}>
                <Check className="mr-2 size-4" />
                Duyệt
              </Button>
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10"
                onClick={rejectActivity}
                disabled={data.actionLoading}
              >
                <X className="mr-2 size-4" />
                Từ chối
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ActivityApprovalTable({ data, mode = "all" }) {
  const [selectedActivity, setSelectedActivity] = useState(null)

  const filteredActivities = useMemo(() => {
    const activities =
      mode === "pending"
        ? data.activities.filter((activity) => ["pending", "reviewing", "cancellationrequested"].includes(activity.statusKey))
        : data.activities

    return sortActivitiesWithEndedLast(activities)
  }, [data.activities, mode])

  const viewDetails = async (activity) => {
    if (activity.statusKey === "pending") {
      const reviewingActivity = await data.startActivityReview(activity.id)
      setSelectedActivity(reviewingActivity)
      return
    }

    setSelectedActivity(activity)
  }

  return (
    <div className="flex flex-col gap-4">
      <ActivityDetailPanel activity={selectedActivity} data={data} onClose={() => setSelectedActivity(null)} />
      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{mode === "pending" ? "Duyệt hoạt động" : "Tất cả hoạt động"}</CardTitle>
              <CardDescription>Theo dõi trạng thái, chi tiết, yêu cầu hủy và trùng lịch.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={data.refreshAll} disabled={data.loading || data.actionLoading}>
              <RefreshCw className="mr-2 size-4" />
              Tải lại
            </Button>
          </div>
          <ActivityFilters data={data} />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {data.loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Đang tải hoạt động...
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Không tìm thấy hoạt động.</div>
          ) : (
            filteredActivities.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} data={data} onViewDetails={viewDetails} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StudentStatisticsPanel({ data }) {
  const [filters, setFilters] = useState(data.studentStatisticFilters)

  useEffect(() => {
    setFilters(data.studentStatisticFilters)
  }, [data.studentStatisticFilters])

  const students = data.studentStatistics?.students || []
  const totalParticipated = students.reduce((sum, student) => sum + Number(student.participatedActivityCount || 0), 0)
  const totalPoints = students.reduce((sum, student) => sum + Number(student.totalEarnedPoints || 0), 0)

  const update = (event) => {
    const { name, value } = event.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    await data.searchStudentStatistics(filters)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Sinh viên</p>
              <p className="text-2xl font-semibold text-card-foreground">{students.length}</p>
            </div>
            <Users className="size-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Lượt tham gia</p>
              <p className="text-2xl font-semibold text-card-foreground">{totalParticipated}</p>
            </div>
            <Check className="size-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Tổng điểm</p>
              <p className="text-2xl font-semibold text-card-foreground">{totalPoints}</p>
            </div>
            <Award className="size-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Thống kê sinh viên tham gia hoạt động</CardTitle>
              <CardDescription>Mã sinh viên, họ tên, lớp, số hoạt động đã tham gia và điểm rèn luyện.</CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadStudentStatisticsExcel(students, data.studentStatisticFilters)}
                disabled={data.loading || students.length === 0}
              >
                <Download className="mr-2 size-4" />
                Tải Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => data.searchStudentStatistics(filters)} disabled={data.loading || data.actionLoading}>
                <RefreshCw className="mr-2 size-4" />
                Tải lại
              </Button>
            </div>
          </div>
          <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
            <Input type="datetime-local" name="fromTime" value={filters.fromTime || ""} onChange={update} />
            <Input type="datetime-local" name="toTime" value={filters.toTime || ""} onChange={update} />
            <Input name="className" value={filters.className || ""} onChange={update} placeholder="Lớp" />
            <Input name="department" value={filters.department || ""} onChange={update} placeholder="Khoa" />
            <Button type="submit" disabled={data.loading}>
              <Search className="mr-2 size-4" />
              Lọc
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          {data.loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Đang tải thống kê...
            </div>
          ) : students.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Chưa có dữ liệu sinh viên tham gia.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã số sinh viên</TableHead>
                    <TableHead>Tên</TableHead>
                    <TableHead>Lớp</TableHead>
                    <TableHead className="text-right">Số hoạt động đã tham gia</TableHead>
                    <TableHead className="text-right">Điểm</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.studentId || student.studentCode}>
                      <TableCell className="font-medium">{student.studentCode || student.studentId || "Chưa có"}</TableCell>
                      <TableCell>{student.fullName || "Chưa có"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {[student.className, student.department].filter(Boolean).join(" / ") || "Chưa có"}
                      </TableCell>
                      <TableCell className="text-right font-medium">{student.participatedActivityCount ?? 0}</TableCell>
                      <TableCell className="text-right font-semibold">{student.totalEarnedPoints ?? 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ReportsPanel({ data }) {
  const [filters, setFilters] = useState(data.reportFilters)

  useEffect(() => {
    setFilters(data.reportFilters)
  }, [data.reportFilters])

  const activitiesById = useMemo(() => {
    return Object.fromEntries(data.activities.map((activity) => [activity.id, activity]))
  }, [data.activities])

  const update = (event) => {
    const { name, value } = event.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    await data.searchReports(filters)
  }

  const rejectReport = async (report) => {
    const reason = window.prompt("Lý do từ chối báo cáo")
    if (!reason?.trim()) return
    await data.rejectReport(report.id, reason.trim())
  }

  const downloadReport = async (report) => {
    const downloadWindow = window.open("about:blank", "_blank")
    try {
      const updatedReport = await data.downloadReport(report.id)
      const fileUrl = updatedReport?.fileUrl || report.fileUrl
      if (fileUrl && downloadWindow) {
        downloadWindow.location.href = fileUrl
      } else if (fileUrl) {
        window.open(fileUrl, "_blank", "noopener,noreferrer")
      } else {
        downloadWindow?.close()
      }
    } catch (error) {
      downloadWindow?.close()
      throw error
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Báo cáo sau hoạt động</CardTitle>
            <CardDescription>Duyệt báo cáo sau hoạt động và chốt điểm chính thức.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={data.refreshAll} disabled={data.loading || data.actionLoading}>
            <RefreshCw className="mr-2 size-4" />
            Tải lại
          </Button>
        </div>
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <Input name="activityId" value={filters.activityId || ""} onChange={update} placeholder="Mã hoạt động" />
          <select
            name="reportStatus"
            value={filters.reportStatus || ""}
            onChange={update}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            {reportStatusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={data.loading}>
            <Search className="mr-2 size-4" />
            Tìm kiếm
          </Button>
        </form>
      </CardHeader>
      <CardContent>
        {data.loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Đang tải báo cáo...
          </div>
        ) : data.reports.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Không tìm thấy báo cáo.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Báo cáo</TableHead>
                  <TableHead>Hoạt động</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Đã tải lên</TableHead>
                  <TableHead className="w-48">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.reports.map((report) => {
                  const statusKey = getStatusKey(report.reportStatus)
                  const canDownload = statusKey === "pending" || statusKey === "reviewing"
                  const canReviewDecision = statusKey === "reviewing"
                  const activity = activitiesById[report.activityId]

                  return (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <a className="font-medium text-primary underline-offset-4 hover:underline" href={report.fileUrl} target="_blank" rel="noreferrer">
                            {report.originalFileName || report.fileUrl || report.id}
                          </a>
                          <span className="text-xs text-muted-foreground">{report.reviewNote || "Chưa có ghi chú"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span>{activity?.title || report.activityId}</span>
                          <span className="text-xs text-muted-foreground">{report.activityId}</span>
                        </div>
                      </TableCell>
                      <TableCell>{reportBadge(report.reportStatus)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(report.uploadedAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!canDownload || data.actionLoading}
                            onClick={() => downloadReport(report)}
                            title="Tải báo cáo"
                            aria-label="Tải báo cáo"
                          >
                            <Download className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            disabled={!canReviewDecision || data.actionLoading}
                            onClick={() => data.approveReport(report.id)}
                            title="Duyệt báo cáo"
                            aria-label="Duyệt báo cáo"
                          >
                            <Check className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-destructive text-destructive hover:bg-destructive/10"
                            disabled={!canReviewDecision || data.actionLoading}
                            onClick={() => rejectReport(report)}
                            title="Từ chối báo cáo"
                            aria-label="Từ chối báo cáo"
                          >
                            <X className="size-4" />
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

function NotificationPanel({ data }) {
  const [form, setForm] = useState({
    title: "",
    content: "",
    recipientMode: "roles",
    roleId: "all",
    userIds: "",
    className: "",
    department: "",
  })

  const update = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
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

  const submit = async (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.content.trim()) {
      window.alert("Vui lòng nhập tiêu đề và nội dung.")
      return
    }

    const userIds = form.userIds
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)

    if (form.recipientMode === "manual") {
      if (userIds.length === 0) {
        window.alert("Nhập ít nhất một user ID.")
        return
      }

      await data.sendNotification({
        title: form.title.trim(),
        content: form.content.trim(),
        type: "Hệ thống",
        userIds,
      })
    } else {
      const selectedRole = notificationRoleOptions.find((role) => role.value === form.roleId)
      await data.broadcastNotification({
        title: form.title.trim(),
        content: form.content.trim(),
        roleId: selectedRole?.roleId ?? null,
        className: form.className.trim() || null,
        department: form.department.trim() || null,
      })
    }

    resetForm()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gửi thông báo thủ công</CardTitle>
        <CardDescription>Gửi thông báo theo vai trò hoặc danh sách user ID nhập tay.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="grid gap-2">
              <Label htmlFor="notify-title">Tiêu đề</Label>
              <Input id="notify-title" name="title" value={form.title} onChange={update} />
            </div>
            <div className="grid gap-2">
              <Label>Người nhận</Label>
              <RadioGroup
                value={form.recipientMode}
                onValueChange={(value) => setForm((prev) => ({ ...prev, recipientMode: value }))}
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
                <Label htmlFor="notify-role">Vai trò nhận</Label>
                <Select value={form.roleId} onValueChange={(value) => setForm((prev) => ({ ...prev, roleId: value }))}>
                  <SelectTrigger id="notify-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {notificationRoleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notify-department">Khoa</Label>
                <Input id="notify-department" name="department" value={form.department} onChange={update} placeholder="CNTT" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notify-class">Lớp</Label>
                <Input id="notify-class" name="className" value={form.className} onChange={update} placeholder="D20CQCN01-B" />
              </div>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="notify-users">ID người nhận</Label>
              <Input id="notify-users" name="userIds" value={form.userIds} onChange={update} placeholder="id1, id2, id3" />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="notify-content">Nội dung</Label>
            <Textarea id="notify-content" name="content" rows={3} value={form.content} onChange={update} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={data.actionLoading}>
              {data.actionLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Bell className="mr-2 size-4" />}
              Gửi
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function ManagerOverview({ data }) {
  const pendingCount = data.activities.filter((activity) => activity.statusKey === "pending").length
  const reviewingCount = data.activities.filter((activity) => activity.statusKey === "cancellationrequested").length
  const pendingReports = data.reports.filter((report) => getStatusKey(report.reportStatus) === "pending").length

  return (
    <div className="flex flex-col gap-4">
      <StatGrid data={data} />
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Hoạt động chờ duyệt</p>
            <p className="text-2xl font-semibold">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Yêu cầu hủy</p>
            <p className="text-2xl font-semibold">{reviewingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Báo cáo chờ duyệt</p>
            <p className="text-2xl font-semibold">{pendingReports}</p>
          </CardContent>
        </Card>
      </div>
      <ActivityApprovalTable data={data} mode="pending" />
    </div>
  )
}

export function ManagerDashboard({ activeSection = "dashboard" }) {
  const data = useManagerData()

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {data.error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {data.error}
        </div>
      )}

      {activeSection === "dashboard" && <ManagerOverview data={data} />}
      {activeSection === "activity-approvals" && <ActivityApprovalTable data={data} />}
      {activeSection === "student-statistics" && <StudentStatisticsPanel data={data} />}
      {activeSection === "reports" && <ReportsPanel data={data} />}
      {activeSection === "manage-notifications" && (
        <div className="grid gap-4">
          <NotificationPanel data={data} />
          <SentNotificationsPanel title="Thông báo đã gửi" description="Các thông báo được gửi từ tài khoản của bạn" />
        </div>
      )}
      {activeSection === "notifications" && (
        <NotificationsPanel title="Thông báo" description="Các thông báo bạn đã nhận" />
      )}
      {activeSection === "personal-profile" && <PersonalProfilePanel />}
    </div>
  )
}
