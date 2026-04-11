"use client"

import { useRole } from "@/lib/role-context"
import { StatCard } from "@/components/stat-card"
import { PersonalProfilePanel } from "@/components/profile/personal-profile-panel"
import { StatusBadge, CategoryBadge } from "@/components/status-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  CalendarDays,
  Users,
  TrendingUp,
  Check,
  X,
  MoreHorizontal,
  AlertCircle,
  Clock,
  FileText,
} from "lucide-react"

function ActivityApprovalTable() {
  const { activities, approveActivity, rejectActivity } = useRole()
  const pendingActivities = activities.filter((a) => a.approvalStatus === "pending")
  const approvedActivities = activities.filter((a) => a.approvalStatus === "approved")

  return (
    <div className="flex flex-col gap-4">
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

function ReportsPanel() {
  const mockReports = [
    {
      id: "rep1",
      title: "Monthly Activity Statistics",
      description: "Comprehensive overview of activity engagement and participation metrics",
      date: "2026-03-05",
      author: "System",
    },
    {
      id: "rep2",
      title: "Student Enrollment Report",
      description: "Detailed breakdown of enrollment patterns across all activities",
      date: "2026-03-04",
      author: "System",
    },
    {
      id: "rep3",
      title: "Activity Performance Review",
      description: "Analysis of completed activities and their success metrics",
      date: "2026-03-01",
      author: "System",
    },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-card-foreground">Reports</CardTitle>
          <CardDescription>View and analyze activity reports</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="w-full sm:w-auto border-border text-foreground hover:bg-secondary">
          Generate Report
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {mockReports.map((report) => (
          <div
            key={report.id}
            className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-4"
          >
            <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-sm font-medium text-card-foreground">{report.title}</span>
                <span className="text-xs text-muted-foreground">{report.date}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{report.description}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span>By {report.author}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function ManagerDashboard({ activeSection = "dashboard" }) {
  const { activities } = useRole()
  const totalActivities = activities.length
  const pendingApprovals = activities.filter((a) => a.approvalStatus === "pending").length
  const approvedActivities = activities.filter((a) => a.approvalStatus === "approved").length

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Activities"
          value={totalActivities}
          icon={<CalendarDays className="size-5" />}
          trend={{ value: "+12%", positive: true }}
          description="from last month"
        />
        <StatCard
          title="Pending Approvals"
          value={pendingApprovals}
          icon={<AlertCircle className="size-5" />}
          description="awaiting review"
        />
        <StatCard
          title="Approved"
          value={approvedActivities}
          icon={<TrendingUp className="size-5" />}
          description="active & verified"
        />
        <StatCard
          title="Reports"
          value={3}
          icon={<FileText className="size-5" />}
          description="available"
        />
      </div>

      {/* Content Area */}
      {(activeSection === "dashboard" || activeSection === "activity-approvals") && (
        <ActivityApprovalTable />
      )}
      {activeSection === "reports" && (
        <ReportsPanel />
      )}
      {activeSection === "personal-profile" && (
        <PersonalProfilePanel />
      )}
    </div>
  )
}
