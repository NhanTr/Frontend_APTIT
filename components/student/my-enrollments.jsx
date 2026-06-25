"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, CheckCircle2, ChevronRight, Clock, GraduationCap, MapPin } from "lucide-react"

const activityStatusMeta = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border" },
  pending: { label: "Waiting activity approval", className: "bg-warning/10 text-warning border-warning/20" },
  reviewing: { label: "Cancel request review", className: "bg-primary/10 text-primary border-primary/20" },
  approved: { label: "Activity approved", className: "bg-success/10 text-success border-success/20" },
  ongoing: { label: "Ongoing", className: "bg-success/10 text-success border-success/20" },
  closed: { label: "Closed", className: "bg-secondary text-secondary-foreground border-border" },
  completed: { label: "Closed", className: "bg-secondary text-secondary-foreground border-border" },
  rejected: { label: "Activity rejected", className: "bg-destructive/10 text-destructive border-destructive/20" },
  cancelled: { label: "Activity cancelled", className: "bg-destructive/10 text-destructive border-destructive/20" },
}

const registrationStatusMeta = {
  pending: { label: "Registration pending", className: "bg-warning/10 text-warning border-warning/20" },
  approved: { label: "Registration approved", className: "bg-success/10 text-success border-success/20" },
  rejected: { label: "Registration rejected", className: "bg-destructive/10 text-destructive border-destructive/20" },
  cancelled: { label: "Registration cancelled", className: "bg-muted text-muted-foreground border-border" },
}

function getStatusKey(status) {
  return String(status || "").trim().toLowerCase()
}

function isApprovedRegistration(registrationStatus) {
  return getStatusKey(registrationStatus) === "approved"
}

function isActivityOngoing(activity) {
  if (getStatusKey(activity.status) === "ongoing") return true

  const startTime = activity.startTime ? new Date(activity.startTime).getTime() : null
  const endTime = activity.endTime ? new Date(activity.endTime).getTime() : null
  const now = Date.now()

  return Number.isFinite(startTime) && startTime <= now && (!Number.isFinite(endTime) || endTime > now)
}

function getCheckInMeta(registration) {
  if (registration?.checkInTime) {
    return { label: "Checked in", className: "bg-success/10 text-success border-success/20" }
  }

  return { label: "Not checked in", className: "bg-muted text-muted-foreground border-border" }
}

function getPresenceMeta(registration) {
  if (registration?.isPresent === true) {
    return { label: "Present", className: "bg-success/10 text-success border-success/20" }
  }

  if (registration?.isPresent === false) {
    return { label: "Not present", className: "bg-muted text-muted-foreground border-border" }
  }

  return { label: "Not confirmed", className: "bg-muted text-muted-foreground border-border" }
}

function StatusGroup({ activity, registrationStatus, registration }) {
  const activityMeta =
    activityStatusMeta[getStatusKey(activity.status)] || {
      label: activity.status || "Unknown activity status",
      className: "bg-muted text-muted-foreground border-border",
    }
  const registrationMeta =
    registrationStatusMeta[getStatusKey(registrationStatus)] || {
      label: "Registration pending",
      className: "bg-warning/10 text-warning border-warning/20",
    }
  const checkInMeta = getCheckInMeta(registration)
  const presenceMeta = getPresenceMeta(registration)

  return (
    <div className="flex flex-wrap gap-2">
      <div className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1">
        <span className="text-[11px] font-medium text-muted-foreground">Activity</span>
        <Badge variant="outline" className={activityMeta.className}>
          {activityMeta.label}
        </Badge>
      </div>
      <div className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1">
        <span className="text-[11px] font-medium text-muted-foreground">Registration</span>
        <Badge variant="outline" className={registrationMeta.className}>
          {registrationMeta.label}
        </Badge>
      </div>
      {isApprovedRegistration(registrationStatus) && (
        <div className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1">
          <span className="text-[11px] font-medium text-muted-foreground">Check-in</span>
          <Badge variant="outline" className={checkInMeta.className}>
            {checkInMeta.label}
          </Badge>
        </div>
      )}
      {isApprovedRegistration(registrationStatus) && (
        <div className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1">
          <span className="text-[11px] font-medium text-muted-foreground">Presence</span>
          <Badge variant="outline" className={presenceMeta.className}>
            {presenceMeta.label}
          </Badge>
        </div>
      )}
    </div>
  )
}

