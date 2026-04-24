export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    const { searchParams } = new URL(req.url)
    const page = searchParams.get('page') || '0'
    const size = searchParams.get('size') || '10'
    
    // Extract filter parameters
    const status = searchParams.get('status')
    const sponsor = searchParams.get('sponsor')
    const startTime = searchParams.get('startTime')
    const endTime = searchParams.get('endTime')
    const location = searchParams.get('location')

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
    const url = new URL(`${backendUrl}/api/v1/activities`)
    url.searchParams.append('page', page)
    url.searchParams.append('size', size)
    
    // Add filter parameters to backend API call
    if (status) {
      url.searchParams.append('status', status)
    }
    if (sponsor) {
      url.searchParams.append('sponsor', sponsor)
    }
    if (startTime) {
      url.searchParams.append('startTime', startTime)
    }
    if (endTime) {
      url.searchParams.append('endTime', endTime)
    }
    if (location) {
      url.searchParams.append('location', location)
    }
    
    // Build headers - only add Authorization if token exists
    const headers = {
      'Content-Type': 'application/json'
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(url.toString(), {
      headers
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Fetch activities failed:', { status: response.status, error: errorText })
      return new Response(
        JSON.stringify({ error: 'Failed to fetch activities' }),
        { status: response.status }
      )
    }

    const data = await response.json()
    const activities = data.result || data
    return new Response(JSON.stringify(activities), { status: 200 })
  } catch (error) {
    console.error('❌ Get activities error:', error.message)
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