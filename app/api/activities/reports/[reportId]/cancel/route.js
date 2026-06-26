import { proxyBackendRequest } from "@/app/api/_utils/backend"

export async function PATCH(req, { params }) {
  try {
    const { reportId } = await params
    return proxyBackendRequest(req, `/api/v1/activities/reports/${reportId}/cancel`, {
      method: "PATCH",
    })
  } catch (error) {
    console.error("Cancel activity report error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
