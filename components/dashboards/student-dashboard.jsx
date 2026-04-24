"use client"

import { useState, useEffect, useCallback } from "react"
import { useRole } from "@/lib/role-context"
import { useStudentEnrollment } from "@/hooks/use-student-enrollment"
import { useUrlFilterSync, areFiltersEqual } from "@/hooks/use-url-filter-sync"
import { ActivityGrid } from "@/components/student/activity-grid"
import { ActivityFilter } from "@/components/student/activity-filter"
import { MyEnrollments } from "@/components/student/my-enrollments"
import { StudentAnnouncements } from "@/components/student/announcements"
import { PersonalProfilePanel } from "@/components/profile/personal-profile-panel"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, X } from "lucide-react"

export function StudentDashboard({ activeSection = "dashboard" }) {
  const { activities, loadMore, currentPage, hasMore, loading, enrolled, applyFilters } = useRole()
  const { initialFilters, updateUrlFilters } = useUrlFilterSync()
  const [filters, setFilters] = useState(() => initialFilters)
  const [localEnrolled, setLocalEnrolled] = useState(enrolled || [])
  const { enrollingActivityIds, unenrollingActivityIds, handleEnroll, handleUnenroll, getUserEnrollments, enrollmentError, setEnrollmentError } = useStudentEnrollment()

  useEffect(() => {
    setFilters((prev) => (areFiltersEqual(prev, initialFilters) ? prev : initialFilters))
  }, [initialFilters])

  const handleFilterChange = useCallback((newFilters) => {
    if (areFiltersEqual(filters, newFilters)) return

    setFilters(newFilters)
    applyFilters(newFilters)
    updateUrlFilters(newFilters)
  }, [filters, applyFilters, updateUrlFilters])

  // Load user's enrollments from database on mount
  useEffect(() => {
    const loadEnrollments = async () => {
      console.log("📋 Loading enrollments from database...")
      const enrollmentIds = await getUserEnrollments()
      setLocalEnrolled(enrollmentIds)
    }
    loadEnrollments()
  }, [])

  const handleEnrollClick = async (activityId) => {
    const success = await handleEnroll(activityId)
    // Reload enrollments after attempting to enroll (success or fail)
    console.log("🔄 Reloading enrollments after enroll attempt...")
    const enrollmentIds = await getUserEnrollments()
    setLocalEnrolled(enrollmentIds)
    return success
  }

  const handleUnenrollClick = async (activityId) => {
    const success = await handleUnenroll(activityId)
    // Reload enrollments after attempting to unenroll (success or fail)
    console.log("🔄 Reloading enrollments after unenroll attempt...")
    const enrollmentIds = await getUserEnrollments()
    setLocalEnrolled(enrollmentIds)
    return success
  }

  const enrolledActivities = activities.filter((a) => localEnrolled.includes(a.id))
  const availableActivities = activities.filter(
    (a) => !localEnrolled.includes(a.id) && a.status !== "cancelled" && a.status !== "completed"
  )

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Error Alert */}
      {enrollmentError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{enrollmentError}</span>
            <button
              onClick={() => setEnrollmentError(null)}
              className="ml-2 inline-flex"
            >
              <X className="h-4 w-4" />
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Content Area */}
      {(activeSection === "dashboard" || activeSection === "browse-activities") && (
        <>
          <ActivityFilter onFilterChange={handleFilterChange} initialFilters={filters} />
          <ActivityGrid
            activities={activities}
            enrolled={localEnrolled}
            onEnroll={handleEnrollClick}
            onUnenroll={handleUnenrollClick}
            currentPage={currentPage}
            hasMore={hasMore}
            onLoadMore={loadMore}
            loading={loading}
            enrollingActivityIds={enrollingActivityIds}
            unenrollingActivityIds={unenrollingActivityIds}
          />
        </>
      )}
      {activeSection === "my-enrollments" && (
        <MyEnrollments 
          activities={activities} 
          enrolled={localEnrolled}
          onUnenroll={handleUnenrollClick}
          unenrollingActivityIds={unenrollingActivityIds}
        />
      )}
      {activeSection === "announcements" && (
        <StudentAnnouncements />
      )}
      {activeSection === "personal-profile" && (
        <PersonalProfilePanel />
      )}
    </div>
  )
}
