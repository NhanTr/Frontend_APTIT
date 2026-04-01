export async function GET(req, { params }) {
  try {
    const { organizerId } = params
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

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
    const activities = data.result || data
    return new Response(JSON.stringify(activities), { status: 200 })
  } catch (error) {
    console.error('Get organizer activities error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
