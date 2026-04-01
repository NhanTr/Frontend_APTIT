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
    const response = await fetch(`${backendUrl}/api/v1/users/me`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Token không hợp lệ' }), 
        { status: response.status }
      )
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), { status: 200 })
  } catch (error) {
    console.error('Get current user error:', error)
    return new Response(
      JSON.stringify({ error: 'Lỗi: ' + error.message }), 
      { status: 500 }
    )
  }
}
