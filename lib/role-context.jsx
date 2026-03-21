"use client"

import { createContext, useContext, useState } from "react"
import { mockUsers, mockActivities } from "./mock-data"

const RoleContext = createContext(undefined)

export function RoleProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(mockUsers[0])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activities, setActivities] = useState(mockActivities)

  function setRole(role) {
    const user = mockUsers.find((u) => u.role === role) ?? mockUsers[0]
    setCurrentUser(user)
    setIsAuthenticated(true)
  }

  function logout() {
    setIsAuthenticated(false)
  }

  function createActivity(activityData) {
    const newActivity = {
      id: `a${activities.length + 1}`,
      ...activityData,
      approvalStatus: "pending",
      enrolled: 0,
      instructorId: currentUser.id === "u2" ? "t1" : "t2",
      instructor: currentUser.name,
    }
    setActivities([...activities, newActivity])
    return newActivity
  }

  function approveActivity(activityId) {
    setActivities(activities.map(a => 
      a.id === activityId ? { ...a, approvalStatus: "approved" } : a
    ))
  }

  function rejectActivity(activityId) {
    setActivities(activities.map(a => 
      a.id === activityId ? { ...a, approvalStatus: "rejected" } : a
    ))
  }

  function updateActivityStatus(activityId, status) {
    setActivities(activities.map(a => 
      a.id === activityId ? { ...a, status } : a
    ))
  }

  return (
    <RoleContext.Provider value={{ 
      currentUser, 
      setRole, 
      logout, 
      isAuthenticated,
      activities,
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
