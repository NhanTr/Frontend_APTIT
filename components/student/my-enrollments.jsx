"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { GraduationCap, Calendar, Clock, MapPin, ChevronRight } from "lucide-react"

export function MyEnrollments({ activities, enrolled, onUnenroll, unenrollingActivityIds = [] }) {
  const [selectedActivity, setSelectedActivity] = useState(null)
  const enrolledActivities = activities.filter((a) => enrolled.includes(a.id))

  const handleUnenroll = async (activityId) => {
    if (onUnenroll) {
      await onUnenroll(activityId)
      setSelectedActivity(null)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-card-foreground">My Enrollments</CardTitle>
          <CardDescription>Activities you are currently enrolled in</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {enrolledActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-lg border border-border bg-secondary/30 p-3 sm:p-4"
            >
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Calendar className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-card-foreground">{activity.title}</span>
                    <StatusBadge status={activity.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {activity.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {activity.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3" />
                      {activity.location}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none border-border text-foreground hover:bg-secondary"
                  onClick={() => setSelectedActivity(activity)}
                >
                  Details
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              </div>
            </div>
          ))}

          {enrolledActivities.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
              <GraduationCap className="size-10 opacity-50" />
              <p className="text-sm">You haven{"'"}t enrolled in any activities yet.</p>
              <p className="text-xs">Browse available activities to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Details Dialog */}
      <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
        <DialogContent className="max-w-2xl">
          {selectedActivity && (
            <>
              <DialogHeader>
                <DialogTitle className="text-card-foreground">{selectedActivity.title}</DialogTitle>
                <DialogDescription>Activity Details</DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4">
                {/* Activity Info */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Status</span>
                    <StatusBadge status={selectedActivity.status} />
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Date</span>
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-primary" />
                      <span className="text-sm text-card-foreground">{selectedActivity.date}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Time</span>
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-primary" />
                      <span className="text-sm text-card-foreground">{selectedActivity.time}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Location</span>
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-primary" />
                      <span className="text-sm text-card-foreground">{selectedActivity.location}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedActivity.description && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Description</span>
                    <p className="text-sm text-card-foreground">{selectedActivity.description}</p>
                  </div>
                )}

                {/* Organizer */}
                {selectedActivity.organizer && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Organizer</span>
                    <p className="text-sm text-card-foreground">{selectedActivity.organizer}</p>
                  </div>
                )}

                {/* Capacity */}
                {selectedActivity.capacity && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Capacity</span>
                    <p className="text-sm text-card-foreground">
                      {selectedActivity.registeredCount || 0} / {selectedActivity.capacity} registered
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 justify-end pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedActivity(null)}
                  >
                    Close
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={unenrollingActivityIds.includes(selectedActivity.id)}
                    onClick={() => handleUnenroll(selectedActivity.id)}
                  >
                    {unenrollingActivityIds.includes(selectedActivity.id) ? "Cancelling..." : "Cancel Enrollment"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
