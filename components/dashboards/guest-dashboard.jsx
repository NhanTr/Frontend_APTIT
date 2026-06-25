"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useRole } from "@/lib/role-context"
import { StatusBadge, CategoryBadge } from "@/components/status-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ActivityFilter } from "@/components/student/activity-filter"
import {
  Clock,
  MapPin,
  Calendar,
  Users,
  AlertCircle,
  LockIcon,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

const filterKeys = ["status", "sponsor", "startTime", "endTime", "location"]

function areFiltersEqual(a, b) {
  return filterKeys.every((key) => (a?.[key] || "") === (b?.[key] || ""))
}

function isApprovedActivity(activity) {
  if (activity?.approvalStatus) {
    return activity.approvalStatus === "approved"
  }

  return ["approved", "ongoing", "closed", "completed"].includes(String(activity?.status || "").toLowerCase())
}

function BrowseActivitiesGuest({ activities, currentPage, hasMore, onLoadMore, loading }) {
  const [selectedActivity, setSelectedActivity] = useState(null)

  return (
    <>
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activities
          .filter(isApprovedActivity)
          .map((activity) => {
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
                  <CardTitle className="text-sm sm:text-base text-card-foreground mt-2">{activity.title}</CardTitle>
                  <CardDescription className="leading-relaxed text-xs sm:text-sm line-clamp-2">{activity.description}</CardDescription>
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-1 border-muted text-muted-foreground hover:bg-muted/20"
                      disabled
                    >
                      <LockIcon className="size-3 mr-1" />
                      Sign in to enroll
                    </Button>
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
                <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <LockIcon className="size-5 text-warning" />
                    <p className="text-sm font-medium text-card-foreground">Sign in to enroll</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You need to be logged in to enroll in activities. Please sign in to your account to participate.
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Pagination Info & Load More */}
      <div className="flex flex-col items-center gap-4 mt-6">
        <p className="text-sm text-muted-foreground">
          Trang <span className="font-semibold text-card-foreground">{currentPage + 1}</span> | Tổng hoạt động: <span className="font-semibold text-card-foreground">{activities.length}</span>
        </p>
        {hasMore && (
          <Button 
            onClick={onLoadMore}
            disabled={loading}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {loading ? 'Đang tải...' : 'Tải thêm'}
          </Button>
        )}
        {!hasMore && activities.length > 0 && (
          <p className="text-xs text-muted-foreground">Đã tải hết tất cả hoạt động</p>
        )}
      </div>
    </>
  )
}

export function GuestDashboard() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { activities, loadMore, currentPage, hasMore, loading, applyFilters } = useRole()
  const initialFilters = useMemo(() => {
    return {
      status: searchParams.get("status") || "",
      sponsor: searchParams.get("sponsor") || "",
      startTime: searchParams.get("startTime") || "",
      endTime: searchParams.get("endTime") || "",
      location: searchParams.get("location") || "",
    }
  }, [searchParams])

  const [filters, setFilters] = useState(() => initialFilters)
  const approvedActivities = useMemo(
    () => activities.filter(isApprovedActivity),
    [activities]
  )

  useEffect(() => {
    setFilters((prev) => (areFiltersEqual(prev, initialFilters) ? prev : initialFilters))
  }, [initialFilters])

  const updateUrlFilters = useCallback((nextFilters) => {
    const nextParams = new URLSearchParams(searchParams.toString())

    for (const key of filterKeys) {
      const value = nextFilters[key]
      if (value) {
        nextParams.set(key, value)
      } else {
        nextParams.delete(key)
      }
    }

    const query = nextParams.toString()
    const nextUrl = query ? `${pathname}?${query}` : pathname
    const currentQuery = searchParams.toString()
    const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname

    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false })
    }
  }, [pathname, router, searchParams])

  const handleFilterChange = useCallback((newFilters) => {
    if (areFiltersEqual(filters, newFilters)) return

    setFilters(newFilters)
    applyFilters(newFilters)
    updateUrlFilters(newFilters)
  }, [filters, applyFilters, updateUrlFilters])

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-card-foreground">Browse Activities</CardTitle>
          <CardDescription>View all available activities and events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ActivityFilter
            onFilterChange={handleFilterChange}
            initialFilters={filters}
          />
          <BrowseActivitiesGuest 
            activities={approvedActivities}
            currentPage={currentPage}
            hasMore={hasMore}
            onLoadMore={loadMore}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  )
}
