export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    // Backend logout endpoint (nếu có)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
    
    if (token) {
      try {
        await fetch(`${backendUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(err => {
          // If backend doesn't have logout endpoint, continue anyway
        })
      } catch (err) {
        // Ignore backend logout errors
      }
    }
    
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
