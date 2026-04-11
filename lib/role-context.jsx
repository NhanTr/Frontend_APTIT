"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth-context"

const RoleContext = createContext(undefined)

export function RoleProvider({ children }) {
  const {user, accessToken, refreshAccessToken, logout } = useAuth()
  const [currentUser, setCurrentUser] = useState(null)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Pagination state (0-based page numbering for backend)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // Helper: Transform backend activity format to frontend format
  function transformActivity(backendActivity) {
    return {
      id: backendActivity.id,
      title: backendActivity.title,
      description: backendActivity.description || '',
      category: 'event', // Backend không có category
      status: backendActivity.status.toLowerCase(), // "Draft" -> "draft"
      approvalStatus: backendActivity.status === 'Approved' ? 'approved' : 
                      backendActivity.status === 'Draft' ? 'pending' : 'approved',
      date: new Date(backendActivity.startTime).toISOString().split('T')[0],
      time: new Date(backendActivity.startTime).toTimeString().slice(0, 5),
      location: backendActivity.location,
      capacity: 100, // Backend không có capacity, default 100
      enrolled: 0, // Backend không tính enrolled
      instructor: backendActivity.sponsor || 'Unknown',
      instructorId: backendActivity.organizerId,
      // Additional backend fields
      startTime: backendActivity.startTime,
      endTime: backendActivity.endTime,
      budget: backendActivity.budget,
      sponsor: backendActivity.sponsor,
      targetAudience: backendActivity.targetAudience,
      purpose: backendActivity.purpose,
      trainingPoints: backendActivity.trainingPoints
    }
  }

  // Helper: Make API call with automatic token refresh on 401
  async function makeAuthenticatedRequest(url, options = {}, retryCount = 0) {
    const maxRetries = 1
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      }

      // Add authorization header if we have a token
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }

      const response = await fetch(url, {
        ...options,
        headers
      })

      // If token expired, try to refresh and retry
      if (response.status === 401 && retryCount < maxRetries) {
        console.log('⏰ Token expired (401), attempting to refresh...')
        const refreshed = await refreshAccessToken()
        
        if (refreshed) {
          console.log('✅ Token refreshed, retrying request...')
          // Recursively retry with incremented counter
          return makeAuthenticatedRequest(url, options, retryCount + 1)
        } else {
          console.error('❌ Token refresh failed, logging out...')
          await logout()
          throw new Error('Session expired. Please log in again.')
        }
      }

      return response
    } catch (err) {
      console.error('❌ Authenticated request error:', err.message)
      throw err
    }
  }

  // Cập nhật currentUser khi user từ auth context thay đổi
  useEffect(() => {
    if (user) {
      setCurrentUser({
        id: user.id,
        name: user.name || user.username || 'User',
        email: user.email || '',
        role: user.role
      })
    }
  }, [user])

  // Fetch activities từ API backend với pagination
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true)
        const url = `/api/activities?page=${currentPage}&size=${pageSize}`
        
        console.log('📡 Fetching activities from:', url)
        const response = await makeAuthenticatedRequest(url, { method: 'GET' })

        console.log('📊 Response status:', response.status, response.statusText)

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`❌ Fetch activities error: ${response.status} ${response.statusText}`, errorText)
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.json()
        console.log('✅ API response data:', data)
        
        // Parse response - Backend format: { code, message, result: { content: [...], totalPages, totalElements } }
        const result = data.result || data
        let activitiesList = Array.isArray(result) ? result : result.content || []
        let totalPagesFromResponse = result.totalPages || 1
        
        console.log('📋 Transformed activities count:', activitiesList.length)
        
        // Transform backend format to frontend format
        const transformedActivities = activitiesList
          .map(activity => transformActivity(activity))

        // Nếu là trang đầu tiên (page 0), replace toàn bộ activities; nếu không thì append
        if (currentPage === 0) {
          setActivities(transformedActivities)
        } else {
          setActivities(prev => [...prev, ...transformedActivities])
        }
        
        // Cập nhật pagination info
        setTotalPages(totalPagesFromResponse)
        setHasMore(currentPage < totalPagesFromResponse)
        setError(null)
      } catch (err) {
        console.error('❌ Error fetching activities:', err.message)
        setError(err.message)
        // Fallback: dùng mock data nếu API fail và đang ở trang đầu
        if (currentPage === 0) {
          setActivities([])
          setTotalPages(1)
          setHasMore(false)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [accessToken, currentPage, pageSize])

  async function createActivity(activityData) {
    if (!accessToken) throw new Error('Not authenticated')
    
    try {
      const response = await makeAuthenticatedRequest('/api/activities', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          ...activityData,
          instructorId: currentUser.id,
          instructor: currentUser.name,
        })
      })

      if (!response.ok) throw new Error('Failed to create activity')
      const newActivity = await response.json()
      setActivities([...activities, newActivity])
      return newActivity
    } catch (err) {
      console.error('Error creating activity:', err)
      throw err
    }
  }

  async function approveActivity(activityId) {
    if (!accessToken) throw new Error('Not authenticated')
    
    try {
      await fetch(`/api/activities/${activityId}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ approvalStatus: 'approved' })
      })

      setActivities(activities.map(a => 
        a.id === activityId ? { ...a, approvalStatus: "approved" } : a
      ))
    } catch (err) {
      console.error('Error approving activity:', err)
      throw err
    }
  }

  async function rejectActivity(activityId) {
    if (!accessToken) throw new Error('Not authenticated')
    
    try {
      await fetch(`/api/activities/${activityId}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ approvalStatus: 'rejected' })
      })

      setActivities(activities.map(a => 
        a.id === activityId ? { ...a, approvalStatus: "rejected" } : a
      ))
    } catch (err) {
      console.error('Error rejecting activity:', err)
      throw err
    }
  }

  async function updateActivityStatus(activityId, status) {
    if (!accessToken) throw new Error('Not authenticated')
    
    try {
      await fetch(`/api/activities/${activityId}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      setActivities(activities.map(a => 
        a.id === activityId ? { ...a, status } : a
      ))
    } catch (err) {
      console.error('Error updating activity status:', err)
      throw err
    }
  }

  // Tải thêm activities (next page)
  const loadMore = () => {
    if (hasMore && !loading) {
      setCurrentPage(prev => prev + 1)
    }
  }

  // Reset về trang 0 khi logout (accessToken becomes null)
  useEffect(() => {
    if (!accessToken) {
      setCurrentPage(0)
      setActivities([])
      setHasMore(true)
      setTotalPages(1)
    }
  }, [accessToken])

  return (
    <RoleContext.Provider value={{ 
      currentUser, 
      activities,
      loading,
      error,
      createActivity,
      approveActivity,
      rejectActivity,
      updateActivityStatus,
      // Pagination
      currentPage,
      pageSize,
      totalPages,
      hasMore,
      loadMore
    }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (!context) throw new Error("useRole must be used within a RoleProvider")
  return context
}
