export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
    const response = await fetch(`${backendUrl}/api/v1/activities`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch activities' }),
        { status: response.status }
      )
    }

    const data = await response.json()
    const activities = data.result || data
    return new Response(JSON.stringify(activities), { status: 200 })
  } catch (error) {
    console.error('Get activities error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    const body = await req.json()
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
    
    const response = await fetch(`${backendUrl}/api/v1/activities`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const error = await response.json()
      return new Response(
        JSON.stringify({ error: error.message || 'Failed to create activity' }),
        { status: response.status }
      )
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), { status: 201 })
  } catch (error) {
    console.error('Create activity error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}