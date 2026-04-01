export async function POST(req, { params }) {
  try {
    const { id } = params
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
    const response = await fetch(`${backendUrl}/api/v1/student/enrolled/${id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json()
      return new Response(
        JSON.stringify({ error: error.message || 'Failed to enroll' }),
        { status: response.status }
      )
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), { status: 201 })
  } catch (error) {
    console.error('Enroll error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
    const response = await fetch(`${backendUrl}/api/v1/student/enrolled/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok && response.status !== 204) {
      return new Response(
        JSON.stringify({ error: 'Failed to unenroll' }),
        { status: response.status }
      )
    }

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Unenroll error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
