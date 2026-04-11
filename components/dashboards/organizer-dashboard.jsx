"use client"

import { useState } from "react"
import { useRole } from "@/lib/role-context"
import { useAuth } from "@/lib/auth-context"
import { StatCard } from "@/components/stat-card"
import { PersonalProfilePanel } from "@/components/profile/personal-profile-panel"
import { StatusBadge, CategoryBadge } from "@/components/status-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  BookOpen,
  Users,
  ClipboardList,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  Plus,
  AlertCircle,
} from "lucide-react"

const organizerStudents = []

function CreateActivityForm() {
  const { createActivity } = useRole()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "academic",
    date: "",
    time: "",
    location: "",
    capacity: "",
  })
  const [submitted, setSubmitted] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.title || !formData.date || !formData.time || !formData.location || !formData.capacity) {
      alert("Please fill in all required fields")
      return
    }

    const newActivity = createActivity({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      date: formData.date,
      time: formData.time,
      location: formData.location,
      capacity: parseInt(formData.capacity),
      status: "upcoming",
    })

    setSubmitted(true)
    setFormData({
      title: "",
      description: "",
      category: "academic",
      date: "",
      time: "",
      location: "",
      capacity: "",
    })

    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-card-foreground">Create New Activity</CardTitle>
        <CardDescription>Submit a new activity for admin approval</CardDescription>
      </CardHeader>
      <CardContent>
        {submitted && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-success/10 text-success border border-success/20 p-3">
            <CheckCircle2 className="size-4 shrink-0" />
            <p className="text-sm">Activity created successfully! Awaiting admin approval.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title" className="text-card-foreground font-medium">
                Activity Title *
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Tech Workshop"
                value={formData.title}
                onChange={handleInputChange}
                className="border-border bg-secondary/30"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="category" className="text-card-foreground font-medium">
                Category *
              </Label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm"
              >
                <option value="academic">Academic</option>
                <option value="sports">Sports</option>
                <option value="cultural">Cultural</option>
                <option value="technology">Technology</option>
                <option value="community">Community</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex flex-col gap-2">
              <Label htmlFor="description" className="text-card-foreground font-medium">
                Description
              </Label>
              <textarea
                id="description"
                name="description"
                placeholder="Describe the activity..."
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm resize-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="date" className="text-card-foreground font-medium">
                Date *
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                className="border-border bg-secondary/30"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="time" className="text-card-foreground font-medium">
                Time *
              </Label>
              <Input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleInputChange}
                className="border-border bg-secondary/30"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-2">
              <Label htmlFor="location" className="text-card-foreground font-medium">
                Location *
              </Label>
              <Input
                id="location"
                name="location"
                placeholder="e.g., Auditorium"
                value={formData.location}
                onChange={handleInputChange}
                className="border-border bg-secondary/30"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="capacity" className="text-card-foreground font-medium">
                Capacity *
              </Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                placeholder="Max participants"
                value={formData.capacity}
                onChange={handleInputChange}
                className="border-border bg-secondary/30"
              />
            </div>
          </div>

          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-2 size-4" />
            Submit for Approval
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function MyActivities() {
  const { activities } = useRole()
  const { user } = useAuth()
  const myActivities = activities.filter((a) => a.instructorId === user.id)

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {myActivities.map((activity) => (
        <Card key={activity.id} className="bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CategoryBadge category={activity.category} />
              <div className="flex gap-1">
                <StatusBadge status={activity.status} />
                <Badge 
                  className={
                    activity.approvalStatus === "pending"
                      ? "bg-warning/10 text-warning border-warning/20"
                      : activity.approvalStatus === "approved"
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  }
                >
                  {activity.approvalStatus}
                </Badge>
              </div>
            </div>
            <CardTitle className="text-base sm:text-lg text-card-foreground mt-2">{activity.title}</CardTitle>
            <CardDescription className="leading-relaxed text-sm">{activity.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  <span>{activity.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  <span>{activity.time}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                <MapPin className="size-3.5" />
                <span>{activity.location}</span>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                  <span className="text-muted-foreground">Enrollment</span>
                  <span className="font-medium text-card-foreground">{activity.enrolled}/{activity.capacity}</span>
                </div>
                <Progress value={(activity.enrolled / activity.capacity) * 100} className="h-2" />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Button size="sm" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                  Manage
                </Button>
                <Button variant="outline" size="sm" className="flex-1 border-border text-foreground hover:bg-secondary">
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function MyStudents() {
  const { activities } = useRole()
  const { user } = useAuth()
  const myActivities = activities.filter((a) => a.instructorId === user.id)
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-card-foreground">Enrolled Students</CardTitle>
        <CardDescription>Students in your activities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {organizerStudents.map((student) => {
            const enrolled = student.enrolledActivities
              .map((id) => activities.find((a) => a.id === id)?.title)
              .filter(Boolean)
            return (
              <div
                key={student.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3 sm:p-4"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {student.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-card-foreground truncate">{student.name}</span>
                      <Badge variant="secondary" className="shrink-0">{student.grade}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{student.email}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 sm:ml-auto">
                  {enrolled.map((name) => (
                    <Badge key={name} variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function AttendanceTracker() {
  const { activities } = useRole()
  const { user } = useAuth()
  const myActivities = activities.filter((a) => a.instructorId === user.id)
  const [checked, setChecked] = useState({})

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-card-foreground">Take Attendance</CardTitle>
          <CardDescription>{myActivities[0]?.title || "Activities"} - {new Date().toLocaleDateString()}</CardDescription>
        </div>
        <Button size="sm" className="w-full sm:w-auto bg-success text-success-foreground hover:bg-success/90">
          <CheckCircle2 className="mr-1 size-4" />
          Submit
        </Button>
      </CardHeader>
      <CardContent>
        {/* Mobile Card View */}
        <div className="flex flex-col gap-3 sm:hidden">
          {organizerStudents.map((student) => (
            <div
              key={student.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3"
            >
              <Checkbox
                checked={checked[student.id] ?? false}
                onCheckedChange={(v) => setChecked((prev) => ({ ...prev, [student.id]: !!v }))}
                aria-label={`Mark ${student.name} as present`}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-card-foreground truncate">{student.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">{student.grade}</Badge>
                  {checked[student.id] ? (
                    <Badge className="bg-success/10 text-success border-success/20 text-xs" variant="outline">Present</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground text-xs">Pending</Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Desktop Table View */}
        <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">Present</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizerStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Checkbox
                      checked={checked[student.id] ?? false}
                      onCheckedChange={(v) => setChecked((prev) => ({ ...prev, [student.id]: !!v }))}
                      aria-label={`Mark ${student.name} as present`}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-card-foreground">{student.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{student.grade}</Badge>
                  </TableCell>
                  <TableCell>
                    {checked[student.id] ? (
                      <Badge className="bg-success/10 text-success border-success/20" variant="outline">Present</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Pending</Badge>
                    )}
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

export function OrganizerDashboard({ activeSection = "dashboard" }) {
  const { activities } = useRole()
  const { user } = useAuth()
  const myActivities = activities.filter((a) => a.instructorId === user.id)
  const totalEnrolled = myActivities.reduce((sum, a) => sum + a.enrolled, 0)
  const upcoming = myActivities.filter((a) => a.status === "upcoming").length
  const pending = myActivities.filter((a) => a.approvalStatus === "pending").length

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="My Activities"
          value={myActivities.length}
          icon={<BookOpen className="size-5" />}
          description="assigned to you"
        />
        <StatCard
          title="Total Students"
          value={totalEnrolled}
          icon={<Users className="size-5" />}
          description="across all activities"
        />
        <StatCard
          title="Upcoming Events"
          value={upcoming}
          icon={<Calendar className="size-5" />}
          description="in the next 30 days"
        />
        <StatCard
          title="Pending Approval"
          value={pending}
          icon={<AlertCircle className="size-5" />}
          description="awaiting admin review"
        />
      </div>

      {/* Content Area */}
      {(activeSection === "dashboard" || activeSection === "my-activities") && (
        <MyActivities />
      )}
      {activeSection === "create-activity" && (
        <CreateActivityForm />
      )}
      {activeSection === "my-students" && (
        <MyStudents />
      )}
      {activeSection === "attendance" && (
        <AttendanceTracker />
      )}
      {activeSection === "personal-profile" && (
        <PersonalProfilePanel />
      )}
    </div>
  )
}