export function MyEnrollments({
  activities,
  enrolled,
  registrationStatusByActivity = {},
  registrationByActivity = {},
  onUnenroll,
  onCheckIn,
  unenrollingActivityIds = [],
  checkingInRegistrationIds = [],
}) {
  const [selectedActivity, setSelectedActivity] = useState(null)
  const enrolledActivities = activities.filter((activity) => enrolled.includes(activity.id))

  const handleUnenroll = async (activityId) => {
    if (onUnenroll) {
      await onUnenroll(activityId)
      setSelectedActivity(null)
    }
  }

  const handleCheckIn = async (registrationId) => {
    if (onCheckIn) {
      await onCheckIn(registrationId)
    }
  }

  const getRegistration = (activity) => registrationByActivity[activity.id]
  const getRegistrationStatus = (activity) => registrationStatusByActivity[activity.id]
  const canCheckInActivity = (activity) => {
    const registration = getRegistration(activity)

    return (
      registration?.id &&
      isApprovedRegistration(getRegistrationStatus(activity)) &&
      isActivityOngoing(activity) &&
      !registration?.checkInTime
    )
  }
  const selectedRegistration = selectedActivity ? getRegistration(selectedActivity) : null
  const selectedCanCheckIn = selectedActivity ? canCheckInActivity(selectedActivity) : false
  const selectedIsCheckingIn = checkingInRegistrationIds.includes(selectedRegistration?.id)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-card-foreground">My Enrollments</CardTitle>
          <CardDescription>Track activity lifecycle and your registration approval separately</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {enrolledActivities.map((activity) => {
            const registration = getRegistration(activity)
            const registrationStatus = getRegistrationStatus(activity)
            const canCheckIn = canCheckInActivity(activity)
            const isCheckingIn = checkingInRegistrationIds.includes(registration?.id)

            return (
              <div
                key={activity.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/30 p-3 sm:p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Calendar className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-card-foreground">{activity.title}</p>
                      <div className="mt-2">
                        <StatusGroup
                          activity={activity}
                          registrationStatus={registrationStatus}
                          registration={registration}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
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
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-36">
                    {canCheckIn && (
                      <Button
                        size="sm"
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        disabled={isCheckingIn}
                        onClick={() => handleCheckIn(registration.id)}
                      >
                        <CheckCircle2 className="mr-1 size-4" />
                        {isCheckingIn ? "Checking in..." : "Check in"}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-border text-foreground hover:bg-secondary"
                      onClick={() => setSelectedActivity(activity)}
                    >
                      Details
                      <ChevronRight className="ml-1 size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}

          {enrolledActivities.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
              <GraduationCap className="size-10 opacity-50" />
              <p className="text-sm">You have not registered for any activities yet.</p>
              <p className="text-xs">Use Dashboard to find an activity and request approval.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
        <DialogContent className="max-w-2xl">
          {selectedActivity && (
            <>
              <DialogHeader>
                <DialogTitle className="text-card-foreground">{selectedActivity.title}</DialogTitle>
                <DialogDescription>Enrollment details</DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4">
                <StatusGroup
                  activity={selectedActivity}
                  registrationStatus={registrationStatusByActivity[selectedActivity.id]}
                  registration={selectedRegistration}
                />

                <div className="grid gap-4 sm:grid-cols-2">
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

                  {selectedActivity.capacity && (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-muted-foreground">Capacity</span>
                      <p className="text-sm text-card-foreground">
                        {selectedActivity.enrolled || 0} / {selectedActivity.capacity} registered
                      </p>
                    </div>
                  )}
                </div>

                {selectedActivity.description && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Description</span>
                    <p className="text-sm text-card-foreground">{selectedActivity.description}</p>
                  </div>
                )}

                {selectedActivity.organizer && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Organizer</span>
                    <p className="text-sm text-card-foreground">{selectedActivity.organizer}</p>
                  </div>
                )}

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  {selectedCanCheckIn && (
                    <Button
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={selectedIsCheckingIn}
                      onClick={() => handleCheckIn(selectedRegistration.id)}
                    >
                      <CheckCircle2 className="mr-1 size-4" />
                      {selectedIsCheckingIn ? "Checking in..." : "Check in"}
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setSelectedActivity(null)}>
                    Close
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={unenrollingActivityIds.includes(selectedActivity.id)}
                    onClick={() => handleUnenroll(selectedActivity.id)}
                  >
                    {unenrollingActivityIds.includes(selectedActivity.id) ? "Cancelling..." : "Cancel registration"}
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
