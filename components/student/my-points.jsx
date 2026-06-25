"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Award, Calendar, CheckCircle2, Clock, MapPin, RefreshCw } from "lucide-react"

function getStatusKey(status) {
  return String(status || "").trim().toLowerCase()
}

function formatDateTime(value) {
  if (!value) return "Not set"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not set"
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function attendanceBadge(activity) {
  const checkedIn = Boolean(activity.checkInTime)
  const present = activity.isPresent === true

  return (
    <div className="flex flex-wrap gap-1">
      <Badge variant="outline" className={checkedIn ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border"}>
        {checkedIn ? "Checked in" : "Not checked in"}
      </Badge>
      <Badge variant="outline" className={present ? "bg-success/10 text-success border-success/20" : "text-muted-foreground"}>
        {present ? "Present" : "Not confirmed"}
      </Badge>
    </div>
  )
}

function statusBadge(status) {
  const key = getStatusKey(status)
  if (key === "closed" || key === "completed") {
    return <Badge variant="outline">Closed</Badge>
  }
  if (key === "ongoing") {
    return <Badge className="bg-success/10 text-success border-success/20">Ongoing</Badge>
  }
  if (key === "approved") {
    return <Badge className="bg-primary/10 text-primary border-primary/20">Approved</Badge>
  }
  return <Badge variant="outline">{status || "Unknown"}</Badge>
}

export function MyPoints({ getMyPoints }) {
  const currentYear = String(new Date().getFullYear())
  const [year, setYear] = useState(currentYear)
  const [semester, setSemester] = useState("all")
  const [pointsData, setPointsData] = useState({ totalPoints: 0, activities: [] })
  const [loading, setLoading] = useState(false)

  const filters = useMemo(
    () => ({
      year: year.trim(),
      semester: semester === "all" ? "" : semester,
    }),
    [semester, year],
  )

  const loadPoints = async () => {
    if (!getMyPoints) return

    setLoading(true)
    try {
      const data = await getMyPoints(filters)
      setPointsData({
        totalPoints: data?.totalPoints ?? 0,
        activities: Array.isArray(data?.activities) ? data.activities : [],
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPoints()
  }, [getMyPoints, filters])

  const attendedActivities = pointsData.activities.filter((activity) => activity.isPresent === true).length
  const closedActivities = pointsData.activities.filter((activity) => {
    const status = getStatusKey(activity.activityStatus)
    return status === "closed" || status === "completed"
  }).length

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total points</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Award className="size-6 text-primary" />
              {pointsData.totalPoints}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Present activities</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <CheckCircle2 className="size-6 text-success" />
              {attendedActivities}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Closed activities</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Clock className="size-6 text-muted-foreground" />
              {closedActivities}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <div>
            <CardTitle>My Points</CardTitle>
            <CardDescription>Track your training points and attendance history.</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              className="w-full sm:w-28"
              inputMode="numeric"
              value={year}
              onChange={(event) => setYear(event.target.value)}
              placeholder="Year"
            />
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All semesters</SelectItem>
                <SelectItem value="1">Semester 1</SelectItem>
                <SelectItem value="2">Semester 2</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadPoints} disabled={loading}>
              <RefreshCw className="mr-2 size-4" />
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pointsData.activities.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No point history found for the selected period.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pointsData.activities.map((activity) => (
                  <TableRow key={activity.registrationId || activity.activityId}>
                    <TableCell>
                      <div className="flex min-w-56 flex-col gap-1">
                        <span className="font-medium">{activity.activityTitle || "Untitled activity"}</span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3" />
                          {activity.location || "No location"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-44 flex-col gap-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {formatDateTime(activity.startTime)}
                        </span>
                        <span>{formatDateTime(activity.endTime)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{statusBadge(activity.activityStatus)}</TableCell>
                    <TableCell>{attendanceBadge(activity)}</TableCell>
                    <TableCell className="text-right font-semibold">{activity.earnedPoints ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
