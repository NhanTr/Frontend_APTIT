"use client"

import { useEffect, useState } from "react"
import { StatusBadge, CategoryBadge } from "@/components/status-badge"
import { ListPagination, usePagination } from "@/components/list-pagination"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Award,
  Calendar,
  Clock,
  FileText,
  MapPin,
  Target,
  Users,
} from "lucide-react"

function formatDateTime(value) {
  if (!value) return "Chưa có"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-border bg-background p-3">
      <Icon className="mt-1 size-5 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-xs uppercase text-muted-foreground">{label}</p>
        <p className="break-words text-sm font-medium text-card-foreground">{value || "Chưa có"}</p>
      </div>
    </div>
  )
}

export function ActivityGrid({
  activities = [],
  enrolled = [],
  onEnroll = () => {},
  onUnenroll = () => {},
  enrollingActivityIds = [],
  unenrollingActivityIds = [],
  registrationStatusByActivity = {},
}) {
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [localEnrolled, setLocalEnrolled] = useState(enrolled)

  useEffect(() => {
    setLocalEnrolled(enrolled)
  }, [enrolled])

  const handleEnroll = (activityId) => {
    onEnroll(activityId).then((success) => {
      if (success) {
        setLocalEnrolled((prev) => (prev.includes(activityId) ? prev : [...prev, activityId]))
      }
    })
  }

  const handleUnenroll = (activityId) => {
    onUnenroll(activityId).then((success) => {
      if (success) {
        setLocalEnrolled((prev) => prev.filter((id) => id !== activityId))
      }
    })
  }

  const getStatusKey = (status) => String(status || "").trim().toLowerCase()
  const isClosedActivity = (activity) => {
    const endTime = activity.endTime ? new Date(activity.endTime).getTime() : null
    return ["closed", "completed"].includes(getStatusKey(activity.status)) || (Number.isFinite(endTime) && endTime <= Date.now())
  }
  const isOngoingActivity = (activity) => {
    if (getStatusKey(activity.status) === "ongoing") return true
    const startTime = activity.startTime ? new Date(activity.startTime).getTime() : null
    const endTime = activity.endTime ? new Date(activity.endTime).getTime() : null
    const now = Date.now()
    return Number.isFinite(startTime) && startTime <= now && (!Number.isFinite(endTime) || endTime > now)
  }
  const canCancelRegistration = (activity) => !isClosedActivity(activity) && !isOngoingActivity(activity)
  const canEnrollActivity = (activity) => getStatusKey(activity.status) === "approved"
  const getActivityTime = (activity) => {
    const startTime = activity.startTime ? new Date(activity.startTime).getTime() : null
    return Number.isFinite(startTime) ? startTime : 0
  }
  const sortedActivities = activities
    .filter((activity) => getStatusKey(activity.status) !== "cancelled")
    .map((activity, index) => ({ activity, index }))
    .sort((left, right) => {
      const timeDiff = getActivityTime(right.activity) - getActivityTime(left.activity)

      if (timeDiff !== 0) return timeDiff
      return left.index - right.index
    })
    .map(({ activity }) => activity)
  const activitiesPagination = usePagination(sortedActivities, [activities.length])

  return (
    <>
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activitiesPagination.items.map((activity) => {
          const isEnrolled = localEnrolled.includes(activity.id)
          const registrationStatus = String(registrationStatusByActivity[activity.id] || "").trim().toLowerCase()
          const registrationLabel = registrationStatus === "approved" ? "Đã duyệt" : "Chờ duyệt"
          const isFull = activity.enrolled >= activity.capacity
          const isClosed = isClosedActivity(activity)
          const isOngoing = isOngoingActivity(activity)
          return (
            <Card
              key={activity.id}
              className="bg-card flex flex-col cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedActivity(activity)}
            >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CategoryBadge category={activity.category} />
                    <StatusBadge status={activity.status} />
                  </div>
                  <CardTitle className="text-sm sm:text-base text-card-foreground mt-2">
                    {activity.title}
                  </CardTitle>
                  <CardDescription className="leading-relaxed text-xs sm:text-sm line-clamp-2">
                    {activity.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-end">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {activity.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {activity.time}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      <span className="truncate">{activity.location}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="size-3" />
                      <span className="truncate">{activity.instructor}</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Spots</span>
                        <span className="font-medium text-card-foreground">
                          Còn {activity.capacity - activity.enrolled} chỗ
                        </span>
                      </div>
                      <Progress value={(activity.enrolled / activity.capacity) * 100} className="h-1.5" />
                    </div>
                    {isEnrolled ? (
                      <div className="flex flex-col gap-2">
                        <div className="rounded-md border border-warning/20 bg-warning/5 px-3 py-2 text-center text-xs font-medium text-card-foreground">
                          {isClosed ? "Kết thúc" : isOngoing ? "Đang diễn ra" : registrationLabel}
                        </div>
                        {canCancelRegistration(activity) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                            disabled={unenrollingActivityIds.includes(activity.id)}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUnenroll(activity.id)
                            }}
                          >
                            {unenrollingActivityIds.includes(activity.id) ? "Đang hủy..." : "Hủy đăng ký"}
                          </Button>
                        )}
                      </div>
                    ) : isClosed ? (
                      <Button variant="outline" size="sm" className="w-full mt-1" disabled>
                        Kết thúc
                      </Button>
                    ) : isOngoing ? (
                      <Button variant="outline" size="sm" className="w-full mt-1" disabled>
                        Đang diễn ra
                      </Button>
                    ) : isFull ? (
                      <Button variant="outline" size="sm" className="w-full mt-1" disabled>
                        Đã đầy
                      </Button>
                    ) : canEnrollActivity(activity) ? (
                      <Button
                        size="sm"
                        className="w-full mt-1 bg-primary text-primary-foreground hover:bg-primary/90"
                        disabled={enrollingActivityIds.includes(activity.id)}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEnroll(activity.id)
                        }}
                      >
                        {enrollingActivityIds.includes(activity.id) ? "Đang đăng ký..." : "Đăng ký ngay"}
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="w-full mt-1" disabled>
                        Chưa mở đăng ký
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
      </div>

      {/* Activity Details Modal */}
      <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedActivity && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 flex-wrap">
                  <CategoryBadge category={selectedActivity.category} />
                  <StatusBadge status={selectedActivity.status} />
                </div>
                <DialogTitle className="text-xl mt-2">{selectedActivity.title}</DialogTitle>
                <DialogDescription className="text-base leading-relaxed">
                  {selectedActivity.description}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4">
                {/* Activity Info */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailItem icon={Clock} label="Bắt đầu" value={formatDateTime(selectedActivity.startTime)} />
                  <DetailItem icon={Clock} label="Kết thúc" value={formatDateTime(selectedActivity.endTime)} />
                  <DetailItem icon={Calendar} label="Hạn đăng ký" value={formatDateTime(selectedActivity.registrationDeadline)} />
                  <DetailItem
                    icon={MapPin}
                    label="Phòng học"
                    value={selectedActivity.roomCode || selectedActivity.location}
                  />
                  <DetailItem
                    icon={Users}
                    label="Đơn vị tổ chức"
                    value={selectedActivity.organizerName || selectedActivity.instructor || selectedActivity.organizerId}
                  />
                  <DetailItem icon={Users} label="Đơn vị tài trợ" value={selectedActivity.sponsor || "Chưa có"} />
                  <DetailItem icon={Users} label="Đối tượng tham gia" value={selectedActivity.targetAudience} />
                  <DetailItem icon={Award} label="Điểm rèn luyện" value={`${selectedActivity.trainingPoints ?? 0} điểm`} />
                </div>

                <div className="grid gap-3">
                  <div className="rounded-lg border border-border bg-background p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-card-foreground">
                      <FileText className="size-4 text-primary" />
                      Mo ta
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {selectedActivity.description || "Chưa có mô tả"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border bg-background p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-card-foreground">
                      <Target className="size-4 text-primary" />
                      Muc dich
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {selectedActivity.purpose || "Chưa có mục đích"}
                    </p>
                  </div>
                </div>

                {/* Capacity Info */}
                <div className="bg-secondary/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-card-foreground">Tình trạng đăng ký</span>
                    <span className="text-sm font-medium text-card-foreground">
                      {selectedActivity.enrolled} / {selectedActivity.capacity}
                    </span>
                  </div>
                  <Progress
                    value={(selectedActivity.enrolled / selectedActivity.capacity) * 100}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Còn {selectedActivity.capacity - selectedActivity.enrolled} chỗ
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {localEnrolled.includes(selectedActivity.id) ? (
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="rounded-md border border-warning/20 bg-warning/5 px-3 py-2 text-center text-sm font-medium text-card-foreground">
                        {isClosedActivity(selectedActivity)
                          ? "Kết thúc"
                          : isOngoingActivity(selectedActivity)
                            ? "Đang diễn ra"
                            : String(registrationStatusByActivity[selectedActivity.id] || "").trim().toLowerCase() === "approved"
                              ? "Đăng ký đã duyệt"
                              : "Đang chờ ban tổ chức duyệt"}
                      </div>
                      {canCancelRegistration(selectedActivity) && (
                        <Button
                          variant="destructive"
                          disabled={unenrollingActivityIds.includes(selectedActivity.id)}
                          onClick={() => {
                            handleUnenroll(selectedActivity.id)
                            setSelectedActivity(null)
                          }}
                        >
                          {unenrollingActivityIds.includes(selectedActivity.id)
                            ? "Đang hủy..."
                            : "Hủy đăng ký"}
                        </Button>
                      )}
                    </div>
                  ) : isClosedActivity(selectedActivity) ? (
                    <Button disabled className="flex-1">
                      Kết thúc
                    </Button>
                  ) : isOngoingActivity(selectedActivity) ? (
                    <Button disabled className="flex-1">
                      Đang diễn ra
                    </Button>
                  ) : selectedActivity.enrolled >= selectedActivity.capacity ? (
                    <Button disabled className="flex-1">
                      Hoạt động đã đầy
                    </Button>
                  ) : canEnrollActivity(selectedActivity) ? (
                    <Button
                      className="flex-1 bg-primary"
                      disabled={enrollingActivityIds.includes(selectedActivity.id)}
                      onClick={() => {
                        handleEnroll(selectedActivity.id)
                        setSelectedActivity(null)
                      }}
                    >
                      {enrollingActivityIds.includes(selectedActivity.id) ? "Đang đăng ký..." : "Đăng ký ngay"}
                    </Button>
                  ) : (
                    <Button disabled className="flex-1">
                      Chưa mở đăng ký
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <div className="mt-6">
        <ListPagination pagination={activitiesPagination} />
      </div>
    </>
  )
}
