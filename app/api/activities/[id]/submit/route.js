import { proxyBackendRequest } from "@/app/api/_utils/backend"

export async function PATCH(req, { params }) {
  try {
    const { id } = await params
    return proxyBackendRequest(req, `/api/v1/activities/${id}/submit`, {
      method: "PATCH",
    })
  } catch (error) {
    console.error("Submit activity error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
