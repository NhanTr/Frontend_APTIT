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

export async function POST(req) {
  try {
    const { refreshToken } = await req.json()

    if (!refreshToken) {
      return new Response(
        JSON.stringify({ error: 'Refresh token is required' }),
        { status: 400 }
      )
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
    
    const response = await fetch(`${backendUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Backend refresh error:', error)
      return new Response(
        JSON.stringify({ 
          error: error.message || 'Token refresh failed'
        }), 
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Backend format: { code, message, result: { token, refreshToken } }
    const authResult = data.result
    
    if (!authResult?.token) {
      console.error('❌ Missing token in refresh response:', authResult)
      return new Response(
        JSON.stringify({ 
          error: 'Backend returned invalid refresh response',
          received: authResult
        }), 
        { status: 400 }
      )
    }

    // Decode token để verify
    const tokenPayload = decodeToken(authResult.token)
    if (!tokenPayload) {
      console.error('❌ Failed to decode refreshed token')
      return new Response(
        JSON.stringify({ error: 'Failed to decode token' }), 
        { status: 400 }
      )
    }

    const responseData = {
      accessToken: authResult.token,
      refreshToken: authResult.refreshToken || refreshToken
    }
    
    return new Response(
      JSON.stringify(responseData), 
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  } catch (error) {
    console.error('❌ Token refresh error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Token refresh failed'
      }), 
      { status: 500 }
    )
  }
}
