import { useState, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"

export function useStudentEnrollment() {
  const authContext = useAuth() as {
    refreshAccessToken: () => Promise<boolean>
    logout: () => Promise<void>
  }
  
  const refreshAccessToken = authContext.refreshAccessToken
  const logout = authContext.logout

  const [enrollingActivityIds, setEnrollingActivityIds] = useState<string[]>([])
  const [unenrollingActivityIds, setUnenrollingActivityIds] = useState<string[]>([])
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null)

  // Make authenticated request with automatic token refresh on 401
  // Read token from localStorage each time to avoid stale closure
  const makeAuthenticatedRequest = useCallback(
    async (
      url: string,
      options: RequestInit = {},
      retryCount = 0
    ): Promise<Response | null> => {
      const maxRetries = 1

      try {
        // Read fresh token from localStorage each time
        const accessToken = localStorage.getItem("accessToken")
        
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        }

        // Add custom headers if provided
        if (options.headers && typeof options.headers === "object") {
          Object.assign(headers, options.headers)
        }

        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`
        }

        console.log(`📡 Request: ${options.method || 'GET'} ${url}`)
        console.log(`🔐 Headers:`, { Authorization: headers["Authorization"] ? "Bearer ..." : "none" })
        console.log(`📦 Body:`, options.body || "no body")

        const response = await fetch(url, {
          ...options,
          headers,
        })

        console.log(`📊 Response: ${response.status} ${response.statusText}`)

        // If token expired, try to refresh and retry
        if (response.status === 401 && retryCount < maxRetries) {
          console.log("⏰ Token expired (401), attempting to refresh...")
          const refreshed = await refreshAccessToken()

          if (refreshed) {
            console.log("✅ Token refreshed, retrying request...")
            return makeAuthenticatedRequest(url, options, retryCount + 1)
          } else {
            console.error("❌ Token refresh failed, logging out...")
            logout()
            return null
          }
        }

        return response
      } catch (error) {
        console.error("API Error:", error)
        return null
      }
    },
    [refreshAccessToken, logout]
  )

  // Get all activities
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

  // Get user's enrolled activities
  const getUserEnrollments = useCallback(async () => {
    try {
      console.log("📥 Fetching user enrollments...")
      const response = await makeAuthenticatedRequest("/api/registrations")
      if (!response?.ok) {
        console.error("❌ Failed to fetch enrollments:", response?.status)
        return []
      }
      const data = await response.json()
      console.log("✅ Raw enrollment response:", data)
      
      // Extract activity IDs from response
      let enrollmentIds: string[] = []
      
      if (Array.isArray(data)) {
        // If response is array, extract IDs
        enrollmentIds = data.map((item: any) => {
          return item.activityId || item.activity_id || item.id
        }).filter(Boolean)
      } else if (data?.data && Array.isArray(data.data)) {
        // If wrapped in data field
        enrollmentIds = data.data.map((item: any) => {
          return item.activityId || item.activity_id || item.id
        }).filter(Boolean)
      } else if (data?.registrations && Array.isArray(data.registrations)) {
        // If wrapped in registrations field
        enrollmentIds = data.registrations.map((item: any) => {
          return item.activityId || item.activity_id || item.id
        }).filter(Boolean)
      }
      
      console.log("🎯 Extracted activity IDs:", enrollmentIds)
      return enrollmentIds
    } catch (error) {
      console.error("Error fetching enrollments:", error)
      return []
    }
  }, [makeAuthenticatedRequest])

  // Enroll in activity
  const handleEnroll = useCallback(
    async (activityId: string): Promise<boolean> => {
      setEnrollingActivityIds((prev) => [...prev, activityId])
      setEnrollmentError(null)
      try {
        const response = await makeAuthenticatedRequest(`/api/registrations`, {
          method: "POST",
          body: JSON.stringify({ activityId }),
        })
        
        if (!response?.ok) {
          const errorData = response ? await response.json().catch(() => ({})) : {}
          const errorMsg = errorData?.error || errorData?.message || "Enrollment failed"
          console.error("❌ Enrollment error:", errorMsg)
          setEnrollmentError(errorMsg)
          return false
        }
        
        console.log("✅ Enrollment successful")
        return true
      } catch (error) {
        console.error("Enrollment error:", error)
        setEnrollmentError(error instanceof Error ? error.message : "Enrollment failed")
        return false
      } finally {
        setEnrollingActivityIds((prev) => prev.filter((id) => id !== activityId))
      }
    },
    [makeAuthenticatedRequest]
  )

  // Unenroll from activity
  const handleUnenroll = useCallback(
    async (activityId: string): Promise<boolean> => {
      setUnenrollingActivityIds((prev) => [...prev, activityId])
      setEnrollmentError(null)
      try {
        const response = await makeAuthenticatedRequest(`/api/registrations`, {
          method: "DELETE",
          body: JSON.stringify({ activityId }),
        })
        
        if (!response?.ok) {
          const errorData = response ? await response.json().catch(() => ({})) : {}
          const errorMsg = errorData?.error || errorData?.message || "Unenrollment failed"
          console.error("❌ Unenrollment error:", errorMsg)
          setEnrollmentError(errorMsg)
          return false
        }
        
        console.log("✅ Unenrollment successful")
        return true
      } catch (error) {
        console.error("Unenrollment error:", error)
        setEnrollmentError(error instanceof Error ? error.message : "Unenrollment failed")
        return false
      } finally {
        setUnenrollingActivityIds((prev) => prev.filter((id) => id !== activityId))
      }
    },
    [makeAuthenticatedRequest]
  )

  return {
    makeAuthenticatedRequest,
    getAllActivities,
    getUserEnrollments,
    handleEnroll,
    handleUnenroll,
    enrollingActivityIds,
    unenrollingActivityIds,
    enrollmentError,
    setEnrollmentError,
  }

}

