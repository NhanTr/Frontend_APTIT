"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Award,
  Ban,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Download,
  Edit3,
  Eye,
  FileText,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Users,
  XCircle,
} from "lucide-react"
import { useOrganizerData } from "@/hooks/use-organizer-data"
import { ListPagination, usePagination } from "@/components/list-pagination"
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

const statusOptions = [
  { value: "Draft", label: "Bản nháp" },
  { value: "Pending", label: "Chờ duyệt" },
  { value: "Reviewing", label: "Đang xem xét" },
  { value: "Approved", label: "Đã duyệt" },
  { value: "Ongoing", label: "Đang diễn ra" },
  { value: "Closed", label: "Đã kết thúc" },
  { value: "Rejected", label: "Từ chối" },
  { value: "Cancelled", label: "Đã hủy" },
]

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

function getCurrentDateTimeLocal() {
  const date = new Date()
  const pad = (value) => String(value).padStart(2, "0")

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function getDateTimeValue(value) {
  if (!value) return null
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : null
}

function getProgress(activity) {
  if (!activity?.capacity) return 0
  return Math.min(100, (Number(activity.enrolled || 0) / Number(activity.capacity)) * 100)
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

function pointsBadge(registration, activity) {
  const points = registration.earnedPoints
  if (points != null && points !== undefined) {
    return <Badge variant="outline" className="bg-success/10 text-success border-success/20">{points} điểm</Badge>
  }
  if (registration.isPresent === true) {
    return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Chờ duyệt</Badge>
  }
  return <span className="text-sm text-muted-foreground">—</span>
}

function getRegistrationStatusLabel(status) {
  const key = getStatusKey(status)
  return registrationMeta[key]?.label || status || "Không rõ"
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
  return String(value || "danh-sach-sinh-vien")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80) || "danh-sach-sinh-vien"
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

function downloadActivityRegistrationsExcel(activity, registrations) {
  const headers = [
    "STT",
    "Mã sinh viên",
    "Họ tên",
    "Email",
    "Lớp",
    "Khoa",
    "Trạng thái đăng ký",
    "Ngày đăng ký",
    "Điểm danh",
    "Điểm đã cấp",
  ]
  const rows = registrations.map((registration, index) => [
    index + 1,
    registration.studentCode || registration.studentId || "",
    getStudentName(registration),
    registration.studentEmail || "",
    registration.className || "",
    registration.department || "",
    getRegistrationStatusLabel(registration.status),
    formatDateTime(registration.createdAt),
    registration.isPresent === true ? "Có mặt" : registration.isPresent === false ? "Vắng" : "Chưa điểm danh",
    registration.earnedPoints ?? "",
  ])
  const sheetRows = [
    [activity?.title || "Hoạt động"],
    [`Thời gian: ${formatDateTime(activity?.startTime)}`],
    [],
    headers,
    ...rows,
  ]
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
    <sheet name="Sinh viên" sheetId="1" r:id="rId1"/>
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
  link.download = `${sanitizeFileName(activity?.title)}-sinh-vien.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
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

function validateActivityTimeFields(form, minTime) {
  const now = getDateTimeValue(minTime)
  const startTime = getDateTimeValue(form.startTime)
  const endTime = getDateTimeValue(form.endTime)
  const registrationDeadline = getDateTimeValue(form.registrationDeadline)

  if (startTime !== null && now !== null && startTime < now) {
    return "Thời gian bắt đầu không được ở quá khứ."
  }

  if (endTime !== null && now !== null && endTime < now) {
    return "Thời gian kết thúc không được ở quá khứ."
  }

  if (registrationDeadline !== null && now !== null && registrationDeadline < now) {
    return "Hạn đăng ký không được ở quá khứ."
  }

  if (startTime !== null && endTime !== null && startTime >= endTime) {
    return "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc."
  }

  if (registrationDeadline !== null && startTime !== null && registrationDeadline >= startTime) {
    return "Hạn đăng ký phải nhỏ hơn thời gian bắt đầu."
  }

  return ""
}

function ActivityForm({ initialActivity, actionLoading, rooms = [], onCheckScheduleConflicts, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => buildFormFromActivity(initialActivity))
  const [scheduleConflicts, setScheduleConflicts] = useState([])
  const [checkingSchedule, setCheckingSchedule] = useState(false)
  const isEditing = !!initialActivity
  const minDateTime = useMemo(() => getCurrentDateTimeLocal(), [initialActivity])

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
    const startTime = getDateTimeValue(form.startTime)
    const endTime = getDateTimeValue(form.endTime)

    if (!onCheckScheduleConflicts || !form.roomId || !form.startTime || !form.endTime || startTime >= endTime) {
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

    const timeError = validateActivityTimeFields(form, getCurrentDateTimeLocal())
    if (timeError) {
      window.alert(timeError)
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
          <Input
            id="startTime"
            name="startTime"
            type="datetime-local"
            min={form.registrationDeadline || minDateTime}
            value={form.startTime}
            onChange={handleChange}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="endTime">Kết thúc *</Label>
          <Input
            id="endTime"
            name="endTime"
            type="datetime-local"
            min={form.startTime || minDateTime}
            value={form.endTime}
            onChange={handleChange}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="registrationDeadline">Hạn đăng ký</Label>
          <Input
            id="registrationDeadline"
            name="registrationDeadline"
            type="datetime-local"
            min={minDateTime}
            max={form.startTime || undefined}
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
              <SelectValue placeholder="Chọn phòng học" />
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
          {checkingSchedule && <p className="text-xs text-muted-foreground">Đang kiểm tra trùng lịch...</p>}
          {!checkingSchedule && scheduleConflicts.length > 0 && (
            <div className="rounded-md border border-warning/20 bg-warning/5 p-3 text-sm">
              <p className="mb-2 font-medium text-card-foreground">Phòng này đang trùng lịch</p>
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

function ActivityDetailDialog({ activity, open, onOpenChange }) {
  if (!activity) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Sửa hoạt động</DialogTitle>
            <DialogDescription>Chỉ có thể sửa các hoạt động bản nháp, chờ duyệt hoặc bị từ chối.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {statusBadge(activity.status)}
            {activity.trainingPoints != null && <Badge variant="outline">{activity.trainingPoints} điểm</Badge>}
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
              <p className="text-xs font-medium text-muted-foreground">Phòng học</p>
              <p className="mt-1 text-sm text-card-foreground">{activity.location || activity.roomCode || "Chưa có"}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="text-xs font-medium text-muted-foreground">Đăng ký</p>
              <p className="mt-1 text-sm text-card-foreground">
                {activity.enrolled}/{activity.capacity || 0}
              </p>
              <Progress value={getProgress(activity)} className="mt-2 h-2" />
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="text-xs font-medium text-muted-foreground">Kinh phi</p>
              <p className="mt-1 text-sm text-card-foreground">{activity.budget ?? "Chưa có"}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="text-xs font-medium text-muted-foreground">Đơn vị tài trợ</p>
              <p className="mt-1 text-sm text-card-foreground">{activity.sponsor || "Chưa có"}</p>
            </div>
            <div className="rounded-md border border-border p-3 sm:col-span-2">
              <p className="text-xs font-medium text-muted-foreground">Doi tuong tham gia</p>
              <p className="mt-1 text-sm text-card-foreground">{activity.targetAudience || "Chưa có"}</p>
            </div>
          </div>

          <div className="rounded-md border border-border p-3">
            <p className="text-xs font-medium text-muted-foreground">Mo ta</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-card-foreground">{activity.description || "Chưa có mô tả"}</p>
          </div>

          <div className="rounded-md border border-border p-3">
            <p className="text-xs font-medium text-muted-foreground">Muc dich</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-card-foreground">{activity.purpose || "Chưa có"}</p>
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
  const registrationsPagination = usePagination(registrations, [activity?.id || "", open ? "open" : "closed"])
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
                {registrationsPagination.items.map((registration) => (
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
                    <TableCell>{pointsBadge(registration, activity)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ListPagination pagination={registrationsPagination} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ActivityCard({
  activity,
  actionLoading,
  onView,
  onViewParticipants,
  onExportParticipants,
  onEdit,
  onSubmit,
  onDelete,
  onCancelRequest,
}) {
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
            <Button size="sm" variant="outline" onClick={() => onExportParticipants(activity)} disabled={actionLoading}>
              <Download className="mr-1 size-4" />
              Xuất Excel
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
  const sortedActivities = useMemo(() => sortActivitiesWithEndedLast(data.activities), [data.activities])
  const activitiesPagination = usePagination(sortedActivities, [
    data.activityFilters?.keyword || "",
    data.activityFilters?.status || "",
    data.activityFilters?.location || "",
  ])
  const hasActiveFilters = Boolean(data.activityFilters?.keyword || data.activityFilters?.status || data.activityFilters?.location)

  const handleDelete = async (activityId) => {
    if (!window.confirm("Xóa hoạt động này?")) return
    await data.deleteActivity(activityId)
  }

  const handleCancelRequest = async (activityId) => {
    const reason = window.prompt("Nhập lý do hủy hoạt động")
    if (!reason?.trim()) return
    await data.requestCancelActivity(activityId, reason.trim())
  }

  const handleExportParticipants = async (activity) => {
    const registrations = await data.loadRegistrations(activity.id)
    if (registrations.length === 0) {
      window.alert("Hoạt động này chưa có sinh viên đăng ký.")
      return
    }
    downloadActivityRegistrationsExcel(activity, registrations)
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
          <ActivityFilters data={data} />
          {data.loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />Đang tải hoạt động...</div>
          ) : data.activities.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {hasActiveFilters ? "Không tìm thấy hoạt động phù hợp." : "Chưa có hoạt động nào."}
            </div>
          ) : (
            <>
              {activitiesPagination.items.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  actionLoading={data.actionLoading}
                  onView={setViewingActivity}
                  onViewParticipants={setParticipantsActivity}
                  onExportParticipants={handleExportParticipants}
                  onEdit={setEditingActivity}
                  onSubmit={data.submitActivity}
                  onDelete={handleDelete}
                  onCancelRequest={handleCancelRequest}
                />
              ))}
              <ListPagination pagination={activitiesPagination} />
            </>
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
            <DialogDescription>Chỉ có thể sửa các hoạt động bản nháp, chờ duyệt hoặc bị từ chối.</DialogDescription>
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
  const options = sortActivitiesWithEndedLast(filter ? activities.filter(filter) : activities)

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
  const registrationsPagination = usePagination(registrations, [selectedActivityId])
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
                {registrationsPagination.items.map((registration) => {
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
            <ListPagination pagination={registrationsPagination} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StudentsPanelV2({ data }) {
  const [selectedActivityId, setSelectedActivityId] = useState("all")
  const isAllActivities = selectedActivityId === "all"
  const sortedActivities = useMemo(() => sortActivitiesWithEndedLast(data.activities), [data.activities])
  const activityById = useMemo(
    () => Object.fromEntries(data.activities.map((activity) => [activity.id, activity])),
    [data.activities],
  )
  const selectedActivity = data.activities.find((activity) => activity.id === selectedActivityId)
  const withActivityTitle = (registration, fallbackActivity) => ({
    ...registration,
    activityId: registration.activityId || fallbackActivity?.id || selectedActivityId,
    activityTitle:
      activityById[registration.activityId]?.title ||
      fallbackActivity?.title ||
      registration.activityId ||
      "Chưa có",
  })
  const registrations = isAllActivities
    ? data.activities.flatMap((activity) =>
        (data.registrationsByActivity[activity.id] || []).map((registration) =>
          withActivityTitle(registration, activity),
        ),
      )
    : selectedActivityId
      ? (data.registrationsByActivity[selectedActivityId] || []).map((registration) =>
          withActivityTitle(registration, selectedActivity),
        )
      : []
  const loadRegistrations = data.loadRegistrations

  const pendingRegistrations = registrations.filter((registration) => {
    const status = getStatusKey(registration.status)
    return status === "pending" || status === "registered"
  })
  const approvedRegistrations = registrations.filter((registration) => getStatusKey(registration.status) === "approved")
  const rejectedRegistrations = registrations.filter((registration) => getStatusKey(registration.status) === "rejected")
  const pendingPagination = usePagination(pendingRegistrations, [selectedActivityId, "pending"])
  const approvedPagination = usePagination(approvedRegistrations, [selectedActivityId, "approved"])
  const rejectedPagination = usePagination(rejectedRegistrations, [selectedActivityId, "rejected"])

  useEffect(() => {
    if (!isAllActivities && selectedActivityId) {
      loadRegistrations(selectedActivityId)
    }
  }, [isAllActivities, loadRegistrations, selectedActivityId])

  useEffect(() => {
    if (!isAllActivities) return

    data.activities.forEach((activity) => {
      if (!data.registrationsByActivity[activity.id]) {
        loadRegistrations(activity.id)
      }
    })
  }, [data.activities, isAllActivities, loadRegistrations])

  const reject = async (registration) => {
    const reason = window.prompt("Nhập lý do từ chối đăng ký")
    if (!reason?.trim()) return
    await data.rejectRegistration(registration.activityId, registration.studentId, reason.trim())
  }

  const renderRegistrationTable = (items, { showActions = false, showActivity = false, showRejectReason = false } = {}) => {
    if (items.length === 0) {
      return <div className="py-8 text-center text-sm text-muted-foreground">Không có sinh viên trong nhóm này.</div>
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã sinh viên</TableHead>
              {showActivity && <TableHead>Hoạt động</TableHead>}
              <TableHead>Trạng thái đăng ký</TableHead>
              <TableHead>Ngày đăng ký</TableHead>
              <TableHead>Người duyệt</TableHead>
              {showRejectReason && <TableHead>Lý do</TableHead>}
              {showActions && <TableHead className="w-44">Thao tác</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((registration) => {
              const activity = activityById[registration.activityId]
              const isActivityEnded = isEndedActivity(activity)
              const actionDisabled = data.actionLoading || isActivityEnded

              return (
              <TableRow key={registration.id}>
                <TableCell className="font-medium">{registration.studentId}</TableCell>
                {showActivity && (
                  <TableCell className="max-w-72">
                    <span className="line-clamp-2 text-card-foreground">{registration.activityTitle}</span>
                  </TableCell>
                )}
                <TableCell>{registrationBadge(registration.status)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDateTime(registration.createdAt)}</TableCell>
                <TableCell className="text-muted-foreground">{registration.approvedBy || "Chưa có"}</TableCell>
                {showRejectReason && (
                  <TableCell className="max-w-96 text-muted-foreground">
                    <span className="line-clamp-2">{registration.rejectReason || "Chưa có lý do"}</span>
                  </TableCell>
                )}
                {showActions && (
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={actionDisabled}
                        title={isActivityEnded ? "Hoạt động đã kết thúc" : "Duyệt đăng ký"}
                        onClick={() => data.approveRegistration(registration.activityId, registration.studentId)}
                      >
                        <CheckCircle2 className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        disabled={actionDisabled}
                        title={isActivityEnded ? "Hoạt động đã kết thúc" : "Từ chối đăng ký"}
                        onClick={() => reject(registration)}
                      >
                        <XCircle className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
              )
            })}
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
            <CardTitle>Sinh viên đăng ký</CardTitle>
            <CardDescription>
              {isAllActivities
                ? "Hoạt động: Tất cả hoạt động"
                : selectedActivity
                ? `Hoạt động: ${selectedActivity.title}`
                : "Chọn hoạt động để xem sinh viên chờ duyệt và đã duyệt."}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={selectedActivityId} onValueChange={setSelectedActivityId}>
              <SelectTrigger className="w-full sm:w-80">
                <SelectValue placeholder="Chọn hoạt động" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả hoạt động</SelectItem>
                {sortedActivities.map((activity) => (
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
            <div className="py-10 text-center text-sm text-muted-foreground">Chọn một hoạt động để xem danh sách.</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
                <p className="text-sm text-muted-foreground">Chờ duyệt</p>
                <p className="text-2xl font-semibold text-card-foreground">{pendingRegistrations.length}</p>
              </div>
              <div className="rounded-lg border border-success/20 bg-success/5 p-4">
                <p className="text-sm text-muted-foreground">Đã duyệt</p>
                <p className="text-2xl font-semibold text-card-foreground">{approvedRegistrations.length}</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <p className="text-sm text-muted-foreground">Đã từ chối</p>
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
              <CardTitle>Danh sách chờ duyệt</CardTitle>
              <CardDescription>Sinh viên mới đăng ký, cần BTC/CLB duyệt hoặc từ chối.</CardDescription>
            </CardHeader>
            <CardContent>
              {renderRegistrationTable(pendingPagination.items, { showActions: true, showActivity: true })}
              <ListPagination pagination={pendingPagination} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danh sách đã duyệt</CardTitle>
              <CardDescription>Sinh viên đã được xác nhận tham gia hoạt động.</CardDescription>
            </CardHeader>
            <CardContent>
              {renderRegistrationTable(approvedPagination.items, { showActivity: true })}
              <ListPagination pagination={approvedPagination} />
            </CardContent>
          </Card>

          {rejectedRegistrations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Danh sách đã từ chối</CardTitle>
                <CardDescription>Các đăng ký đã bị từ chối kèm lý do.</CardDescription>
              </CardHeader>
              <CardContent>
                {renderRegistrationTable(rejectedPagination.items, { showRejectReason: true })}
                <ListPagination pagination={rejectedPagination} />
              </CardContent>
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
  const attendancePagination = usePagination(approvedRegistrations, [selectedActivityId])
  const getAttendance = (registration) => data.attendanceByRegistration[registration.id] || {
    id: registration.attendanceId,
    registrationId: registration.id,
    isPresent: registration.isPresent,
    checkInTime: registration.checkInTime,
    earnedPoints: registration.earnedPoints,
  }
  const checkedInCount = approvedRegistrations.filter((registration) => Boolean(getAttendance(registration)?.checkInTime)).length
  const presentCount = approvedRegistrations.filter((registration) => getAttendance(registration)?.isPresent === true).length
  const awardedCount = approvedRegistrations.filter((registration) => getAttendance(registration)?.earnedPoints != null).length
  const pendingPointsCount = approvedRegistrations.filter((registration) => {
    const att = getAttendance(registration)
    return att?.isPresent === true && att?.earnedPoints == null
  }).length
  const selectedActivity = data.activities.find((a) => a.id === selectedActivityId)
  const activityReports = data.reports.filter((r) => r.activityId === selectedActivityId)
  const latestReport = activityReports[0]
  const reportApproved = latestReport && getStatusKey(latestReport.reportStatus) === "approved"
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-border bg-background px-3 py-2">
                <p className="text-xs text-muted-foreground">Tổng đã duyệt</p>
                <p className="text-xl font-semibold text-card-foreground">{approvedRegistrations.length}</p>
              </div>
              <div className="rounded-lg border border-success/20 bg-success/5 px-3 py-2">
                <p className="text-xs text-muted-foreground">Đã check-in</p>
                <p className="text-xl font-semibold text-success">{checkedInCount}</p>
              </div>
              <div className="rounded-lg border border-success/20 bg-success/5 px-3 py-2">
                <p className="text-xs text-muted-foreground">Có mặt</p>
                <p className="text-xl font-semibold text-success">{presentCount}</p>
              </div>
              <div className="rounded-lg border border-warning/20 bg-warning/5 px-3 py-2">
                <p className="text-xs text-muted-foreground">Đã cấp điểm</p>
                <p className="text-xl font-semibold text-success">{awardedCount}</p>
              </div>
            </div>

            {pendingPointsCount > 0 && !reportApproved && (
              <div className="rounded-lg border border-warning/20 bg-warning/5 px-3 py-2 text-sm">
                <p className="font-medium text-card-foreground">
                  {pendingPointsCount} sinh viên có mặt — chờ báo cáo được duyệt để cấp điểm.
                </p>
                <p className="text-muted-foreground">
                  {latestReport
                    ? `Báo cáo hiện tại: ${statusBadge(latestReport.reportStatus)?.props?.children}. Vui lòng đợi manager duyệt báo cáo.`
                    : "Chưa có báo cáo. Vui lòng nộp báo cáo và đợi manager duyệt."}
                </p>
              </div>
            )}

            {attendancePagination.items.map((registration) => {
              const attendance = getAttendance(registration)
              const checkedIn = Boolean(attendance?.checkInTime)
              const present = attendance?.isPresent === true
              const hasPoints = attendance?.earnedPoints != null
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
                      {checkedIn ? "Đã check-in" : "Chưa check-in"}
                    </Badge>
                    <Checkbox
                      checked={present}
                      disabled={data.actionLoading}
                      onCheckedChange={(value) => data.checkInRegistration(registration.id, !!value)}
                      aria-label={`Điểm danh ${registration.studentId}`}
                    />
                    <Badge variant="outline" className={present ? "bg-success/10 text-success border-success/20" : "text-muted-foreground"}>
                      {present ? "Có mặt" : "Chưa điểm danh"}
                    </Badge>
                    {pointsBadge(registration, selectedActivity)}
                  </div>
                </div>
              )
            })}
            <ListPagination pagination={attendancePagination} />
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
  const reportsPagination = usePagination(submittedReports, [selectedActivityId])

  const selectedActivity = selectedActivityId ? activitiesById[selectedActivityId] : null
  const latestReport = submittedReports[0]
  const reportApproved = latestReport && getStatusKey(latestReport.reportStatus) === "approved"

  const registrations = selectedActivityId ? data.registrationsByActivity[selectedActivityId] || [] : []
  const approvedRegistrations = registrations.filter((registration) => getStatusKey(registration.status) === "approved")
  const getAttendance = (registration) => data.attendanceByRegistration[registration.id] || {
    id: registration.attendanceId,
    registrationId: registration.id,
    isPresent: registration.isPresent,
    checkInTime: registration.checkInTime,
    earnedPoints: registration.earnedPoints,
  }
  const pendingPointsRegs = approvedRegistrations.filter((registration) => {
    const att = getAttendance(registration)
    return att?.isPresent === true && att?.earnedPoints == null
  })
  const awardedRegs = approvedRegistrations.filter((registration) => {
    const att = getAttendance(registration)
    return att?.earnedPoints != null
  })
  const pendingPointsPagination = usePagination(pendingPointsRegs, [selectedActivityId, "pending-points"])
  const awardedPagination = usePagination(awardedRegs, [selectedActivityId, "awarded-points"])
  const loadRegistrations = data.loadRegistrations

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

  const awardPointsForAll = async () => {
    if (!reportApproved) {
      window.alert("Báo cáo phải được manager duyệt trước khi cấp điểm.")
      return
    }
    if (pendingPointsRegs.length === 0) {
      window.alert("Không có sinh viên nào chờ cấp điểm.")
      return
    }
    if (!window.confirm(`Cấp điểm cho ${pendingPointsRegs.length} sinh viên có mặt?`)) return
    for (const registration of pendingPointsRegs) {
      await data.awardPoints(registration.id, "")
    }
  }

  useEffect(() => {
    if (selectedActivityId) {
      loadRegistrations(selectedActivityId)
    }
  }, [selectedActivityId, loadRegistrations])

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
            <CardTitle>Cấp điểm sinh viên</CardTitle>
            <CardDescription>
              Điểm chỉ được cấp khi báo cáo hoạt động đã được manager duyệt.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={awardPointsForAll}
            disabled={data.actionLoading || !reportApproved || pendingPointsRegs.length === 0}
            className="shrink-0"
          >
            <Award className="mr-2 size-4" />
            Cấp điểm cho {pendingPointsRegs.length} SV
          </Button>
        </CardHeader>
        <CardContent>
          {pendingPointsRegs.length === 0 && awardedRegs.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Chưa có sinh viên nào có mặt hoặc chưa chọn hoạt động.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pendingPointsRegs.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-muted-foreground">Sinh viên chờ cấp điểm ({pendingPointsRegs.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {pendingPointsPagination.items.map((registration) => (
                      <Badge key={registration.id} variant="outline" className="bg-warning/10 text-warning border-warning/20">
                        {registration.studentId}
                      </Badge>
                    ))}
                  </div>
                  <ListPagination pagination={pendingPointsPagination} />
                </div>
              )}
              {awardedRegs.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-muted-foreground">Đã cấp điểm ({awardedRegs.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {awardedPagination.items.map((registration) => {
                      const att = getAttendance(registration)
                      return (
                        <Badge key={registration.id} variant="outline" className="bg-success/10 text-success border-success/20">
                          {registration.studentId}: {att?.earnedPoints ?? 0} điểm
                        </Badge>
                      )
                    })}
                  </div>
                  <ListPagination pagination={awardedPagination} />
                </div>
              )}
              {!reportApproved && pendingPointsRegs.length > 0 && (
                <div className="rounded-md border border-warning/20 bg-warning/5 px-3 py-2 text-sm">
                  <p className="font-medium text-card-foreground">
                    {latestReport
                      ? `Báo cáo hiện tại đang ở trạng thái "${latestReport.reportStatus}". Vui lòng đợi manager duyệt báo cáo để cấp điểm.`
                      : "Chưa có báo cáo. Vui lòng nộp báo cáo và đợi manager duyệt để cấp điểm."}
                  </p>
                </div>
              )}
              {reportApproved && pendingPointsRegs.length > 0 && (
                <div className="rounded-md border border-success/20 bg-success/5 px-3 py-2 text-sm">
                  <p className="font-medium text-success">Báo cáo đã được duyệt. Có thể cấp điểm cho {pendingPointsRegs.length} sinh viên.</p>
                </div>
              )}
            </div>
          )}
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
                  {reportsPagination.items.map((report) => {
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
              <ListPagination pagination={reportsPagination} />
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
