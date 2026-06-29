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

function isVisibleStudentActivity(activity) {
  const status = String(activity?.status || "").trim().toLowerCase()
  const endTime = activity?.endTime ? new Date(activity.endTime).getTime() : null

  return (
    ["approved", "ongoing", "closed", "completed"].includes(status) ||
    (Number.isFinite(endTime) && endTime <= Date.now())
  )
}

function transformActivity(rawActivity) {
  const activity = rawActivity?.result || rawActivity
  if (!activity) return null

  const startDate = activity.startTime ? new Date(activity.startTime) : null

  return {
    id: activity.id,
    title: activity.title,
    description: activity.description || "",
    status: String(activity.status || "").toLowerCase(),
    date: startDate && !Number.isNaN(startDate.getTime()) ? startDate.toISOString().split("T")[0] : "",
    time: startDate && !Number.isNaN(startDate.getTime()) ? startDate.toTimeString().slice(0, 5) : "",
    location: activity.location || "",
    capacity: activity.maxParticipants ?? 0,
    enrolled: activity.currentParticipants ?? 0,
    startTime: activity.startTime,
    endTime: activity.endTime,
    organizer: activity.organizerName,
  }
}

export function StudentDashboard({ activeSection = "browse-activities" }) {
  const { activities, enrolled, applyFilters } = useRole()
  const { initialFilters, updateUrlFilters } = useUrlFilterSync()
  const [filters, setFilters] = useState(() => initialFilters)
  const [localEnrolled, setLocalEnrolled] = useState(enrolled || [])
  const [enrollmentActivities, setEnrollmentActivities] = useState([])
  const [registrationStatusByActivity, setRegistrationStatusByActivity] = useState({})
  const [registrationByActivity, setRegistrationByActivity] = useState({})
  const {
    makeAuthenticatedRequest,
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
    const activeActivityIds = activeRegistrations.map(getRegistrationActivityId).filter(Boolean)

    setLocalEnrolled(activeActivityIds)
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

    // My Enrollments should not depend on paginated/filtered browse activities.
    const activityById = new Map(activities.map((activity) => [activity.id, activity]))
    const resolvedActivities = activeActivityIds
      .map((activityId) => activityById.get(activityId))
      .filter(Boolean)

    const missingActivityIds = activeActivityIds.filter((activityId) => !activityById.has(activityId))

    if (missingActivityIds.length > 0) {
      const fetchedMissingActivities = await Promise.all(
        missingActivityIds.map(async (activityId) => {
          const response = await makeAuthenticatedRequest(`/api/activities/${activityId}`)
          if (!response?.ok) return null

          const data = await response.json().catch(() => null)
          return transformActivity(data)
        }),
      )

      setEnrollmentActivities([...resolvedActivities, ...fetchedMissingActivities.filter(Boolean)])
      return
    }

    setEnrollmentActivities(resolvedActivities)
  }, [activities, getUserRegistrations, makeAuthenticatedRequest])

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
  const visibleActivities = activities.filter(isVisibleStudentActivity)

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
            activities={visibleActivities}
            enrolled={localEnrolled}
            registrationStatusByActivity={registrationStatusByActivity}
            onEnroll={handleEnrollClick}
            onUnenroll={handleUnenrollClick}
            enrollingActivityIds={enrollingActivityIds}
            unenrollingActivityIds={unenrollingActivityIds}
          />
        </>
      )}
      {activeSection === "my-enrollments" && (
        <MyEnrollments
          activities={enrollmentActivities}
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
