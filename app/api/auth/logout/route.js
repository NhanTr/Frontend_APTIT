export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    console.log('🔑 Logout request received')

    // Backend logout endpoint (nếu có)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
    
    if (token) {
      try {
        // Gọi backend logout endpoint (nếu backend có)
        // Chú ý: có thể backend không có logout endpoint, nó chỉ validate token
        await fetch(`${backendUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(err => {
          // Nếu backend không có logout endpoint, vẫn tiếp tục
          console.log('Backend logout endpoint not available:', err.message)
        })
      } catch (err) {
        console.log('Backend logout error:', err.message)
      }
    }

    console.log('✅ Logout successful')
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Logged out successfully'
      }), 
      { 
        status: 200,
        headers: {
          // Clear refresh token cookie
          'Set-Cookie': 'refreshToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax'
        }
      }
    )
  } catch (error) {
    console.error('❌ Logout error:', error)
    return new Response(
      JSON.stringify({ error: 'Logout failed: ' + error.message }), 
      { status: 500 }
    )
  }
}
