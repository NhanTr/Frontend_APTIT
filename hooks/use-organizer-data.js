"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"

const defaultActivityFilters = {
  status: "",
  keyword: "",
  location: "",
}

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase()
}

function applyActivityFilters(activities, filters) {
  const status = normalizeStatus(filters.status)
  const keyword = String(filters.keyword || "").trim().toLowerCase()
  const location = String(filters.location || "").trim().toLowerCase()

  return activities.filter((activity) => {
    const matchesStatus = !status || activity.statusKey === status
    const matchesKeyword =
      !keyword ||
      [activity.title, activity.description].some((value) =>
        String(value || "").toLowerCase().includes(keyword),
      )
    const matchesLocation = !location || String(activity.location || "").toLowerCase().includes(location)

    return matchesStatus && matchesKeyword && matchesLocation
  })
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
    instructor: activity.organizerName || activity.organizerId || "Ban tổ chức",
    organizerName: activity.organizerName,
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
  const [activityFilters, setActivityFilters] = useState(defaultActivityFilters)
  const [allActivities, setAllActivities] = useState([])
  const [activities, setActivities] = useState([])
  const [rooms, setRooms] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [reports, setReports] = useState([])
  const [registrationsByActivity, setRegistrationsByActivity] = useState({})
  const [attendanceByRegistration, setAttendanceByRegistration] = useState({})
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)

  const makeAuthenticatedRequest = useCallback(
    async (url, options = {}, retryCount = 0) => {
      const isFormData = options.body instanceof FormData
      const headers = {
        ...(options.headers || {}),
      }
      if (!isFormData) {
        headers["Content-Type"] = headers["Content-Type"] || "application/json"
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
    setAllActivities(transformed)
    setActivities(applyActivityFilters(transformed, activityFilters))
    return transformed
  }, [activityFilters, requestJson, user?.id])

  const refreshStatistics = useCallback(async () => {
    const data = await requestJson("/api/activities/my-club/statistics")
    setStatistics(data || null)
    return data
  }, [requestJson])

  const refreshRooms = useCallback(async () => {
    const data = await requestJson("/api/rooms")
    const list = Array.isArray(data) ? data : []
    setRooms(list)
    return list
  }, [requestJson])

  const refreshReports = useCallback(async () => {
    const data = await requestJson("/api/activities/reports/my")
    const list = Array.isArray(data) ? data : []
    setReports(list)
    return list
  }, [requestJson])

  const refreshAll = useCallback(async () => {
    if (!accessToken || !user?.id) return

    setLoading(true)
    setError(null)
    try {
      await Promise.all([refreshActivities(), refreshStatistics(), refreshReports(), refreshRooms()])
    } catch (err) {
      setError(err.message)
      setAllActivities([])
      setActivities([])
      setRooms([])
      setStatistics(null)
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [accessToken, refreshActivities, refreshReports, refreshRooms, refreshStatistics, user?.id])

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  const searchActivities = useCallback(
    async (nextFilters) => {
      const mergedFilters = { ...activityFilters, ...nextFilters }
      setActivityFilters(mergedFilters)
      setActivities(applyActivityFilters(allActivities, mergedFilters))
      return applyActivityFilters(allActivities, mergedFilters)
    },
    [activityFilters, allActivities],
  )

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
        setAttendanceByRegistration((prev) => {
          const next = { ...prev }
          registrations.forEach((registration) => {
            const hasAttendance =
              registration.attendanceId ||
              (registration.isPresent !== null && registration.isPresent !== undefined) ||
              registration.checkInTime ||
              (registration.earnedPoints !== null && registration.earnedPoints !== undefined)

            if (hasAttendance) {
              next[registration.id] = {
                id: registration.attendanceId,
                registrationId: registration.id,
                isPresent: registration.isPresent,
                checkInTime: registration.checkInTime,
                earnedPoints: registration.earnedPoints,
              }
            } else {
              delete next[registration.id]
            }
          })
          return next
        })
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

  const checkScheduleConflicts = useCallback(
    async ({ roomId, startTime, endTime }) => {
      const params = new URLSearchParams()
      params.set("roomId", roomId)
      params.set("startTime", startTime)
      params.set("endTime", endTime)
      const data = await requestJson(`/api/activities/schedule-conflicts?${params.toString()}`)
      return Array.isArray(data) ? data : []
    },
    [requestJson],
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
    async (activityId, file) =>
      runMutation(() => {
        const formData = new FormData()
        formData.append("file", file)
        return requestJson(`/api/activities/${activityId}/reports`, {
          method: "POST",
          body: formData,
        })
      }),
    [requestJson, runMutation],
  )

  const cancelReport = useCallback(
    async (reportId) =>
      runMutation(() =>
        requestJson(`/api/activities/reports/${reportId}/cancel`, {
          method: "PATCH",
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
          setRegistrationsByActivity((prev) =>
            Object.fromEntries(
              Object.entries(prev).map(([activityId, registrations]) => [
                activityId,
                registrations.map((registration) =>
                  registration.id === registrationId
                    ? {
                        ...registration,
                        attendanceId: result.id,
                        isPresent: result.isPresent,
                        checkInTime: result.checkInTime,
                        earnedPoints: result.earnedPoints,
                      }
                    : registration,
                ),
              ]),
            ),
          )
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
    rooms,
    statistics,
    reports,
    registrationsByActivity,
    attendanceByRegistration,
    loading,
    actionLoading,
    error,
    activityFilters,
    refreshAll,
    refreshReports,
    searchActivities,
    loadRegistrations,
    createActivity,
    updateActivity,
    deleteActivity,
    submitActivity,
    checkScheduleConflicts,
    requestCancelActivity,
    submitReport,
    cancelReport,
    approveRegistration,
    rejectRegistration,
    checkInRegistration,
    awardPoints,
  }
}
