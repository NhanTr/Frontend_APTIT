export async function GET(req, { params }) {
  try {
    const { id } = params
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
    const response = await fetch(`${backendUrl}/api/v1/users/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: response.status }
      )
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), { status: 200 })
  } catch (error) {
    console.error('Get user error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    const body = await req.json()
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
    
    const response = await fetch(`${backendUrl}/api/v1/users/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const error = await response.json()
      return new Response(
        JSON.stringify({ error: error.message || 'Failed to update user' }),
        { status: response.status }
      )
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), { status: 200 })
  } catch (error) {
    console.error('Update user error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
    
    const response = await fetch(`${backendUrl}/api/v1/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok && response.status !== 204) {
      return new Response(
        JSON.stringify({ error: 'Failed to delete user' }),
        { status: response.status }
      )
    }

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Delete user error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
