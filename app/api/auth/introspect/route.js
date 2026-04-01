export async function POST(req) {
  try {
    const { token } = await req.json()

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token không tìm thấy' }),
        { status: 400 }
      )
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
    const response = await fetch(`${backendUrl}/auth/introspect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })

    if (!response.ok) {
      const error = await response.json()
      return new Response(
        JSON.stringify({ 
          error: error.message || 'Token không hợp lệ',
          valid: false
        }), 
        { status: response.status }
      )
    }

    const data = await response.json()
    const introspectData = data.result || data

    return new Response(
      JSON.stringify({
        valid: introspectData.valid,
        userId: introspectData.userId,
        expiresAt: introspectData.expiresAt
      }), 
      { status: 200 }
    )
  } catch (error) {
    console.error('Introspect error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Lỗi kiểm tra token: ' + error.message,
        valid: false
      }), 
      { status: 500 }
    )
  }
}
