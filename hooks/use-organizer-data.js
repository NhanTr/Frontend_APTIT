"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase()
}

export function transformOrganizerActivity(activity = {}) {
  const status = activity.status || "Draft"
  const capacity = activity.maxParticipants ?? activity.capacity ?? 0
  const enrolled = activity.currentParticipants ?? activity.enrolled ?? 0

  return {
    ...activity,
    id: activity.id,
    title: activity.title || "",
    description: activity.description || "",
    location: activity.location || "",
    status,
    statusKey: normalizeStatus(status),
    capacity,
    enrolled,
    maxParticipants: capacity,
    currentParticipants: enrolled,
    category: "event",
    approvalStatus:
      normalizeStatus(status) === "approved"
        ? "approved"
        : normalizeStatus(status) === "rejected"
          ? "rejected"
          : "pending",
    date: activity.startTime ? new Date(activity.startTime).toISOString().split("T")[0] : "",
    time: activity.startTime ? new Date(activity.startTime).toTimeString().slice(0, 5) : "",
    instructorId: activity.organizerId,
    instructor: activity.sponsor || activity.organizerId || "Ban tổ chức",
  }
}

function unwrapApiResponse(data) {
  return data?.result ?? data
}

async function readResponse(response) {
  const text = await response.text()
  return text ? JSON.parse(text) : null
}

