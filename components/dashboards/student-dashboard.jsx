"use client"

import { useState } from "react"
import { mockActivities, mockAnnouncements } from "@/lib/mock-data"
import { StatCard } from "@/components/stat-card"
import { StatusBadge, CategoryBadge } from "@/components/status-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  GraduationCap,
  CalendarDays,
  Clock,
  MapPin,
  Calendar,
  Users,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

const enrolledIds = ["a1", "a4"]
const enrolledActivities = mockActivities.filter((a) => enrolledIds.includes(a.id))
const availableActivities = mockActivities.filter(
  (a) => !enrolledIds.includes(a.id) && a.status !== "cancelled" && a.status !== "completed"
)

function BrowseActivities() {
  const [enrolled, setEnrolled] = useState(enrolledIds)

  function handleEnroll(activityId) {
    setEnrolled((prev) => [...prev, activityId])
  }

  function handleUnenroll(activityId) {
    setEnrolled((prev) => prev.filter((id) => id !== activityId))
  }

  return (
    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {mockActivities
        .filter((a) => a.status !== "cancelled")
        .map((activity) => {
          const isEnrolled = enrolled.includes(activity.id)
          const isFull = activity.enrolled >= activity.capacity
          return (
            <Card key={activity.id} className="bg-card flex flex-col">
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
                  {isEnrolled ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={() => handleUnenroll(activity.id)}
                    >
                      Unenroll
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
                      onClick={() => handleEnroll(activity.id)}
                    >
                      Enroll Now
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
    </div>
  )
}

function MyEnrollments() {
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
                <CalendarDays className="size-5" />
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
            <Button variant="outline" size="sm" className="w-full sm:w-auto border-border text-foreground hover:bg-secondary">
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

function StudentAnnouncements() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-card-foreground">Announcements</CardTitle>
        <CardDescription>Latest news and updates from your institution</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {mockAnnouncements.map((a) => (
          <div key={a.id} className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3">
            {a.priority === "high" ? (
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            ) : (
              <CheckCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-card-foreground">{a.title}</span>
                {a.priority === "high" && (
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                    Important
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{a.content}</p>
              <span className="mt-1.5 block text-xs text-muted-foreground">{a.date}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function StudentDashboard() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Enrolled Activities"
          value={enrolledActivities.length}
          icon={<GraduationCap className="size-5" />}
          description="active enrollments"
        />
        <StatCard
          title="Available Activities"
          value={availableActivities.length}
          icon={<CalendarDays className="size-5" />}
          description="open for enrollment"
        />
        <StatCard
          title="Upcoming Events"
          value={enrolledActivities.filter((a) => a.status === "upcoming").length}
          icon={<Calendar className="size-5" />}
          description="in your schedule"
        />
        <StatCard
          title="Announcements"
          value={mockAnnouncements.length}
          icon={<AlertCircle className="size-5" />}
          trend={{ value: "2 new", positive: true }}
          description="this week"
        />
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="browse" className="flex-1 sm:flex-none text-xs sm:text-sm">Browse</TabsTrigger>
          <TabsTrigger value="enrollments" className="flex-1 sm:flex-none text-xs sm:text-sm">Enrollments</TabsTrigger>
          <TabsTrigger value="announcements" className="flex-1 sm:flex-none text-xs sm:text-sm">News</TabsTrigger>
        </TabsList>
        <TabsContent value="browse">
          <BrowseActivities />
        </TabsContent>
        <TabsContent value="enrollments">
          <MyEnrollments />
        </TabsContent>
        <TabsContent value="announcements">
          <StudentAnnouncements />
        </TabsContent>
      </Tabs>
    </div>
  )
}
