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

export async function POST(req) {
  try {
    const { username, password } = await req.json()

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
    const response = await fetch(`${backendUrl}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    if (!response.ok) {
      let backendMessage = ''
      try {
        const error = await response.json()
        backendMessage = error?.message || error?.error || ''
      } catch {
        // Backend returned non-JSON error body (e.g. HTML or empty); fall through.
      }
      console.error('❌ Backend login error:', backendMessage || `HTTP ${response.status}`)
      return new Response(
        JSON.stringify({
          error: backendMessage || 'Sai tên đăng nhập hoặc mật khẩu',
        }),
        { status: response.status }
      )
    }

    let data
    try {
      data = await response.json()
    } catch (parseErr) {
      console.error('❌ Backend returned non-JSON login response:', parseErr.message)
      return new Response(
        JSON.stringify({
          error: 'Phản hồi từ máy chủ không hợp lệ. Vui lòng thử lại sau.',
        }),
        { status: 502 }
      )
    }

    // Backend format: { code, message, result: { token, refreshToken, authenticated } }
    const authResult = data?.result

    if (!authResult?.token || !authResult?.authenticated) {
      console.error('❌ Missing auth fields:', authResult)
      return new Response(
        JSON.stringify({
          error: 'Backend trả về dữ liệu không đầy đủ',
          received: authResult
        }),
        { status: 400 }
      )
    }

    // Decode token để lấy user info
    const tokenPayload = decodeToken(authResult.token)

    if (!tokenPayload) {
      console.error('❌ Failed to decode token')
      return new Response(
        JSON.stringify({ error: 'Không thể decode token' }), 
        { status: 400 }
      )
    }

    // Tạo user object từ JWT payload
    const user = {
      id: tokenPayload.userId || tokenPayload.sub,
      username: username,
      role: (tokenPayload.scopes || 'STUDENT').toLowerCase(),
    }
    
    const responseData = {
      accessToken: authResult.token,
      refreshToken: authResult.refreshToken,
      user: user
    }
    
    return new Response(
      JSON.stringify(responseData), 
      { 
        status: 200,
        headers: {
          'Set-Cookie': `refreshToken=${authResult.refreshToken}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`
        }
      }
    )
  } catch (error) {
    console.error('❌ Login error:', error.message)
    return new Response(
      JSON.stringify({ error: 'Lỗi đăng nhập: ' + error.message }), 
      { status: 500 }
    )
  }
}