export function useOrganizerData() {
  const { user, accessToken, refreshAccessToken, logout } = useAuth()
  const [activities, setActivities] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [registrationsByActivity, setRegistrationsByActivity] = useState({})
  const [attendanceByRegistration, setAttendanceByRegistration] = useState({})
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)

  const makeAuthenticatedRequest = useCallback(
    async (url, options = {}, retryCount = 0) => {
      const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      }

      const token = accessToken || localStorage.getItem("accessToken")
      if (token) {
        headers.Authorization = `Bearer ${token}`
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
      }

      return response
    },
    [accessToken, refreshAccessToken, logout],
  )

  const requestJson = useCallback(
    async (url, options = {}) => {
      const response = await makeAuthenticatedRequest(url, options)
      const data = await readResponse(response)

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "Yêu cầu thất bại")
      }

      return unwrapApiResponse(data)
    },
    [makeAuthenticatedRequest],
  )

  const refreshActivities = useCallback(async () => {
    if (!user?.id) return []

    const data = await requestJson(`/api/activities/organizer/${user.id}`)
    const list = Array.isArray(data) ? data : []
    const transformed = list.map(transformOrganizerActivity)
    setActivities(transformed)
    return transformed
  }, [requestJson, user?.id])

  const refreshStatistics = useCallback(async () => {
    const data = await requestJson("/api/activities/my-club/statistics")
    setStatistics(data || null)
    return data
  }, [requestJson])

  const refreshAll = useCallback(async () => {
    if (!accessToken || !user?.id) return

    setLoading(true)
    setError(null)
    try {
      await Promise.all([refreshActivities(), refreshStatistics()])
    } catch (err) {
      setError(err.message)
      setActivities([])
      setStatistics(null)
    } finally {
      setLoading(false)
    }
  }, [accessToken, refreshActivities, refreshStatistics, user?.id])

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  const runMutation = useCallback(
    async (mutation, options = {}) => {
      setActionLoading(true)
      setError(null)
      try {
        const result = await mutation()
        if (options.refresh !== false) {
          await refreshAll()
        }
        return result
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setActionLoading(false)
      }
    },
    [refreshAll],
  )

  const loadRegistrations = useCallback(
    async (activityId) => {
      if (!activityId) return []

      setActionLoading(true)
      setError(null)
      try {
        const data = await requestJson(`/api/registrations/${activityId}`)
        const registrations = Array.isArray(data) ? data : []
        setRegistrationsByActivity((prev) => ({
          ...prev,
          [activityId]: registrations,
        }))
        return registrations
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setActionLoading(false)
      }
    },
    [requestJson],
  )

  const createActivity = useCallback(
    async (payload, options = {}) =>
      runMutation(async () => {
        const created = await requestJson("/api/activities", {
          method: "POST",
          body: JSON.stringify(payload),
        })
        const activity = transformOrganizerActivity(created)
        if (options.submitAfterCreate && activity.id) {
          return requestJson(`/api/activities/${activity.id}/submit`, {
            method: "PATCH",
          })
        }
        return activity
      }),
    [requestJson, runMutation],
  )

  const updateActivity = useCallback(
    async (activityId, payload) =>
      runMutation(() =>
        requestJson(`/api/activities/${activityId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        }),
      ),
    [requestJson, runMutation],
  )

  const deleteActivity = useCallback(
    async (activityId) =>
      runMutation(() =>
        requestJson(`/api/activities/${activityId}`, {
          method: "DELETE",
        }),
      ),
    [requestJson, runMutation],
  )

  const submitActivity = useCallback(
    async (activityId) =>
      runMutation(() =>
        requestJson(`/api/activities/${activityId}/submit`, {
          method: "PATCH",
        }),
      ),
    [requestJson, runMutation],
  )

  const requestCancelActivity = useCallback(
    async (activityId, reason) =>
      runMutation(() =>
        requestJson(`/api/activities/${activityId}/cancel-request`, {
          method: "PATCH",
          body: JSON.stringify({ reason }),
        }),
      ),
    [requestJson, runMutation],
  )

  const submitReport = useCallback(
    async (activityId, payload) =>
      runMutation(() =>
        requestJson(`/api/activities/${activityId}/reports`, {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      ),
    [requestJson, runMutation],
  )

  const approveRegistration = useCallback(
    async (activityId, studentId) =>
      runMutation(
        async () => {
          const result = await requestJson(
            `/api/manager/registrations/${activityId}/students/${studentId}/approve`,
            { method: "PATCH" },
          )
          await loadRegistrations(activityId)
          return result
        },
        { refresh: false },
      ),
    [loadRegistrations, requestJson, runMutation],
  )

  const rejectRegistration = useCallback(
    async (activityId, studentId, reason) =>
      runMutation(
        async () => {
          const result = await requestJson(
            `/api/manager/registrations/${activityId}/students/${studentId}/reject`,
            {
              method: "PATCH",
              body: JSON.stringify({ reason }),
            },
          )
          await loadRegistrations(activityId)
          return result
        },
        { refresh: false },
      ),
    [loadRegistrations, requestJson, runMutation],
  )

  const checkInRegistration = useCallback(
    async (registrationId, isPresent) =>
      runMutation(
        async () => {
          const result = await requestJson("/api/organizer/attendance/check-in", {
            method: "POST",
            body: JSON.stringify({ registrationId, isPresent }),
          })
          setAttendanceByRegistration((prev) => ({
            ...prev,
            [registrationId]: result,
          }))
          return result
        },
        { refresh: false },
      ),
    [requestJson, runMutation],
  )

  const awardPoints = useCallback(
    async (registrationId, earnedPoints) =>
      runMutation(
        async () => {
          const result = await requestJson("/api/organizer/attendance/points", {
            method: "PATCH",
            body: JSON.stringify({
              registrationId,
              earnedPoints: earnedPoints === "" ? undefined : Number(earnedPoints),
            }),
          })
          setAttendanceByRegistration((prev) => ({
            ...prev,
            [registrationId]: result,
          }))
          return result
        },
        { refresh: false },
      ),
    [requestJson, runMutation],
  )

  return {
    activities,
    statistics,
    registrationsByActivity,
    attendanceByRegistration,
    loading,
    actionLoading,
    error,
    refreshAll,
    loadRegistrations,
    createActivity,
    updateActivity,
    deleteActivity,
    submitActivity,
    requestCancelActivity,
    submitReport,
    approveRegistration,
    rejectRegistration,
    checkInRegistration,
    awardPoints,
  }
}
