"use client"

import { useEffect, useState } from "react"
import { StatusBadge, CategoryBadge } from "@/components/status-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Calendar,
  Clock,
  MapPin,
  Users,
} from "lucide-react"

export function ActivityGrid({
  activities = [],
  enrolled = [],
  onEnroll = () => {},
  onUnenroll = () => {},
  currentPage = 0,
  hasMore = false,
  onLoadMore = () => {},
  loading = false,
  enrollingActivityIds = [],
  unenrollingActivityIds = [],
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

  return (
    <>
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activities
          .filter((a) => a.status !== "cancelled")
          .map((activity) => {
            const isEnrolled = localEnrolled.includes(activity.id)
            const isFull = activity.enrolled >= activity.capacity
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
                          {activity.capacity - activity.enrolled} left
                        </span>
                      </div>
                      <Progress value={(activity.enrolled / activity.capacity) * 100} className="h-1.5" />
                    </div>
                    {isEnrolled ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                        disabled={unenrollingActivityIds.includes(activity.id)}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUnenroll(activity.id)
                        }}
                      >
                        {unenrollingActivityIds.includes(activity.id) ? "Unenrolling..." : "Unenroll"}
                      </Button>
                    ) : activity.status === "completed" ? (
                      <Button variant="outline" size="sm" className="w-full mt-1" disabled>
                        Completed
                      </Button>
                    ) : isFull ? (
                      <Button variant="outline" size="sm" className="w-full mt-1" disabled>
                        Full
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full mt-1 bg-primary text-primary-foreground hover:bg-primary/90"
                        disabled={enrollingActivityIds.includes(activity.id)}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEnroll(activity.id)
                        }}
                      >
                        {enrollingActivityIds.includes(activity.id) ? "Enrolling..." : "Enroll Now"}
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
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Calendar className="size-5 text-primary mt-1 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Date</p>
                      <p className="text-sm font-medium text-card-foreground">{selectedActivity.date}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="size-5 text-primary mt-1 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Time</p>
                      <p className="text-sm font-medium text-card-foreground">{selectedActivity.time}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="size-5 text-primary mt-1 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Location</p>
                      <p className="text-sm font-medium text-card-foreground">{selectedActivity.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="size-5 text-primary mt-1 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Instructor</p>
                      <p className="text-sm font-medium text-card-foreground">{selectedActivity.instructor}</p>
                    </div>
                  </div>
                </div>

                {/* Capacity Info */}
                <div className="bg-secondary/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-card-foreground">Enrollment Status</span>
                    <span className="text-sm font-medium text-card-foreground">
                      {selectedActivity.enrolled} / {selectedActivity.capacity}
                    </span>
                  </div>
                  <Progress
                    value={(selectedActivity.enrolled / selectedActivity.capacity) * 100}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedActivity.capacity - selectedActivity.enrolled} spots remaining
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {localEnrolled.includes(selectedActivity.id) ? (
                    <Button
                      variant="destructive"
                      className="flex-1"
                      disabled={unenrollingActivityIds.includes(selectedActivity.id)}
                      onClick={() => {
                        handleUnenroll(selectedActivity.id)
                        setSelectedActivity(null)
                      }}
                    >
                      {unenrollingActivityIds.includes(selectedActivity.id)
                        ? "Unenrolling..."
                        : "Unenroll from Activity"}
                    </Button>
                  ) : selectedActivity.status === "completed" ? (
                    <Button disabled className="flex-1">
                      Activity Completed
                    </Button>
                  ) : selectedActivity.enrolled >= selectedActivity.capacity ? (
                    <Button disabled className="flex-1">
                      Activity Full
                    </Button>
                  ) : (
                    <Button
                      className="flex-1 bg-primary"
                      disabled={enrollingActivityIds.includes(selectedActivity.id)}
                      onClick={() => {
                        handleEnroll(selectedActivity.id)
                        setSelectedActivity(null)
                      }}
                    >
                      {enrollingActivityIds.includes(selectedActivity.id) ? "Enrolling..." : "Enroll Now"}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Pagination Info & Load More */}
      <div className="flex flex-col items-center gap-4 mt-6">
        <p className="text-sm text-muted-foreground">
          Trang <span className="font-semibold text-card-foreground">{currentPage + 1}</span> | Tổng hoạt động:{" "}
          <span className="font-semibold text-card-foreground">{activities.length}</span>
        </p>
        {hasMore && (
          <Button onClick={onLoadMore} disabled={loading} variant="outline" className="w-full sm:w-auto">
            {loading ? "Đang tải..." : "Tải thêm"}
          </Button>
        )}
        {!hasMore && activities.length > 0 && (
          <p className="text-xs text-muted-foreground">Đã tải hết tất cả hoạt động</p>
        )}
      </div>
    </>
  )
}
