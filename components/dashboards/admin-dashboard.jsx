"use client"

import { useState, useEffect, useCallback } from "react"
import { useRole } from "@/lib/role-context"
import { useUrlFilterSync, areFiltersEqual } from "@/hooks/use-url-filter-sync"
import { PersonalProfilePanel } from "@/components/profile/personal-profile-panel"
import { StatusBadge, CategoryBadge } from "@/components/status-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ActivityFilter } from "@/components/student/activity-filter"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Users,
  AlertCircle,
  MoreHorizontal,
  Clock,
  Check,
  X,
} from "lucide-react"

function ActivityApprovalTable() {
  const { activities, approveActivity, rejectActivity, applyFilters } = useRole()
  const { initialFilters, updateUrlFilters } = useUrlFilterSync()
  const [filters, setFilters] = useState(() => initialFilters)
  const pendingActivities = activities.filter((a) => a.approvalStatus === "pending")
  const approvedActivities = activities.filter((a) => a.approvalStatus === "approved")

  useEffect(() => {
    setFilters((prev) => (areFiltersEqual(prev, initialFilters) ? prev : initialFilters))
  }, [initialFilters])

  const handleFilterChange = useCallback((newFilters) => {
    if (areFiltersEqual(filters, newFilters)) return

    setFilters(newFilters)
    applyFilters(newFilters)
    updateUrlFilters(newFilters)
  }, [filters, applyFilters, updateUrlFilters])

  return (
    <div className="flex flex-col gap-4">
      <ActivityFilter onFilterChange={handleFilterChange} initialFilters={filters} />
      {/* Pending Activities for Approval */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-card-foreground">Pending Activity Approvals</CardTitle>
            <CardDescription>Review and approve new activities from organizers</CardDescription>
          </div>
          {pendingActivities.length > 0 && (
            <Badge className="w-fit mt-2 bg-warning/10 text-warning border-warning/20">{pendingActivities.length} pending</Badge>
          )}
        </CardHeader>
        <CardContent>
          {pendingActivities.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="size-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No pending activities for approval</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="flex flex-col gap-3 md:hidden">
                {pendingActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex flex-col gap-3 rounded-lg border border-warning/20 bg-warning/5 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <span className="font-medium text-card-foreground">{activity.title}</span>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <CategoryBadge category={activity.category} />
                          <Badge className="bg-warning/10 text-warning border-warning/20">Pending Review</Badge>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{activity.description}</p>
                    <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        <span>{activity.date} @ {activity.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="size-3.5" />
                        <span>Organizer: {activity.instructor}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                        onClick={() => approveActivity(activity.id)}
                      >
                        <Check className="mr-1 size-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => rejectActivity(activity.id)}
                      >
                        <X className="mr-1 size-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activity</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Organizer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingActivities.map((activity) => (
                      <TableRow key={activity.id} className="border-warning/20">
                        <TableCell className="font-medium text-card-foreground">{activity.title}</TableCell>
                        <TableCell>
                          <CategoryBadge category={activity.category} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">{activity.instructor}</TableCell>
                        <TableCell className="text-muted-foreground">{activity.date}</TableCell>
                        <TableCell className="text-muted-foreground">{activity.capacity}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-success text-success-foreground hover:bg-success/90"
                              onClick={() => approveActivity(activity.id)}
                            >
                              <Check className="size-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-destructive text-destructive hover:bg-destructive/10"
                              onClick={() => rejectActivity(activity.id)}
                            >
                              <X className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* All Activities Overview */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-card-foreground">All Activities</CardTitle>
            <CardDescription>Monitor all student activities</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile Card View */}
          <div className="flex flex-col gap-3 md:hidden">
            {approvedActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/30 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <span className="font-medium text-card-foreground">{activity.title}</span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <CategoryBadge category={activity.category} />
                      <StatusBadge status={activity.status} />
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground hover:text-foreground" aria-label="More actions">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </div>
                <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />
                    <span>{activity.date}</span>
                    <span className="mx-1">{"/"}</span>
                    <Clock className="size-3.5" />
                    <span>{activity.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="size-3.5" />
                    <span>{activity.instructor}</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Enrollment</span>
                    <span className="font-medium text-card-foreground">{activity.enrolled}/{activity.capacity}</span>
                  </div>
                  <Progress value={(activity.enrolled / activity.capacity) * 100} className="h-2" />
                </div>
              </div>
            ))}
          </div>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Enrollment</TableHead>
                  <TableHead>Organizer</TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium text-card-foreground">{activity.title}</TableCell>
                    <TableCell>
                      <CategoryBadge category={activity.category} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={activity.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{activity.date}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={(activity.enrolled / activity.capacity) * 100} className="h-2 w-16" />
                        <span className="text-xs text-muted-foreground">
                          {activity.enrolled}/{activity.capacity}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{activity.instructor}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" aria-label="More actions">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AnnouncementsPanel() {
  const { activities } = useRole()
  const mockAnnouncements = [
    {
      id: "an1",
      title: "Spring Activities Registration Open",
      content: "Registration for all spring semester activities is now open. Please sign up before March 10th to secure your spot.",
      author: "Sarah Chen",
      date: "2026-03-01",
      priority: "high",
    },
    {
      id: "an2",
      title: "Basketball Tournament Schedule Update",
      content: "The tournament has been rescheduled to March 15th due to facility maintenance. All registered participants will be notified.",
      author: "James Wilson",
      date: "2026-03-03",
      priority: "medium",
    },
    {
      id: "an3",
      title: "New Computer Lab Equipment",
      content: "The engineering lab has been upgraded with new 3D printers and robotics kits. Available for club use starting next week.",
      author: "Prof. Alan Turing",
      date: "2026-03-02",
      priority: "low",
    },
    {
      id: "an4",
      title: "Community Service Hours Reminder",
      content: "All students must complete a minimum of 20 community service hours per semester. Check available volunteer opportunities.",
      author: "Sarah Chen",
      date: "2026-02-28",
      priority: "medium",
    },
  ]

  const priorityStyles = {
    high: "bg-destructive/10 text-destructive border-destructive/20",
    medium: "bg-warning/10 text-warning border-warning/20",
    low: "bg-muted text-muted-foreground border-border",
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-card-foreground">Recent Announcements</CardTitle>
          <CardDescription>Latest updates and notices</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="w-full sm:w-auto border-border text-foreground hover:bg-secondary">
          View All
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {mockAnnouncements.map((announcement) => (
          <div
            key={announcement.id}
            className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-card-foreground">{announcement.title}</span>
                <Badge variant="outline" className={priorityStyles[announcement.priority]}>
                  {announcement.priority}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{announcement.content}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{announcement.author}</span>
                <span>{"/"}</span>
                <span>{announcement.date}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function StudentsList() {
  const mockStudents = [
    { id: 1, name: "Alice Johnson", email: "alice@university.edu", enrollments: 5, role: "Active" },
    { id: 2, name: "Bob Smith", email: "bob@university.edu", enrollments: 3, role: "Active" },
    { id: 3, name: "Carol Davis", email: "carol@university.edu", enrollments: 7, role: "Active" },
    { id: 4, name: "David Lee", email: "david@university.edu", enrollments: 2, role: "Inactive" },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-card-foreground">Students Management</CardTitle>
          <CardDescription>Manage all registered students and their accounts</CardDescription>
        </div>
        <Button size="sm" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
          Add Student
        </Button>
      </CardHeader>
      <CardContent>
        {/* Mobile Card View */}
        <div className="flex flex-col gap-3 md:hidden">
          {mockStudents.map((student) => (
            <div key={student.id} className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/30 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span className="font-medium text-card-foreground">{student.name}</span>
                  <p className="text-xs text-muted-foreground">{student.email}</p>
                </div>
                <Badge variant={student.role === "Active" ? "default" : "secondary"}>{student.role}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Enrollments: {student.enrollments}</span>
                <Button variant="ghost" size="icon" className="size-8" aria-label="More actions">
                  <MoreHorizontal className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Enrollments</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium text-card-foreground">{student.name}</TableCell>
                  <TableCell className="text-muted-foreground">{student.email}</TableCell>
                  <TableCell className="text-muted-foreground">{student.enrollments}</TableCell>
                  <TableCell>
                    <Badge variant={student.role === "Active" ? "default" : "secondary"}>{student.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="size-8" aria-label="More actions">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export function AdminDashboard({ activeSection = "dashboard" }) {
  const mockStudents = [
    { id: 1, name: "Alice Johnson", email: "alice@university.edu", status: "Active" },
    { id: 2, name: "Bob Smith", email: "bob@university.edu", status: "Active" },
    { id: 3, name: "Carol Davis", email: "carol@university.edu", status: "Active" },
    { id: 4, name: "David Lee", email: "david@university.edu", status: "Inactive" },
  ]

  const totalStudents = mockStudents.length
  const activeStudents = mockStudents.filter((s) => s.status === "Active").length
  const inactiveStudents = mockStudents.filter((s) => s.status === "Inactive").length

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Content Area */}
      {(activeSection === "dashboard" || activeSection === "students") && (
        <StudentsList />
      )}
      {activeSection === "announcements" && (
        <AnnouncementsPanel />
      )}
      {activeSection === "personal-profile" && (
        <PersonalProfilePanel />
      )}
    </div>
  )
}
