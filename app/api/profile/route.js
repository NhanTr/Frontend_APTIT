export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return new Response(JSON.stringify({ error: "Không tìm thấy token" }), { status: 401 })
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"
    const response = await fetch(`${backendUrl}/api/v1/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return new Response(
        JSON.stringify({ error: errorText || "Failed to fetch profile" }),
        { status: response.status }
      )
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), { status: 200 })
  } catch (error) {
    console.error("Get profile error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

export async function PUT(req) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return new Response(JSON.stringify({ error: "Không tìm thấy token" }), { status: 401 })
    }

    const body = await req.json()
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"

    const response = await fetch(`${backendUrl}/api/v1/profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return new Response(
        JSON.stringify({ error: errorText || "Failed to update profile" }),
        { status: response.status }
      )
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), { status: 200 })
  } catch (error) {
    console.error("Update profile error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}