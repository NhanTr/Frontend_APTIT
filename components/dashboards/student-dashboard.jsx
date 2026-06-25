"use client"

import { useCallback, useEffect, useState } from "react"
import { useRole } from "@/lib/role-context"
import { useStudentEnrollment } from "@/hooks/use-student-enrollment"
import { useUrlFilterSync, areFiltersEqual } from "@/hooks/use-url-filter-sync"
import { ActivityGrid } from "@/components/student/activity-grid"
import { ActivityFilter } from "@/components/student/activity-filter"
import { MyEnrollments } from "@/components/student/my-enrollments"
import { MyPoints } from "@/components/student/my-points"
import { StudentAnnouncements } from "@/components/student/announcements"
import { PersonalProfilePanel } from "@/components/profile/personal-profile-panel"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, X } from "lucide-react"

function isActiveRegistration(registration) {
  const status = String(registration.status || registration.registrationStatus || "").trim().toLowerCase()
  return status === "pending" || status === "approved"
}

function getRegistrationActivityId(registration) {
  return registration.activityId || registration.activity_id || registration.id
}

export function StudentDashboard({ activeSection = "browse-activities" }) {
  const { activities, loadMore, currentPage, hasMore, loading, enrolled, applyFilters } = useRole()
  const { initialFilters, updateUrlFilters } = useUrlFilterSync()
  const [filters, setFilters] = useState(() => initialFilters)
  const [localEnrolled, setLocalEnrolled] = useState(enrolled || [])
  const [registrationStatusByActivity, setRegistrationStatusByActivity] = useState({})
  const [registrationByActivity, setRegistrationByActivity] = useState({})
  const {
    enrollingActivityIds,
    unenrollingActivityIds,
    checkingInRegistrationIds,
    handleEnroll,
    handleUnenroll,
    handleCheckIn,
    getMyPoints,
    getUserRegistrations,
    enrollmentError,
    setEnrollmentError,
  } = useStudentEnrollment()

  useEffect(() => {
    setFilters((prev) => (areFiltersEqual(prev, initialFilters) ? prev : initialFilters))
  }, [initialFilters])

  const handleFilterChange = useCallback(
    (newFilters) => {
      if (areFiltersEqual(filters, newFilters)) return

      setFilters(newFilters)
      applyFilters(newFilters)
      updateUrlFilters(newFilters)
    },
    [filters, applyFilters, updateUrlFilters],
  )

  const refreshRegistrations = useCallback(async () => {
    const registrations = await getUserRegistrations()
    const activeRegistrations = registrations.filter(isActiveRegistration)

    setLocalEnrolled(activeRegistrations.map(getRegistrationActivityId).filter(Boolean))
    setRegistrationByActivity(
      Object.fromEntries(
        activeRegistrations
          .map((registration) => [getRegistrationActivityId(registration), registration])
          .filter(([activityId]) => Boolean(activityId)),
      ),
    )
    setRegistrationStatusByActivity(
      Object.fromEntries(
        activeRegistrations
          .map((registration) => [
            getRegistrationActivityId(registration),
            registration.status || registration.registrationStatus,
          ])
          .filter(([activityId]) => Boolean(activityId)),
      ),
    )
  }, [getUserRegistrations])

  useEffect(() => {
    refreshRegistrations()
  }, [refreshRegistrations])

  const handleEnrollClick = async (activityId) => {
    const success = await handleEnroll(activityId)
    await refreshRegistrations()
    return success
  }

  const handleUnenrollClick = async (activityId) => {
    const success = await handleUnenroll(activityId)
    await refreshRegistrations()
    return success
  }

  const handleCheckInClick = async (registrationId) => {
    const success = await handleCheckIn(registrationId)
    await refreshRegistrations()
    return success
  }

  const isDashboardSection = activeSection === "dashboard" || activeSection === "browse-activities"

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {enrollmentError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{enrollmentError}</span>
            <button onClick={() => setEnrollmentError(null)} className="ml-2 inline-flex">
              <X className="h-4 w-4" />
            </button>
          </AlertDescription>
        </Alert>
      )}

      {isDashboardSection && (
        <>
          <ActivityFilter onFilterChange={handleFilterChange} initialFilters={filters} />
          <ActivityGrid
            activities={activities}
            enrolled={localEnrolled}
            registrationStatusByActivity={registrationStatusByActivity}
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
          registrationStatusByActivity={registrationStatusByActivity}
          registrationByActivity={registrationByActivity}
          onUnenroll={handleUnenrollClick}
          onCheckIn={handleCheckInClick}
          unenrollingActivityIds={unenrollingActivityIds}
          checkingInRegistrationIds={checkingInRegistrationIds}
        />
      )}
      {activeSection === "my-points" && <MyPoints getMyPoints={getMyPoints} />}
      {activeSection === "announcements" && <StudentAnnouncements />}
      {activeSection === "personal-profile" && <PersonalProfilePanel />}
    </div>
  )
}
