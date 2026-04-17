"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

const AuthContext = createContext(undefined)

// Check if token is expired
function isTokenExpired(token) {
  try {
    const payload = decodeToken(token)
    if (!payload || !payload.exp) return true
    // Check if token expires in less than 1 minute
    return payload.exp * 1000 - Date.now() < 60000
  } catch {
    return true
  }
}

// Decode JWT token để lấy payload
function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Token decode error:', error)
    return null
  }
}

export function AuthProvider({ children }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Refresh access token using refresh token
  async function refreshAccessToken() {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken')
      if (!refreshTokenValue) {
        console.warn('⚠️ No refresh token available - user not logged in')
        await logout()
        return false
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshTokenValue })
      })

      if (!response.ok) {
        console.error('❌ Token refresh failed:', response.status)
        await logout()
        return false
      }

      const data = await response.json()
      
      if (!data.accessToken) {
        console.error('❌ No new accessToken in refresh response')
        await logout()
        return false
      }

      // Update token pair
      localStorage.setItem('accessToken', data.accessToken)
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken)
      }

      // Rebuild user from refreshed token
      const tokenPayload = decodeToken(data.accessToken)
      const savedUsername = localStorage.getItem('username') || user?.username || 'User'

      setAccessToken(data.accessToken)
      setUser((prev) => ({
        ...(prev || {}),
        id: tokenPayload?.userId || tokenPayload?.sub || prev?.id,
        username: prev?.username || savedUsername,
        name: prev?.name || savedUsername,
        role: tokenPayload?.scopes ? tokenPayload.scopes.toLowerCase() : (prev?.role || 'student'),
        expiresAt: tokenPayload?.exp ? tokenPayload.exp * 1000 : prev?.expiresAt
      }))

      setError(null)
      console.log('✅ Token refreshed successfully')
      return true
    } catch (err) {
      console.error('❌ Token refresh error:', err.message)
      await logout()
      return false
    }
  }

  // Kiểm tra token từ localStorage khi mount
  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = localStorage.getItem('accessToken')
      const refreshToken = localStorage.getItem('refreshToken')
      const savedUsername = localStorage.getItem('username') || 'User'

      if (!token) {
        // No access token, try refresh token before considering session expired
        if (refreshToken) {
          const refreshed = await refreshAccessToken()
          if (!refreshed) {
            setError('Phiên đăng nhập đã hết hạn')
          }
        }
        // If no refresh token either, user is simply not logged in - this is normal
        setLoading(false)
        return
      }

      const payload = decodeToken(token)

      if (!payload) {
        console.error('❌ Cannot decode access token, trying refresh token...')
        localStorage.removeItem('accessToken')
        const refreshed = await refreshAccessToken()
        if (!refreshed) {
          setError('Token không hợp lệ')
        }
        setLoading(false)
        return
      }

      // If access token is expired, try refresh token instead of immediate logout
      if (isTokenExpired(token)) {
        console.log('⏰ Access token expired on startup, attempting refresh token...')
        const refreshed = await refreshAccessToken()
        if (!refreshed) {
          setError('Phiên đăng nhập đã hết hạn')
        }
        setLoading(false)
        return
      }

      // Access token is still valid
      setAccessToken(token)
      setUser({
        id: payload.userId || payload.sub,
        username: savedUsername,
        name: savedUsername,
        role: (payload.scopes || 'STUDENT').toLowerCase(),
        expiresAt: payload.exp * 1000
      })
      setError(null)
      setLoading(false)
    }

    bootstrapAuth()
  }, [])

  async function login(username, password) {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Login failed:', errorData.error)
        throw new Error(errorData.error || 'Đăng nhập thất bại')
      }

      const data = await response.json()
      
      if (!data.accessToken) {
        console.error('❌ No accessToken in response')
        throw new Error('Lỗi: Server không trả về accessToken')
      }

      if (!data.user) {
        console.error('❌ No user in response')
        throw new Error('Lỗi: Server không trả về thông tin user')
      }
      
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('username', username)
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken)
      }

      // Decode token để lấy role từ JWT payload
      const tokenPayload = decodeToken(data.accessToken)
      
      const userWithName = {
        ...data.user,
        name: data.user.name || username,
        username: username,
        role: tokenPayload?.scopes ? (tokenPayload.scopes).toLowerCase() : data.user.role
      }

      setAccessToken(data.accessToken)
      setUser(userWithName)
      setError(null)
      
      // Navigate to home page which will show dashboard
      router.push('/')
      
      return userWithName
    } catch (err) {
      console.error('❌ Login error:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function register(username, email, password, fullName, role = 'student') {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, fullName, role })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Đăng ký thất bại')
      }

      const data = await response.json()
      setError(null)
      return data.user
    } catch (err) {
      console.error('Register error:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error('❌ Logout API error:', response.status)
      }
    } catch (err) {
      console.error('❌ Logout error:', err.message)
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('username')
      setAccessToken(null)
      setUser(null)
      setError(null)
      
      router.push('/')
    }
  }

  // Monitor token expiry and auto-refresh
  useEffect(() => {
    if (!accessToken) return

    const checkTokenExpiry = setInterval(async () => {
      if (isTokenExpired(accessToken)) {
        console.log('⏰ Token about to expire, attempting refresh...')
        await refreshAccessToken()
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(checkTokenExpiry)
  }, [accessToken])

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        accessToken, 
        loading, 
        error,
        login, 
        register, 
        logout,
        refreshAccessToken,
        isAuthenticated: !!user && !!accessToken
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
