export async function POST(req) {
  try {
    const { username, email, password, fullName, role } = await req.json()

    // Gọi backend API để tạo tài khoản (POST /api/v1/users)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
    const response = await fetch(`${backendUrl}/api/v1/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username, 
        email, 
        password,
        fullName,
        role: role || 'student'
      })
    })

    if (!response.ok) {
      const error = await response.json()
      return new Response(
        JSON.stringify({ 
          error: error.message || 'Đăng ký thất bại',
          code: error.code 
        }), 
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return new Response(
      JSON.stringify({
        user: data,
        message: 'Đăng ký thành công'
      }), 
      { status: 201 }
    )
  } catch (error) {
    console.error('Register error:', error)
    return new Response(
      JSON.stringify({ error: 'Lỗi đăng ký: ' + error.message }), 
      { status: 500 }
    )
  }
}
