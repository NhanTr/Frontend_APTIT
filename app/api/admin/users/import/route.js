// Proxy multipart CSV upload to the Spring Boot backend.
// Forwards the raw request body (FormData) so the multipart boundary is preserved.

export const dynamic = "force-dynamic"

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"
    const contentType = req.headers.get("content-type") || ""

    const response = await fetch(`${backendUrl}/api/admin/users/import`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        // Forward original multipart boundary intact.
        "Content-Type": contentType,
      },
      body: req.body,
      // Required so Node streams the request body without buffering it first.
      duplex: "half",
    })

    const text = await response.text()
    let data
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = { message: text }
    }

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: data?.message || data?.error || response.statusText || "Import failed",
          result: data?.result,
        }),
        { status: response.status },
      )
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("CSV import proxy error:", error)
    return new Response(
      JSON.stringify({ error: "Lỗi proxy: " + error.message }),
      { status: 500 },
    )
  }
}
