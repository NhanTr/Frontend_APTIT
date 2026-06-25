import { proxyBackendRequest } from "@/app/api/_utils/backend"

export async function POST(req, { params }) {
  try {
    const { id } = await params
    const body = await req.json()
    return proxyBackendRequest(req, `/api/v1/activities/${id}/reports`, {
      method: "POST",
      body,
    })
  } catch (error) {
    console.error("Submit activity report error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
