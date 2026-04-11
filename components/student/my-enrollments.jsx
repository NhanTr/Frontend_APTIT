"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { GraduationCap, Calendar, Clock, MapPin } from "lucide-react"

export function MyEnrollments({ activities, enrolled, onUnenroll, unenrollingActivityIds = [] }) {
  const enrolledActivities = activities.filter((a) => enrolled.includes(a.id))

  return (
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
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto border-border text-foreground hover:bg-secondary"
            >
              Details
            </Button>
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
  )
}
