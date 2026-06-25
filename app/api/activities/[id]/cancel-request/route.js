import { proxyBackendRequest } from "@/app/api/_utils/backend"

export async function PATCH(req, { params }) {
  try {
    const { id } = await params
    const body = await req.json()
    return proxyBackendRequest(req, `/api/v1/activities/${id}/cancel-request`, {
      method: "PATCH",
      body,
    })
  } catch (error) {
    console.error("Request cancel activity error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
