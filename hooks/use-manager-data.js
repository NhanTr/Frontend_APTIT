"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useAuth } from "@/lib/auth-context"

const defaultActivityFilters = {
  status: "",
  keyword: "",
  location: "",
  page: 0,
  size: 20,
}

const defaultReportFilters = {
  activityId: "",
  reportStatus: "",
}

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase()
}

function unwrapApiResponse(data) {
  return data?.result ?? data
}

async function readResponse(response) {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

export function transformManagerActivity(activity = {}) {
  const status = activity.status || "Draft"
  const statusKey = normalizeStatus(status)
  const capacity = activity.maxParticipants ?? activity.capacity ?? 0
  const enrolled = activity.currentParticipants ?? activity.enrolled ?? 0

  return {
    ...activity,
    status,
    statusKey,
    capacity,
    enrolled,
    maxParticipants: capacity,
    currentParticipants: enrolled,
    date: activity.startTime ? new Date(activity.startTime).toISOString().split("T")[0] : "",
    time: activity.startTime ? new Date(activity.startTime).toTimeString().slice(0, 5) : "",
    organizerName: activity.sponsor || activity.organizerId || "Organizer",
  }
}

function extractPage(data) {
  const result = unwrapApiResponse(data)
  const list = Array.isArray(result) ? result : result?.content || []

  return {
    content: list.map(transformManagerActivity),
    totalPages: result?.totalPages ?? 1,
    totalElements: result?.totalElements ?? list.length,
    number: result?.number ?? 0,
    size: result?.size ?? list.length,
  }
}

function buildActivitiesUrl(filters) {
  const params = new URLSearchParams()
  params.set("page", String(filters.page ?? 0))
  params.set("size", String(filters.size ?? 20))

  if (filters.status) params.append("statuses", filters.status)
  if (filters.keyword) params.set("keyword", filters.keyword)
  if (filters.location) params.set("location", filters.location)
  if (filters.fromTime) params.set("fromTime", filters.fromTime)
  if (filters.toTime) params.set("toTime", filters.toTime)

  return `/api/manager/activities?${params.toString()}`
}

function buildReportsUrl(filters) {
  const params = new URLSearchParams()
  if (filters.activityId) params.set("activityId", filters.activityId)
  if (filters.reportStatus) params.set("reportStatus", filters.reportStatus)

  const query = params.toString()
  return `/api/manager/activities/reports${query ? `?${query}` : ""}`
}

export function useManagerData() {
  const { accessToken, refreshAccessToken, logout } = useAuth()
  const [activityFilters, setActivityFilters] = useState(defaultActivityFilters)
  const [reportFilters, setReportFilters] = useState(defaultReportFilters)
  const [activities, setActivities] = useState([])
  const [pageInfo, setPageInfo] = useState({ totalPages: 1, totalElements: 0, number: 0, size: 20 })
  const [statistics, setStatistics] = useState(null)
  const [reports, setReports] = useState([])
  const [conflictsByActivity, setConflictsByActivity] = useState({})
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)

  const token = useMemo(() => accessToken || (typeof window !== "undefined" ? localStorage.getItem("accessToken") : ""), [accessToken])

  const makeAuthenticatedRequest = useCallback(
    async (url, options = {}, retryCount = 0) => {
      const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      }

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
    [logout, refreshAccessToken, token],
  )

  const requestJson = useCallback(
    async (url, options = {}) => {
      const response = await makeAuthenticatedRequest(url, options)
      const data = await readResponse(response)

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "Request failed")
      }

      return unwrapApiResponse(data)
    },
    [makeAuthenticatedRequest],
  )

  const refreshActivities = useCallback(
    async (filters = activityFilters) => {
      const response = await makeAuthenticatedRequest(buildActivitiesUrl(filters))
      const data = await readResponse(response)

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "Failed to load activities")
      }

      const page = extractPage(data)
      setActivities(page.content)
      setPageInfo({
        totalPages: page.totalPages,
        totalElements: page.totalElements,
        number: page.number,
        size: page.size,
      })
      return page.content
    },
    [activityFilters, makeAuthenticatedRequest],
  )

  const refreshStatistics = useCallback(async () => {
    const data = await requestJson("/api/manager/activities/statistics")
    setStatistics(data || null)
    return data
  }, [requestJson])

  const refreshReports = useCallback(
    async (filters = reportFilters) => {
      const data = await requestJson(buildReportsUrl(filters))
      const list = Array.isArray(data) ? data : []
      setReports(list)
      return list
    },
    [reportFilters, requestJson],
  )

  const refreshAll = useCallback(async () => {
    if (!token) return

    setLoading(true)
    setError(null)
    try {
      await Promise.all([refreshActivities(), refreshStatistics(), refreshReports()])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [refreshActivities, refreshReports, refreshStatistics, token])

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

  const searchActivities = useCallback(
    async (nextFilters) => {
      const mergedFilters = { ...activityFilters, ...nextFilters, page: nextFilters?.page ?? 0 }
      setActivityFilters(mergedFilters)
      setLoading(true)
      setError(null)
      try {
        return await refreshActivities(mergedFilters)
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [activityFilters, refreshActivities],
  )

  const searchReports = useCallback(
    async (nextFilters) => {
      const mergedFilters = { ...reportFilters, ...nextFilters }
      setReportFilters(mergedFilters)
      setLoading(true)
      setError(null)
      try {
        return await refreshReports(mergedFilters)
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [refreshReports, reportFilters],
  )

  const approveActivity = useCallback(
    (activityId) =>
      runMutation(async () => {
        const result = await requestJson(`/api/manager/activities/${activityId}/approve`, {
          method: "PATCH",
        })
        if (Array.isArray(result?.scheduleConflicts)) {
          setConflictsByActivity((prev) => ({ ...prev, [activityId]: result.scheduleConflicts }))
        }
        return result
      }),
    [requestJson, runMutation],
  )

  const startActivityReview = useCallback(
    (activityId) =>
      runMutation(
        async () => {
          const result = await requestJson(`/api/manager/activities/${activityId}/review`, {
            method: "PATCH",
          })
          const transformed = transformManagerActivity(result || {})
          setActivities((prev) => prev.map((activity) => (activity.id === activityId ? transformed : activity)))
          return transformed
        },
        { refresh: false },
      ),
    [requestJson, runMutation],
  )

  const rejectActivity = useCallback(
    (activityId, reason) =>
      runMutation(() =>
        requestJson(`/api/manager/activities/${activityId}/reject`, {
          method: "PATCH",
          body: JSON.stringify({ reason }),
        }),
      ),
    [requestJson, runMutation],
  )

  const cancelApprovedActivity = useCallback(
    (activityId, reason) =>
      runMutation(() =>
        requestJson(`/api/manager/activities/${activityId}/cancel`, {
          method: "PATCH",
          body: JSON.stringify({ reason }),
        }),
      ),
    [requestJson, runMutation],
  )

  const approveCancelRequest = useCallback(
    (activityId) =>
      runMutation(() =>
        requestJson(`/api/manager/activities/${activityId}/cancel-requests/approve`, {
          method: "PATCH",
        }),
      ),
    [requestJson, runMutation],
  )

  const rejectCancelRequest = useCallback(
    (activityId, reason) =>
      runMutation(() =>
        requestJson(`/api/manager/activities/${activityId}/cancel-requests/reject`, {
          method: "PATCH",
          body: JSON.stringify({ reason }),
        }),
      ),
    [requestJson, runMutation],
  )

  const loadScheduleConflicts = useCallback(
    (activityId) =>
      runMutation(
        async () => {
          const conflicts = await requestJson(`/api/manager/activities/${activityId}/schedule-conflicts`)
          setConflictsByActivity((prev) => ({ ...prev, [activityId]: Array.isArray(conflicts) ? conflicts : [] }))
          return conflicts
        },
        { refresh: false },
      ),
    [requestJson, runMutation],
  )

  const approveReport = useCallback(
    (reportId) =>
      runMutation(() =>
        requestJson(`/api/manager/activities/reports/${reportId}/approve`, {
          method: "PATCH",
        }),
      ),
    [requestJson, runMutation],
  )

  const rejectReport = useCallback(
    (reportId, reason) =>
      runMutation(() =>
        requestJson(`/api/manager/activities/reports/${reportId}/reject`, {
          method: "PATCH",
          body: JSON.stringify({ reason }),
        }),
      ),
    [requestJson, runMutation],
  )

  const sendNotification = useCallback(
    (payload) =>
      runMutation(
        () =>
          requestJson("/api/notifications", {
            method: "POST",
            body: JSON.stringify(payload),
          }),
        { refresh: false },
      ),
    [requestJson, runMutation],
  )

  return {
    activities,
    activityFilters,
    reportFilters,
    pageInfo,
    statistics,
    reports,
    conflictsByActivity,
    loading,
    actionLoading,
    error,
    refreshAll,
    searchActivities,
    searchReports,
    startActivityReview,
    approveActivity,
    rejectActivity,
    cancelApprovedActivity,
    approveCancelRequest,
    rejectCancelRequest,
    loadScheduleConflicts,
    approveReport,
    rejectReport,
    sendNotification,
  }
}
