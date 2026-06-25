import { proxyBackendRequest } from "@/app/api/_utils/backend"

export async function PATCH(req, { params }) {
  try {
    const { reportId } = await params
    const body = await req.json()
    return proxyBackendRequest(req, `/api/manager/activities/reports/${reportId}/reject`, {
      method: "PATCH",
      body,
    })
  } catch (error) {
    console.error("Reject report error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
