import { getBackendUrl, getBearerToken, proxyBackendRequest } from "@/app/api/_utils/backend"

export async function POST(req, { params }) {
  try {
    const { id } = await params
    const contentType = req.headers.get("content-type") || ""

    if (!contentType.includes("multipart/form-data")) {
      const body = await req.json()
      return proxyBackendRequest(req, `/api/v1/activities/${id}/reports`, {
        method: "POST",
        body,
      })
    }

    const token = getBearerToken(req)
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const formData = await req.formData()
    const response = await fetch(`${getBackendUrl()}/api/v1/activities/${id}/reports/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    const text = await response.text()
    return new Response(text, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
      },
    })
  } catch (error) {
    console.error("Submit activity report error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
