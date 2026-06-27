// Decode JWT token để lấy payload (không cần verify ở frontend)
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

export async function GET(req) {
  try {
    // Lấy token từ header Authorization
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Không tìm thấy token' }), 
        { status: 401 }
      )
    }

    // Gọi backend API để lấy thông tin user hiện tại
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
    const response = await fetch(`${backendUrl}/api/v1/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    const tokenPayload = decodeToken(token)
    const baseUser = {
      id: tokenPayload?.userId || tokenPayload?.sub,
      username: tokenPayload?.sub,
      role: (tokenPayload?.scopes || 'STUDENT').toLowerCase(),
    }

    // Backend may legitimately return 404 when the user has no profile yet.
    // In that case, fall back to JWT claims so the frontend still gets a user.
    if (response.status === 404) {
      return new Response(JSON.stringify(baseUser), { status: 200 })
    }

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Token không hợp lệ' }),
        { status: response.status }
      )
    }

    const data = await response.json()
    // Backend returns { code, message, result: ProfileResponse }
    const profile = data.result || data
    const user = {
      ...baseUser,
      fullName: profile?.fullName,
      email: profile?.email,
      className: profile?.className,
      avatarUrl: profile?.avatarUrl,
    }
    return new Response(JSON.stringify(user), { status: 200 })
  } catch (error) {
    console.error('Get current user error:', error)
    return new Response(
      JSON.stringify({ error: 'Lỗi: ' + error.message }), 
      { status: 500 }
    )
  }
}
