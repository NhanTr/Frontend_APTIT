
export async function POST(req) {
  try {
    console.log("📨 POST /api/registrations - Received request")
    
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    console.log("🔐 Auth token:", token ? "Present" : "Missing")

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    const body = await req.json()
    console.log("📦 Request body:", body)
    
    const { activityId } = body
    console.log("🎯 Activity ID:", activityId)

    if (!activityId) {
      console.error("❌ Activity ID is missing from request body")
      return new Response(
        JSON.stringify({ error: 'Activity ID is required' }),
        { status: 400 }
      )
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
    console.log(`🔗 Calling backend: POST ${backendUrl}/api/v1/registrations/${activityId}`)
    
    const response = await fetch(`${backendUrl}/api/v1/registrations/${activityId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log(`📊 Backend response: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("❌ Backend error:", errorData)
      return new Response(
        JSON.stringify({ error: errorData?.message || 'Failed to register' }),
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("✅ Registration successful:", data)
    return new Response(JSON.stringify(data), { status: 200 })
  } catch (error) {
    console.error('❌ Register error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

export async function DELETE(req) {
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
    const { activityId } = body

    if (!activityId) {
      return new Response(
        JSON.stringify({ error: 'Activity ID is required' }),
        { status: 400 }
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return new Response(
        JSON.stringify({ error: errorData?.message || 'Failed to unregister' }),
        { status: response.status }
      )
    }

    return new Response(JSON.stringify({ message: 'Successfully unregistered' }), { status: 200 })
  } catch (error) {
    console.error('Unregister error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

export async function GET(req) {
  try {
    console.log("📨 GET /api/registrations - Fetching user enrollments")
    
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    console.log("🔐 Auth token:", token ? "Present" : "Missing")

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
    console.log(`🔗 Calling backend: GET ${backendUrl}/api/v1/registrations/my-registrations`)
    
    const response = await fetch(`${backendUrl}/api/v1/registrations/my-registrations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log(`📊 Backend response: ${response.status} ${response.statusText}`)

    // Handle 404 as empty registrations (no enrollments yet)
    if (response.status === 404) {
      console.log("ℹ️ No registrations found (404) - returning empty array")
      return new Response(JSON.stringify([]), { status: 200 })
    }

    if (!response.ok) {
      console.error(`❌ Backend error: ${response.status} ${response.statusText}`)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch registrations' }),
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("✅ Registrations fetched:", data)
    const registrations = data.result || data || []
    return new Response(JSON.stringify(registrations), { status: 200 })
  } catch (error) {
    console.error('❌ Get registrations error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
