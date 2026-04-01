"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { mockUsers, mockActivities } from "./mock-data"
import { useAuth } from "./auth-context"

const RoleContext = createContext(undefined)

export function RoleProvider({ children }) {
  const {user, accessToken } = useAuth()
  const [currentUser, setCurrentUser] = useState(mockUsers[0])
  const [activities, setActivities] = useState(mockActivities)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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

  // Fetch activities từ API backend
  useEffect(() => {
    const fetchActivities = async () => {
      if (!accessToken) {
        console.log('⏭️  Skipping: No accessToken yet')
        return
      }
      
      try {
        setLoading(true)
        console.log('📡 Fetching activities from /api/activities (frontend route)')
        
        // Gọi qua frontend API route mà không qua backend trực tiếp
        const response = await fetch('/api/activities', {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })

        console.log('📊 Response status:', response.status)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ Response not ok:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          })
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log('✅ Activities fetched:', data)
        // Transform backend format to frontend format
        const transformedActivities = (Array.isArray(data) ? data : data.result || [])
          .map(activity => transformActivity(activity))
        setActivities(transformedActivities)
        setError(null)
      } catch (err) {
        console.error('❌ Error fetching activities:', {
          message: err.message,
          stack: err.stack,
          type: err.constructor.name
        })
        console.error('Full error:', err)
        setError(err.message)
        // Fallback: dùng mock data nếu API fail
        console.log('📦 Using mock data as fallback')
        setActivities(mockActivities)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [accessToken])

  async function createActivity(activityData) {
    if (!accessToken) throw new Error('Not authenticated')
    
    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
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

  return (
    <RoleContext.Provider value={{ 
      currentUser, 
      activities,
      loading,
      error,
      createActivity,
      approveActivity,
      rejectActivity,
      updateActivityStatus
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
