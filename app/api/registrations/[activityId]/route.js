export async function DELETE(req, { params }) {
  try {
    const { activityId } = params
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
    const response = await fetch(`${backendUrl}/api/v1/registrations/${activityId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok && response.status !== 204) {
      return new Response(
        JSON.stringify({ error: 'Failed to unregister activity' }),
        { status: response.status }
      )
    }

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Unregister error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

export async function GET(req, { params }) {
  try {
    const { activityId } = params
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
    const response = await fetch(`${backendUrl}/api/v1/registrations/activity/${activityId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch activity registrations' }),
        { status: response.status }
      )
    }

    const data = await response.json()
    const registrations = data.result || data
    return new Response(JSON.stringify(registrations), { status: 200 })
  } catch (error) {
    console.error('Get activity registrations error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
