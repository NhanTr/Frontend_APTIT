"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ListPagination, usePagination } from "@/components/list-pagination"
import { Award, Calendar, CheckCircle2, Clock, MapPin, RefreshCw } from "lucide-react"

function getStatusKey(status) {
  return String(status || "").trim().toLowerCase()
}

function formatDateTime(value) {
  if (!value) return "Chưa thiết lập"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Chưa thiết lập"
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
        {checkedIn ? "Đã check-in" : "Chưa check-in"}
      </Badge>
      <Badge variant="outline" className={present ? "bg-success/10 text-success border-success/20" : "text-muted-foreground"}>
        {present ? "Có mặt" : "Chưa xác nhận"}
      </Badge>
    </div>
  )
}

function statusBadge(status) {
  const key = getStatusKey(status)
  if (key === "closed" || key === "completed") {
    return <Badge variant="outline">Đã kết thúc</Badge>
  }
  if (key === "ongoing") {
    return <Badge className="bg-success/10 text-success border-success/20">Đang diễn ra</Badge>
  }
  if (key === "approved") {
    return <Badge className="bg-primary/10 text-primary border-primary/20">Đã duyệt</Badge>
  }
  return <Badge variant="outline">{status || "Không rõ"}</Badge>
}

export function MyPoints({ getMyPoints }) {
  const currentYear = String(new Date().getFullYear())
  const [year, setYear] = useState(currentYear)
  const [semester, setSemester] = useState("all")
  const [pointsData, setPointsData] = useState({ totalPoints: 0, activities: [] })
  const [loading, setLoading] = useState(false)
  const pointsPagination = usePagination(pointsData.activities, [year, semester, pointsData.activities.length])

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
            <CardDescription>Tổng điểm</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Award className="size-6 text-primary" />
              {pointsData.totalPoints}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Hoạt động có mặt</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <CheckCircle2 className="size-6 text-success" />
              {attendedActivities}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Hoạt động đã kết thúc</CardDescription>
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
            <CardTitle>Điểm của tôi</CardTitle>
            <CardDescription>Theo dõi điểm rèn luyện và lịch sử tham dự.</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              className="w-full sm:w-28"
              inputMode="numeric"
              value={year}
              onChange={(event) => setYear(event.target.value)}
              placeholder="Năm"
            />
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Học kỳ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả học kỳ</SelectItem>
                <SelectItem value="1">Học kỳ 1</SelectItem>
                <SelectItem value="2">Học kỳ 2</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadPoints} disabled={loading}>
              <RefreshCw className="mr-2 size-4" />
              {loading ? "Đang tải..." : "Tải lại"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pointsData.activities.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Chưa có lịch sử điểm trong khoảng thời gian đã chọn.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hoạt động</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead className="text-right">Điểm</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pointsPagination.items.map((activity) => (
                    <TableRow key={activity.registrationId || activity.activityId}>
                      <TableCell>
                        <div className="flex min-w-56 flex-col gap-1">
                          <span className="font-medium">{activity.activityTitle || "Hoạt động chưa có tên"}</span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3" />
                            {activity.location || "Chưa có địa điểm"}
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
              <ListPagination pagination={pointsPagination} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
