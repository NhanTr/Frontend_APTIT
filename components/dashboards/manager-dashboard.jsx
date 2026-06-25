"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Bell,
  CalendarDays,
  Check,
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

const statusMeta = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border" },
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
  reviewing: { label: "Cancel review", className: "bg-primary/10 text-primary border-primary/20" },
  approved: { label: "Approved", className: "bg-success/10 text-success border-success/20" },
  ongoing: { label: "Ongoing", className: "bg-success/10 text-success border-success/20" },
  closed: { label: "Closed", className: "bg-secondary text-secondary-foreground border-border" },
  rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/20" },
  cancelled: { label: "Cancelled", className: "bg-destructive/10 text-destructive border-destructive/20" },
}

const reportMeta = {
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
  approved: { label: "Approved", className: "bg-success/10 text-success border-success/20" },
  rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/20" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground border-border" },
}

const statusOptions = ["Draft", "Pending", "Reviewing", "Approved", "Ongoing", "Closed", "Rejected", "Cancelled"]
const reportStatusOptions = ["Pending", "Approved", "Rejected", "Cancelled"]

function getStatusKey(value) {
  return String(value || "").trim().toLowerCase()
}

function formatDateTime(value) {
  if (!value) return "Not set"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

function getProgress(activity) {
  const capacity = Number(activity?.capacity || 0)
  if (!capacity) return 0
  return Math.min(100, (Number(activity.enrolled || 0) / capacity) * 100)
}

function statusBadge(status) {
  const key = getStatusKey(status)
  const meta = statusMeta[key] || { label: status || "Unknown", className: "bg-muted text-muted-foreground border-border" }
  return (
    <Badge variant="outline" className={meta.className}>
      {meta.label}
    </Badge>
  )
}

function reportBadge(status) {
  const key = getStatusKey(status)
  const meta = reportMeta[key] || { label: status || "Unknown", className: "bg-muted text-muted-foreground border-border" }
  return (
    <Badge variant="outline" className={meta.className}>
      {meta.label}
    </Badge>
  )
}

function StatGrid({ data }) {
  const items = [
    { label: "Activities", value: data.statistics?.totalActivities ?? data.activities.length, icon: CalendarDays },
    { label: "Registered", value: data.statistics?.registeredStudents ?? 0, icon: Users },
    { label: "Attended", value: data.statistics?.attendedStudents ?? 0, icon: Check },
    { label: "Earned points", value: data.statistics?.totalEarnedPoints ?? 0, icon: FileText },
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
      <Input name="keyword" value={filters.keyword || ""} onChange={update} placeholder="Search title or description" />
      <select
        name="status"
        value={filters.status || ""}
        onChange={update}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">All statuses</option>
        {statusOptions.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <Input name="location" value={filters.location || ""} onChange={update} placeholder="Location" />
      <Button type="submit" disabled={data.loading}>
        <Search className="mr-2 size-4" />
        Search
      </Button>
    </form>
  )
}

function ConflictList({ conflicts }) {
  if (!conflicts?.length) return null

  return (
    <div className="rounded-md border border-warning/20 bg-warning/5 p-3 text-sm">
      <p className="mb-2 font-medium text-card-foreground">Schedule warnings</p>
      <div className="flex flex-col gap-2">
        {conflicts.map((conflict) => (
          <div key={`${conflict.activityId}-${conflict.startTime}`} className="text-muted-foreground">
            {conflict.warning}: {conflict.title} at {conflict.location || "unknown location"} ({formatDateTime(conflict.startTime)})
          </div>
        ))}
      </div>
    </div>
  )
}

function ActivityRow({ activity, data }) {
  const statusKey = getStatusKey(activity.status)
  const isPending = statusKey === "pending"
  const isReviewing = statusKey === "reviewing"
  const conflicts = data.conflictsByActivity[activity.id]

  const rejectActivity = async () => {
    const reason = window.prompt("Reason for rejection")
    if (!reason?.trim()) return
    await data.rejectActivity(activity.id, reason.trim())
  }

  const rejectCancel = async () => {
    const reason = window.prompt("Reason for rejecting cancellation")
    if (!reason?.trim()) return
    await data.rejectCancelRequest(activity.id, reason.trim())
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-2">
              {statusBadge(activity.status)}
              {activity.trainingPoints != null && <Badge variant="outline">{activity.trainingPoints} points</Badge>}
            </div>
            <h3 className="truncate text-base font-semibold text-card-foreground">{activity.title || "Untitled activity"}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{activity.description || "No description"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => data.loadScheduleConflicts(activity.id)} disabled={data.actionLoading}>
              <AlertCircle className="mr-1 size-4" />
              Check schedule
            </Button>
            {isPending && (
              <>
                <Button size="sm" onClick={() => data.approveActivity(activity.id)} disabled={data.actionLoading}>
                  <Check className="mr-1 size-4" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/10"
                  onClick={rejectActivity}
                  disabled={data.actionLoading}
                >
                  <X className="mr-1 size-4" />
                  Reject
                </Button>
              </>
            )}
            {isReviewing && (
              <>
                <Button size="sm" onClick={() => data.approveCancelRequest(activity.id)} disabled={data.actionLoading}>
                  <Check className="mr-1 size-4" />
                  Approve cancel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/10"
                  onClick={rejectCancel}
                  disabled={data.actionLoading}
                >
                  <X className="mr-1 size-4" />
                  Keep activity
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4" />
            <span>{formatDateTime(activity.startTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="size-4" />
            <span className="truncate">{activity.location || "No location"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="size-4" />
            <span>{activity.organizerName}</span>
          </div>
        </div>

        {activity.cancelReason && (
          <p className="rounded-md border border-warning/20 bg-warning/5 px-3 py-2 text-sm text-muted-foreground">
            Cancel reason: {activity.cancelReason}
          </p>
        )}

        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Enrollment</span>
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

function ActivityApprovalTable({ data, mode = "all" }) {
  const filteredActivities = useMemo(() => {
    if (mode === "pending") {
      return data.activities.filter((activity) => ["pending", "reviewing"].includes(activity.statusKey))
    }
    return data.activities
  }, [data.activities, mode])

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{mode === "pending" ? "Activity approvals" : "All activities"}</CardTitle>
              <CardDescription>Review lifecycle status, details, cancellation requests, and schedule conflicts.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={data.refreshAll} disabled={data.loading || data.actionLoading}>
              <RefreshCw className="mr-2 size-4" />
              Refresh
            </Button>
          </div>
          <ActivityFilters data={data} />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {data.loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading activities...
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No activities found.</div>
          ) : (
            filteredActivities.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} data={data} />
            ))
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
    const reason = window.prompt("Reason for rejecting report")
    if (!reason?.trim()) return
    await data.rejectReport(report.id, reason.trim())
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Post-activity reports</CardTitle>
            <CardDescription>Approve completed activity reports and lock official points.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={data.refreshAll} disabled={data.loading || data.actionLoading}>
            <RefreshCw className="mr-2 size-4" />
            Refresh
          </Button>
        </div>
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <Input name="activityId" value={filters.activityId || ""} onChange={update} placeholder="Activity ID" />
          <select
            name="reportStatus"
            value={filters.reportStatus || ""}
            onChange={update}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All statuses</option>
            {reportStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={data.loading}>
            <Search className="mr-2 size-4" />
            Search
          </Button>
        </form>
      </CardHeader>
      <CardContent>
        {data.loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading reports...
          </div>
        ) : data.reports.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No reports found.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="w-48">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.reports.map((report) => {
                  const isPending = getStatusKey(report.reportStatus) === "pending"
                  const activity = activitiesById[report.activityId]

                  return (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <a className="font-medium text-primary underline-offset-4 hover:underline" href={report.fileUrl} target="_blank" rel="noreferrer">
                            {report.originalFileName || report.fileUrl || report.id}
                          </a>
                          <span className="text-xs text-muted-foreground">{report.reviewNote || "No note"}</span>
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
                          <Button size="sm" disabled={!isPending || data.actionLoading} onClick={() => data.approveReport(report.id)}>
                            <Check className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-destructive text-destructive hover:bg-destructive/10"
                            disabled={!isPending || data.actionLoading}
                            onClick={() => rejectReport(report)}
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
  const [form, setForm] = useState({ title: "", content: "", userIds: "" })

  const update = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.content.trim()) {
      window.alert("Title and content are required.")
      return
    }

    const userIds = form.userIds
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)

    await data.sendNotification({
      title: form.title.trim(),
      content: form.content.trim(),
      type: "System",
      userIds,
    })
    setForm({ title: "", content: "", userIds: "" })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual notification</CardTitle>
        <CardDescription>Send a message to selected users, or leave recipients empty to broadcast.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="notify-title">Title</Label>
              <Input id="notify-title" name="title" value={form.title} onChange={update} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="notify-users">Recipient user IDs</Label>
              <Input id="notify-users" name="userIds" value={form.userIds} onChange={update} placeholder="id1, id2, id3" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notify-content">Content</Label>
            <Textarea id="notify-content" name="content" rows={3} value={form.content} onChange={update} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={data.actionLoading}>
              {data.actionLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Bell className="mr-2 size-4" />}
              Send
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function ManagerOverview({ data }) {
  const pendingCount = data.activities.filter((activity) => activity.statusKey === "pending").length
  const reviewingCount = data.activities.filter((activity) => activity.statusKey === "reviewing").length
  const pendingReports = data.reports.filter((report) => getStatusKey(report.reportStatus) === "pending").length

  return (
    <div className="flex flex-col gap-4">
      <StatGrid data={data} />
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending approvals</p>
            <p className="text-2xl font-semibold">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Cancel requests</p>
            <p className="text-2xl font-semibold">{reviewingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending reports</p>
            <p className="text-2xl font-semibold">{pendingReports}</p>
          </CardContent>
        </Card>
      </div>
      <ActivityApprovalTable data={data} mode="pending" />
      <NotificationPanel data={data} />
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
      {activeSection === "reports" && <ReportsPanel data={data} />}
      {activeSection === "personal-profile" && <PersonalProfilePanel />}
    </div>
  )
}
