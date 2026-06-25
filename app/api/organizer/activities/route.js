export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    const tokenPayload = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/')
    const payload = tokenPayload ? JSON.parse(Buffer.from(tokenPayload, 'base64').toString('utf8')) : null
    const organizerId = payload?.userId || payload?.sub

    if (!organizerId) {
      return new Response(
        JSON.stringify({ error: 'Organizer ID not found in token' }),
        { status: 400 }
      )
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
    const response = await fetch(`${backendUrl}/api/v1/activities/organizer/${organizerId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch organizer activities' }),
        { status: response.status }
      )
    }

    const data = await response.json()
    return new Response(JSON.stringify(data.result || data), { status: 200 })
  } catch (error) {
    console.error('Get organizer activities error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
