import { useCallback, useState } from "react"
import { useAuth } from "@/lib/auth-context"

type RegistrationLike = {
  id?: string
  activityId?: string
  activity_id?: string
  status?: string
  registrationStatus?: string
  attendanceId?: string
  isPresent?: boolean | null
  checkInTime?: string | null
  earnedPoints?: number | null
}

function normalizeRegistrationList(data: any): RegistrationLike[] {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.result)) return data.result
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.registrations)) return data.registrations
  return []
}

function isActiveRegistration(status: string | undefined) {
  const normalized = String(status || "").trim().toLowerCase()
  return normalized === "pending" || normalized === "approved"
}

export function useStudentEnrollment() {
  const authContext = useAuth() as {
    refreshAccessToken: () => Promise<boolean>
    logout: () => Promise<void>
  }

  const refreshAccessToken = authContext.refreshAccessToken
  const logout = authContext.logout

  const [enrollingActivityIds, setEnrollingActivityIds] = useState<string[]>([])
  const [unenrollingActivityIds, setUnenrollingActivityIds] = useState<string[]>([])
  const [checkingInRegistrationIds, setCheckingInRegistrationIds] = useState<string[]>([])
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null)

  const makeAuthenticatedRequest = useCallback(
    async (url: string, options: RequestInit = {}, retryCount = 0): Promise<Response | null> => {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        }

        if (options.headers && typeof options.headers === "object") {
          Object.assign(headers, options.headers)
        }

        const accessToken = localStorage.getItem("accessToken")
        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`
        }

        const response = await fetch(url, {
          ...options,
          headers,
        })

        if (response.status === 401 && retryCount < 1) {
          const refreshed = await refreshAccessToken()
          if (refreshed) {
            return makeAuthenticatedRequest(url, options, retryCount + 1)
          }
          await logout()
          return null
        }

        return response
      } catch (error) {
        console.error("API Error:", error)
        return null
      }
    },
    [logout, refreshAccessToken],
  )

  const getAllActivities = useCallback(async () => {
    try {
      const response = await makeAuthenticatedRequest("/api/activities")
      if (!response?.ok) return []
      return await response.json()
    } catch (error) {
      console.error("Error fetching activities:", error)
      return []
    }
  }, [makeAuthenticatedRequest])

  const getUserRegistrations = useCallback(async () => {
    try {
      const response = await makeAuthenticatedRequest("/api/registrations")
      if (!response?.ok) return []

      const data = await response.json()
      return normalizeRegistrationList(data)
    } catch (error) {
      console.error("Error fetching registrations:", error)
      return []
    }
  }, [makeAuthenticatedRequest])

  const getUserEnrollments = useCallback(async () => {
    try {
      const registrations = await getUserRegistrations()
      return registrations
        .filter((item) => isActiveRegistration(item.status || item.registrationStatus))
        .map((item) => item.activityId || item.activity_id || item.id)
        .filter(Boolean) as string[]
    } catch (error) {
      console.error("Error fetching enrollments:", error)
      return []
    }
  }, [getUserRegistrations])

  const handleEnroll = useCallback(
    async (activityId: string): Promise<boolean> => {
      setEnrollingActivityIds((prev) => [...prev, activityId])
      setEnrollmentError(null)
      try {
        const response = await makeAuthenticatedRequest("/api/registrations", {
          method: "POST",
          body: JSON.stringify({ activityId }),
        })

        if (!response?.ok) {
          const errorData = response ? await response.json().catch(() => ({})) : {}
          setEnrollmentError(errorData?.error || errorData?.message || "Enrollment failed")
          return false
        }

        return true
      } catch (error) {
        setEnrollmentError(error instanceof Error ? error.message : "Enrollment failed")
        return false
      } finally {
        setEnrollingActivityIds((prev) => prev.filter((id) => id !== activityId))
      }
    },
    [makeAuthenticatedRequest],
  )

  const handleUnenroll = useCallback(
    async (activityId: string): Promise<boolean> => {
      setUnenrollingActivityIds((prev) => [...prev, activityId])
      setEnrollmentError(null)
      try {
        const response = await makeAuthenticatedRequest("/api/registrations", {
          method: "DELETE",
          body: JSON.stringify({ activityId }),
        })

        if (!response?.ok) {
          const errorData = response ? await response.json().catch(() => ({})) : {}
          setEnrollmentError(errorData?.error || errorData?.message || "Unenrollment failed")
          return false
        }

        return true
      } catch (error) {
        setEnrollmentError(error instanceof Error ? error.message : "Unenrollment failed")
        return false
      } finally {
        setUnenrollingActivityIds((prev) => prev.filter((id) => id !== activityId))
      }
    },
    [makeAuthenticatedRequest],
  )

  const handleCheckIn = useCallback(
    async (registrationId: string): Promise<boolean> => {
      setCheckingInRegistrationIds((prev) => [...prev, registrationId])
      setEnrollmentError(null)
      try {
        const response = await makeAuthenticatedRequest("/api/attendance/check-in", {
          method: "POST",
          body: JSON.stringify({ registrationId }),
        })

        if (!response?.ok) {
          const errorData = response ? await response.json().catch(() => ({})) : {}
          setEnrollmentError(errorData?.error || errorData?.message || "Check-in failed")
          return false
        }

        return true
      } catch (error) {
        setEnrollmentError(error instanceof Error ? error.message : "Check-in failed")
        return false
      } finally {
        setCheckingInRegistrationIds((prev) => prev.filter((id) => id !== registrationId))
      }
    },
    [makeAuthenticatedRequest],
  )

  const getMyPoints = useCallback(
    async (filters: { year?: string; semester?: string } = {}) => {
      try {
        const params = new URLSearchParams()
        if (filters.year) params.set("year", filters.year)
        if (filters.semester) params.set("semester", filters.semester)

        const query = params.toString()
        const response = await makeAuthenticatedRequest(`/api/student/points${query ? `?${query}` : ""}`)
        if (!response?.ok) return { totalPoints: 0, activities: [] }

        const data = await response.json()
        return data?.result || data || { totalPoints: 0, activities: [] }
      } catch (error) {
        console.error("Error fetching student points:", error)
        return { totalPoints: 0, activities: [] }
      }
    },
    [makeAuthenticatedRequest],
  )

  return {
    makeAuthenticatedRequest,
    getAllActivities,
    getUserRegistrations,
    getUserEnrollments,
    getMyPoints,
    handleEnroll,
    handleUnenroll,
    handleCheckIn,
    enrollingActivityIds,
    unenrollingActivityIds,
    checkingInRegistrationIds,
    enrollmentError,
    setEnrollmentError,
  }
}
