"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

const AuthContext = createContext(undefined)

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

  // Kiểm tra token từ localStorage khi mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      console.log('🔐 Token found in localStorage, decoding...')
      const payload = decodeToken(token)
      
      if (payload) {
        console.log('✅ Token decoded successfully:', payload)
        setAccessToken(token)
        // Tạo user object từ JWT payload
        // 从 localStorage 获取 username (login 时保存的)
        const savedUsername = localStorage.getItem('username') || 'User'
        const userData = {
          id: payload.userId || payload.sub,
          username: savedUsername,
          name: savedUsername,
          role: (payload.scopes || 'STUDENT').toLowerCase(),
          expiresAt: payload.exp * 1000 // convert to milliseconds
        }
        setUser(userData)
        setError(null)
      } else {
        console.error('❌ Cannot decode token')
        localStorage.removeItem('accessToken')
        setAccessToken(null)
        setError('Token không hợp lệ')
      }
    } else {
      console.log('⏭️  No token in localStorage')
    }
    setLoading(false)
  }, [])

  async function login(username, password) {
    setLoading(true)
    setError(null)
    try {
      console.log('🔐 Calling /api/auth/login with:', { username })
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      console.log('📡 /api/auth/login response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Login response error:', errorData)
        throw new Error(errorData.error || 'Đăng nhập thất bại')
      }

      const data = await response.json()
      console.log('📦 Login response data:', JSON.stringify(data, null, 2))
      
      // Kiểm tra các field bắt buộc
      if (!data.accessToken) {
        console.error('❌ No accessToken in response')
        throw new Error('Lỗi: Server không trả về accessToken')
      }

      if (!data.user) {
        console.error('❌ No user in response')
        throw new Error('Lỗi: Server không trả về thông tin user')
      }

      console.log('✅ Login success, storing token')
      
      // 保存 token 和 username 到 localStorage
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('username', username)
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken)
      }

      // 确保返回的 user 有 name 字段
      const userWithName = {
        ...data.user,
        name: data.user.name || username,
        username: username
      }

      setAccessToken(data.accessToken)
      setUser(userWithName)
      setError(null)
      
      console.log('✅ User state updated:', userWithName)
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
      console.log('🔑 Logging out...')
      
      // Gọi backend logout API
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error('Logout API error:', response.status)
      } else {
        console.log('✅ Backend logout successful')
      }
    } catch (err) {
      console.error('Logout error:', err)
      // Vẫn tiếp tục logout local dù API fail
    } finally {
      // Xóa local data
      console.log('Clearing local storage...')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('username')
      setAccessToken(null)
      setUser(null)
      setError(null)
      console.log('✅ Logout completed')
      
      // Redirect về login page
      console.log('🔄 Redirecting to login...')
      router.push('/')
    }
  }

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
